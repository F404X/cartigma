import {dayUTC,periodKeys,json,ipOf,rate,sha256,now,fail} from "./lib.js";
import {requireUser} from "./auth.js";
const DIFFICULTIES=["normal","hard","rush"];
const PERIODS=["week","month","total"];
export async function leaderboard(request,env){
  await rate(env,"LEADERBOARD_LIMIT","leaderboard:"+ipOf(request));
  // Atomic 3-minute per-IP cooldown. The native rate limiter supports
  // only 10/60-second windows, so D1 enforces the longer interval.
  if(!env.GAME_SECRET)fail(503,"cooldown_not_configured");
  const hashedIp=(await sha256(env.GAME_SECRET+":leaderboard:"+ipOf(request))).slice(0,40);
  const t=now();
  const reservation=await env.DB.prepare(`INSERT INTO leaderboard_cooldowns(ip_hash,next_allowed)
    VALUES(?,?) ON CONFLICT(ip_hash) DO UPDATE SET next_allowed=excluded.next_allowed
    WHERE leaderboard_cooldowns.next_allowed<=? RETURNING next_allowed`)
    .bind(hashedIp,t+180,t).first();
  if(!reservation)fail(429,"cooldown");
  const date=dayUTC(),keys=periodKeys(date);
  const boards={};
  // Each query uses the period/difficulty/score index; no full result history scan.
  for(const d of DIFFICULTIES){
    boards[d]={};
    for(const period of PERIODS){
      const key=period==="week"?keys.week:period==="month"?keys.month:"all";
      const rows=await env.DB.prepare("SELECT u.username,s.points,s.wins,s.games FROM player_stats s JOIN users u ON u.id=s.user_id WHERE s.period_type=? AND s.period_key=? AND s.difficulty=? AND u.deleted_at IS NULL ORDER BY s.points DESC,s.wins DESC,s.games ASC,u.username ASC LIMIT 25")
        .bind(period,key,d).all();
      boards[d][period]=rows.results||[];
    }
  }
  return json({updatedAt:Date.now(),periods:keys,boards},200,{"cache-control":"no-store"});
}
export async function myStats(request,env){
  const user=await requireUser(request,env);
  const result=await env.DB.prepare("SELECT period_type,period_key,difficulty,points,wins,games FROM player_stats WHERE user_id=? ORDER BY period_type,period_key DESC")
    .bind(user.id).all();
  return json({user:{id:user.id,username:user.username},stats:result.results||[]});
}
