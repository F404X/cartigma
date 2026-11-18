import {now,randomToken,base64url,unbase64url,sha256,hmac,
  constantTimeEqual,json,fail,readJSON,ipOf,rate} from "./lib.js";
const cookieName="__Host-cartigma_session";
const sessionLifetime=14*86400;
const ITERATIONS=100000; // Cloudflare WebCrypto cap; benchmark before production
// New credentials must contain only letters and digits, including each class.
// Do not apply this rule to login: existing accounts may use older passwords.
export function validNewPassword(value){
  return typeof value==="string" && value.length>=8 && value.length<=256 &&
    /^[A-Za-z0-9]+$/.test(value) && /[a-z]/.test(value) &&
    /[A-Z]/.test(value) && /[0-9]/.test(value);
}
async function hashPassword(password,salt,pepper){
  if(!pepper||pepper.length<32)fail(503,"auth_not_configured");
  const input=await hmac(pepper,password);
  const key=await crypto.subtle.importKey("raw",input,"PBKDF2",false,["deriveBits"]);
  const bits=await crypto.subtle.deriveBits({
    name:"PBKDF2",hash:"SHA-256",salt:unbase64url(salt),iterations:ITERATIONS
  },key,256);
  return base64url(new Uint8Array(bits));
}
export async function verifyPassword(password,user,env){
  const candidate=await hashPassword(password,user.password_salt,env.AUTH_PEPPER);
  return constantTimeEqual(candidate,user.password_hash);
}
function cookie(value,age=sessionLifetime){
  return cookieName+"="+value+"; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age="+age;
}
async function issueSession(env,user){
  const raw=randomToken();
  await env.DB.prepare("INSERT INTO sessions(token_hash,user_id,created_at,expires_at) VALUES(?,?,?,?)")
    .bind(await sha256(raw),user.id,now(),now()+sessionLifetime).run();
  return cookie(raw);
}
export async function currentUser(request,env){
  const raw=request.headers.get("Cookie")?.match(/(?:^|;\s*)__Host-cartigma_session=([A-Za-z0-9_-]{43})/)?.[1];
  if(!raw)return null;
  const tokenHash=await sha256(raw);
  return env.DB.prepare("SELECT u.id,u.username,u.email,u.created_at,s.token_hash FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at>? AND u.deleted_at IS NULL")
    .bind(tokenHash,now()).first();
}
export async function requireUser(request,env){
  const user=await currentUser(request,env);
  if(!user)fail(401,"login_required");
  return user;
}
async function validateTurnstile(body,request,env){
  if(!env.TURNSTILE_SECRET)return;
  if(typeof body.turnstile!=="string"||body.turnstile.length>2048)fail(400,"turnstile_required");
  const form=new FormData();
  form.set("secret",env.TURNSTILE_SECRET);
  form.set("response",body.turnstile);
  form.set("remoteip",ipOf(request));
  const response=await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify",
    {method:"POST",body:form,signal:AbortSignal.timeout(8000)});
  if(!response.ok||(await response.json()).success!==true)fail(403,"bot_check_failed");
}
export async function authRoute(request,env,path){
  if(path==="/v1/auth/me"){
    const user=await currentUser(request,env);
    return json({user:user?{id:user.id,username:user.username,email:user.email}:null});
  }
  if(request.method!=="POST")fail(405,"method_not_allowed");
  await rate(env,"AUTH_LIMIT","auth:"+ipOf(request));
  const body=await readJSON(request);
  if(path==="/v1/auth/register"){
    const username=String(body.username||"").trim();
    const email=String(body.email||"").trim().toLowerCase();
    const password=body.password;
    if(!/^[a-zA-Z0-9_]{3,20}$/.test(username)||!/^\S+@\S+\.\S+$/.test(email)||email.length>254)
      fail(400,"invalid_account_details");
    if(!validNewPassword(password))fail(400,"weak_password");
    await validateTurnstile(body,request,env);
    const salt=randomToken(16);
    const hashed=await hashPassword(password,salt,env.AUTH_PEPPER);
    const user={id:crypto.randomUUID(),username,email};
    try {
      await env.DB.prepare("INSERT INTO users(id,username,email,password_hash,password_salt,created_at) VALUES(?,?,?,?,?,?)")
        .bind(user.id,username,email,hashed,salt,now()).run();
    }catch(e){
      if(/UNIQUE constraint failed/i.test(String(e)))fail(409,"account_unavailable");
      throw e;
    }
    return json({user},201,{"set-cookie":await issueSession(env,user)});
  }
  if(path==="/v1/auth/login"){
    const email=String(body.email||"").trim().toLowerCase();
    const password=body.password;
    if(email.length>254||typeof password!=="string"||password.length>256||!password)
      fail(401,"invalid_credentials");
    const user=await env.DB.prepare("SELECT * FROM users WHERE email=? AND deleted_at IS NULL").bind(email).first();
    if(!user||!await verifyPassword(password,user,env))fail(401,"invalid_credentials");
    return json({user:{id:user.id,username:user.username,email:user.email}},
      200,{"set-cookie":await issueSession(env,user)});
  }
  if(path==="/v1/auth/logout"){
    const user=await currentUser(request,env);
    if(user)await env.DB.prepare("DELETE FROM sessions WHERE token_hash=?").bind(user.token_hash).run();
    return json({ok:true},200,{"set-cookie":cookie("",0)});
  }
  if(path==="/v1/auth/request-reset"){
    const email=String(body.email||"").trim().toLowerCase();
    const configured=Boolean(env.RESEND_API_KEY&&env.RESET_FROM_EMAIL);
    if(configured&&email.length<=254){
      const user=await env.DB.prepare("SELECT id FROM users WHERE email=? AND deleted_at IS NULL").bind(email).first();
      if(user){
        const raw=randomToken();
        await env.DB.prepare("INSERT INTO password_resets(token_hash,user_id,expires_at) VALUES(?,?,?)")
          .bind(await sha256(raw),user.id,now()+900).run();
        const url=env.APP_ORIGIN+"/?reset="+encodeURIComponent(raw);
        const response=await fetch("https://api.resend.com/emails",{
          method:"POST",headers:{"Authorization":"Bearer "+env.RESEND_API_KEY,
          "Content-Type":"application/json"},
          body:JSON.stringify({from:env.RESET_FROM_EMAIL,to:[email],
            subject:"Recuperação de senha — Cartigma",
            text:"Use este link nos próximos 15 minutos: "+url})
        });
        if(!response.ok)console.error("Password reset email delivery failed");
      }
    }
    return json({ok:true,enabled:configured},202);
  }
  if(path==="/v1/auth/reset"){
    const token=body.token,password=body.password;
    if(typeof token!=="string"||token.length!==43
      ||!validNewPassword(password))
      fail(400,"invalid_reset");
    const hash=await sha256(token);
    const reset=await env.DB.prepare("SELECT user_id FROM password_resets WHERE token_hash=? AND expires_at>?")
      .bind(hash,now()).first();
    if(!reset)fail(400,"invalid_reset");
    const salt=randomToken(16);
    const newHash=await hashPassword(password,salt,env.AUTH_PEPPER);
    await env.DB.batch([
      env.DB.prepare("UPDATE users SET password_hash=?,password_salt=? WHERE id=?")
        .bind(newHash,salt,reset.user_id),
      env.DB.prepare("DELETE FROM sessions WHERE user_id=?").bind(reset.user_id),
      env.DB.prepare("DELETE FROM password_resets WHERE user_id=?").bind(reset.user_id)
    ]);
    return json({ok:true});
  }
  if(path==="/v1/auth/delete"){
    const user=await requireUser(request,env);
    if(typeof body.password!=="string")fail(400,"password_required");
    const secret=await env.DB.prepare("SELECT password_hash,password_salt FROM users WHERE id=?").bind(user.id).first();
    if(!await verifyPassword(body.password,secret,env))fail(403,"invalid_credentials");
    await env.DB.batch([
      env.DB.prepare("DELETE FROM game_results WHERE user_id=?").bind(user.id),
      env.DB.prepare("DELETE FROM game_sessions WHERE id IN (SELECT game_id FROM ranked_matches WHERE user_id=?)")
        .bind(user.id),
      env.DB.prepare("DELETE FROM users WHERE id=?").bind(user.id)
    ]);
    return json({ok:true},200,{"set-cookie":cookie("",0)});
  }
  fail(404,"not_found");
}
