import {ApiError,json,cors,csrf} from "./lib.js";
import {authRoute} from "./auth.js";
import {gameRoute} from "./games.js";
import {leaderboard,myStats} from "./ranking.js";
const authPaths=new Set(["/v1/auth/register","/v1/auth/login","/v1/auth/logout",
  "/v1/auth/me","/v1/auth/request-reset","/v1/auth/reset","/v1/auth/delete"]);
const gamePaths=new Set(["/v1/games/start","/v1/games/guess",
  "/v1/games/reveal","/v1/games/finish","/v1/games/save"]);
export default {
  async fetch(request,env){
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
        response=json({ok:true,service:"cartigma-ranking"});
      }else if(path==="/v1/config"&&request.method==="GET"){
        response=json({turnstileSiteKey:env.TURNSTILE_SITE_KEY||null});
      }else if(path==="/v1/leaderboards"&&request.method==="GET"){
        response=await leaderboard(request,env);
      }else if(path==="/v1/me/stats"&&request.method==="GET"){
        response=await myStats(request,env);
      }else if(authPaths.has(path)&&
        (request.method==="POST"||(path==="/v1/auth/me"&&request.method==="GET"))){
        if(request.method==="POST")csrf(request,env);
        response=await authRoute(request,env,path);
      }else if(gamePaths.has(path)&&request.method==="POST"){
        csrf(request,env);
        response=await gameRoute(request,env,path);
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
