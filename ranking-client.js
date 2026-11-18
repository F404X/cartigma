/* Isolated ranked-game client. Casual Cartigma never depends on this module. */
(()=>{
 "use strict";
 const BASE=(window.CARTIGMA_RANKING_API||(location.hostname.endsWith(".workers.dev")?location.origin:"https://api.cartigma.f404x.net")).replace(/\/$/,"");
 const CACHE_KEY="cartigma-leaderboard-cache-v3:"+BASE;
 const DIFFICULTIES={normal:"Normal",hard:"Difícil",rush:"Rush"};
 const PERIODS={week:"Semanal",month:"Mensal",total:"Total"};
 const countryNames=Intl.DisplayNames?new Intl.DisplayNames("pt-BR",{type:"region"}):null;
 const historyDate=new Intl.DateTimeFormat("pt-BR",{dateStyle:"short",timeStyle:"short"});
 const TABS=["boards","account"];
 const ACCOUNT_MARKER="cartigma-ranked-account-v1";
 const rankResumes=new Map();
 let accountRequest=null;
 const CACHE_TTL=60*1000;
 const state={tab:"boards",boards:null,user:null,meChecked:false,loading:false,visible:false};
 let leaderboardRequest=null,leaderboardRevision=0,lastRefresh=0;
 const announcedGames=new Set();
 let matchHistory={};
 let turnstileSiteKey=null,turnstileToken=null;
 const $=id=>document.getElementById(id);
 function text(id,value){const el=$(id);if(el)el.textContent=value;}
 function message(value,error=false){
   const el=$("rank-status");if(!el)return;
   el.textContent=value;el.classList.toggle("rank-error",error);
 }
 function cached(){try{return JSON.parse(localStorage.getItem(CACHE_KEY)||"null");}catch{return null;}}
 function saveCache(data){try{localStorage.setItem(CACHE_KEY,JSON.stringify({data,at:Date.now()}));}catch{}}
 async function api(path,body){
   const options={method:body===undefined?"GET":"POST",credentials:"include",
     headers:{"Accept":"application/json"}};
   if(body!==undefined){options.headers["Content-Type"]="application/json";options.body=JSON.stringify(body);}
   let response;
   try{response=await fetch(BASE+"/v1"+path,options);}catch{throw Error("Servidor indisponível");}
   const result=await response.json().catch(()=>({}));
   if(!response.ok){
     const err=Error({
       login_required:"Entre na sua conta para acessar suas partidas ranqueadas.",
       game_not_found:"Partida indisponível.",
       daily_score_already_saved:"Você já salvou uma partida deste dia e dificuldade.",
       game_state_conflict:"Partida alterada em outra aba. Tente novamente.",
       country_already_guessed:"Você já tentou esse país.",
       cooldown:"Muitas ações em sequência. Aguarde um instante.",
       auth_not_configured:"Autenticação ainda não configurada.",
       game_not_configured:"Partidas competitivas ainda não configuradas.",
       invalid_credentials:"E-mail ou senha incorretos.",
       account_unavailable:"Usuário ou e-mail já utilizado.",
       weak_password:"Use pelo menos 8 caracteres, com maiúscula, minúscula e número, sem símbolos.",
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
     const response=await fetch("ranking-panel.html?v=20261118-case-history");
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
   panel.querySelectorAll("[data-auth-mode]").forEach(b=>b.onclick=()=>setAuthMode(b.dataset.authMode));
   $("rank-form").onsubmit=authenticate;
   $("rank-logout").onclick=logout;
   $("rank-history-more").onclick=()=>loadMatchHistory(Boolean(matchHistory.nextCursor));
   $("rank-forgot").onclick=requestReset;
   setAuthMode("login");
   setInterval(refreshVisibleBoards,15000);
   document.addEventListener("visibilitychange",refreshVisibleBoards);
   const reset=new URL(location.href).searchParams.get("reset");
   if(reset){open();setTab("account");setTimeout(()=>resetPassword(reset),0);}
 }
 async function open(){
   state.visible=true;$("rank-panel").hidden=false;setTab(state.tab);
   if(!state.meChecked){
     state.meChecked=true;
     const previousUser=state.user;
     try{
       const {user}=await api("/auth/me");
       if(state.user!==previousUser)return;
       state.user=user;
       if(state.user)localStorage.setItem(ACCOUNT_MARKER,"1");
       else localStorage.removeItem(ACCOUNT_MARKER);
     }catch{}
     renderAccount();
   }
 }
 function close(){state.visible=false;$("rank-panel").hidden=true;}
 function setTab(tab){
   state.tab=TABS.includes(tab)?tab:"boards";
   $("rank-panel").dataset.view=state.tab;
   for(const t of TABS)$("rank-"+t).hidden=t!==state.tab;
   document.querySelectorAll("[data-rank-tab]").forEach(b=>{
     b.classList.toggle("active",b.dataset.rankTab===state.tab);
     b.setAttribute("aria-selected",String(b.dataset.rankTab===state.tab));
   });
   if(tab==="boards")loadBoards();
   if(state.tab==="account"){
     renderAccount();
     if(state.user)loadMatchHistory();
   }
 }
 function refreshVisibleBoards(){
   if(state.visible&&state.tab==="boards"&&!document.hidden&&Date.now()-lastRefresh>=CACHE_TTL){
     loadBoards();
   }
 }
 function invalidateBoards(){
   leaderboardRevision++;
   lastRefresh=0;
   try{localStorage.removeItem(CACHE_KEY);}catch{}
   refreshVisibleBoards();
 }
 async function loadBoards(){
   if(!state.boards){
     const cache=cached();
     if(cache?.data){state.boards=cache.data;renderBoards();}
   }
   const revision=leaderboardRevision;
   if(leaderboardRequest?.revision===revision)return;
   const request={revision};
   leaderboardRequest=request;
   try{
     const result=await api("/leaderboards");
     if(revision!==leaderboardRevision)return;
     lastRefresh=Date.now();
     state.boards=result;
     saveCache(result);
     renderBoards();
   }catch(error){
     if(revision===leaderboardRevision){
       text("rank-freshness",state.boards
         ?"Classificações exibidas em cache. Atualização indisponível."
         :"Não foi possível carregar as classificações.");
     }
   }finally{
     if(leaderboardRequest===request)leaderboardRequest=null;
   }
 }
 function formatSolveTime(ms){
   const millis=String(ms%1000).padStart(3,"0");
   const seconds=String(Math.floor(ms/1000)%60).padStart(2,"0");
   const minutes=Math.floor(ms/60000);
   const clock=minutes>=60?Math.floor(minutes/60)+":"+String(minutes%60).padStart(2,"0"):
     String(minutes);
   return clock+":"+seconds+","+millis;
 }
 function renderBoards(){
   const groups=$("rank-groups");
   if(!groups||!state.boards)return;
   const focusedBoard=document.activeElement?.id;
   const scrollPositions=new Map(Array.from(groups.querySelectorAll(".rank-list"),
     list=>[list.id,list.scrollTop]));
   groups.replaceChildren();
   for(const [difficulty,label] of Object.entries(DIFFICULTIES)){
     const section=document.createElement("section"),heading=document.createElement("h3");
     const grid=document.createElement("div");
     section.className="rank-group";heading.textContent=label;grid.className="rank-group-grid";
     for(const [period,title] of Object.entries(PERIODS)){
       const card=document.createElement("div"),caption=document.createElement("h4");
       card.className="rank-board";caption.textContent=title;card.append(caption);
       const players=state.boards.boards?.[difficulty]?.[period]||[];
       if(players.length){
         const list=document.createElement("ol");list.className="rank-list";
         list.id="rank-list-"+difficulty+"-"+period;
         list.tabIndex=0;
         list.setAttribute("aria-label",label+" · "+title);
         for(const [index,player] of players.entries()){
           const row=document.createElement("li");
           const position=document.createElement("span"),name=document.createElement("span"),points=document.createElement("strong");
           position.className="rank-position";position.textContent=index+1;
           name.className="rank-player";name.textContent=player.username;name.title=player.username;
           points.textContent=Number(player.points).toLocaleString("pt-BR")+" pts";
           const stats=document.createElement("span"),time=document.createElement("small");
           stats.className="rank-player-stats";
           const hasTime=Number.isInteger(player.solve_time_ms)&&player.solve_time_ms>=0;
           time.textContent=hasTime?formatSolveTime(player.solve_time_ms):"—";
           time.setAttribute("aria-label",hasTime?"Tempo de acerto "+time.textContent:"Sem tempo de acerto");
           stats.append(points,time);
           row.classList.toggle("rank-self",player.username===state.user?.username);
           row.append(position,name,stats);list.append(row);
         }
         card.append(list);
       }else{
         const empty=document.createElement("p");
         empty.className="rank-note";empty.textContent="Sem partidas registradas";
         card.append(empty);
       }
       grid.append(card);
     }
     section.append(heading,grid);groups.append(section);
   }
   for(const [id,scrollTop] of scrollPositions){
     const list=$(id);
     if(list)list.scrollTop=scrollTop;
   }
   if(focusedBoard?.startsWith("rank-list-"))$(focusedBoard)?.focus({preventScroll:true});
   const stamp=new Date(state.boards.updatedAt);
   text("rank-freshness","Atualizado às "+stamp.toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"}));
 }
 // Authenticate once when an existing account may be present. An anonymous
 // visitor never makes a session-check request just to play locally.
 async function signedInUser(){
   if(state.user)return state.user;
   if(localStorage.getItem(ACCOUNT_MARKER)!=="1")return null;
   if(!accountRequest){
     accountRequest=api("/auth/me").then(({user})=>{
       state.user=user;
       if(!user)localStorage.removeItem(ACCOUNT_MARKER);
       renderAccount();
       return user;
     }).finally(()=>{accountRequest=null;});
   }
   return accountRequest;
 }
 function fetchResume(mode,difficulty,userId){
   const key=userId+":"+mode+":"+difficulty;
   if(!rankResumes.has(key)){
     const request=api("/games/resume",{mode,difficulty}).finally(()=>rankResumes.delete(key));
     rankResumes.set(key,request);
   }
   return rankResumes.get(key);
 }
 async function beginRanked({mode,difficulty,caseNumber}){
   const user=await signedInUser();
   if(!user)return null;
   const pending=rankResumes.get(user.id+":"+mode+":"+difficulty);
   const existing=pending&&(await pending).game;
   if(existing)return existing;
   try{
     return await api("/games/start",{mode,difficulty,caseNumber});
   }catch(error){
     if(error.code!=="ranked_attempt_already_started")throw error;
     const {game}=await fetchResume(mode,difficulty,user.id);
     if(game)return game;
     // A previous Rush round can expire while reopening Freeplay.
     if(mode==="free")return api("/games/start",{mode,difficulty,caseNumber});
     throw error;
   }
 }
 async function gameAction(action,{id,mode,difficulty,...args}={}){
   if(!id)throw Error("Sessão competitiva indisponível");
   const result=await api("/games/"+action,{id,...args});
   if(result.finished&&result.saved&&!announcedGames.has(id)){
     announcedGames.add(id);
     invalidateBoards();
     if(state.user){
       resetMatchHistory(state.user.id);
       if(state.visible&&state.tab==="account")loadMatchHistory();
     }
   }
   return result;
 }
 async function resumeRanked(mode,difficulty){
   const user=await signedInUser();
   if(!user)return null;
   const {game}=await fetchResume(mode,difficulty,user.id);
   return game;
 }
 function resetMatchHistory(owner){
   matchHistory={owner,games:[],loaded:false,nextCursor:null,request:null,opening:false};
   $("rank-history-list")?.replaceChildren();
   text("rank-history-status","");
   if($("rank-history-more"))$("rank-history-more").hidden=true;
 }
 async function loadMatchHistory(append=false){
   const history=matchHistory;
   if(!state.user||history.owner!==state.user.id||history.request)return;
   if(append&&!history.nextCursor)return;
   const cursor=append?"?before="+encodeURIComponent(history.nextCursor):"";
   const more=$("rank-history-more");
   more.disabled=true;
   text("rank-history-status","Carregando partidas…");
   history.request=api("/me/games"+cursor);
   try{
     const {games,nextCursor}=await history.request;
     if(history!==matchHistory)return;
     history.games=append?[...history.games,...games]:games;
     history.nextCursor=nextCursor;
     history.loaded=true;
     renderMatchHistory();
   }catch(error){
     if(history!==matchHistory)return;
     text("rank-history-status",error.message||"Não foi possível carregar o histórico.");
     more.hidden=false;
     more.textContent="Tentar novamente";
   }finally{
     if(history===matchHistory){
       history.request=null;
       more.disabled=false;
     }
   }
 }
 function renderMatchHistory(){
   const list=$("rank-history-list"),more=$("rank-history-more");
   list.replaceChildren();
   for(const game of matchHistory.games){
     const row=document.createElement("li"),button=document.createElement("button");
     const title=document.createElement("strong"),details=document.createElement("span");
     const summary=document.createElement("span");
     button.type="button";button.className="rank-history-case";
     title.textContent=countryNames?.of(game.target)??game.target;
     details.textContent=(game.mode==="daily"?"Caso do dia":"Jogo livre")+" · "+DIFFICULTIES[game.difficulty];
     summary.textContent=historyDate.format(game.finishedAt)+" · "+
       (game.won?"Acertou":"Encerrada")+" · "+game.score.toLocaleString("pt-BR")+" pts";
     button.append(title,details,summary);
     button.onclick=()=>openMatch(game.id,button);
     row.append(button);list.append(row);
   }
   text("rank-history-status",matchHistory.games.length?"":"Nenhuma partida concluída.");
   more.hidden=!matchHistory.nextCursor;
   more.textContent="Carregar mais partidas";
 }
 async function openMatch(id,button){
   const history=matchHistory;
   if(history.opening)return;
   history.opening=true;
   button.disabled=true;
   text("rank-history-status","Abrindo ficha…");
   try{
     const {game}=await api("/me/games/"+encodeURIComponent(id));
     if(history!==matchHistory||!state.visible||state.tab!=="account")return;
     if(!window.CartigmaCaseArchive?.open(game))throw Error("Não foi possível abrir a ficha.");
     text("rank-history-status","");
   }catch(error){
     if(history===matchHistory)text("rank-history-status",error.message);
   }finally{
     history.opening=false;
     button.disabled=false;
   }
 }
 function renderAccount(){
   if(!$("rank-user"))return;
   $("rank-user").hidden=!state.user;$("rank-auth").hidden=Boolean(state.user);
   if(matchHistory.owner!==state.user?.id)resetMatchHistory(state.user?.id);
   if(state.user){
     text("rank-username","Conectado como "+state.user.username);
     if(state.visible&&state.tab==="account"&&!matchHistory.loaded)loadMatchHistory();
   }
   if(state.visible&&state.tab==="boards")renderBoards();
 }
 let authMode="login";
 function setAuthMode(mode){
   authMode=mode==="register"?"register":"login";
   if(!$("rank-username-input"))return;
   $("rank-username-input").hidden=authMode!=="register";
   $("rank-username-label").hidden=authMode!=="register";
   $("rank-username-input").required=authMode==="register";
   $("rank-password").setAttribute("autocomplete",authMode==="register"?"new-password":"current-password");
   const passwordInput=$("rank-password");
   if(authMode==="register"){
     passwordInput.setAttribute("pattern","(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])[A-Za-z0-9]{8,256}");
     passwordInput.setAttribute("title","Mínimo de 8 caracteres: letras maiúsculas, minúsculas e números, sem símbolos.");
   }else{
     // Login must continue accepting passwords created under older policies.
     passwordInput.removeAttribute("pattern");
     passwordInput.removeAttribute("title");
   }
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
   const registering=authMode==="register";
   const payload={email:$("rank-email").value,password:$("rank-password").value};
   if(registering){payload.username=$("rank-username-input").value;payload.turnstile=turnstileToken;}
   try{
     state.user=(await api("/auth/"+authMode,payload)).user;
     localStorage.setItem(ACCOUNT_MARKER,"1");
     $("rank-password").value="";renderAccount();message("Conta conectada.");
   }catch(e){message(e.message,true);}
   finally{
     if(registering&&turnstileToken){
       turnstileToken=null;
       window.turnstile?.reset("#rank-turnstile");
     }
     state.loading=false;$("rank-auth-submit").disabled=false;
   }
 }
 async function logout(){
   try{
     await api("/auth/logout",{});
     state.user=null;
     localStorage.removeItem(ACCOUNT_MARKER);
     renderAccount();message("Sessão encerrada.");
   }
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
   const password=prompt("Nova senha (mínimo 8 caracteres, maiúscula, minúscula e número, sem símbolos):");
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
