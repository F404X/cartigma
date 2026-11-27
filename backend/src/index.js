import {ApiError,json,cors,csrf} from "./lib.js";
import {authRoute} from "./auth.js";
import {gameRoute,matchHistory} from "./games.js";
import {leaderboard,myStats} from "./ranking.js";
const authPaths=new Set(["/v1/auth/register","/v1/auth/login","/v1/auth/logout",
  "/v1/auth/me","/v1/auth/request-reset","/v1/auth/reset","/v1/auth/delete"]);
const gamePaths=new Set(["/v1/games/start","/v1/games/resume","/v1/games/guess",
  "/v1/games/reveal","/v1/games/overlay","/v1/games/finish","/v1/games/save","/v1/games/state"]);
export default {
  async fetch(request,env,ctx){
    let response;
    const path=new URL(request.url).pathname;
    try {
      if(request.method==="OPTIONS"){
        if(request.headers.get("Origin")!==env.APP_ORIGIN)return json({error:"origin_denied"},403);
        response=new Response(null,{status:204,headers:{
          "Access-Control-Allow-Methods":"GET,POST,OPTIONS",
          "Access-Control-Allow-Headers":"Content-Type",
          "Access-Control-Max-Age":"600"}});
      }else if(path==="/v1/health"&&request.method==="GET"){
        // A successful Worker response alone does not mean ranking/login works.
        // Check bindings and the migrated D1 schema before reporting healthy.
        const checks={
          database:false,
          auth:Boolean(env.AUTH_PEPPER&&env.AUTH_PEPPER.length>=32),
          games:Boolean(env.GAME_SECRET&&env.GAME_SECRET.length>=32),
          turnstile:Boolean(env.TURNSTILE_SITE_KEY)===Boolean(env.TURNSTILE_SECRET)
        };
        if(env.DB){
          try{
            await env.DB.prepare("SELECT id FROM users LIMIT 1").first();
            await env.DB.prepare("SELECT user_id FROM player_stats LIMIT 1").first();
            checks.database=true;
          }catch(error){
            console.error("Cartigma API D1 health check failed",String(error?.message||error));
          }
        }
        const ready=Object.values(checks).every(Boolean);
        response=json({ok:ready,service:"cartigma-ranking",checks},ready?200:503);
      }else if(path==="/v1/config"&&request.method==="GET"){
        response=json({turnstileSiteKey:env.TURNSTILE_SITE_KEY||null});
      }else if(path==="/v1/leaderboards"&&request.method==="GET"){
        response=await leaderboard(request,env,ctx);
      }else if(request.method==="GET"&&(path==="/v1/me/games"||path.startsWith("/v1/me/games/"))){
        response=await matchHistory(request,env,path==="/v1/me/games"?undefined:path.slice("/v1/me/games/".length));
      }else if(path==="/v1/me/stats"&&request.method==="GET"){
        response=await myStats(request,env);
      }else if(authPaths.has(path)&&
        (request.method==="POST"||(path==="/v1/auth/me"&&request.method==="GET"))){
        if(request.method==="POST")csrf(request,env);
        response=await authRoute(request,env,path,ctx);
      }else if(gamePaths.has(path)&&request.method==="POST"){
        csrf(request,env);
        response=await gameRoute(request,env,path);
      }else if(request.method==="GET"&&!path.startsWith("/v1/")&&env.ASSETS){
        response=await env.ASSETS.fetch(request);
      }else{
        response=json({error:"not_found"},404);
      }
    }catch(e){
      if(e instanceof ApiError){
        response=json({error:e.code},e.status,e.status===429?{"retry-after":"60"}:{});
      }else{
        console.error("Cartigma API unexpected error",String(e?.message||e));
        response=json({error:"internal_error"},500);
      }
    }
    response=cors(request,env,response);
    const headers=new Headers(response.headers);
    headers.set("Access-Control-Expose-Headers","Retry-After");
    headers.set("X-Frame-Options","DENY");
    headers.set("X-Content-Type-Options","nosniff");
    return new Response(response.body,{status:response.status,headers});
  }
};
