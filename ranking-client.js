/* Isolated ranked-game client. Casual Cartigma never depends on this module. */
(()=>{
 "use strict";
 const BASE=(window.CARTIGMA_RANKING_API||"https://api.cartigma.f404x.net").replace(/\/$/,"");
 const CACHE_KEY="cartigma-leaderboard-cache-v1";
 const TABS=["boards","play","account"];
 const state={tab:"boards",difficulty:"normal",period:"week",boards:null,user:null,
   meChecked:false,game:null,playToken:null,selected:null,loading:false,nextRankingFetch:0,visible:false};
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
   $("rank-refresh").onclick=()=>loadBoards(true);
   $("rank-start").onclick=start;
   $("rank-guess").onclick=guess;
   $("rank-reveal").onclick=reveal;
   $("rank-finish").onclick=finish;
   $("rank-save").onclick=save;
   $("rank-country").onchange=e=>selectCountry(e.target.value);
   $("rank-play-difficulty").onchange=e=>{state.difficulty=e.target.value;};
   panel.querySelectorAll("[data-auth-mode]").forEach(b=>b.onclick=()=>setAuthMode(b.dataset.authMode));
   $("rank-form").onsubmit=authenticate;
   $("rank-logout").onclick=logout;
   $("rank-forgot").onclick=requestReset;
   const options=(window.CartigmaCountries||[]).slice()
     .sort((a,b)=>countryName(a.code).localeCompare(countryName(b.code)));
   for(const country of options){
     const o=document.createElement("option");o.value=country.code;
     o.textContent=countryName(country.code);$("rank-country").append(o);
   }
   setAuthMode("login");renderBoards();
   setInterval(()=>{if(state.visible&&state.game&&!state.game.finished)renderTimer();},1000);
   const reset=new URL(location.href).searchParams.get("reset");
   if(reset){open();setTab("account");setTimeout(()=>resetPassword(reset),0);}
 }
 async function open(){
   state.visible=true;$("rank-panel").hidden=false;setTab(state.tab);
   if(!state.meChecked){
     state.meChecked=true;
     try{state.user=(await api("/auth/me")).user;}catch{}
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
   if(tab==="play")renderGame();
 }
 async function loadBoards(force){
   const cache=cached();
   if(cache?.data){state.boards=cache.data;renderBoards();}
   const timestamp=Date.now();
   if(!force&&cache&&timestamp-cache.at<300000)return;
   if(timestamp<state.nextRankingFetch){
     message("Aguarde o cooldown; usando placar em cache.");return;
   }
   state.nextRankingFetch=timestamp+60000;
   try{
     const result=await api("/leaderboards");
     state.boards=result;saveCache(result);renderBoards();message("Placar atualizado.");
   }catch(e){
     if(e.code==="cooldown")state.nextRankingFetch=Date.now()+e.retry*1000;
     message(e.message,true);
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
 function selectCountry(code){
   if(!state.game||state.game.finished)return;
   state.selected=code||null;$("rank-country").value=code||"";
   $("rank-guess").disabled=!state.selected||state.loading;
 }
 function renderTimer(){
   const g=state.game;if(!g)return;
   const elapsed=Math.max(0,Date.now()-g.startedAt);
   const time=g.difficulty==="rush"?Math.max(0,60000-elapsed):elapsed;
   const seconds=Math.ceil(time/1000);
   text("rank-timer",String(Math.floor(seconds/60)).padStart(2,"0")+":"+
     String(seconds%60).padStart(2,"0"));
   const max=g.difficulty==="rush"?"∞":g.difficulty==="hard"?4:6;
   text("rank-progress",g.guesses.length+" / "+max);
   if(g.difficulty==="rush")renderClues();
 }
 function renderClues(){
   const g=state.game,container=$("rank-clues");if(!g||!container)return;
   const elapsed=Math.max(0,Date.now()-g.startedAt);
   const max=g.difficulty==="rush"&&!g.finished?Math.min(10,1+Math.floor(elapsed/6000)):g.clues.length;
   container.replaceChildren();
   for(const clue of g.clues.slice(0,max)){
     const p=document.createElement("p");p.textContent=clue.label+": "+clue.value;container.append(p);
   }
 }
 function renderGame(){
   const g=state.game;if(!$("rank-game"))return;
   $("rank-game").hidden=!g;
   $("rank-start").hidden=Boolean(g&&!g.finished);
   $("rank-play-difficulty").disabled=Boolean(g&&!g.finished);
   if(!g)return;
   renderTimer();renderClues();
   const ongoing=!g.finished;
   for(const id of ["rank-country","rank-finish"])$(id).disabled=!ongoing||state.loading;
   $("rank-guess").disabled=!ongoing||!state.selected||state.loading;
   $("rank-reveal").disabled=!ongoing||g.difficulty==="rush"||g.revealed>=10||state.loading;
   $("rank-result").hidden=ongoing;
   if(!ongoing){
     text("rank-result",(g.won?"Vitória! ":"Derrota. ")+
       "País: "+countryName(g.target)+". Pontos: "+g.score.toLocaleString("pt-BR"));
   }
   $("rank-save").hidden=ongoing||g.saved;
   text("rank-save",state.user?"Salvar pontuação":"Entrar para salvar");
 }
 async function withGame(path,extra={}){
   if(state.loading||!state.game)return;
   state.loading=true;renderGame();
   try {
     state.game=await api("/games/"+path,{id:state.game.id,playToken:state.playToken,...extra});
     state.selected=null;renderGame();message("");
   }catch(e){message(e.message,true);}
   finally{state.loading=false;renderGame();}
 }
 async function start(){
   if(state.loading)return;
   state.loading=true;$("rank-start").disabled=true;
   try{
     const g=await api("/games/start",{difficulty:$("rank-play-difficulty").value});
     state.playToken=g.playToken;delete g.playToken;state.game=g;state.selected=null;
     message("Desafio iniciado.");renderGame();
   }catch(e){message(e.message,true);}
   finally{state.loading=false;$("rank-start").disabled=false;}
 }
 async function guess(){if(state.selected)await withGame("guess",{code:state.selected});}
 async function reveal(){await withGame("reveal");}
 async function finish(){await withGame("finish");}
 async function save(){
   if(!state.user){setTab("account");message("Faça login ou cadastre-se para salvar.");return;}
   await withGame("save");
   if(state.game?.saved)message("Pontuação salva. Ranking atualizará após o cache.");
 }
 function renderAccount(){
   if(!$("rank-user"))return;
   $("rank-user").hidden=!state.user;$("rank-auth").hidden=Boolean(state.user);
   if(state.user)text("rank-username","Conectado como "+state.user.username);
   if(state.game?.finished)renderGame();
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
     $("rank-password").value="";renderAccount();message("Conta conectada.");
     if(state.game?.finished&&!state.game.saved)setTab("play");
   }catch(e){message(e.message,true);}
   finally{state.loading=false;$("rank-auth-submit").disabled=false;}
 }
 async function logout(){
   try{await api("/auth/logout",{});state.user=null;renderAccount();message("Sessão encerrada.");}
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
 window.CartigmaRanking={
   get isPlaying(){return state.visible&&state.tab==="play"&&Boolean(state.game)&&!state.game.finished;},
   selectCountry
 };
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",build);
 else build();
})();
