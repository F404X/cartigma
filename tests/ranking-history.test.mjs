import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {runInNewContext} from "node:vm";

test("Account match history clearly labels country - Vitória/Derrota",()=>{
  const source=readFileSync(new URL("../ranking-client.js",import.meta.url),"utf8");
  const begin=source.indexOf(" function renderMatchHistory(){");
  const end=source.indexOf(" async function openMatch(",begin);
  assert.ok(begin>=0&&end>begin,"Expected match history renderer");
  const renderSource=source.slice(begin,end);

  const list={children:[],replaceChildren(){this.children=[]},append(...items){this.children.push(...items)}};
  const more={hidden:false,textContent:""};
  const elements={"rank-history-list":list,"rank-history-more":more};
  const mockDocument={
    createElement(tag){
      return {tag,children:[],textContent:"",append(...items){this.children.push(...items)}};
    }
  };
  const games=[
    {id:"win",target:"BR",mode:"daily",difficulty:"normal",
      finishedAt:Date.parse("2026-11-18T12:00:00Z"),won:true,score:5000},
    {id:"loss",target:"JP",mode:"free",difficulty:"hard",
      finishedAt:Date.parse("2026-11-18T12:10:00Z"),won:false,score:0}
  ];
  const context={
    document:mockDocument,
    $:id=>elements[id],
    text:()=>{},
    matchHistory:{games,nextCursor:null},
    countryNames:new Intl.DisplayNames("pt-BR",{type:"region"}),
    historyDate:new Intl.DateTimeFormat("pt-BR",{dateStyle:"short",timeStyle:"short"}),
    DIFFICULTIES:{normal:"Normal",hard:"Difícil"},
    openMatch:()=>{}
  };
  runInNewContext(renderSource+"\nrenderMatchHistory();",context);
  assert.equal(list.children.length,2);
  const [win,loss]=list.children.map(row=>row.children[0]);
  assert.equal(win.children[0].textContent,"Brasil - Vitória");
  assert.equal(loss.children[0].textContent,"Japão - Derrota");
  assert.match(win.children[1].textContent,/Caso do dia/);
  assert.match(loss.children[1].textContent,/Jogo livre/);
  assert.match(win.children[2].textContent,/5\.000 pts/);
  assert.match(loss.children[2].textContent,/0 pts/);
});
