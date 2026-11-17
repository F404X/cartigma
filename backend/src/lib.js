const encoder=new TextEncoder();
export const now=()=>Math.floor(Date.now()/1000);
export const dayUTC=(timestamp=Date.now())=>new Date(timestamp).toISOString().slice(0,10);
export function periodKeys(date=dayUTC()){
  const d=new Date(date+"T00:00:00Z"),monday=new Date(d);
  monday.setUTCDate(d.getUTCDate()-(d.getUTCDay()+6)%7);
  return {week:monday.toISOString().slice(0,10),month:date.slice(0,7)};
}
export function base64url(bytes){
  let raw="";for(const n of bytes)raw+=String.fromCharCode(n);
  return btoa(raw).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");
}
export function unbase64url(raw){
  return Uint8Array.from(atob(raw.replace(/-/g,"+").replace(/_/g,"/")),c=>c.charCodeAt(0));
}
export const randomToken=(size=32)=>base64url(crypto.getRandomValues(new Uint8Array(size)));
export async function sha256(value){
  const bytes=await crypto.subtle.digest("SHA-256",typeof value==="string"?encoder.encode(value):value);
  return [...new Uint8Array(bytes)].map(v=>v.toString(16).padStart(2,"0")).join("");
}
export async function hmac(secret,input){
  const key=await crypto.subtle.importKey("raw",encoder.encode(secret),{name:"HMAC",hash:"SHA-256"},false,["sign"]);
  return new Uint8Array(await crypto.subtle.sign("HMAC",key,encoder.encode(input)));
}
export function constantTimeEqual(a,b){
  if(typeof a!=="string"||typeof b!=="string"||a.length!==b.length)return false;
  let diff=0;for(let i=0;i<a.length;i++)diff|=a.charCodeAt(i)^b.charCodeAt(i);
  return diff===0;
}
export function json(body,status=200,extra={}){
  return new Response(JSON.stringify(body),{status,headers:{
    "content-type":"application/json; charset=utf-8",
    "x-content-type-options":"nosniff","referrer-policy":"no-referrer",
    "cache-control":"no-store",...extra}});
}
export class ApiError extends Error{constructor(status,code){super(code);this.status=status;this.code=code;}}
export function fail(status,code){throw new ApiError(status,code);}
export async function readJSON(request){
  if(!(request.headers.get("content-type")||"").toLowerCase().startsWith("application/json"))
    fail(415,"json_required");
  if(Number(request.headers.get("content-length")||"0")>8192)fail(413,"payload_too_large");
  const raw=await request.text();if(raw.length>8192)fail(413,"payload_too_large");
  try{
    const parsed=JSON.parse(raw);
    if(parsed===null||typeof parsed!=="object"||Array.isArray(parsed))fail(400,"invalid_json");
    return parsed;
  }catch(e){if(e instanceof ApiError)throw e;fail(400,"invalid_json");}
}
export const ipOf=request=>request.headers.get("CF-Connecting-IP")||"local";
export async function rate(env,name,key){
  if(!env[name])return;
  if(!(await env[name].limit({key})).success)fail(429,"cooldown");
}
export function cors(request,env,response){
  if(request.headers.get("Origin")!==env.APP_ORIGIN)return response;
  const headers=new Headers(response.headers);
  headers.set("Access-Control-Allow-Origin",env.APP_ORIGIN);
  headers.set("Access-Control-Allow-Credentials","true");
  headers.set("Vary","Origin");
  return new Response(response.body,{status:response.status,statusText:response.statusText,headers});
}
export function difficulty(value){
  if(!["normal","hard","rush"].includes(value))fail(400,"invalid_difficulty");
  return value;
}
export function csrf(request,env){
  if(request.headers.get("Origin")!==env.APP_ORIGIN)fail(403,"origin_required");
}
