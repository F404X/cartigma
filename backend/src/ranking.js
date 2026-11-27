import {dayUTC,periodKeys,json,ipOf,rate} from "./lib.js";
import {requireUser} from "./auth.js";
const DIFFICULTIES=["normal","hard","rush"];
const PERIODS=["week","month","total"];
// The public board costs nine D1 queries. Serve one shared copy from the
// edge cache so anonymous traffic cannot multiply those reads. (The Cache
// API is a no-op on workers.dev, where only the per-IP limit applies.)
const BOARD_CACHE_SECONDS=15;
export async function leaderboard(request,env,ctx){
  await rate(env,"READ_LIMIT","board:"+ipOf(request));
  const cache=globalThis.caches?.default;
  const cacheKey=new Request(new URL("/v1/leaderboards",request.url).href);
  const hit=await cache?.match(cacheKey);
  if(hit){
    const cached=new Response(hit.body,hit);
    cached.headers.set("cache-control","no-store");
    return cached;
  }
  const response=await buildLeaderboard(env);
  if(cache){
    const shared=response.clone();
    const stored=new Response(shared.body,shared);
    stored.headers.set("cache-control","public, max-age="+BOARD_CACHE_SECONDS);
    const write=cache.put(cacheKey,stored).catch(()=>{});
    if(ctx?.waitUntil)ctx.waitUntil(write);else await write;
  }
  return response;
}
async function buildLeaderboard(env){
  const keys=periodKeys(dayUTC());
  const boards={};
  const queries=[];
  for(const difficulty of DIFFICULTIES){
    boards[difficulty]={};
    for(const period of PERIODS){
      const key=period==="week"?keys.week:period==="month"?keys.month:"all";
      queries.push(env.DB.prepare(`SELECT u.username,s.points,s.wins,s.games,t.solve_time_ms FROM player_stats s
        JOIN users u ON u.id=s.user_id
        LEFT JOIN player_solve_times t ON t.user_id=s.user_id AND t.period_type=s.period_type
          AND t.period_key=s.period_key AND t.difficulty=s.difficulty
        WHERE s.period_type=? AND s.period_key=? AND s.difficulty=? AND u.deleted_at IS NULL
        ORDER BY s.points DESC,t.solve_time_ms ASC NULLS LAST,s.wins DESC,s.games ASC,u.username ASC LIMIT 25`)
        .bind(period,key,difficulty));
    }
  }
  const results=await env.DB.batch(queries);
  let index=0;
  for(const difficulty of DIFFICULTIES){
    for(const period of PERIODS)boards[difficulty][period]=results[index++].results||[];
  }
  return json({updatedAt:Date.now(),periods:keys,boards},200,{"cache-control":"no-store"});
}
export async function myStats(request,env){
  const user=await requireUser(request,env);
  const result=await env.DB.prepare("SELECT period_type,period_key,difficulty,points,wins,games FROM player_stats WHERE user_id=? ORDER BY period_type,period_key DESC")
    .bind(user.id).all();
  return json({user:{id:user.id,username:user.username},stats:result.results||[]});
}
