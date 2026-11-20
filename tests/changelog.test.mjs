import assert from "node:assert/strict";
import {test} from "node:test";
import {readFileSync} from "node:fs";
import {runInNewContext} from "node:vm";

const file=name=>readFileSync(new URL("../"+name,import.meta.url),"utf8");
const sandbox={window:{}};
runInNewContext(file("changelog-data.js"),sandbox);
const log=sandbox.window.CartigmaChangelog;

test("complete historical audit preserves every original commit",()=>{
  assert.ok(log.historicCommits>=489,"The original 489 commits must be preserved");
  assert.equal(log.groupedChanges,453);
  const all=log.entries.flatMap(entry=>entry.commits);
  assert.equal(all.length,log.historicCommits);
  assert.equal(new Set(all).size,all.length);
  assert.ok(all.every(hash=>/^[0-9a-f]{40}$/i.test(hash)));
});

test("cumulative beta versions only increment for general updates or bug fixes",()=>{
  let general=0,fixes=0;
  for(const entry of [...log.entries].reverse()){
    if(entry.kind==="general")general++;
    else if(entry.kind==="fix")fixes++;
    else assert.equal(entry.kind,"technical");
    assert.equal(entry.version,"v1."+general+"."+fixes+"b");
  }
  assert.equal(log.general,general);
  assert.equal(log.fixes,fixes);
  assert.equal(log.current,"v1."+general+"."+fixes+"b");
});

test("the About dialog exposes an accessible, offline changelog tab",()=>{
  const html=file("index.html"),app=file("app.js");
  for(const id of ["changelogTab","changelogPanel","changelogList","changelogFilter","changelogMore","changelogVersion"])
    assert.equal(html.split('id="'+id+'"').length-1,1,id);
  for(const asset of ["changelog-data.js","changelog.js"])
    assert.ok(html.includes('src="'+asset+"?v="),asset);
  assert.match(html,/aria-controls="changelogPanel"/);
  assert.match(html,/role="tabpanel" aria-labelledby="changelogTab"/);
  assert.ok(app.includes('$("changelogTab")'));
  assert.ok(app.includes('$("changelogPanel")'));
  new Function(file("changelog.js"));
});

test("all 19 interface packs have a Changelog tab name",()=>{
  const context={window:{}};
  runInNewContext(file("i18n.js"),context);
  const packs=context.window.GeoI18n.PACKS;
  assert.equal(Object.keys(packs).length,19);
  for(const [language,pack] of Object.entries(packs))assert.ok(pack.changelog,language);
});
