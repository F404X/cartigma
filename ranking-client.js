/* Isolated ranked-game client. Casual Cartigma never depends on this module. */
(()=>{
 "use strict";
 const BASE=(window.CARTIGMA_RANKING_API||(location.hostname.endsWith(".workers.dev")?location.origin:"https://api.cartigma.f404x.net")).replace(/\/$/,"");
 const CACHE_KEY="cartigma-leaderboard-cache-v1";
 const TABS=["boards","account"];
 const ACCOUNT_MARKER="cartigma-ranked-account-v1";
 const RANK_SESSION_PREFIX="cartigma-ranked-session-v2:";
 const CACHE_TTL=15*60*1000;
 const COOLDOWN=3*60*1000;
 const state={tab:"boards",difficulty:"normal",period:"week",boards:null,user:null,
   meChecked:false,activeRank:null,loading:false,nextRankingFetch:0,visible:false};
 let turnstileSiteKey=null,turnstileToken=null;
 const $=id=>document.getElementById(id);
 function text(id,value){const el=$(id);if(el)el.textContent=value;}
 function message(value,error=false){
   const el=$("rank-status");if(!el)return;
   el.textContent=value;el.classList.toggle("rank-error",error);
 }
 function cached(){try{return JSON.parse(localStorage.getItem(CACHE_KEY)||"null");}catch{return null;}}
 function saveCache(data){try{localStorage.setItem(CACHE_KEY,JSON.stringify({data,at:Date.now()}));}catch{}}
 function countryName(code){
   const c=window.CartigmaCountries?.find(c=>c.code===code);
   if(!c)return code||"";
   try{return new Intl.DisplayNames([document.documentElement.lang||"pt"],{type:"region"}).of(code)||c.name;}
   catch{return c.name;}
 }
 async function api(path,body){
   const options={method:body===undefined?"GET":"POST",credentials:"include",
     headers:{"Accept":"application/json"}};
   if(body!==undefined){options.headers["Content-Type"]="application/json";options.body=JSON.stringify(body);}
   let response;
   try{response=await fetch(BASE+"/v1"+path,options);}catch{throw Error("Servidor indisponível");}
   const result=await response.json().catch(()=>({}));
   if(!response.ok){
     const err=Error({
       cooldown:"Muitas consultas deste IP. Exibindo o placar em cache.",
       login_required:"Entre na sua conta para salvar o placar.",
       daily_score_already_saved:"Você já salvou uma partida deste dia e dificuldade.",
       game_state_conflict:"Partida alterada em outra aba. Tente novamente.",
       auth_not_configured:"Autenticação ainda não configurada.",
       game_not_configured:"Partidas competitivas ainda não configuradas.",
       invalid_credentials:"E-mail ou senha incorretos.",
       account_unavailable:"Usuário ou e-mail já utilizado.",
       weak_password:"Senha precisa ter no mínimo 12 caracteres.",
       bot_check_failed:"Verificação anti-bot recusada.",
       turnstile_required:"Complete a verificação de segurança."
     }[result.error]||result.error||"Erro na solicitação");
     err.code=result.error;err.retry=Number(response.headers.get("Retry-After"))||60;
     throw err;
   }
   return result;
 }
 async function build(){
   const panel=document.createElement("aside");panel.id="rank-panel";panel.className="rank-panel";
   panel.hidden=true;panel.setAttribute("aria-label","Cartigma — ranking competitivo");
   try{
     const response=await fetch("ranking-panel.html");
     if(!response.ok)throw Error("markup unavailable");
     panel.innerHTML=await response.text();
   }catch{console.warn("Cartigma ranking panel unavailable");return;}
   document.body.append(panel);
   const launch=document.createElement("button");
   launch.id="rank-launch";launch.className="header-button";launch.type="button";
   launch.textContent="Ranking";launch.setAttribute("aria-label","Ranking e contas");
   const sibling=$("helpBtn");
   if(sibling?.parentNode)sibling.parentNode.insertBefore(launch,sibling);
   else document.body.append(launch);
   launch.onclick=()=>open();
   $("rank-close").onclick=close;
   panel.querySelectorAll("[data-rank-tab]").forEach(b=>b.onclick=()=>setTab(b.dataset.rankTab));
   $("rank-period").onchange=e=>{state.period=e.target.value;renderBoards();};
   $("rank-board-difficulty").onchange=e=>{state.difficulty=e.target.value;renderBoards();};
   panel.querySelectorAll("[data-auth-mode]").forEach(b=>b.onclick=()=>setAuthMode(b.dataset.authMode));
   $("rank-form").onsubmit=authenticate;
   $("rank-logout").onclick=logout;
   $("rank-forgot").onclick=requestReset;
   setAuthMode("login");renderBoards();
   const reset=new URL(location.href).searchParams.get("reset");
   if(reset){open();setTab("account");setTimeout(()=>resetPassword(reset),0);}
 }
 async function open(){
   state.visible=true;$("rank-panel").hidden=false;setTab(state.tab);
   if(!state.meChecked){
     state.meChecked=true;
     try{state.user=(await api("/auth/me")).user;
       if(state.user)localStorage.setItem(ACCOUNT_MARKER,"1");
       else localStorage.removeItem(ACCOUNT_MARKER);
     }catch{}
     renderAccount();
   }
 }
 function close(){state.visible=false;$("rank-panel").hidden=true;}
 function setTab(tab){
   state.tab=TABS.includes(tab)?tab:"boards";
   for(const t of TABS)$("rank-"+t).hidden=t!==state.tab;
   document.querySelectorAll("[data-rank-tab]").forEach(b=>{
     b.classList.toggle("active",b.dataset.rankTab===state.tab);
     b.setAttribute("aria-selected",String(b.dataset.rankTab===state.tab));
   });
   if(tab==="boards")loadBoards(false);
   if(tab==="account")renderAccount();
 }
 async function loadBoards(force){
   const cache=cached();
   if(cache?.data){state.boards=cache.data;renderBoards();}
   const timestamp=Date.now();
   if(!force&&cache&&timestamp-cache.at<CACHE_TTL)return;
   if(timestamp<state.nextRankingFetch)return;
   state.nextRankingFetch=timestamp+COOLDOWN;
   try{
     const result=await api("/leaderboards");
     state.boards=result;saveCache(result);renderBoards();message("");
   }catch(e){
     if(e.code==="cooldown")state.nextRankingFetch=Date.now()+e.retry*1000;
     if(e.code!=="cooldown"&&!state.boards)message(e.message,true);
   }
 }
 function renderBoards(){
   const list=$("rank-list");if(!list)return;list.replaceChildren();
   const players=state.boards?.boards?.[state.difficulty]?.[state.period]||[];
   if(!players.length){
     const p=document.createElement("p");p.className="rank-note";
     p.textContent=state.boards?"Nenhuma pontuação ainda.":"Sem placar em cache.";
     list.append(p);return;
   }
   for(const [i,player] of players.entries()){
     const li=document.createElement("li");
     const username=document.createElement("span");username.textContent=(i+1)+". "+player.username;
     const points=document.createElement("strong");
     points.textContent=Number(player.points).toLocaleString("pt-BR")+" pts";
     li.append(username,points);list.append(li);
   }
 }

 // Authenticate once when an existing account may be present. An anonymous
 // visitor never makes a session-check request just to play locally.
 async function signedInUser(){
   if(state.user)return state.user;
   if(localStorage.getItem(ACCOUNT_MARKER)!=="1")return null;
   const me=await api("/auth/me");
   state.user=me.user;
   if(!state.user)localStorage.removeItem(ACCOUNT_MARKER);
   renderAccount();
   return state.user;
 }
 function sessionKey(difficulty){
   return RANK_SESSION_PREFIX+
     new Date().toISOString().slice(0,10)+":"+difficulty;
 }
 function storedSession(difficulty){
   try{return JSON.parse(sessionStorage.getItem(sessionKey(difficulty))||"null");}
   catch{return null;}
 }
 async function beginRanked({mode,difficulty}){
   if(!await signedInUser())return null;
   const key=sessionKey(difficulty);
   const old=storedSession(difficulty);
   if(old?.id&&old?.playToken){
     state.activeRank=old;
     try{return await api("/games/state",{id:old.id,playToken:old.playToken});}
     catch(e){
       if(e.code!=="game_not_found"&&e.code!=="game_expired")throw e;
       sessionStorage.removeItem(key);
       state.activeRank=null;
     }
   }
   const result=await api("/games/start",{mode,difficulty});
   const playToken=result.playToken;delete result.playToken;
   state.activeRank={id:result.id,playToken,difficulty};
   sessionStorage.setItem(key,JSON.stringify(state.activeRank));
   return result;
 }
 async function gameAction(action,payload={}){
   const item=state.activeRank;
   if(!item)throw Error("Sessão competitiva indisponível");
   const data={id:item.id,playToken:item.playToken,...payload};
   let result=await api("/games/"+action,data);
   if(result.finished&&!result.saved&&action!=="save"){
     try{
       result=await api("/games/save",data);
     }catch(e){
       result.saveError=e.message||"Não foi possível salvar a pontuação";
     }
   }
   return result;
 }
 async function resumeRanked(difficulty){
   if(!await signedInUser())return null;
   const stored=storedSession(difficulty);
   if(!stored)return null;
   state.activeRank=stored;
   try{return await api("/games/state",{id:stored.id,playToken:stored.playToken});}
   catch(e){
     if(e.code==="game_expired"||e.code==="game_not_found"){
       sessionStorage.removeItem(sessionKey(difficulty));
       state.activeRank=null;
       return null;
     }
     throw e;
   }
 }
 function renderAccount(){
   if(!$("rank-user"))return;
   $("rank-user").hidden=!state.user;$("rank-auth").hidden=Boolean(state.user);
   if(state.user)text("rank-username","Conectado como "+state.user.username);
 }
 let authMode="login";
 function setAuthMode(mode){
   authMode=mode==="register"?"register":"login";
   if(!$("rank-username-input"))return;
   $("rank-username-input").hidden=authMode!=="register";
   $("rank-username-label").hidden=authMode!=="register";
   $("rank-username-input").required=authMode==="register";
   $("rank-password").setAttribute("autocomplete",authMode==="register"?"new-password":"current-password");
   text("rank-auth-submit",authMode==="register"?"Criar conta":"Entrar");
   document.querySelectorAll("[data-auth-mode]").forEach(b=>b.classList.toggle("active",b.dataset.authMode===authMode));
   if(authMode==="register")loadTurnstile();
 }
 async function loadTurnstile(){
   if(turnstileSiteKey===null){
     try{turnstileSiteKey=(await api("/config")).turnstileSiteKey||"";}catch{turnstileSiteKey="";}
   }
   if(!turnstileSiteKey||$("rank-turnstile").dataset.loaded)return;
   const script=document.createElement("script");
   script.src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
   script.onload=()=>{
     if(window.turnstile)window.turnstile.render("#rank-turnstile",{
       sitekey:turnstileSiteKey,callback:token=>{turnstileToken=token;},
       "expired-callback":()=>{turnstileToken=null;}
     });
     $("rank-turnstile").dataset.loaded="true";
   };
   document.head.append(script);
 }
 async function authenticate(event){
   event.preventDefault();if(state.loading)return;
   state.loading=true;$("rank-auth-submit").disabled=true;
   const payload={email:$("rank-email").value,password:$("rank-password").value};
   if(authMode==="register"){payload.username=$("rank-username-input").value;payload.turnstile=turnstileToken;}
   try{
     state.user=(await api("/auth/"+authMode,payload)).user;
     localStorage.setItem(ACCOUNT_MARKER,"1");
     $("rank-password").value="";renderAccount();message("Conta conectada.");
   }catch(e){message(e.message,true);}
   finally{state.loading=false;$("rank-auth-submit").disabled=false;}
 }
 async function logout(){
   try{await api("/auth/logout",{});state.user=null;state.activeRank=null;
     localStorage.removeItem(ACCOUNT_MARKER);
     for(const d of ["normal","hard","rush"])sessionStorage.removeItem(sessionKey(d));
     renderAccount();message("Sessão encerrada.");}
   catch(e){message(e.message,true);}
 }
 async function requestReset(){
   const email=$("rank-email").value.trim();
   if(!email){message("Informe seu e-mail.",true);return;}
   try{
     const result=await api("/auth/request-reset",{email});
     message(result.enabled?"Se a conta existir, um link será enviado.":"Recuperação de senha ainda não configurada.");
   }catch(e){message(e.message,true);}
 }
 async function resetPassword(token){
   const password=prompt("Nova senha (mínimo 12 caracteres):");
   if(!password)return;
   try{
     await api("/auth/reset",{token,password});
     history.replaceState(null,"",location.pathname);message("Senha alterada. Faça login.");
   }catch(e){message(e.message,true);}
 }
 window.CartigmaRanking={beginRanked,gameAction,resumeRanked,
   mayRank:()=>Boolean(state.user)||localStorage.getItem(ACCOUNT_MARKER)==="1"};
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",build);
 else build();
})();
