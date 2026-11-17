import {dayUTC,periodKeys,json,ipOf,rate} from "./lib.js";
import {requireUser} from "./auth.js";
const DIFFICULTIES=["normal","hard","rush"];
const PERIODS=["week","month","total"];
export async function leaderboard(request,env){
  await rate(env,"LEADERBOARD_LIMIT","leaderboard:"+ipOf(request));
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
