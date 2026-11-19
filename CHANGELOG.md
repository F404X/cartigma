# Changelog — Cartigma

**Versão beta atual: v1.191.95b**

Formato `v1.x.yb`: `x` representa a quantidade acumulada de atualizações gerais; `y`, a quantidade acumulada de correções de bugs. Os símbolos `v`, `1` e `b` permanecem fixos durante esta fase beta.

A contagem foi reconstruída a partir da história de commits da branch `feature/ranking`. Cada alteração com mensagem distinta incrementa o contador correspondente, exceto operações apenas técnicas (testes, CI, documentação, publicação e merges), que constam no histórico sem incremento. Mensagens consecutivas idênticas são agrupadas, mas todos os hashes são mantidos.

**Atenção:** o changelog documenta o percurso do projeto. Recursos antigos podem ter sido substituídos (por exemplo, o antigo catálogo de cidades deu lugar aos países). As descrições originais dos commits permanecem em inglês para rastreabilidade.

**Auditoria:** 489 commits históricos, 453 grupos históricos, 191 atualizações gerais e 95 correções, incluindo a atualização atual.

### v1.191.95b — 2026-11-19 — Atualização geral

Add complete historical changelog and cumulative beta versioning

Inclusão da aba de changelogs e registro completo do histórico.

### v1.190.95b — 2026-11-19 — Correção de bug

Fix Monaco's land border and separate profile from ranking

Commits: [`258937a6`](https://github.com/F404X/cartigma/commit/258937a63b0d0d8fb4288b0f6d5d485e8fe216cf)

### v1.190.94b — 2026-11-19 — Correção de bug

Draw national outlines on the dark OpenStreetMap fallback

Commits: [`202ed0e9`](https://github.com/F404X/cartigma/commit/202ed0e904ff4c6f990d16e2e61bd9b40f2bd3b5)

### v1.190.93b — 2026-11-19 — Correção de bug

Fix dark map borders and keep Cartigma playable offline

Commits: [`cd7696d2`](https://github.com/F404X/cartigma/commit/cd7696d2401d8b43bfbadd601925a7cf880f883b)

### v1.190.92b — 2026-11-18 — Atualização geral

Replace theme toggle with a ten-palette catalog

Commits: [`2c296fa9`](https://github.com/F404X/cartigma/commit/2c296fa9315f02cd4cf4b65daa3695bb4c9ed448)

### v1.189.92b — 2026-11-18 — Registro técnico — sem incremento

chore(cache): load five-minute leaderboard refresh behavior on mobile and desktop

Commits: [`3573cfd2`](https://github.com/F404X/cartigma/commit/3573cfd28c6946435201c1e2d69d1faac62590ec)

### v1.189.92b — 2026-11-18 — Registro técnico — sem incremento

test(ranking): check five-minute polling and immediate open, saved game, and hidden-panel refresh

Commits: [`6378ebcb`](https://github.com/F404X/cartigma/commit/6378ebcb6dc45998598c18261b2c74ca5c2c8ed3)

### v1.189.92b — 2026-11-18 — Atualização geral

perf(ranking): refresh every five minutes, immediately on tab open or saved match

Commits: [`2492529d`](https://github.com/F404X/cartigma/commit/2492529dfdf9e476b27035eb45906376c4e1b04e)

### v1.188.92b — 2026-11-18 — Registro técnico — sem incremento

docs: explain dedicated Caribbean clue and North/Central region without a seventh continent

Commits: [`2074aeee`](https://github.com/F404X/cartigma/commit/2074aeee0b3be7b5986a3a9edb27e0a4f166263e)

### v1.188.92b — 2026-11-18 — Registro técnico — sem incremento

test(ranking): handle Caribbean region hint without assuming continent overlay

Commits: [`b9321bbe`](https://github.com/F404X/cartigma/commit/b9321bbed389f658a1b86be62d073fa430466bf0)

### v1.188.92b — 2026-11-18 — Registro técnico — sem incremento

chore(cache): force latest Caribbean-region clues and translations on staging

Commits: [`211ec201`](https://github.com/F404X/cartigma/commit/211ec2011ccc5d8e13cace1b8209974cb804555e)

### v1.188.92b — 2026-11-18 — Registro técnico — sem incremento

test(ui): verify Caribbean and North/Central region hints in PT/EN and all locale packs

Commits: [`bc720476`](https://github.com/F404X/cartigma/commit/bc72047616b15c772c68bb7046ac7d898317d9cb)

### v1.188.92b — 2026-11-18 — Correção de bug

fix(i18n): preserve continent names in legacy dossiers; use new separate region clues

Commits: [`5ee6b5d1`](https://github.com/F404X/cartigma/commit/5ee6b5d105bc99c6ed1571e5b5f4b2f01c9eebd3)

### v1.188.91b — 2026-11-18 — Registro técnico — sem incremento

test: verify 10 North/Central, 13 Caribbean, shared region clues and six-continent draw

Commits: [`41c1a932`](https://github.com/F404X/cartigma/commit/41c1a9326a0d29faea96b64492b6d330918fd9f4)

### v1.188.91b — 2026-11-18 — Atualização geral

feat(game): render Caribbean region hint and preserve old daily cases

Commits: [`7d771f1a`](https://github.com/F404X/cartigma/commit/7d771f1ad74295713740c552bb6787a34b4b3c6c)

### v1.187.91b — 2026-11-18 — Atualização geral

i18n: keep Caribbean as a region while case dossiers name its continent Americas

Commits: [`0c1ad6f7`](https://github.com/F404X/cartigma/commit/0c1ad6f7814d0028d59c94928cd8cd6c755b7d28)

### v1.186.91b — 2026-11-18 — Atualização geral

i18n: name North/Central America separately from Caribbean in all 19 languages

Commits: [`871a0bda`](https://github.com/F404X/cartigma/commit/871a0bdae1f0d82df28eb25a53d951fb5f88de21)

### v1.185.91b — 2026-11-18 — Atualização geral

feat(clues): distinguish Caribbean as region from North/Central America, preserve six-continent draw

Commits: [`1d6f7104`](https://github.com/F404X/cartigma/commit/1d6f71047e962b650c176bf121d8dc801279c257)

### v1.184.91b — 2026-11-18 — Registro técnico — sem incremento

test(account): implement append on mock history list

Commits: [`860c60ed`](https://github.com/F404X/cartigma/commit/860c60ed166ebf023f69e4d0d7ba4cd4915b7a60)

### v1.184.91b — 2026-11-18 — Registro técnico — sem incremento

test(account): update history smoke assertion to explicit victory label

Commits: [`8c08b4e9`](https://github.com/F404X/cartigma/commit/8c08b4e96b9f0c015a7422a38d36f106c09fa1dc)

### v1.184.91b — 2026-11-18 — Correção de bug

fix(cache): invalidate ranking history script after outcome labels

Commits: [`46911299`](https://github.com/F404X/cartigma/commit/469112991104a248e6c740515af453b2a9d47c2d)

### v1.184.90b — 2026-11-18 — Registro técnico — sem incremento

test(account): assert country and victory/defeat labels in match history

Commits: [`6ad31c92`](https://github.com/F404X/cartigma/commit/6ad31c925a1e12ad87c9f5ae336e8cb99f41116f)

### v1.184.90b — 2026-11-18 — Correção de bug

fix(account): label match history with country and explicit victory or defeat

Commits: [`84f12cf0`](https://github.com/F404X/cartigma/commit/84f12cf0b9bfc281ecaee649ba7126b72bf34752)

### v1.184.89b — 2026-11-18 — Registro técnico — sem incremento

Remove completed staging recovery workflow

Commits: [`d3deeee4`](https://github.com/F404X/cartigma/commit/d3deeee496dd96349509acd226ead60355342099)

### v1.184.89b — 2026-11-18 — Registro técnico — sem incremento

Run one-time staging account recovery

Commits: [`52362016`](https://github.com/F404X/cartigma/commit/523620165ccc7605d51057223d5acc8208c4f946)

### v1.184.89b — 2026-11-18 — Atualização geral

Save full case dossiers in account match history

Commits: [`c8737b0e`](https://github.com/F404X/cartigma/commit/c8737b0e88149a9375a6f5182a271570fbac6e72)

### v1.183.89b — 2026-11-18 — Atualização geral

Show solve times and break leaderboard ties by speed

Commits: [`b1f13024`](https://github.com/F404X/cartigma/commit/b1f13024678f1db330e0e5287bd339fa8a35bf66)

### v1.182.89b — 2026-11-18 — Atualização geral

Balance continental draws and make Freeplay scores visible

Commits: [`91353020`](https://github.com/F404X/cartigma/commit/91353020fd5e750cf7a05268a239ab4732bc3bc1)

### v1.181.89b — 2026-11-18 — Atualização geral

Improve country deduction and ranked match reliability

Commits: [`c5623822`](https://github.com/F404X/cartigma/commit/c5623822e0dea27ae8ef86d66ec0fd6a62a3b2ef)

### v1.180.89b — 2026-11-18 — Correção de bug

fix(cache): load latest shared-scoring game engine in staging preview

Commits: [`9e2baa62`](https://github.com/F404X/cartigma/commit/9e2baa627700972e8fb32c668b934be93276c498)

### v1.180.88b — 2026-11-18 — Correção de bug

fix(ranking): preserve pending guesses when purchasing hints or overlays

Commits: [`57020977`](https://github.com/F404X/cartigma/commit/570209770cb9f56e49f581c6b89893a98f1d59b2)

### v1.180.87b — 2026-11-18 — Registro técnico — sem incremento

test(staging): check canonical clues, per-clue prices and anti-double-spend overlays

Commits: [`2098a528`](https://github.com/F404X/cartigma/commit/2098a5282161f4efb49daa2cde43e6757d7e72a1)

### v1.180.87b — 2026-11-18 — Registro técnico — sem incremento

docs: document shared clue engine and latitude/UTM removal

Commits: [`53146f5f`](https://github.com/F404X/cartigma/commit/53146f5f8edf3c1f0668f53c48faa3836330b5ac)

### v1.180.87b — 2026-11-18 — Registro técnico — sem incremento

test: normalize VM realm before comparing currency snapshot objects

Commits: [`c2d0c1c8`](https://github.com/F404X/cartigma/commit/c2d0c1c879663594ea81a57e6272d071413f6510)

### v1.180.87b — 2026-11-18 — Registro técnico — sem incremento

test: update UI regressions for sourced 6–10 clues and removed UTM/latitude hints

Commits: [`6620acfd`](https://github.com/F404X/cartigma/commit/6620acfd65ca1b12d3fb4d563f7aaf9ea147b3c9)

### v1.180.87b — 2026-11-18 — Registro técnico — sem incremento

test(ranking): verify evidence, metadata and scoring parity against browser for all countries

Commits: [`86c76920`](https://github.com/F404X/cartigma/commit/86c769208b135aa471f62ea5f10e855408f45bec)

### v1.180.87b — 2026-11-18 — Atualização geral

feat(game): validate ranked overlays and score with shared offline rules

Commits: [`8056c734`](https://github.com/F404X/cartigma/commit/8056c734550482a8fc3c1732dbcab1444fefe988)

### v1.179.87b — 2026-11-18 — Atualização geral

feat(clues): load shared engine in static preview, Worker and test harness

Commits: [`22071896`](https://github.com/F404X/cartigma/commit/220718964d95c9e1aa7e9ae2bb12e8653e725160), [`5eb5d7e9`](https://github.com/F404X/cartigma/commit/5eb5d7e9339d86d1d9ff513508a3a91100065792), [`d4b50071`](https://github.com/F404X/cartigma/commit/d4b50071ab696a0ca0898760a17038e64f352c26), [`9ca36cdb`](https://github.com/F404X/cartigma/commit/9ca36cdbe7e91c5358f07e3d6fd27f2ab7d415b6), [`1c45913a`](https://github.com/F404X/cartigma/commit/1c45913a5cc13c012343cf32c1ba042ff1ca82f0)

### v1.178.87b — 2026-11-18 — Atualização geral

feat(ranking): authoritative shared clues and costs with validated map overlays

Commits: [`e6489fbb`](https://github.com/F404X/cartigma/commit/e6489fbb4c0ff9a76c39d93966d9dc501f40602d)

### v1.177.87b — 2026-11-18 — Atualização geral

feat(ranking): track validated overlay purchases without migrating active rounds

Commits: [`01fb1406`](https://github.com/F404X/cartigma/commit/01fb1406d8af91d3e5927ca38d566d8c1eb2f332)

### v1.176.87b — 2026-11-18 — Atualização geral

feat(clues): share exact score and overlay-price formulas across runtimes

Commits: [`fbaa8c88`](https://github.com/F404X/cartigma/commit/fbaa8c88cc0b840bda5ac0a83ea694f85a4c42f8)

### v1.175.87b — 2026-11-18 — Atualização geral

feat(clues): unify offline/ranked clue selection, formatting and hint costs

Commits: [`6bf86495`](https://github.com/F404X/cartigma/commit/6bf86495988c98d00ce8f998ff5d42fe2a955e9a)

### v1.174.87b — 2026-11-18 — Atualização geral

feat(ranking): mirror verified country evidence facts for server parity

Commits: [`c265fec2`](https://github.com/F404X/cartigma/commit/c265fec2823d9900f4bfb277077a41e1b1188169)

### v1.173.87b — 2026-11-18 — Atualização geral

feat(clues): add single deterministic evidence and hint-cost engine for offline and ranked

Commits: [`3723d475`](https://github.com/F404X/cartigma/commit/3723d4756221eb40db4c6dff4c4df920bba60e7c)

### v1.172.87b — 2026-11-18 — Registro técnico — sem incremento

test: verify password policy and repeated leaderboard reads without cooldown

Commits: [`c0a42f4b`](https://github.com/F404X/cartigma/commit/c0a42f4bf1b15e6333d372100011b7cdad9c2dfd), [`5325b948`](https://github.com/F404X/cartigma/commit/5325b948abd3a7b9a99c7ef3a1d07f036da25550)

### v1.172.87b — 2026-11-18 — Correção de bug

fix(auth): 8-character alphanumeric policy; remove leaderboard cooldown in UI

Commits: [`d7d5ff75`](https://github.com/F404X/cartigma/commit/d7d5ff75e46b6d43b2f2fca5a33e7d81c132eb44), [`0cf132ac`](https://github.com/F404X/cartigma/commit/0cf132ac05760a5a2a1344d7162cc6411e8d6a4d), [`c4dee845`](https://github.com/F404X/cartigma/commit/c4dee84515df4fc8668effde2f2dc3edc019c763)

### v1.172.86b — 2026-11-18 — Correção de bug

fix(ranking): remove Worker cooldown and allow 8-character alphanumeric passwords

Commits: [`2db5aa46`](https://github.com/F404X/cartigma/commit/2db5aa46e57bc7096c5801426dd9fabadd04456e), [`0aa55eba`](https://github.com/F404X/cartigma/commit/0aa55ebaa821400a71613efdf5478beaf18c2480), [`58df2005`](https://github.com/F404X/cartigma/commit/58df2005cb04206216ca754988116a2c48307f57), [`2617d823`](https://github.com/F404X/cartigma/commit/2617d823f7155a14effb85f0c55b609d5c7ea4b5), [`43f0329a`](https://github.com/F404X/cartigma/commit/43f0329ac6b58fdca8dfcb9ae7efed6bb041b42b), [`12e91ab3`](https://github.com/F404X/cartigma/commit/12e91ab330629dad80a09d7d0186022d293645c2)

### v1.172.85b — 2026-11-18 — Correção de bug

fix: invalidate cached map game JS after free-to-daily navigation fix

Commits: [`2d8beadd`](https://github.com/F404X/cartigma/commit/2d8beadd6eec68f2496b5f2489cc07421b250e50)

### v1.172.84b — 2026-11-18 — Registro técnico — sem incremento

test: switch to Daily directly from the completed Free case dossier

Commits: [`41577180`](https://github.com/F404X/cartigma/commit/41577180c513941794a778bc25764b2c79f300a7)

### v1.172.84b — 2026-11-18 — Correção de bug

fix(ui): allow Daily mode directly from completed Free case report

Commits: [`0fd17903`](https://github.com/F404X/cartigma/commit/0fd179036feed2892826487142c32f49f713a43b)

### v1.172.83b — 2026-11-17 — Correção de bug

fix: bust mobile caches for free-play and mode switching fix

Commits: [`07767e87`](https://github.com/F404X/cartigma/commit/07767e870f676ca1c589dd114c1192789c8b96ae)

### v1.172.82b — 2026-11-17 — Registro técnico — sem incremento

test: use localized mode controls and updated Rush title in navigation regression

Commits: [`63d18360`](https://github.com/F404X/cartigma/commit/63d18360c0236c012abe5ab7aeb62de565565758)

### v1.172.82b — 2026-11-17 — Registro técnico — sem incremento

test: free replay and mode switch after ranked result

Commits: [`a87c44e3`](https://github.com/F404X/cartigma/commit/a87c44e3a2a8359ebce0a34bbe3257191490301a)

### v1.172.82b — 2026-11-17 — Atualização geral

perf(ranking): skip redundant API checks for completed free-play cases

Commits: [`b652108e`](https://github.com/F404X/cartigma/commit/b652108e1f01aa337eaaf6e03119453b05d46a5c)

### v1.171.82b — 2026-11-17 — Correção de bug

fix(ranking): bind server game requests to correct mode during navigation

Commits: [`fddc1c2f`](https://github.com/F404X/cartigma/commit/fddc1c2fe2b5b8cf634b22a1b08149ef7fe0d81d)

### v1.171.81b — 2026-11-17 — Correção de bug

fix(game): prevent finished free-play session from hijacking mode switches

Commits: [`6e7a71d0`](https://github.com/F404X/cartigma/commit/6e7a71d0559b163472a2bf057619160eeb506d78)

### v1.171.80b — 2026-11-17 — Correção de bug

fix(ranking): isolate session by mode and allow unlimited free cases after daily score

Commits: [`e8bd2890`](https://github.com/F404X/cartigma/commit/e8bd2890d7a8a923a667e331697baf1c4b16d3b6)

### v1.171.79b — 2026-11-17 — Correção de bug

fix: refresh game engine asset fingerprint for corrected start card

Commits: [`3e1ffc93`](https://github.com/F404X/cartigma/commit/3e1ffc934327dbc0deed83c165aa06721294568c)

### v1.171.78b — 2026-11-17 — Registro técnico — sem incremento

test: verify correct start-card mode and attempts

Commits: [`4bbee7de`](https://github.com/F404X/cartigma/commit/4bbee7de92e15e8d98c5815dc41dba98c4925f43)

### v1.171.78b — 2026-11-17 — Correção de bug

fix: display current mode and attempt count on start card

Commits: [`ba01a5a8`](https://github.com/F404X/cartigma/commit/ba01a5a88f63525fcbcf752650b960d191a213bd), [`3b36f0b4`](https://github.com/F404X/cartigma/commit/3b36f0b4de3671c79e566f0fafbd3471dc13249f)

### v1.171.77b — 2026-11-17 — Registro técnico — sem incremento

test: verify authenticated games use native Cartigma map and automatic ranked API flow

Commits: [`5e1f0ec7`](https://github.com/F404X/cartigma/commit/5e1f0ec77fbdb1a6a29f63b59d3c13858bf50faf)

### v1.171.77b — 2026-11-17 — Registro técnico — sem incremento

test(ranking): smoke-test automatic ranked reservation and 180-second leaderboard limit

Commits: [`8c8f142a`](https://github.com/F404X/cartigma/commit/8c8f142ace38cf6d7b1fb70d72296e49c3cc0632)

### v1.171.77b — 2026-11-17 — Registro técnico — sem incremento

ci: redeploy staging preview when native game or leaderboard UI changes

Commits: [`6b692f4d`](https://github.com/F404X/cartigma/commit/6b692f4df165fa6da7de36fbbf08fcc1fbf5fd53)

### v1.171.77b — 2026-11-17 — Correção de bug

fix(ranking): release native controls after online start and remove dead map branch

Commits: [`3b179c09`](https://github.com/F404X/cartigma/commit/3b179c0969c670e5bc7e5946ff52fb423df68232)

### v1.171.76b — 2026-11-17 — Registro técnico — sem incremento

test: preserve active-game fixtures and verify new universal Start gate

Commits: [`62db4edf`](https://github.com/F404X/cartigma/commit/62db4edf1a5513921e8b0c9b0819eccaaae81150)

### v1.171.76b — 2026-11-17 — Correção de bug

fix(ranking): session auto-detection, 180s throttling and shared native start UI

Commits: [`5adf5aee`](https://github.com/F404X/cartigma/commit/5adf5aee8e8faaa72ce70bebdb75902503ff9c54), [`dd4eee42`](https://github.com/F404X/cartigma/commit/dd4eee421f14b43e4a0d554129c3dad9fd96a09b), [`aedb8359`](https://github.com/F404X/cartigma/commit/aedb8359b62ed82436480d6d1dced71eda697d54), [`bd93a140`](https://github.com/F404X/cartigma/commit/bd93a140579be48db2271d6d0f8df6a1bebae8a7), [`327ff8c7`](https://github.com/F404X/cartigma/commit/327ff8c732a97718f2da485ca9630248b8b64796)

### v1.171.75b — 2026-11-17 — Correção de bug

fix(ranking): synchronous guest start, session resume and native map flow

Commits: [`7a6db473`](https://github.com/F404X/cartigma/commit/7a6db473897e16cf7269092574367768fab65d49)

### v1.171.74b — 2026-11-17 — Atualização geral

refactor(ranking): implicit account ranked sessions and cached simple leaderboard

Commits: [`c049c44e`](https://github.com/F404X/cartigma/commit/c049c44eaea8f76efa8630a1fa81e93c72f98fab)

### v1.170.74b — 2026-11-17 — Atualização geral

refactor(ranking): show only leaderboard and account, no separate play or refresh

Commits: [`377ae5d6`](https://github.com/F404X/cartigma/commit/377ae5d61408f6762dbfcaf6c2730897beccaaff)

### v1.169.74b — 2026-11-17 — Atualização geral

feat: start gate and automatic ranked play on native Cartigma interface

Commits: [`ea8eef7b`](https://github.com/F404X/cartigma/commit/ea8eef7b231302d04226fca40a1d5c1f022e829c)

### v1.168.74b — 2026-11-17 — Atualização geral

feat(ranking): reserve account attempts and enforce 3-minute IP cooldown

Commits: [`c05b7a76`](https://github.com/F404X/cartigma/commit/c05b7a76be64db99b121525de0b9afe16cba6d83), [`681389af`](https://github.com/F404X/cartigma/commit/681389af64507f627c5289f9b2b286cef2cea76c), [`8bba92e6`](https://github.com/F404X/cartigma/commit/8bba92e6952f965d0b49c7dfba5f30b050df2f11), [`cc941cb4`](https://github.com/F404X/cartigma/commit/cc941cb42c8606d9b176e46a9ba91d344d1d28b5)

### v1.167.74b — 2026-11-17 — Registro técnico — sem incremento

test(ranking): verify staging preview, account lifecycle and score saving

Commits: [`75b88239`](https://github.com/F404X/cartigma/commit/75b882396732f1a843feaa57c321beace4cc0ef0)

### v1.167.74b — 2026-11-17 — Atualização geral

feat(ranking): publish isolated playable staging preview

Commits: [`73efa363`](https://github.com/F404X/cartigma/commit/73efa3634ad469f981be13fac112f0df46cf4aec), [`b1185f81`](https://github.com/F404X/cartigma/commit/b1185f812257f0512f594cd3eba51d862a464852), [`6e50d6b6`](https://github.com/F404X/cartigma/commit/6e50d6b62a620bb6802e8dca59f04896d0923424), [`99f1bf23`](https://github.com/F404X/cartigma/commit/99f1bf23ee43d10b2b8bcd1935326af08c7ebd07)

### v1.166.74b — 2026-11-17 — Correção de bug

fix(ranking): use non-interactive Wrangler deploy supported syntax

Commits: [`e844fff9`](https://github.com/F404X/cartigma/commit/e844fff9a86547e92cf36d946325337308283f24)

### v1.166.73b — 2026-11-17 — Correção de bug

fix(ranking): correct CI expectations and D1 API provisioning

Commits: [`11b85864`](https://github.com/F404X/cartigma/commit/11b858640ea068239836600c1221e319dcd81be6), [`23e83eca`](https://github.com/F404X/cartigma/commit/23e83eca42b08b46a25ac7e827c3f459a2d3bcd5), [`0b185674`](https://github.com/F404X/cartigma/commit/0b1856746cfac4b9c78394391a01d0dd3fdf52f7)

### v1.166.72b — 2026-11-17 — Registro técnico — sem incremento

ci(ranking): provision isolated Cloudflare staging D1 and Worker

Commits: [`5a430320`](https://github.com/F404X/cartigma/commit/5a430320f8f650f2aafa6ef8d4d01a2c7ded2eca)

### v1.166.72b — 2026-11-17 — Registro técnico — sem incremento

ci(ranking): run static checks tests and SQL trigger verification

Commits: [`75bc20d4`](https://github.com/F404X/cartigma/commit/75bc20d46399a1d9fe30258ed2796ecff8c4c6c8)

### v1.166.72b — 2026-11-17 — Atualização geral

feat(ranking): connect .github/workflows/pages.yml to competitive mode

Commits: [`377d361a`](https://github.com/F404X/cartigma/commit/377d361a9bcfc59abe21d23de074ff6e26145e02)

### v1.165.72b — 2026-11-17 — Atualização geral

feat(ranking): connect index.html to competitive mode

Commits: [`ccaa4e71`](https://github.com/F404X/cartigma/commit/ccaa4e71279d31319c031b45cc4da3ec4366a44c)

### v1.164.72b — 2026-11-17 — Atualização geral

feat(ranking): connect app.js to competitive mode

Commits: [`965aeb01`](https://github.com/F404X/cartigma/commit/965aeb019f943951e2744704038a08cf7cfca040)

### v1.163.72b — 2026-11-17 — Atualização geral

feat(ranking): style compact responsive leaderboard and account panel

Commits: [`e68e6364`](https://github.com/F404X/cartigma/commit/e68e6364c0703bc508b33ff5e2774943795b234e)

### v1.162.72b — 2026-11-17 — Atualização geral

feat(ranking): implement cached leaderboards and ranked UI

Commits: [`70d22bcb`](https://github.com/F404X/cartigma/commit/70d22bcba1c8a10d705b3f0a2d6d7788347ac6b0)

### v1.161.72b — 2026-11-17 — Atualização geral

feat(ranking): add isolated accessible leaderboard panel markup

Commits: [`f3268f3b`](https://github.com/F404X/cartigma/commit/f3268f3b2658387e46ae70c85b05fb95b89ef802)

### v1.160.72b — 2026-11-17 — Registro técnico — sem incremento

test(ranking): cover country catalogue weekly keys and scoring

Commits: [`dedc6d3f`](https://github.com/F404X/cartigma/commit/dedc6d3f2f41debbf2c0367fbc794e9dbf428a31)

### v1.160.72b — 2026-11-17 — Atualização geral

feat(ranking): add Worker API router CORS and safe errors

Commits: [`d6732e0b`](https://github.com/F404X/cartigma/commit/d6732e0bffaefcc423c121ecabd71a8eb36325f2)

### v1.159.72b — 2026-11-17 — Atualização geral

feat(ranking): add weekly monthly and all-time leaderboard queries

Commits: [`1b7473c7`](https://github.com/F404X/cartigma/commit/1b7473c71714349ee157d071c050a7cd85ed5077)

### v1.158.72b — 2026-11-17 — Atualização geral

feat(ranking): add server-authoritative daily match engine

Commits: [`15317b90`](https://github.com/F404X/cartigma/commit/15317b90d4491a2c0310083d54a3e7f5d010bc12)

### v1.157.72b — 2026-11-17 — Atualização geral

feat(ranking): mirror 195-country catalogue for server-authoritative rounds

Commits: [`fb7e411d`](https://github.com/F404X/cartigma/commit/fb7e411da52890166718f6d6c1929d5abfaf2a32)

### v1.156.72b — 2026-11-17 — Atualização geral

feat(ranking): add account login secure password hashes sessions and reset

Commits: [`d3227988`](https://github.com/F404X/cartigma/commit/d32279884da85a687e5f29ca70e385be4a66fed6)

### v1.155.72b — 2026-11-17 — Atualização geral

feat(ranking): add API crypto and HTTP utilities

Commits: [`292e961e`](https://github.com/F404X/cartigma/commit/292e961e59ba147d8aa81bdbcebb1831f2edd9b3)

### v1.154.72b — 2026-11-17 — Atualização geral

feat(ranking): add backend/README.md

Commits: [`74aa548d`](https://github.com/F404X/cartigma/commit/74aa548d1b4de5ea501fb920d31c0f197c829e1d)

### v1.153.72b — 2026-11-17 — Atualização geral

feat(ranking): add backend/.gitignore

Commits: [`6b43da80`](https://github.com/F404X/cartigma/commit/6b43da80cf10b412114fe9d645cdadf102302b92)

### v1.152.72b — 2026-11-17 — Atualização geral

feat(ranking): add backend/package.json

Commits: [`295d281e`](https://github.com/F404X/cartigma/commit/295d281ebc9c2229a05570b918bb4a47331b0a6e)

### v1.151.72b — 2026-11-17 — Atualização geral

feat(ranking): add backend/wrangler.toml

Commits: [`32f61c4d`](https://github.com/F404X/cartigma/commit/32f61c4d079ae719b9b76fde43f091d0a8c7a102)

### v1.150.72b — 2026-11-17 — Atualização geral

feat(ranking): add backend/schema.sql

Commits: [`94b22a33`](https://github.com/F404X/cartigma/commit/94b22a334003a8816d310f3611f5ca16315affd0)

### v1.149.72b — 2026-11-17 — Registro técnico — sem incremento

Merge pull request #26 from F404X/fix/mobile-postgame-map-navigation

Commits: [`6c41ef06`](https://github.com/F404X/cartigma/commit/6c41ef066ec2a5a8f0baa806bdc56071c11921b9)

### v1.149.72b — 2026-11-17 — Registro técnico — sem incremento

test(mobile): ensure postgame case-file tab and responsive three-button dock

Commits: [`bbfe8269`](https://github.com/F404X/cartigma/commit/bbfe826981c26aae9c13738966985aa171802228)

### v1.149.72b — 2026-11-17 — Registro técnico — sem incremento

test(mobile): restore history and case-file controls after viewing a completed map

Commits: [`8a697d9a`](https://github.com/F404X/cartigma/commit/8a697d9a7e129c61c962c36db37825a9c77a5d5f)

### v1.149.72b — 2026-11-17 — Atualização geral

style(mobile): fit three postgame navigation buttons and show compact guess history

Commits: [`4f651858`](https://github.com/F404X/cartigma/commit/4f651858fa3168bc95d424d9a08edb1ddd5cfa32)

### v1.148.72b — 2026-11-17 — Correção de bug

fix(mobile): keep postgame evidence and guesses interactive and expose Case file return

Commits: [`bbcef2c4`](https://github.com/F404X/cartigma/commit/bbcef2c454cd3601998b45adaac2aaa3ae9fa84d)

### v1.148.71b — 2026-11-17 — Atualização geral

ui(mobile): give postgame control dock an addressable state

Commits: [`417a70c3`](https://github.com/F404X/cartigma/commit/417a70c33ede93f44c5764382a9c2d4de1027e6b)

### v1.147.71b — 2026-11-17 — Atualização geral

feat(mobile): add an always-available postgame Case file button beside evidence and guesses

Commits: [`99743333`](https://github.com/F404X/cartigma/commit/99743333274746742e3c8b2d31b3af2935e2dec6)

### v1.146.71b — 2026-11-17 — Registro técnico — sem incremento

Merge pull request #25 from F404X/fix/result-pin-normal-hard-lesotho

Commits: [`bbd5d4f6`](https://github.com/F404X/cartigma/commit/bbd5d4f68f53d383e80e994e670a2a5bc9f2a809)

### v1.146.71b — 2026-11-17 — Registro técnico — sem incremento

test: verify Lesotho and all-difficulty result pins, map focus and history persistence

Commits: [`ab604b8a`](https://github.com/F404X/cartigma/commit/ab604b8ad2a5c9e82cfffb12e655d56a8538c636)

### v1.146.71b — 2026-11-17 — Correção de bug

fix: show and center result pin for Normal and Hard as well as Rush

Commits: [`827dc22d`](https://github.com/F404X/cartigma/commit/827dc22d5454d68b8c0ff30801ba07e57fba302f)

### v1.146.70b — 2026-11-17 — Registro técnico — sem incremento

Merge pull request #24 from F404X/fix/mobile-header-list-and-map-settings-icons

Commits: [`592a49be`](https://github.com/F404X/cartigma/commit/592a49beb3160345c68794c793940bef687027cd)

### v1.146.70b — 2026-11-17 — Registro técnico — sem incremento

test: scope mobile icon rules without stopping at nested CSS brace

Commits: [`e9df264a`](https://github.com/F404X/cartigma/commit/e9df264a0e20a07868af4bfc6686eac1afb8a25a)

### v1.146.70b — 2026-11-17 — Registro técnico — sem incremento

test(mobile): keep header and gear icons legible without changing desktop styles

Commits: [`36c41b32`](https://github.com/F404X/cartigma/commit/36c41b32a2d55e120b79a8ad6d6544f01d18641f)

### v1.146.70b — 2026-11-17 — Registro técnico — sem incremento

test: prevent mobile question-mark duplication and malformed map gear icons

Commits: [`92f540ee`](https://github.com/F404X/cartigma/commit/92f540ee19b4567da162def1666d45dcf0ca5041)

### v1.146.70b — 2026-11-17 — Correção de bug

fix(mobile): center map settings cog and preserve a single country-list icon

Commits: [`79cc7b22`](https://github.com/F404X/cartigma/commit/79cc7b22370bfc4354f59081205d7b0320a79cca)

### v1.146.69b — 2026-11-17 — Correção de bug

fix: replace malformed map-settings gear with a centered cog icon

Commits: [`a1f67370`](https://github.com/F404X/cartigma/commit/a1f67370ba6c0499aea419d1cdadea059eaba1f9)

### v1.146.68b — 2026-11-17 — Correção de bug

fix(mobile): restrict question-mark icon to Help button

Commits: [`7a73d95d`](https://github.com/F404X/cartigma/commit/7a73d95d1cdc05d75d1cf94cdb05afa674b4e1ff)

### v1.146.67b — 2026-11-17 — Registro técnico — sem incremento

Merge pull request #23 from F404X/fix/mobile-evidence-above-map-footer-two-clues

Commits: [`bcb74e9e`](https://github.com/F404X/cartigma/commit/bcb74e9e054dac99ff2883c6495e9274fa6aea3e)

### v1.146.67b — 2026-11-17 — Registro técnico — sem incremento

test(mobile): assert two-clue popup size and map footer clearance

Commits: [`9628d91e`](https://github.com/F404X/cartigma/commit/9628d91eb1c501cf4d302c0921de82ed7f5e1857)

### v1.146.67b — 2026-11-17 — Correção de bug

fix(mobile): move evidence sheet clear of map footer and size it for two clues

Commits: [`049e5555`](https://github.com/F404X/cartigma/commit/049e55554ebaea8006c2423fe76875ce05bdef08)

### v1.146.66b — 2026-11-17 — Registro técnico — sem incremento

Merge pull request #22 from F404X/fix/mobile-clue-popup-hidden-under-map-footer

Commits: [`b24b0857`](https://github.com/F404X/cartigma/commit/b24b0857dd6e9e92dc559424e1439fa684434aad)

### v1.146.66b — 2026-11-17 — Registro técnico — sem incremento

test: position last evidence fully within mobile popover scroll viewport

Commits: [`dbda0ff8`](https://github.com/F404X/cartigma/commit/dbda0ff807b9d653c4a5d35bea47f7a78c04afea)

### v1.146.66b — 2026-11-17 — Registro técnico — sem incremento

test(mobile): verify clue popover stacks above footer and latest text is not clipped

Commits: [`692fba09`](https://github.com/F404X/cartigma/commit/692fba0928f61ed833dd807f2a8cb8e4a03c7cdb)

### v1.146.66b — 2026-11-17 — Correção de bug

fix(mobile): bring entire latest clue inside internal scroll viewport

Commits: [`b8b50bb9`](https://github.com/F404X/cartigma/commit/b8b50bb9fb0387d3e07dcaa093662e95d928bccd)

### v1.146.65b — 2026-11-17 — Correção de bug

fix(mobile): layer clue popup above map footer and preserve final clue lines

Commits: [`74cbd48b`](https://github.com/F404X/cartigma/commit/74cbd48b2a41c516e876579c7f8f3831a09687f5)

### v1.146.64b — 2026-11-17 — Registro técnico — sem incremento

Merge pull request #21 from F404X/fix/mobile-evidence-popover-height-latest

Commits: [`e5c03bcd`](https://github.com/F404X/cartigma/commit/e5c03bcdec4762efe4b1a5d0b1148619ee429d69)

### v1.146.64b — 2026-11-17 — Registro técnico — sem incremento

test: count visible unlocked clues accurately in the mock DOM

Commits: [`ea4e72eb`](https://github.com/F404X/cartigma/commit/ea4e72ebdec7ed9acb97e68ac20271aa2c360128)

### v1.146.64b — 2026-11-17 — Registro técnico — sem incremento

test: follow latest unlocked evidence on mobile only, including after reopening

Commits: [`717af0ba`](https://github.com/F404X/cartigma/commit/717af0bae4034e93815c127ee6e6cc514ab81ce9)

### v1.146.64b — 2026-11-17 — Registro técnico — sem incremento

test(mobile): limit evidence popup to 30dvh and keep its own scroll

Commits: [`2d07bc67`](https://github.com/F404X/cartigma/commit/2d07bc6771d7347c9458bb89ac8e84a8414f9e56)

### v1.146.64b — 2026-11-17 — Correção de bug

fix(mobile): auto-scroll evidence popover to the fully visible newest clue

Commits: [`cd0fa47a`](https://github.com/F404X/cartigma/commit/cd0fa47ab9a571990407274a1c58e287c7d4161c)

### v1.146.63b — 2026-11-17 — Correção de bug

fix(mobile): limit evidence sheet height and visually identify the newest clue

Commits: [`3a181f16`](https://github.com/F404X/cartigma/commit/3a181f16602ae55973f7873bc9c572fa7bddeddf)

### v1.146.62b — 2026-11-17 — Registro técnico — sem incremento

Merge pull request #20 from F404X/feat/mobile-compact-panels-rush-no-overlays

Commits: [`6797f349`](https://github.com/F404X/cartigma/commit/6797f3496e0df512fccba06f70ab2b8535396b60)

### v1.146.62b — 2026-11-17 — Registro técnico — sem incremento

test(mobile): verify no popup opens before Rush Start

Commits: [`c7657823`](https://github.com/F404X/cartigma/commit/c765782329f78d204ad5012e2f162c3c8c4cf388)

### v1.146.62b — 2026-11-17 — Correção de bug

fix(mobile): hide both panels before Rush starts and dismiss keyboard after guesses

Commits: [`15816af1`](https://github.com/F404X/cartigma/commit/15816af1d9b622c3cf818d02697ddcef90ef3d8c)

### v1.146.61b — 2026-11-17 — Registro técnico — sem incremento

docs: clarify Rush overlay restrictions and viewport-contained mobile popovers

Commits: [`b612b9a2`](https://github.com/F404X/cartigma/commit/b612b9a2b6978e61090119ddf93024acd02b9986)

### v1.146.61b — 2026-11-17 — Registro técnico — sem incremento

test: verify Rush overlay lockdown and interactive mobile popovers across modes

Commits: [`bad3f033`](https://github.com/F404X/cartigma/commit/bad3f0335bcf7296959dc077b56a29d975719ea3)

### v1.146.61b — 2026-11-17 — Registro técnico — sem incremento

test(mobile): verify viewport-contained popovers, keyboard-sized inputs and desktop isolation

Commits: [`12155c9c`](https://github.com/F404X/cartigma/commit/12155c9cc1cf84775d04e8da97c99c0b525dec4e)

### v1.146.61b — 2026-11-17 — Correção de bug

fix(mobile): keep guess popover open when selecting countries on the map

Commits: [`8b4d7677`](https://github.com/F404X/cartigma/commit/8b4d76772bbfc01d4a1ac8d36b4d41ff7c7e99f4)

### v1.146.60b — 2026-11-17 — Atualização geral

feat(mobile): fit the map and compact evidence/guess popovers inside one viewport

Commits: [`a5b5c772`](https://github.com/F404X/cartigma/commit/a5b5c772622d096be473301b00f6ba83b965789b)

### v1.145.60b — 2026-11-17 — Atualização geral

feat(mobile): connect popup toggles, auto-show new clues, fit result dossier in viewport

Commits: [`a844a86f`](https://github.com/F404X/cartigma/commit/a844a86f59157a24d255741c2f93d8880845a4ef)

### v1.144.60b — 2026-11-17 — Atualização geral

feat: disable evidence overlays in Rush and implement mobile-only popup state

Commits: [`30ef44ee`](https://github.com/F404X/cartigma/commit/30ef44eef613c52c58ffa33e914c8ac482e9601e)

### v1.143.60b — 2026-11-17 — Atualização geral

feat(mobile): add compact evidence and guess popover controls

Commits: [`82b99e2b`](https://github.com/F404X/cartigma/commit/82b99e2b62a3de0cf54e42513323b37c99eaa973)

### v1.142.60b — 2026-11-17 — Registro técnico — sem incremento

Merge pull request #19 from F404X/fix/deduplicate-report-trivia-and-history

Commits: [`e50353d5`](https://github.com/F404X/cartigma/commit/e50353d5122b64967f90e76d307433926491aecc)

### v1.142.60b — 2026-11-17 — Registro técnico — sem incremento

test: prevent duplicate history and trivia in country reports

Commits: [`351418c4`](https://github.com/F404X/cartigma/commit/351418c423e8ee776392dcfb2efb6ca687626043)

### v1.142.60b — 2026-11-17 — Atualização geral

ui: suppress empty or redundant Did you know card in the case dossier

Commits: [`c3607bdb`](https://github.com/F404X/cartigma/commit/c3607bdbcaf12eb7a161aefd4bd893b2bab7ee2e)

### v1.141.60b — 2026-11-17 — Correção de bug

fix: display trivia only when distinct from the country history

Commits: [`73b04e16`](https://github.com/F404X/cartigma/commit/73b04e16cebb36a0af22d96b834195dac293daca)

### v1.141.59b — 2026-11-17 — Registro técnico — sem incremento

Merge pull request #18 from F404X/feat/search-keyboard-rush-result-pin

Commits: [`c2334010`](https://github.com/F404X/cartigma/commit/c23340106b20826377d221d9ba4f6ca4319c2346)

### v1.141.59b — 2026-11-17 — Registro técnico — sem incremento

test: keyboard autocomplete submits guesses and Rush answer pins persist until new cases

Commits: [`37dbbe6c`](https://github.com/F404X/cartigma/commit/37dbbe6cb7ecbc136676cc21bd61f601bb72afef)

### v1.141.59b — 2026-11-17 — Atualização geral

ui: highlight keyboard-selected country and expose combobox ARIA state

Commits: [`fe948ebf`](https://github.com/F404X/cartigma/commit/fe948ebfbef9c955a5784efa3b0b1941df83af80), [`00eacb21`](https://github.com/F404X/cartigma/commit/00eacb210714cb0fca693b5cf65d95e989b8db18)

### v1.140.59b — 2026-11-17 — Atualização geral

feat: navigate country suggestions with arrow keys and submit highlighted guess on Enter

Commits: [`263302f8`](https://github.com/F404X/cartigma/commit/263302f8becf567c4b4df1d29a925c5edfde745b)

### v1.139.59b — 2026-11-17 — Atualização geral

feat: show correct-country star pin when Rush ends, with map-view focus

Commits: [`dcc8dc3e`](https://github.com/F404X/cartigma/commit/dcc8dc3e30d402ea62e8fe53ac9de5df0e3eaa89)

### v1.138.59b — 2026-11-17 — Registro técnico — sem incremento

Merge pull request #17 from F404X/fix/rush-persistent-guess-pins

Commits: [`36b7afbc`](https://github.com/F404X/cartigma/commit/36b7afbca69c966ce74bf6655b5947afe2cba298)

### v1.138.59b — 2026-11-17 — Registro técnico — sem incremento

test: ensure confirmed Rush pins survive subsequent guesses, redraws, and timeout

Commits: [`65459f90`](https://github.com/F404X/cartigma/commit/65459f90fc3ba29d57a748dda74df077f796b3be)

### v1.138.59b — 2026-11-17 — Correção de bug

fix: persist numbered guess pins across Rush confirmation and overlay redraws

Commits: [`c02c6cda`](https://github.com/F404X/cartigma/commit/c02c6cda0683be69916421b6ce565f788529b840)

### v1.138.58b — 2026-11-17 — Registro técnico — sem incremento

Merge pull request #16 from F404X/fix/rush-pins-latitude-and-random

Commits: [`e44bb5d5`](https://github.com/F404X/cartigma/commit/e44bb5d5a395726cc12088df03605fa9330f5228)

### v1.138.58b — 2026-11-17 — Registro técnico — sem incremento

docs: describe Rush pins, non-numeric latitude hints and independent random choices

Commits: [`aaefea48`](https://github.com/F404X/cartigma/commit/aaefea487fe7d48c0d2f17c8e6617bbb41f74233)

### v1.138.58b — 2026-11-17 — Registro técnico — sem incremento

test: cover Rush selected and submitted pins, non-repeating clue types and independent random rolls

Commits: [`3872e347`](https://github.com/F404X/cartigma/commit/3872e3475e92b33534643d92ba4b457fd7b0a597)

### v1.138.58b — 2026-11-17 — Atualização geral

i18n: replace numeric latitude-band counts with +another / +others in all 19 languages

Commits: [`e81bbf39`](https://github.com/F404X/cartigma/commit/e81bbf39aa63b22f12686a5a5e9aeaaf50b78f5c)

### v1.137.58b — 2026-11-17 — Atualização geral

i18n: describe land-border neighbors as an additional non-redundant country clue

Commits: [`82d91e97`](https://github.com/F404X/cartigma/commit/82d91e979adebc7b2abd1c5bf8d5576490167d2b)

### v1.136.58b — 2026-11-17 — Correção de bug

fix: Rush map guess pins, no numeric latitude suffix, and independent random country selection

Commits: [`8c7fa68f`](https://github.com/F404X/cartigma/commit/8c7fa68f803b238d5545c9a0272ba34ce7328ed6)

### v1.136.57b — 2026-11-17 — Registro técnico — sem incremento

Merge pull request #15 from F404X/refactor/country-only-catalog-and-rush-start

Commits: [`aa4d03a8`](https://github.com/F404X/cartigma/commit/aa4d03a84b587bfa45d548470f9f8645bb3b1281)

### v1.136.57b — 2026-11-17 — Atualização geral

refactor: remove hidden city target marker and obsolete distance reveal path

Commits: [`5647ee08`](https://github.com/F404X/cartigma/commit/5647ee08f8c0a4e3f6d5db33535c38b061ff59cd)

### v1.135.57b — 2026-11-17 — Correção de bug

fix(data): distinguish Holy See UN observer status from Vatican City

Commits: [`228e0d0a`](https://github.com/F404X/cartigma/commit/228e0d0a3b8d6332784847594bff8529447329b5)

### v1.135.56b — 2026-11-17 — Registro técnico — sem incremento

docs: clarify duplicate-free rolling 195-day daily scheduling

Commits: [`eecfeb2e`](https://github.com/F404X/cartigma/commit/eecfeb2e4f30e19f897ed9d4d07e6bb02c178a5a)

### v1.135.56b — 2026-11-17 — Correção de bug

fix: prevent daily repetitions in any rolling 195-day window

Commits: [`aa9f7e86`](https://github.com/F404X/cartigma/commit/aa9f7e86093d99b10b1b8ec89342b26e1c03c48f)

### v1.135.55b — 2026-11-17 — Registro técnico — sem incremento

docs: document the 195-country-only game, fair shuffle, and Rush hidden hints

Commits: [`2404a89f`](https://github.com/F404X/cartigma/commit/2404a89f1033d0eb2965c094954ef1ea3e145919)

### v1.135.55b — 2026-11-17 — Atualização geral

refactor: delete obsolete city-based database places.js

Commits: [`3c558faa`](https://github.com/F404X/cartigma/commit/3c558faac030d34bb640361dd40a9ac7032767b2)

### v1.134.55b — 2026-11-17 — Atualização geral

refactor: delete obsolete city-based database facts.js

Commits: [`4c89849f`](https://github.com/F404X/cartigma/commit/4c89849f489143e841195a7bed68d9ca53a9e119)

### v1.133.55b — 2026-11-17 — Atualização geral

refactor: delete obsolete city-based database references.js

Commits: [`6f612ace`](https://github.com/F404X/cartigma/commit/6f612ace5c7d08c51e5eb9f108344a1fd527f9d6)

### v1.132.55b — 2026-11-17 — Atualização geral

refactor: delete obsolete city-based database city-clues-i18n.js

Commits: [`8c075bdc`](https://github.com/F404X/cartigma/commit/8c075bdc51d092418923533448cd31362a62ecce)

### v1.131.55b — 2026-11-17 — Atualização geral

refactor: delete obsolete city-based database urban-2025.js

Commits: [`016cc2c4`](https://github.com/F404X/cartigma/commit/016cc2c442bbddd6db7297547153d3b194f0e803)

### v1.130.55b — 2026-11-17 — Atualização geral

refactor: delete obsolete city-based database city-indicators.js

Commits: [`90438fe6`](https://github.com/F404X/cartigma/commit/90438fe6bebf80be22b6fe3d2b6057549e814a04)

### v1.129.55b — 2026-11-17 — Atualização geral

refactor: delete obsolete city-based database cities-extended.js

Commits: [`d90c5209`](https://github.com/F404X/cartigma/commit/d90c5209658de92a947b2367ffe83714fd5c7615)

### v1.128.55b — 2026-11-17 — Registro técnico — sem incremento

build: publish the country catalogue and remove all unused city assets

Commits: [`12438ed9`](https://github.com/F404X/cartigma/commit/12438ed9b60d2d98633a5b748712d08bab1e4557)

### v1.128.55b — 2026-11-17 — Registro técnico — sem incremento

test: cover complete country catalogue, Rush pre-start privacy and shuffle fairness

Commits: [`93183a2f`](https://github.com/F404X/cartigma/commit/93183a2f62a2182074c50efc935c4d2fbd574715)

### v1.128.55b — 2026-11-17 — Correção de bug

fix: country search input semantics and updated social preview title

Commits: [`dcfff8a3`](https://github.com/F404X/cartigma/commit/dcfff8a385435543f2b86ed026373ab1be5640a9)

### v1.128.54b — 2026-11-17 — Atualização geral

refactor: delete obsolete city guessing, landscape and city evidence definitions

Commits: [`dad98750`](https://github.com/F404X/cartigma/commit/dad98750a868c69de66056879e56b823a98d6396)

### v1.127.54b — 2026-11-17 — Atualização geral

refactor: remove city-name search and external city geocoding entirely

Commits: [`3566f018`](https://github.com/F404X/cartigma/commit/3566f01823ee37b62a6bbb4518a2373cd1ae89bc)

### v1.126.54b — 2026-11-17 — Atualização geral

i18n: relabel the searchable country dossier in all 19 interface languages

Commits: [`cf66134c`](https://github.com/F404X/cartigma/commit/cf66134c584751a49db400bdf54a1968f2697d0f)

### v1.125.54b — 2026-11-17 — Atualização geral

feat: load country-only data and relabel all 195 country dossier UI

Commits: [`9920c3a5`](https://github.com/F404X/cartigma/commit/9920c3a586ba78c54ce6575842e428e204db2256)

### v1.124.54b — 2026-11-17 — Atualização geral

feat: replace 500-city archive with searchable 195-country dossiers

Commits: [`2f4a8849`](https://github.com/F404X/cartigma/commit/2f4a8849c8c229c6cfef2aa8d2df7b9595712094)

### v1.123.54b — 2026-11-17 — Correção de bug

fix: never render Rush hints before Start and show country-only profile facts

Commits: [`c90ca690`](https://github.com/F404X/cartigma/commit/c90ca6905a6b119e0025d79da259d67ec7fa4ae6)

### v1.123.53b — 2026-11-17 — Atualização geral

feat: fair 195-country daily cycle and non-repeating persistent freeplay shuffle bag

Commits: [`ac808d55`](https://github.com/F404X/cartigma/commit/ac808d55730c85cb905723ff6afcb1a2dff4f5d3)

### v1.122.53b — 2026-11-17 — Atualização geral

refactor: replace city-derived evidence with country-only sources and remove landscape hints

Commits: [`965bc175`](https://github.com/F404X/cartigma/commit/965bc17512f732291dbddb2397621872058c52b1)

### v1.121.53b — 2026-11-17 — Atualização geral

feat: expand the country profiles to all 195 states

Commits: [`7090d188`](https://github.com/F404X/cartigma/commit/7090d188db097d723d082eac59c1fd4550c52d05)

### v1.120.53b — 2026-11-17 — Atualização geral

feat: add 195 unique countries with geographic reference metadata

Commits: [`49788e3e`](https://github.com/F404X/cartigma/commit/49788e3e5b89550557563e8ea88012edc437eb93)

### v1.119.53b — 2026-11-17 — Registro técnico — sem incremento

Merge pull request #14 from F404X/feat/country-only-normal-hard-latitude-belts

Commits: [`74cdfa54`](https://github.com/F404X/cartigma/commit/74cdfa54d7d62e232160f02f39f60e855e5476ec)

### v1.119.53b — 2026-11-17 — Registro técnico — sem incremento

test: cover country-only Normal/Hard guesses, removed clues and territorial latitude bands

Commits: [`9b8b100d`](https://github.com/F404X/cartigma/commit/9b8b100d171318ae02f9233b804725fed8803ebb)

### v1.119.53b — 2026-11-17 — Registro técnico — sem incremento

test: keep legacy city regression coverage separate from new country-only default

Commits: [`b53f35f1`](https://github.com/F404X/cartigma/commit/b53f35f180f6b667c306507917b9330cb64aee62)

### v1.119.53b — 2026-11-17 — Registro técnico — sem incremento

docs: describe country guessing and updated country latitude hints

Commits: [`d81ba0bf`](https://github.com/F404X/cartigma/commit/d81ba0bf144df3c025bc7300ad278a2084acd7fb), [`25c41ef6`](https://github.com/F404X/cartigma/commit/25c41ef6965ce4f9baae668d28ac19fa75e68c61)

### v1.119.53b — 2026-11-17 — Atualização geral

i18n: describe country-only Normal and Hard rules in 19 languages

Commits: [`e521d51e`](https://github.com/F404X/cartigma/commit/e521d51eb468f256c32752de4a2912d7f066326e)

### v1.118.53b — 2026-11-17 — Atualização geral

feat: latitude overlays show every band intersected by the target country

Commits: [`49745742`](https://github.com/F404X/cartigma/commit/49745742fcca5eb5e03c96def5916201338e67e6)

### v1.117.53b — 2026-11-17 — Atualização geral

feat: use territorial country selection and country-code victory in normal and hard

Commits: [`05db089a`](https://github.com/F404X/cartigma/commit/05db089a5062c660f201c5dae648060bf5e8d344)

### v1.116.53b — 2026-11-17 — Atualização geral

feat: adapt normal and hard UI, reports and guess history to country answers

Commits: [`2cf1970b`](https://github.com/F404X/cartigma/commit/2cf1970b22511e7ac9224b4bd579c4d6f53be9a9)

### v1.115.53b — 2026-11-17 — Atualização geral

feat: new country-evidence version removes capital, coast and capital-distance hints

Commits: [`c9065c8b`](https://github.com/F404X/cartigma/commit/c9065c8bca837c1231311cbd400c62db5d8d371d)

### v1.114.53b — 2026-11-17 — Atualização geral

feat: add sourced latitude-band coverage for all 165 playable countries

Commits: [`4b3ba819`](https://github.com/F404X/cartigma/commit/4b3ba8197ff3df167c95231d636a92ac089189bf)

### v1.113.53b — 2026-11-17 — Registro técnico — sem incremento

Merge pull request #13 from F404X/fix/rush-start-map-and-timer-layout

Commits: [`fc157bb1`](https://github.com/F404X/cartigma/commit/fc157bb1673f22e1c8bece327e0171d21712b965)

### v1.113.53b — 2026-11-17 — Registro técnico — sem incremento

test: fix asset assertions and cover old unopened Rush dailies

Commits: [`3e1f940d`](https://github.com/F404X/cartigma/commit/3e1f940d9aefefa1e2e26bb9060a3c2f2eb127a2)

### v1.113.53b — 2026-11-17 — Correção de bug

fix: prefer detailed country polygons, preload during Rush intro and migrate untouched dailies

Commits: [`1c9c9764`](https://github.com/F404X/cartigma/commit/1c9c9764ecb6f7be1e4ac5671204bbd58f775bcb)

### v1.113.52b — 2026-11-17 — Registro técnico — sem incremento

docs: explain Rush start screen, map territory selection and responsive timer

Commits: [`5174102a`](https://github.com/F404X/cartigma/commit/5174102a0717b1ae2cef30667325f083dbda83d6)

### v1.113.52b — 2026-11-17 — Registro técnico — sem incremento

test: verify Rush start gate, persistent unstarted daily and accurate map country clicks

Commits: [`4cc2cc9e`](https://github.com/F404X/cartigma/commit/4cc2cc9e1144d4de27d51aa6ee0b1e5f30fa3f93)

### v1.113.52b — 2026-11-17 — Registro técnico — sem incremento

test: adapt Rush regression tests to explicit Start and mocked country polygons

Commits: [`e55127f8`](https://github.com/F404X/cartigma/commit/e55127f8b6613351ea51a632cd15928488bed3ef)

### v1.113.52b — 2026-11-17 — Atualização geral

i18n: localize Rush start gate and territory-map feedback in 19 languages

Commits: [`e37d2534`](https://github.com/F404X/cartigma/commit/e37d253410b75078d607baf12b9d6d08e53a5b55)

### v1.112.52b — 2026-11-17 — Correção de bug

fix: identify country polygons on Rush map click, with safe async fallback

Commits: [`89bb2951`](https://github.com/F404X/cartigma/commit/89bb295198911683b8984a95c201d81779bd7e08)

### v1.112.51b — 2026-11-17 — Correção de bug

fix: gate Rush countdown, evidence and input behind explicit Start button

Commits: [`e8c46a01`](https://github.com/F404X/cartigma/commit/e8c46a01463130efd29d2ef0cddc8ad184554b05)

### v1.112.50b — 2026-11-17 — Correção de bug

fix: create dedicated responsive clock bar and centered Rush start card

Commits: [`1fd9ad59`](https://github.com/F404X/cartigma/commit/1fd9ad590f28e59a2b46078b1f75ae00cfed93e5)

### v1.112.49b — 2026-11-17 — Correção de bug

fix: separate timer from header and add Rush start overlay

Commits: [`b69c7657`](https://github.com/F404X/cartigma/commit/b69c7657ffc45a2098c2710f3014789b32af6e29)

### v1.112.48b — 2026-11-17 — Registro técnico — sem incremento

Merge pull request #12 from F404X/feat/rush-clock-comparison-v2

Commits: [`9ca07cf4`](https://github.com/F404X/cartigma/commit/9ca07cf48141cf07c4d273ddb933ed7de01e00a5)

### v1.112.48b — 2026-11-17 — Registro técnico — sem incremento

test: match localized inequality clues with correctly escaped numeric regex

Commits: [`84818333`](https://github.com/F404X/cartigma/commit/848183331a0d862b9c9da4ef325f051ee1384b8c)

### v1.112.48b — 2026-11-17 — Registro técnico — sem incremento

test: accept versioned stylesheet assets and bounded statistics

Commits: [`3d69c134`](https://github.com/F404X/cartigma/commit/3d69c134e2aca369689bcc60a91db0e392a286f8), [`17030ecb`](https://github.com/F404X/cartigma/commit/17030ecb5ad2b312b51d463d3da1a8bd31e1b506), [`352b7297`](https://github.com/F404X/cartigma/commit/352b72974a6bdb6483cc4105623583b4c5b725f6)

### v1.112.48b — 2026-11-17 — Registro técnico — sem incremento

test: track the refreshed application bootstrap fingerprint

Commits: [`dfcaf648`](https://github.com/F404X/cartigma/commit/dfcaf6484cf70660ed6d50b5c4abc5eb0b4905e8)

### v1.112.48b — 2026-11-17 — Registro técnico — sem incremento

docs: explain Rush, clocks, numeric inequalities and preserved exact sources

Commits: [`a58f3315`](https://github.com/F404X/cartigma/commit/a58f331595c98846773c9c10d5192f88e322299e)

### v1.112.48b — 2026-11-17 — Registro técnico — sem incremento

test: cover valid numerical inequalities, Rush countdown, scoring and daily persistence

Commits: [`7220afcc`](https://github.com/F404X/cartigma/commit/7220afcce54455af98adc3bcb86fe82eeb241458)

### v1.112.48b — 2026-11-17 — Registro técnico — sem incremento

test: adapt historical statistics assertions and mock the game timer

Commits: [`eb6d9b43`](https://github.com/F404X/cartigma/commit/eb6d9b43d5220e5b193b04c39b9ed04ad37bb454)

### v1.112.48b — 2026-11-17 — Correção de bug

fix(i18n): preserve local-script labels while removing approximation qualifiers

Commits: [`ae592df6`](https://github.com/F404X/cartigma/commit/ae592df652486a780cff69545fa9d766ded5d987)

### v1.112.47b — 2026-11-17 — Correção de bug

fix: keep exact archive facts and show live Rush score countdown

Commits: [`72fff4d4`](https://github.com/F404X/cartigma/commit/72fff4d49534fbb6102f78e8318e6db8befd502c), [`cb185552`](https://github.com/F404X/cartigma/commit/cb1855524369ed965e803f292c0d4e9852842bf5), [`e865aea7`](https://github.com/F404X/cartigma/commit/e865aea73490d566d76ec83d58ddda7c0d2b638e)

### v1.112.46b — 2026-11-17 — Atualização geral

i18n: translate Rush rules, timer, country search and outcomes into 19 languages

Commits: [`85e0a1c3`](https://github.com/F404X/cartigma/commit/85e0a1c37b2ec00c3ed94fab11b0fbdd5024d3ea)

### v1.111.46b — 2026-11-17 — Atualização geral

feat: style pink Rush header, countdown and timestamped guesses

Commits: [`9a35fdbc`](https://github.com/F404X/cartigma/commit/9a35fdbc51185d61925b1553addc9d7d0ef06801), [`84c0249a`](https://github.com/F404X/cartigma/commit/84c0249ade889a37ebfaf941ff76ceb1d4d630cb), [`dd851e91`](https://github.com/F404X/cartigma/commit/dd851e910cec6bb8a63d2c90cd08af275bfd120e), [`5dc5c6c6`](https://github.com/F404X/cartigma/commit/5dc5c6c6a6ba7b216b2a5f939e2f8b27b29c01f6)

### v1.110.46b — 2026-11-17 — Atualização geral

feat: make Rush guesses target countries and penalize elapsed time

Commits: [`55b360dd`](https://github.com/F404X/cartigma/commit/55b360dd3803da275c6bcf4faf812567e529166f)

### v1.109.46b — 2026-11-17 — Atualização geral

feat: show Rush UI, auto-hints and per-guess timestamps in history and dossier

Commits: [`049929a0`](https://github.com/F404X/cartigma/commit/049929a072b612528b5938858a77685b5ab24ea1)

### v1.108.46b — 2026-11-17 — Atualização geral

feat: persist case clocks and add one-minute Rush countdown engine

Commits: [`23d77be6`](https://github.com/F404X/cartigma/commit/23d77be62ed6d3c7d81e855a9dbc209b73f698d5)

### v1.107.46b — 2026-11-17 — Atualização geral

feat: derive truthful rounded upper/lower numerical clue bounds

Commits: [`020a55fe`](https://github.com/F404X/cartigma/commit/020a55fe934f72d97b7f0a3799c0472023b961d1)

### v1.106.46b — 2026-11-17 — Atualização geral

feat: show verifiable greater-than/less-than bounds in statistical clues

Commits: [`e2b40559`](https://github.com/F404X/cartigma/commit/e2b405595f7a94687d5f048ef45fccfbe9e4acaf), [`37c55319`](https://github.com/F404X/cartigma/commit/37c55319e64efde416dcc70cde14b88216102faa)

### v1.105.46b — 2026-11-17 — Correção de bug

fix: remove distracting internal seams from map overlays

Commits: [`11e96b2d`](https://github.com/F404X/cartigma/commit/11e96b2d77eac7c90c3b78951c91832d25c3472a)

### v1.105.45b — 2026-11-17 — Registro técnico — sem incremento

test: verify archive reference fields using their actual labels

Commits: [`2c677f88`](https://github.com/F404X/cartigma/commit/2c677f88a5ee7501e7ee2d01d7a41344bd2fd34e)

### v1.105.45b — 2026-11-17 — Atualização geral

feat: retire landmark and administrative-region hints from new cases

Commits: [`4b164aa3`](https://github.com/F404X/cartigma/commit/4b164aa329e302d0a9346b45861a1ec1651a7c96)

### v1.104.45b — 2026-11-17 — Atualização geral

feat: shorten currency evidence to generic denomination names

Commits: [`da442ddb`](https://github.com/F404X/cartigma/commit/da442ddb9d74cc09c36c7529d5771f8d400ea6ea)

### v1.103.45b — 2026-11-17 — Registro técnico — sem incremento

Merge dev into main (#11)

Commits: [`39f3fe68`](https://github.com/F404X/cartigma/commit/39f3fe68fe438a06cf91e01a6876fb5b9d245531)

### v1.103.45b — 2026-11-17 — Registro técnico — sem incremento

Merge pull request #10 from F404X/fix/help-rules-de

Commits: [`cfe037e7`](https://github.com/F404X/cartigma/commit/cfe037e76a4a3f5dbee53ff0dcb8a64aa1083e90)

### v1.103.45b — 2026-11-17 — Registro técnico — sem incremento

Merge pull request #7 from F404X/fix/help-rules-zh

Commits: [`28fd8a2a`](https://github.com/F404X/cartigma/commit/28fd8a2a02d65cb02548ae3e66656f97c1504b0c)

### v1.103.45b — 2026-11-17 — Registro técnico — sem incremento

Merge pull request #5 from F404X/fix/help-rules-pt

Commits: [`1d2ef287`](https://github.com/F404X/cartigma/commit/1d2ef287093f09c749e4119bb8b37af6ee9f5c36)

### v1.103.45b — 2026-11-17 — Correção de bug

fix(i18n): correct German difficulty help

Commits: [`d76d8b69`](https://github.com/F404X/cartigma/commit/d76d8b69b848e29bd78fe3273277a208c376eb5d)

### v1.103.44b — 2026-11-17 — Correção de bug

fix(i18n): correct Simplified Chinese difficulty help

Commits: [`f29e0dc3`](https://github.com/F404X/cartigma/commit/f29e0dc3f7810a93ffa292ea2156cc6b7281cc55)

### v1.103.43b — 2026-11-17 — Correção de bug

fix(i18n): correct Portuguese difficulty help

Commits: [`b6884226`](https://github.com/F404X/cartigma/commit/b6884226e2be64ec9929f1a494ed954d3cf4f131)

### v1.103.42b — 2026-11-17 — Registro técnico — sem incremento

Merge pull request #9 from F404X/fix/help-rules-fr

Commits: [`8644bb07`](https://github.com/F404X/cartigma/commit/8644bb07b5f2b608eb7814056465a3d9bd644d1b)

### v1.103.42b — 2026-11-17 — Registro técnico — sem incremento

Merge pull request #8 from F404X/fix/help-rules-ja

Commits: [`199f4767`](https://github.com/F404X/cartigma/commit/199f4767fae1aef9b33ed0328d2a746c65f218ea)

### v1.103.42b — 2026-11-17 — Registro técnico — sem incremento

Merge pull request #6 from F404X/fix/help-rules-es

Commits: [`925fe38b`](https://github.com/F404X/cartigma/commit/925fe38b2fd9cf136b2d0faf46964a78fb8876cf)

### v1.103.42b — 2026-11-17 — Registro técnico — sem incremento

Merge pull request #4 from F404X/fix/help-rules-en

Commits: [`2173c252`](https://github.com/F404X/cartigma/commit/2173c2527a89a689f19c82784913ed9cee1f277e)

### v1.103.42b — 2026-11-17 — Registro técnico — sem incremento

Merge pull request #2 from F404X/fix/leaflet-cdn-error-cleanup

Commits: [`018feb3d`](https://github.com/F404X/cartigma/commit/018feb3d06844f1432f7f7a9d83611caba5fe458)

### v1.103.42b — 2026-11-17 — Registro técnico — sem incremento

Merge pull request #3 from F404X/fix/language-picker-init-guard

Commits: [`e269702d`](https://github.com/F404X/cartigma/commit/e269702db4a52b947ab79ee2dd2baba16fc77584)

### v1.103.42b — 2026-11-17 — Correção de bug

fix(i18n): correct French difficulty help

Commits: [`5e64e6a6`](https://github.com/F404X/cartigma/commit/5e64e6a698587d812a039430a6237e01437d33fc)

### v1.103.41b — 2026-11-17 — Correção de bug

fix(i18n): correct Japanese difficulty help

Commits: [`258ebf83`](https://github.com/F404X/cartigma/commit/258ebf83f529ababe38c9d8344582ad00b432779)

### v1.103.40b — 2026-11-17 — Registro técnico — sem incremento

Merge pull request #1 from F404X/fix/leaflet-zero-zoom

Commits: [`ad24dd7f`](https://github.com/F404X/cartigma/commit/ad24dd7fdfd65eec65dacde73b2e81338120842e)

### v1.103.40b — 2026-11-17 — Correção de bug

fix(i18n): correct Spanish difficulty help

Commits: [`dfabd6d1`](https://github.com/F404X/cartigma/commit/dfabd6d1ad9e2508d47790bdfb0b4b9e95e20141)

### v1.103.39b — 2026-11-17 — Correção de bug

fix(i18n): correct English difficulty help

Commits: [`6e0f11a7`](https://github.com/F404X/cartigma/commit/6e0f11a70167e3c84935481bab8d30896e16e19c)

### v1.103.38b — 2026-11-17 — Correção de bug

fix(i18n): defer picker ready flag until DOM elements exist

Commits: [`be88b033`](https://github.com/F404X/cartigma/commit/be88b0334afcfb94dfd5454ce742a76413e1517d)

### v1.103.37b — 2026-11-17 — Correção de bug

fix(map): clean up failed Leaflet script loads

Commits: [`331b9814`](https://github.com/F404X/cartigma/commit/331b9814de9fb026d2270c7ac7485bf5dc1deb4d)

### v1.103.36b — 2026-11-17 — Correção de bug

fix(map): honor zoom level zero in Leaflet fallback

Commits: [`3ac8f14a`](https://github.com/F404X/cartigma/commit/3ac8f14ad609bd9ba80bf5ead8511d28912b2c68)

### v1.103.35b — 2026-11-17 — Registro técnico — sem incremento

test: compare latitude overlay camera coordinates across VM contexts

Commits: [`73a579a5`](https://github.com/F404X/cartigma/commit/73a579a584eed341fe0c75f23dec3f66c1d0921e)

### v1.103.35b — 2026-11-17 — Atualização geral

feat: paid map overlays for latitude climate belts

Commits: [`6cd31ae6`](https://github.com/F404X/cartigma/commit/6cd31ae67fd887479071001acce2b8240eb216bf)

### v1.102.35b — 2026-11-16 — Correção de bug

fix: rank exact atlas city matches before regional matches

Commits: [`4eb11894`](https://github.com/F404X/cartigma/commit/4eb11894d592c0e72cbe2f83108038ee1b6cdcab)

### v1.102.34b — 2026-11-16 — Atualização geral

feat: add searchable 500-city encyclopedia beside help

Commits: [`0a979ddc`](https://github.com/F404X/cartigma/commit/0a979ddcab6f832bd2f64ee03fd0a7e1c7113926)

### v1.101.34b — 2026-11-16 — Correção de bug

fix: simplify capital and coast distance clues in all languages

Commits: [`26cee73e`](https://github.com/F404X/cartigma/commit/26cee73ef50325307e07549b53d7901a49257a06)

### v1.101.33b — 2026-11-16 — Registro técnico — sem incremento

test: preserve the initial country facts while allowing city clues

Commits: [`8a933e53`](https://github.com/F404X/cartigma/commit/8a933e53996757a223db9e5b8b5b31e003062b6e)

### v1.101.33b — 2026-11-16 — Atualização geral

feat: sourced city-level geography clues and closest-guess underline

Commits: [`dc3a3a13`](https://github.com/F404X/cartigma/commit/dc3a3a1327d2338cd34ca63ffe668598738b9325)

### v1.100.33b — 2026-11-16 — Registro técnico — sem incremento

test: account for Hard prices and VM-isolated Leaflet callbacks

Commits: [`5278f854`](https://github.com/F404X/cartigma/commit/5278f8543a00845637ed7815706cbd9e24cee891)

### v1.100.33b — 2026-11-16 — Atualização geral

feat: paid UTM ruler overlays and harder hint pricing

Commits: [`806c0f0b`](https://github.com/F404X/cartigma/commit/806c0f0b1f42272c36b0ded78da70e49e6f68b53)

### v1.99.33b — 2026-11-16 — Registro técnico — sem incremento

test: refresh remaining seven-clue and asset version expectations

Commits: [`373648ad`](https://github.com/F404X/cartigma/commit/373648ad52011fc0d3352c4f700a50cd60f763a5)

### v1.99.33b — 2026-11-16 — Atualização geral

feat: enable ten independent clues without changing guess limits

Commits: [`d90733e1`](https://github.com/F404X/cartigma/commit/d90733e1290688254210104be20bba8f8b7e401d)

### v1.98.33b — 2026-11-16 — Atualização geral

feat: display localized currency names instead of ISO codes

Commits: [`561a3885`](https://github.com/F404X/cartigma/commit/561a3885b9ba600bd76ad01368bb9ffb5f6f6b9d)

### v1.97.33b — 2026-11-16 — Correção de bug

fix: display sea-access evidence as explicit localized geographic fact

Commits: [`51a0194c`](https://github.com/F404X/cartigma/commit/51a0194cd33757bc9e2df142f73a49c7cc930dce)

### v1.97.32b — 2026-11-16 — Correção de bug

fix: migrate removed hemisphere purchases and refresh regression tests

Commits: [`9e555417`](https://github.com/F404X/cartigma/commit/9e5554178032cf789b49ed3fc60ba3b4f6b1e40b)

### v1.97.31b — 2026-11-16 — Atualização geral

feat: natural sea-access facts and rebalance geography hints

Commits: [`ef7258b8`](https://github.com/F404X/cartigma/commit/ef7258b8f5a30eb70758e91f530f35f496e710bd)

### v1.96.31b — 2026-11-16 — Correção de bug

fix: align case report footer actions into a balanced two-column grid

Commits: [`cd06e27b`](https://github.com/F404X/cartigma/commit/cd06e27b6c1a7e98b70e3af6530c7487c856a4f3)

### v1.96.30b — 2026-11-16 — Registro técnico — sem incremento

test: avoid regex escaping in country area label checks

Commits: [`cc4319dd`](https://github.com/F404X/cartigma/commit/cc4319dd46a6cf760df35aa3f7ba46bd1b96d845)

### v1.96.30b — 2026-11-16 — Registro técnico — sem incremento

test: update scoped area-label assertions in every locale

Commits: [`041ded9e`](https://github.com/F404X/cartigma/commit/041ded9e27fd27f4c99ddca3d55f236f01877f4a)

### v1.96.30b — 2026-11-16 — Atualização geral

feat: clarify country area and add contextual daily case actions

Commits: [`63e25232`](https://github.com/F404X/cartigma/commit/63e25232a85cb4d221ed7e0eed35f2495049b567)

### v1.95.30b — 2026-11-16 — Registro técnico — sem incremento

test: align cache and rotation assertions with new clue engine

Commits: [`fe409a3c`](https://github.com/F404X/cartigma/commit/fe409a3cc29846530b0fc7cd4c1ffb99d6855747)

### v1.95.30b — 2026-11-16 — Atualização geral

feat: diversify country clues and expand case dossier

Commits: [`0941c47f`](https://github.com/F404X/cartigma/commit/0941c47f19146cb71508631eb4e0343a1a5baa75)

### v1.94.30b — 2026-11-16 — Correção de bug

fix: keep GDP and area clues realistic for small economies

Commits: [`8cb17d2f`](https://github.com/F404X/cartigma/commit/8cb17d2f29b51cd666f766e9b8e105371e97fa31)

### v1.94.29b — 2026-11-16 — Registro técnico — sem incremento

test: update remaining six-clue assertions for seven evidence slots

Commits: [`d415382f`](https://github.com/F404X/cartigma/commit/d415382f8bea38e22dbcd2342fdb541007348fef)

### v1.94.29b — 2026-11-16 — Atualização geral

feat: add seventh varied country evidence and historical dossier for all countries

Commits: [`7cc1cf82`](https://github.com/F404X/cartigma/commit/7cc1cf82e9279f54a40f6a5b21a563875a4d1bd1)

### v1.93.29b — 2026-11-16 — Registro técnico — sem incremento

Atualizar o README.md

Commits: [`0d689370`](https://github.com/F404X/cartigma/commit/0d689370eafb1e3b8dab028514af308a4c5adb7f)

### v1.93.29b — 2026-11-16 — Registro técnico — sem incremento

test: align remaining cache fingerprints with 500-city release

Commits: [`b62f6814`](https://github.com/F404X/cartigma/commit/b62f6814817a615a2497f59c0bd69cd4562d885d)

### v1.93.29b — 2026-11-16 — Correção de bug

fix: close continent geometry script and refresh raster cache test

Commits: [`3220f721`](https://github.com/F404X/cartigma/commit/3220f7211a5464dac0f8fdb0244e26e40f0f26ce)

### v1.93.28b — 2026-11-16 — Atualização geral

feat: expand Cartigma to 500 cities and fix transcontinental Türkiye

Commits: [`e38c8006`](https://github.com/F404X/cartigma/commit/e38c80062126f27b682760c4191b09543083f613)

### v1.92.28b — 2026-11-16 — Registro técnico — sem incremento

test: update legacy basemap assertions for new map filters

Commits: [`b2732f68`](https://github.com/F404X/cartigma/commit/b2732f68f09ce560fa95474f714ffd2b115f87a9)

### v1.92.28b — 2026-11-16 — Atualização geral

feat: add configurable vector map layer filters panel

Commits: [`92711849`](https://github.com/F404X/cartigma/commit/927118499c436823514ed10910b22f572d23808f)

### v1.91.28b — 2026-11-16 — Atualização geral

feat: purchasable continent outlines and instant hemisphere arrows

Commits: [`2bfecd53`](https://github.com/F404X/cartigma/commit/2bfecd5392297ab9cf363616b7f6797753a364be)

### v1.90.28b — 2026-11-16 — Registro técnico — sem incremento

ci: include sitemap and robots.txt in Pages deployment

Commits: [`210337cf`](https://github.com/F404X/cartigma/commit/210337cfe1b92245efd76289fa0f704f7dabf82e)

### v1.90.28b — 2026-11-16 — Atualização geral

seo: advertise XML sitemap to crawlers

Commits: [`816c6401`](https://github.com/F404X/cartigma/commit/816c64015cbf4e8cc172436f1faf4eb346d2d4cc)

### v1.89.28b — 2026-11-16 — Atualização geral

seo: add XML sitemap for public homepage

Commits: [`c35bc303`](https://github.com/F404X/cartigma/commit/c35bc303fdd112ac4c541494029561877a3fccd9)

### v1.88.28b — 2026-11-16 — Correção de bug

fix: anchor hemisphere arrows to the equator at every zoom

Commits: [`5312e90f`](https://github.com/F404X/cartigma/commit/5312e90f5b0e3ef1676a74320ce447546e7f4636)

### v1.88.27b — 2026-11-16 — Atualização geral

feat: offer 600-point dashed hemisphere guide with directional arrows

Commits: [`48fdfc68`](https://github.com/F404X/cartigma/commit/48fdfc688c72ed2e2751c1b08c5048a4369494e7)

### v1.87.27b — 2026-11-16 — Correção de bug

fix: enable sector map actions after vector style loads

Commits: [`894e6373`](https://github.com/F404X/cartigma/commit/894e6373fe785c52ce956e2b4e825b5dac48fa0c)

### v1.87.26b — 2026-11-16 — Atualização geral

feat: paid geographic-sector overlays on map

Commits: [`cc24b86c`](https://github.com/F404X/cartigma/commit/cc24b86cfb440eddc673ee47843588809af4e52e)

### v1.86.26b — 2026-11-16 — Registro técnico — sem incremento

test: correct asset fingerprint assertions to unblock deployment

Commits: [`d95848b4`](https://github.com/F404X/cartigma/commit/d95848b4e14b587308d2f367e83d6c54856128ca)

### v1.86.26b — 2026-11-16 — Correção de bug

fix: keep exact-guess metrics hidden after deploy

Commits: [`89b728d3`](https://github.com/F404X/cartigma/commit/89b728d35d560020f44b106d4369080baab50f0a)

### v1.86.25b — 2026-11-16 — Registro técnico — sem incremento

test: fix geographic evidence regression assertions

Commits: [`aad67c31`](https://github.com/F404X/cartigma/commit/aad67c31af9dad40da9acf71a503ff8a1cf160fa)

### v1.86.25b — 2026-11-16 — Atualização geral

feat: make geographic evidence less revealing and clarify exact guesses

Commits: [`106da01f`](https://github.com/F404X/cartigma/commit/106da01f3fe8a5846e9542fa050f52cf620dee67)

### v1.85.25b — 2026-11-16 — Registro técnico — sem incremento

test: correct national-capital regression metadata assertion

Commits: [`8dfddf7c`](https://github.com/F404X/cartigma/commit/8dfddf7c2e6fd49570cc7d6ec9fdc60087a3920a)

### v1.85.25b — 2026-11-16 — Correção de bug

fix: recognize Taipei and Cape Town as national capitals

Commits: [`5606d759`](https://github.com/F404X/cartigma/commit/5606d759b2a4cefbce2f17e7e91aa5b694564b12)

### v1.85.24b — 2026-11-15 — Registro técnico — sem incremento

ci: cancel superseded tests on rapid pushes

Commits: [`b4ed40ae`](https://github.com/F404X/cartigma/commit/b4ed40ae06ad61d98f225cebc6b8f4dea9679646)

### v1.85.24b — 2026-11-15 — Atualização geral

style(mobile): respect bottom safe area in guess panel

Commits: [`eb05896f`](https://github.com/F404X/cartigma/commit/eb05896f822827cc33bc70218a220cc1c4401c44)

### v1.84.24b — 2026-11-15 — Atualização geral

ux(mobile): display search action on city keyboard

Commits: [`b140626d`](https://github.com/F404X/cartigma/commit/b140626d46532108a6d96d446837be60307d7a94)

### v1.83.24b — 2026-11-15 — Atualização geral

ux(mobile): disable autocapitalization in city search

Commits: [`483a5a87`](https://github.com/F404X/cartigma/commit/483a5a875de87e5235163cdd9cf413b9448cb41c)

### v1.82.24b — 2026-11-15 — Atualização geral

ux(mobile): show search key on language input keyboard

Commits: [`54dae0d7`](https://github.com/F404X/cartigma/commit/54dae0d79be75513c2a43f8291942e7d4e302e7b)

### v1.81.24b — 2026-11-15 — Atualização geral

ux(mobile): disable autocapitalization in language search

Commits: [`2e78e9d9`](https://github.com/F404X/cartigma/commit/2e78e9d9751eb206e3021f80a45d4e3c9acf2981)

### v1.80.24b — 2026-11-15 — Atualização geral

perf: preconnect to flag image provider

Commits: [`dc9a02c0`](https://github.com/F404X/cartigma/commit/dc9a02c0f93f668c707cde7f22538514863b9c13)

### v1.79.24b — 2026-11-15 — Atualização geral

seo: publish canonical Cartigma domain

Commits: [`30b6ddc0`](https://github.com/F404X/cartigma/commit/30b6ddc02acaecbfc720276bc33c490179c7b5b1)

### v1.78.24b — 2026-11-15 — Atualização geral

perf: navigate language options without copying NodeList

Commits: [`5e511b41`](https://github.com/F404X/cartigma/commit/5e511b41694fde69cc5026522d4098c8da578f61)

### v1.77.24b — 2026-11-15 — Atualização geral

perf: decode language flag images asynchronously

Commits: [`b2f9fb5e`](https://github.com/F404X/cartigma/commit/b2f9fb5e3f8f3ea72127d6542b2fd78448576f82)

### v1.76.24b — 2026-11-15 — Correção de bug

fix: keep flag fallback and avoid reloading unchanged flags

Commits: [`78b80e6f`](https://github.com/F404X/cartigma/commit/78b80e6f9526c8b46149dc87d1625001b8b8b670)

### v1.76.23b — 2026-11-15 — Atualização geral

perf: filter language options in one pass

Commits: [`a7e8b65d`](https://github.com/F404X/cartigma/commit/a7e8b65d85e1ae0c751cf8daeb4ce76a3d5dadf1)

### v1.75.23b — 2026-11-15 — Atualização geral

perf: find nearest guess without reduce callback

Commits: [`4a066167`](https://github.com/F404X/cartigma/commit/4a06616769d6d5dc58887b748c552d71282995b2)

### v1.74.23b — 2026-11-15 — Atualização geral

perf: render suggestion limit without slicing results

Commits: [`138e3971`](https://github.com/F404X/cartigma/commit/138e3971f8017f52f19ae281307908a760a4756d)

### v1.73.23b — 2026-11-15 — Atualização geral

refactor: reuse revealed clue count within evidence panel

Commits: [`1b35f4ca`](https://github.com/F404X/cartigma/commit/1b35f4caa41877b9b9da4be39c1e264e9463ccaf)

### v1.72.23b — 2026-11-15 — Atualização geral

refactor: reuse guess count when rendering history

Commits: [`8996c1b7`](https://github.com/F404X/cartigma/commit/8996c1b72c3e1832c168b4125be337cb86803bc1)

### v1.71.23b — 2026-11-15 — Atualização geral

perf: reuse locale flag lookup on language changes

Commits: [`07fecee6`](https://github.com/F404X/cartigma/commit/07fecee62c141483c2cf568e59045e6bf4d03856)

### v1.70.23b — 2026-11-15 — Atualização geral

perf: reuse regional radius defaults across clue calculations

Commits: [`cce5ca10`](https://github.com/F404X/cartigma/commit/cce5ca1017b8648d3e39399ff40ada74d388e323)

### v1.69.23b — 2026-11-15 — Atualização geral

perf: keep river reference names in a single lookup

Commits: [`cc906def`](https://github.com/F404X/cartigma/commit/cc906defa67bcfd3420e2369fd36a770f01a4ad1)

### v1.68.23b — 2026-11-15 — Atualização geral

perf: reuse compass direction arrows

Commits: [`a9e7e8d8`](https://github.com/F404X/cartigma/commit/a9e7e8d820a4c1e95cf902e57e78853e1346d2a5)

### v1.67.23b — 2026-11-15 — Registro técnico — sem incremento

ci: cap Pages deployment job runtime at fifteen minutes

Commits: [`e2de74b9`](https://github.com/F404X/cartigma/commit/e2de74b9e60fdec96d929f5ab66972e3b3857626)

### v1.67.23b — 2026-11-15 — Registro técnico — sem incremento

ci: cap automated test job runtime at ten minutes

Commits: [`b12db3ae`](https://github.com/F404X/cartigma/commit/b12db3ae355fd54313eda9381c1b30650a641a59)

### v1.67.23b — 2026-11-15 — Atualização geral

style(mobile): keep scrolled case details clear of sticky header

Commits: [`71116907`](https://github.com/F404X/cartigma/commit/71116907e4d309bfeb1947fbbff09369309ebefa)

### v1.66.23b — 2026-11-15 — Atualização geral

seo: add canonical social sharing metadata

Commits: [`8e4a501f`](https://github.com/F404X/cartigma/commit/8e4a501f7ca399619645fd1b2deb90fadd6f7888)

### v1.65.23b — 2026-11-15 — Atualização geral

perf: reuse Leaflet adapter between map engine switches

Commits: [`c663aaf0`](https://github.com/F404X/cartigma/commit/c663aaf0c77c7fa3b3794635d82b0e98cb1d972f)

### v1.64.23b — 2026-11-15 — Atualização geral

perf: use keyed language lookup for sync and selection

Commits: [`4e7c4109`](https://github.com/F404X/cartigma/commit/4e7c41097734320abc1c1d985d3a481c84cb4eb8)

### v1.63.23b — 2026-11-15 — Atualização geral

perf: precompute language search terms once

Commits: [`d121b5b5`](https://github.com/F404X/cartigma/commit/d121b5b52fc2f2688ba151c398f47519725923cd)

### v1.62.23b — 2026-11-15 — Atualização geral

perf: reuse supported geocoder languages instead of allocating on each search

Commits: [`5a623c40`](https://github.com/F404X/cartigma/commit/5a623c400552d476f76a5253b16ae00e0c248d9e)

### v1.61.23b — 2026-11-15 — Atualização geral

perf: translate locked clue placeholder once per render

Commits: [`5bee2d4d`](https://github.com/F404X/cartigma/commit/5bee2d4d0fbfc810e76396f1bb0b43b1fe696421)

### v1.60.23b — 2026-11-15 — Atualização geral

perf: avoid rerendering city suggestions before remote search

Commits: [`9251f405`](https://github.com/F404X/cartigma/commit/9251f4050c4c7a73f7de43fe76997aa546913893)

### v1.59.23b — 2026-11-15 — Atualização geral

perf: render guess history in reverse order without array copy

Commits: [`df228d45`](https://github.com/F404X/cartigma/commit/df228d45594499f0707c3354ccd9d2d19de5707d)

### v1.58.23b — 2026-11-15 — Atualização geral

perf: reuse clue category labels lookup during evidence rendering

Commits: [`fefed78b`](https://github.com/F404X/cartigma/commit/fefed78bb173d80c09a3687346a317cbc575139d)

### v1.57.23b — 2026-11-15 — Registro técnico — sem incremento

test(search): assert existing hidden-suggestions behavior for short queries

Commits: [`2632c14c`](https://github.com/F404X/cartigma/commit/2632c14c5b89996bf2955af3c23f139e56cc860d)

### v1.57.23b — 2026-11-15 — Registro técnico — sem incremento

test(perf): ensure clue memoization and indexed city search preserve gameplay

Commits: [`402014af`](https://github.com/F404X/cartigma/commit/402014af2e6fa3e87438b9c124dfe97eb46bb4ac)

### v1.57.23b — 2026-11-15 — Atualização geral

perf: index city search and memoize regional clues and locale formatters

Commits: [`83e59d30`](https://github.com/F404X/cartigma/commit/83e59d3056126b9393565982fdd0326074dd3a87)

### v1.56.23b — 2026-11-15 — Registro técnico — sem incremento

docs(mobile): describe centered searchable language dialog and dismissal controls

Commits: [`1529f042`](https://github.com/F404X/cartigma/commit/1529f042a0046f24f4d18be0842b301c1712b026)

### v1.56.23b — 2026-11-15 — Registro técnico — sem incremento

test(mobile): verify centered language dialog, overlay, accessible close, search and scrollable flags

Commits: [`560463f6`](https://github.com/F404X/cartigma/commit/560463f604fb11084c7e56c14adef2b55e70c2a0)

### v1.56.23b — 2026-11-15 — Atualização geral

style(mobile): centered 78dvh language chooser with dimmed backdrop, spacious flags and scrolling options

Commits: [`d9c358e1`](https://github.com/F404X/cartigma/commit/d9c358e180f0e1b55689b0b8b9a73a2dd1a4d65f)

### v1.55.23b — 2026-11-15 — Atualização geral

feat(mobile): center language modal with backdrop, accessible close, keyboard focus and no automatic phone keyboard

Commits: [`df90c38e`](https://github.com/F404X/cartigma/commit/df90c38e401ff0bdb62fea4e6a14d3cf6dbe0166)

### v1.54.23b — 2026-11-15 — Atualização geral

feat(mobile): add centered language dialog backdrop and explicit close control

Commits: [`bbf47944`](https://github.com/F404X/cartigma/commit/bbf47944ae666ca45a1d350ddb3571b60765da3e)

### v1.53.23b — 2026-11-15 — Registro técnico — sem incremento

test(mobile): cover touch-landscape fallback layout

Commits: [`b02acee1`](https://github.com/F404X/cartigma/commit/b02acee14d4d52b0c11d514792d81724cb1db085)

### v1.53.23b — 2026-11-15 — Registro técnico — sem incremento

test(mobile): verify case dossier actually moves inside scrollable lower panel on phones

Commits: [`293ad47f`](https://github.com/F404X/cartigma/commit/293ad47f6b467034295cefa0fbaa23bf99eaa549)

### v1.53.23b — 2026-11-15 — Atualização geral

style(mobile): include landscape phones with a centered square map and safe page scrolling

Commits: [`18bdb8d6`](https://github.com/F404X/cartigma/commit/18bdb8d6beedb9e61dd0c49d15d371a5bf820d0d)

### v1.52.23b — 2026-11-15 — Registro técnico — sem incremento

test(theme): accept dedicated mobile stylesheet in deployment artifact ordering

Commits: [`6839d960`](https://github.com/F404X/cartigma/commit/6839d960af9bf74906ae1bcd424a127c00f01522)

### v1.52.23b — 2026-11-15 — Registro técnico — sem incremento

docs(mobile): describe 1:1 map, lower scroller and accessible small-screen game layout

Commits: [`2fdf41a0`](https://github.com/F404X/cartigma/commit/2fdf41a0e208a3187caddda78087f39de31ec091)

### v1.52.23b — 2026-11-15 — Registro técnico — sem incremento

test(mobile): cover square map, lower scroll, touch sizing, short screens and inline case report

Commits: [`c271b37d`](https://github.com/F404X/cartigma/commit/c271b37d0b63492bdc1efabe3f76c2b066353961)

### v1.52.23b — 2026-11-15 — Atualização geral

style(mobile): allow full-page scrolling on wider or short viewports where a square map would crowd the case panel

Commits: [`2d6b496d`](https://github.com/F404X/cartigma/commit/2d6b496d564eae5730c16fbf8f40555a18f4ce2e)

### v1.51.23b — 2026-11-15 — Registro técnico — sem incremento

deploy(mobile): include mobile.css in GitHub Pages artifact

Commits: [`d8a0853f`](https://github.com/F404X/cartigma/commit/d8a0853f50b69aea945a3c6975173fc8b46b091b)

### v1.51.23b — 2026-11-15 — Correção de bug

fix(mobile): keep Leaflet tile positions correct when the square map changes size

Commits: [`3ef24964`](https://github.com/F404X/cartigma/commit/3ef2496417cea6d067586d5e102549b7bc4c6d46)

### v1.51.22b — 2026-11-15 — Atualização geral

feat(mobile): attach result dossier to lower scroller and resize map canvas on layout changes

Commits: [`4771dbbc`](https://github.com/F404X/cartigma/commit/4771dbbcc63d35e700779837b6a1ab2b9375cb36)

### v1.50.22b — 2026-11-15 — Atualização geral

style(mobile): square map, scrollable evidence and guesses, touch-sized controls and inline case report

Commits: [`f70d0ed0`](https://github.com/F404X/cartigma/commit/f70d0ed0eb40fbd8e4ae43924fca2d790e63c183)

### v1.49.22b — 2026-11-15 — Atualização geral

feat(mobile): load dedicated smartphone layout overrides after site themes

Commits: [`9f604561`](https://github.com/F404X/cartigma/commit/9f604561f476dc01fba36072fcb8cbe812753286)

### v1.48.22b — 2026-11-15 — Correção de bug

fix(brand): update fallback case report heading

Commits: [`f3e39433`](https://github.com/F404X/cartigma/commit/f3e39433f5633535d36769e4c53e3b4796d6f0ee)

### v1.48.21b — 2026-11-15 — Registro técnico — sem incremento

test(brand): verify Cartigma naming, globe and localized map difficulty

Commits: [`ca623edd`](https://github.com/F404X/cartigma/commit/ca623edde6846241c1aef5939671d83f3ee75c4f)

### v1.48.21b — 2026-11-15 — Registro técnico — sem incremento

chore(ci): rename workflows to Cartigma

Commits: [`6417dcb7`](https://github.com/F404X/cartigma/commit/6417dcb7a874c16737fd7298e7ce489309a8bec1), [`125af78f`](https://github.com/F404X/cartigma/commit/125af78fdc8f2ecb3b11bde6a329fdf909056d4e)

### v1.48.21b — 2026-11-15 — Atualização geral

style(map): align globe at left of difficulty-aware map heading on desktop and mobile

Commits: [`96d67b0e`](https://github.com/F404X/cartigma/commit/96d67b0eb175a5c506713ac236457be40968648e)

### v1.47.21b — 2026-11-15 — Atualização geral

i18n: rebrand translated case report headings as Cartigma

Commits: [`cbb2e5be`](https://github.com/F404X/cartigma/commit/cbb2e5be1cd845536de0f9eff0147b77ad66c9b3)

### v1.46.21b — 2026-11-15 — Registro técnico — sem incremento

docs: rename GeoDetective to Cartigma and update playable site URL

Commits: [`515a85d0`](https://github.com/F404X/cartigma/commit/515a85d0ffeed62c227bfdbca9dc1e62bb369e24)

### v1.46.21b — 2026-11-15 — Atualização geral

feat(brand): show localized map heading per difficulty; share Cartigma and new site URL

Commits: [`ffacbeda`](https://github.com/F404X/cartigma/commit/ffacbeda16db6ff49c85c4fc83a91a2340e4fe8d)

### v1.45.21b — 2026-11-15 — Atualização geral

feat(brand): rename public site Cartigma and add globe + localized difficulty to map heading

Commits: [`bafb4dfb`](https://github.com/F404X/cartigma/commit/bafb4dfb6926fa9f1270354a66351727a0b44bce)

### v1.44.21b — 2026-11-15 — Registro técnico — sem incremento

test(ui): ensure map title bar updates for both difficulties and GitHub mark remains available

Commits: [`33f19b1a`](https://github.com/F404X/cartigma/commit/33f19b1a3eb22b1dfe592e68463fee437ccefe1d)

### v1.44.21b — 2026-11-15 — Atualização geral

style: yellow Normal and red Hard map bar; correct responsive GitHub icon

Commits: [`8032cabd`](https://github.com/F404X/cartigma/commit/8032cabdab06df95b360b52cf3b9d9548eea191c)

### v1.43.21b — 2026-11-15 — Atualização geral

feat(map): color the world-map toolbar according to selected difficulty

Commits: [`ce3f7aed`](https://github.com/F404X/cartigma/commit/ce3f7aed129e4c0b54fec647380900b9d92abeb8)

### v1.42.21b — 2026-11-15 — Correção de bug

fix(header): use proper GitHub mark; identify map toolbar for difficulty coloring

Commits: [`b3aca849`](https://github.com/F404X/cartigma/commit/b3aca8491832df30dbda27fa4a9f682f304dc22d)

### v1.42.20b — 2026-11-15 — Registro técnico — sem incremento

test(map): verify dynamic dark/positron map styles instead of static dark-only URL

Commits: [`f09e79a2`](https://github.com/F404X/cartigma/commit/f09e79a26757cca3f646b0418a3d96dd5c868967)

### v1.42.20b — 2026-11-15 — Registro técnico — sem incremento

docs: explain desaturated navy dark mode, white mode, persistent appearance toggle and vector map themes

Commits: [`8c84a1c0`](https://github.com/F404X/cartigma/commit/8c84a1c078d371ab18509e76ed787c9ff75524b0)

### v1.42.20b — 2026-11-15 — Registro técnico — sem incremento

test(theme): cover persisted dark/white appearance, 19 locales, panel colors and map theme switching

Commits: [`70533d4d`](https://github.com/F404X/cartigma/commit/70533d4daa0b1077086ccb8ee9cf12d7f18b994b)

### v1.42.20b — 2026-11-15 — Registro técnico — sem incremento

deploy: ship theme stylesheet and theme controller in GitHub Pages artifact

Commits: [`f5223335`](https://github.com/F404X/cartigma/commit/f52233350fe8bb857fb97207d9d7fe1d12f6976a)

### v1.42.20b — 2026-11-15 — Atualização geral

feat(map): switch OpenFreeMap dark/positron styles live when appearance theme changes

Commits: [`130e1629`](https://github.com/F404X/cartigma/commit/130e16299fcf6145b5bf075c67f52a00f8b76de2)

### v1.41.20b — 2026-11-15 — Atualização geral

style(theme): neutral slate/black dark palette and complete white/light mode with yellow-only accents

Commits: [`bcefea6f`](https://github.com/F404X/cartigma/commit/bcefea6f93f31c371c626f039c030d1707edc350)

### v1.40.20b — 2026-11-15 — Atualização geral

feat(theme): persist and localize light/dark appearance toggle in 19 languages

Commits: [`8b7ed36a`](https://github.com/F404X/cartigma/commit/8b7ed36acfaf79fb041d42e09738c27f26fa3298)

### v1.39.20b — 2026-11-15 — Atualização geral

feat(theme): add light/dark mode toggle and dedicated theme stylesheet

Commits: [`baa029f4`](https://github.com/F404X/cartigma/commit/baa029f478de400fa1a1c9bbe00226123db6b942)

### v1.38.20b — 2026-11-15 — Atualização geral

style(map): make compass rose transparent and raise above attribution info control

Commits: [`0d067f06`](https://github.com/F404X/cartigma/commit/0d067f06146bcb036a0840423b63b52e3d0467fd)

### v1.37.20b — 2026-11-15 — Registro técnico — sem incremento

docs: explain compass rose, localized arrows, improved evidence order and two basemap styles

Commits: [`a444d265`](https://github.com/F404X/cartigma/commit/a444d26574d815c7de43b86521f3b853df52954c)

### v1.37.20b — 2026-11-15 — Correção de bug

fix(clues): ensure named-river evidence is used for river cities instead of generic terrain

Commits: [`4c123225`](https://github.com/F404X/cartigma/commit/4c1232252713000744206a36799ead0f9e68a3ca)

### v1.37.19b — 2026-11-15 — Registro técnico — sem incremento

deploy: include compass directions translation pack on GitHub Pages

Commits: [`2b98baca`](https://github.com/F404X/cartigma/commit/2b98baca01f6c051c49c5e9673a43612cf99b42a)

### v1.37.19b — 2026-11-15 — Registro técnico — sem incremento

test: validate clue order, named rivers, localized arrows, compass rose and map style switching

Commits: [`6e0d2167`](https://github.com/F404X/cartigma/commit/6e0d2167f1b8257845a63ba993867bb8f12c6add)

### v1.37.19b — 2026-11-15 — Correção de bug

fix(map): preserve center when switching from OpenStreetMap back to vector mode

Commits: [`b096a714`](https://github.com/F404X/cartigma/commit/b096a714b0311f301f07611a05be54e54f87c8dd)

### v1.37.18b — 2026-11-15 — Correção de bug

fix(map): lower vector label thresholds even when original style delays city names

Commits: [`c0a8e5ef`](https://github.com/F404X/cartigma/commit/c0a8e5efae2b7d8e31bc4aa3f1e92fe0d273363d)

### v1.37.17b — 2026-11-15 — Atualização geral

style(map): compass rose at bottom-right and compact bottom basemap selector

Commits: [`da5af7f7`](https://github.com/F404X/cartigma/commit/da5af7f76279efab4213d35ebfc6b629c4ba96c9)

### v1.36.17b — 2026-11-15 — Correção de bug

fix(map): identify style picker for translated accessibility label

Commits: [`9682b56a`](https://github.com/F404X/cartigma/commit/9682b56ade8c7bb157347c5f8a4f67756d765a58)

### v1.36.16b — 2026-11-15 — Atualização geral

feat(map): selectable MapLibre/OpenStreetMap engines with preserved viewport, zoom labels and state

Commits: [`16fc0f43`](https://github.com/F404X/cartigma/commit/16fc0f43ee81ecdf318bd74ae4c7b11161818837)

### v1.35.16b — 2026-11-15 — Atualização geral

feat(clues): hemisphere before continent, named rivers, and localized directions with arrows

Commits: [`25986830`](https://github.com/F404X/cartigma/commit/2598683033ab837545c6fa7a8851a3e192001612)

### v1.34.16b — 2026-11-15 — Atualização geral

feat(i18n): localize named-river evidence and map-style selector captions

Commits: [`4cad775a`](https://github.com/F404X/cartigma/commit/4cad775a00988748b067e7a8fa0484a544635965)

### v1.33.16b — 2026-11-15 — Atualização geral

feat(map): initialize saved basemap preference and lazy-load vector or OpenStreetMap engines

Commits: [`76adeed4`](https://github.com/F404X/cartigma/commit/76adeed40927deffa16c5b3602e0920f27f80aa2)

### v1.32.16b — 2026-11-15 — Atualização geral

ui(map): add compass rose and bottom vector/OpenStreetMap basemap switcher

Commits: [`33a235ba`](https://github.com/F404X/cartigma/commit/33a235bad8b70c7af0a662af64990583f4dcc7fd)

### v1.31.16b — 2026-11-15 — Atualização geral

feat(i18n): add localized cardinal directions and compass rose letters for 19 languages

Commits: [`a9a89faa`](https://github.com/F404X/cartigma/commit/a9a89faa1337bd364a0c6f095dc5b658435b5840)

### v1.30.16b — 2026-11-14 — Registro técnico — sem incremento

docs: explain adaptive regional distance clues and difficulty-based rounding

Commits: [`e638303b`](https://github.com/F404X/cartigma/commit/e638303b9d724d0bd9a01ae4cfbbbdcccb3ef6f0)

### v1.30.16b — 2026-11-14 — Registro técnico — sem incremento

test(clues): validate regional distance radii, wider Hard clues and no overly precise nearest-city hint

Commits: [`7476bcba`](https://github.com/F404X/cartigma/commit/7476bcba3b761dc4fbc92956bba4d779da025c80)

### v1.30.16b — 2026-11-14 — Correção de bug

fix(clues): ensure proximity comparison uses two distinct regional references

Commits: [`73873def`](https://github.com/F404X/cartigma/commit/73873defa276001a44965ab859860170aa45c171)

### v1.30.15b — 2026-11-14 — Atualização geral

feat(clues): adapt reference radius to regional geography and difficulty, with less revealing rounded distances

Commits: [`25003855`](https://github.com/F404X/cartigma/commit/25003855fb8c059ada360b1c742ff604d14da418)

### v1.29.15b — 2026-11-14 — Registro técnico — sem incremento

docs: describe zoom-tiered map labels and searchable flag language picker

Commits: [`a5ce8794`](https://github.com/F404X/cartigma/commit/a5ce879414921578d4172d32e00a8e4140921613)

### v1.29.15b — 2026-11-14 — Registro técnico — sem incremento

test(map): assert country, city and road names appear at increasing zoom thresholds

Commits: [`4d07f691`](https://github.com/F404X/cartigma/commit/4d07f691df24434663d098fdbeead097ca2ec172)

### v1.29.15b — 2026-11-14 — Registro técnico — sem incremento

test: verify flag images, accessible search, keyboard selection and saved locale sync

Commits: [`ba6b1f5a`](https://github.com/F404X/cartigma/commit/ba6b1f5a664c4ceccbabf9f5603304319aa943b3)

### v1.29.15b — 2026-11-14 — Registro técnico — sem incremento

deploy: include custom language picker with flags in GitHub Pages artifact

Commits: [`e6ac4c13`](https://github.com/F404X/cartigma/commit/e6ac4c139e4e6fd6da40977704e62d298ac112a9)

### v1.29.15b — 2026-11-14 — Atualização geral

style(language): custom flag list, search field, selected state and responsive keyboard-friendly popover

Commits: [`bc2a7df2`](https://github.com/F404X/cartigma/commit/bc2a7df2037cdac17639dfc727c9ada865b9805e)

### v1.28.15b — 2026-11-14 — Correção de bug

fix(map): reveal country, city, local and street labels progressively with zoom; sync custom locale dropdown

Commits: [`165ede3f`](https://github.com/F404X/cartigma/commit/165ede3fc6ec2a0dfaf17a75588113a8463e430f)

### v1.28.14b — 2026-11-14 — Atualização geral

feat(i18n): implement accessible searchable flag dropdown for all 19 languages

Commits: [`de0e8a7f`](https://github.com/F404X/cartigma/commit/de0e8a7f0352191387de0256f21de6f91e94bfa5)

### v1.27.14b — 2026-11-14 — Atualização geral

ui(language): replace native locale dropdown with searchable custom list and visible flags

Commits: [`77672425`](https://github.com/F404X/cartigma/commit/77672425236dbe66da485476b56b9c54be8ecc8f)

### v1.26.14b — 2026-11-14 — Registro técnico — sem incremento

docs: explain stacked evidence layout and automatic keyless map fallback

Commits: [`53103e40`](https://github.com/F404X/cartigma/commit/53103e4072e471403785bba298546f560a71bde7)

### v1.26.14b — 2026-11-14 — Registro técnico — sem incremento

test: ensure evidence-above-guess layout and operational Leaflet map fallback

Commits: [`1f7b42ae`](https://github.com/F404X/cartigma/commit/1f7b42ae3f05507c8577ef63e268c1630dd8341a)

### v1.26.14b — 2026-11-14 — Registro técnico — sem incremento

deploy: ship the Leaflet fallback adapter alongside MapLibre

Commits: [`48d12cd6`](https://github.com/F404X/cartigma/commit/48d12cd64b59aee961d30348130653196a5779ae)

### v1.26.14b — 2026-11-14 — Atualização geral

layout: stack evidence above guess panel and style the fallback map

Commits: [`fc9f706d`](https://github.com/F404X/cartigma/commit/fc9f706d14cd2ba050cc857ce7cb00a2771fecc6)

### v1.25.14b — 2026-11-14 — Correção de bug

fix(map): handle missing WebGL, absent supported() and failed vector style with Leaflet fallback

Commits: [`c1c1ba68`](https://github.com/F404X/cartigma/commit/c1c1ba68012289e8176407a69bf5b93818463b87)

### v1.25.13b — 2026-11-14 — Correção de bug

fix(map): preload Leaflet fallback adapter and styles for unavailable vector map

Commits: [`1ab80d3c`](https://github.com/F404X/cartigma/commit/1ab80d3c52e5e8f6d5c84b1c4bb6914acfbaf15d)

### v1.25.12b — 2026-11-14 — Correção de bug

fix(map): resilient bootstrap with CDN failover and keyless Leaflet map fallback

Commits: [`ef272164`](https://github.com/F404X/cartigma/commit/ef2721649a067101cbbec15679693202c8ea5bbc)

### v1.25.11b — 2026-11-14 — Correção de bug

fix(map): provide keyless Leaflet fallback for browsers without WebGL or vector map support

Commits: [`010d5b18`](https://github.com/F404X/cartigma/commit/010d5b189c2b5deb83a4d2b99df63697121b4de9)

### v1.25.10b — 2026-11-14 — Registro técnico — sem incremento

test: guard exact MapLibre pin-tip alignment

Commits: [`17a86114`](https://github.com/F404X/cartigma/commit/17a86114e7aa6dc2f3fec0b2fa82eab1261af062)

### v1.25.10b — 2026-11-14 — Atualização geral

style(map): align 24x32 detector pins to bottom-point geographic coordinates

Commits: [`220fff76`](https://github.com/F404X/cartigma/commit/220fff76bf7577fc1362c5f4314d4da8766cb62a)

### v1.24.10b — 2026-11-14 — Correção de bug

fix(map): anchor full pin height so pointed tip matches exact clicked coordinate

Commits: [`385aad2e`](https://github.com/F404X/cartigma/commit/385aad2eda36bb217060265ff50b5e041e63c224)

### v1.24.9b — 2026-11-14 — Registro técnico — sem incremento

docs: document near-1,000-km clues, multilingual vector map, gestures and side dossier

Commits: [`fe16e496`](https://github.com/F404X/cartigma/commit/fe16e496f9182c075ca2719fed8277947ad6eb98)

### v1.24.9b — 2026-11-14 — Registro técnico — sem incremento

test: mock MapLibre control and exclude browser ESM loader from VM tests

Commits: [`c7554c32`](https://github.com/F404X/cartigma/commit/c7554c32569f62181621e4247415621ff0620ac9)

### v1.24.9b — 2026-11-14 — Registro técnico — sem incremento

test: cover MapLibre multilingual labels, drag threshold, report drawer and 1,000-km clue references

Commits: [`51ce714b`](https://github.com/F404X/cartigma/commit/51ce714b7995e27d4c015c162bd72287dbac62d1)

### v1.24.9b — 2026-11-14 — Registro técnico — sem incremento

deploy: include vector map loader and local geographic reference dataset

Commits: [`810214f2`](https://github.com/F404X/cartigma/commit/810214f2bb005ea0ae67f7617e448e67ea57bd5a)

### v1.24.9b — 2026-11-14 — Atualização geral

style: compact multilingual globe selector and non-modal right-side report with visible map

Commits: [`cdf44811`](https://github.com/F404X/cartigma/commit/cdf44811a1bb828dc9dd582c559d87b93a72a971)

### v1.23.9b — 2026-11-14 — Atualização geral

feat(map): vector tiles with language switching, drag-safe pin placement and adaptive result framing

Commits: [`2fef5a5a`](https://github.com/F404X/cartigma/commit/2fef5a5a979b2526a3a8cd29a14b104fd2881df5)

### v1.22.9b — 2026-11-14 — Correção de bug

fix(clues): restrict reference distances to 1,000 km and localize nearby reference countries

Commits: [`79bbf68c`](https://github.com/F404X/cartigma/commit/79bbf68c51c79f7eebe0085bc5c321be14d1f714)

### v1.22.8b — 2026-11-14 — Atualização geral

feat(map): bootstrap MapLibre GL 6 vector maps without an API key

Commits: [`985507de`](https://github.com/F404X/cartigma/commit/985507de1ba29db41259de9adc12c767fd015dd2)

### v1.21.8b — 2026-11-14 — Atualização geral

ui(map): prepare keyless vector basemap and globe/flag language selector

Commits: [`8beda991`](https://github.com/F404X/cartigma/commit/8beda9919869de6216856512da23113ae18547d3)

### v1.20.8b — 2026-11-14 — Atualização geral

data: curate local reference cities within 1,000 km for every isolated case

Commits: [`754eabea`](https://github.com/F404X/cartigma/commit/754eabea6b2dd70d5d35bd439c9b376304330af3)

### v1.19.8b — 2026-11-14 — Registro técnico — sem incremento

docs: explain Normal and Hard gameplay, case IDs, final dossier, pin anchors and trivia

Commits: [`1fe4aabd`](https://github.com/F404X/cartigma/commit/1fe4aabd7782695058c44a43f0ca6b1965cc5544)

### v1.19.8b — 2026-11-14 — Correção de bug

fix(map): render final marker in same wrapped world copy as closest guess

Commits: [`bf88e02f`](https://github.com/F404X/cartigma/commit/bf88e02fc7c5657d44e23fc869bc3cbb0603e176)

### v1.19.7b — 2026-11-14 — Registro técnico — sem incremento

test: correct regex assertions and provide mocked global Leaflet instance

Commits: [`b7ec0b3f`](https://github.com/F404X/cartigma/commit/b7ec0b3f126006ab7b5b33bcd7e676994ef6f533)

### v1.19.7b — 2026-11-14 — Correção de bug

fix(progress): persist daily case number immediately so reload keeps the same ID

Commits: [`5b19d261`](https://github.com/F404X/cartigma/commit/5b19d261b7bb7f5b8c6f817bb2b66e1cbae86376)

### v1.19.6b — 2026-11-14 — Registro técnico — sem incremento

test: verify two difficulties, hidden Hard bearings, sequential case IDs, map framing and completed dossiers

Commits: [`a27020ba`](https://github.com/F404X/cartigma/commit/a27020ba49e0f9a55a052a8949ab9b096022c441)

### v1.19.6b — 2026-11-14 — Atualização geral

style: compact ruled evidence board, pointed location pins and responsive detective report

Commits: [`e2c80a44`](https://github.com/F404X/cartigma/commit/e2c80a449d20e10fe5f2b5f331b21e214f74609d)

### v1.18.6b — 2026-11-14 — Registro técnico — sem incremento

deploy: include localized dossier and trivia assets in GitHub Pages bundle

Commits: [`81db7ad5`](https://github.com/F404X/cartigma/commit/81db7ad582e464ca8cf0b7ea84ed643674e35357)

### v1.18.6b — 2026-11-14 — Registro técnico — sem incremento

build: load localized case reports and location facts before game engine

Commits: [`d9b47767`](https://github.com/F404X/cartigma/commit/d9b47767d4d309d662f682a762001041da310fa4)

### v1.18.6b — 2026-11-14 — Atualização geral

feat: hard mode without directions, daily case sequence, closest-guess map framing and investigation dossier

Commits: [`1d4bb999`](https://github.com/F404X/cartigma/commit/1d4bb9997da0c408adbcc5d8b7311c1bc1928824)

### v1.17.6b — 2026-11-14 — Atualização geral

data: add 74 curated geographic trivia entries for investigation reports

Commits: [`fe5c517b`](https://github.com/F404X/cartigma/commit/fe5c517b0e9df06a29b87c2b817ac1a12806ed03)

### v1.16.6b — 2026-11-14 — Atualização geral

i18n: localize detective reports, new hint labels and two-mode rules for 19 languages

Commits: [`63215994`](https://github.com/F404X/cartigma/commit/63215994a0b2980f50e22a84dd3757bc459c954c)

### v1.15.6b — 2026-11-14 — Atualização geral

ui: remove Easy mode, add detective case-report dossier and compact evidence headings

Commits: [`cfc1ce8f`](https://github.com/F404X/cartigma/commit/cfc1ce8f12339305be1f5c5021b2c0f9d91364aa)

### v1.14.6b — 2026-11-14 — Registro técnico — sem incremento

test: ensure six continent labels render as names in all 19 languages

Commits: [`0285c458`](https://github.com/F404X/cartigma/commit/0285c458b2d662c8b094101b5c8843f0106bbb71)

### v1.14.6b — 2026-11-14 — Correção de bug

fix(clues): replace numeric continent region codes with localized labels

Commits: [`937724cc`](https://github.com/F404X/cartigma/commit/937724cc4e452671660215a6a48462963b276811)

### v1.14.5b — 2026-11-14 — Correção de bug

fix(i18n): render real continent names instead of UN M49 numeric codes

Commits: [`ae5e6648`](https://github.com/F404X/cartigma/commit/ae5e66480ad04c762c589edcd684ff94e42f35fd)

### v1.14.4b — 2026-11-14 — Correção de bug

fix(clues): avoid ambiguous capital claims and distinguish daily difficulty case codes

Commits: [`b405bccd`](https://github.com/F404X/cartigma/commit/b405bccd1e357893510bd7d771e885b66626ae20)

### v1.14.3b — 2026-11-14 — Registro técnico — sem incremento

docs: document curated city landmarks and richer clue variety

Commits: [`b84f500e`](https://github.com/F404X/cartigma/commit/b84f500e6b799701343ec7ef6a0202aa49bd379a)

### v1.14.3b — 2026-11-14 — Atualização geral

feat(clues): use 74 curated city landmarks as varied final geographic evidence

Commits: [`e6acfd69`](https://github.com/F404X/cartigma/commit/e6acfd6930d831eefd3abd7bef2881e68da193b1)

### v1.13.3b — 2026-11-14 — Atualização geral

feat(clues): translate a city-specific landmark evidence type in all 19 languages

Commits: [`d21f0d31`](https://github.com/F404X/cartigma/commit/d21f0d31b82e33d9e289f36074444ec42c8c5b3a)

### v1.12.3b — 2026-11-14 — Registro técnico — sem incremento

docs: update language options, compact design and difficulty rules

Commits: [`bf5b3ba1`](https://github.com/F404X/cartigma/commit/bf5b3ba15aaa495fb5159ef7ca5f2d8e61b4957f)

### v1.12.3b — 2026-11-14 — Atualização geral

style: align favicon with new yellow accent

Commits: [`09d4629b`](https://github.com/F404X/cartigma/commit/09d4629b110a617379a702973cac74d361a960d4)

### v1.11.3b — 2026-11-14 — Registro técnico — sem incremento

build: include 19-language translation bundles in GitHub Pages artifact

Commits: [`eb789247`](https://github.com/F404X/cartigma/commit/eb78924780903f4e6c7d0c1f3284e7f536ca7843)

### v1.11.3b — 2026-11-14 — Registro técnico — sem incremento

test: support localized short clues and alternate spellings of city names

Commits: [`28546ac5`](https://github.com/F404X/cartigma/commit/28546ac5bc05bc2852d2340db2157038246cfc64)

### v1.11.3b — 2026-11-14 — Registro técnico — sem incremento

test: cover 19 locales, 3 difficulty modes, varied clues, responsive layout, and daily progress

Commits: [`8c22e3ed`](https://github.com/F404X/cartigma/commit/8c22e3ed34744dfd594820d2ed07ad75b7a7cecb)

### v1.11.3b — 2026-11-14 — Atualização geral

feat(game): difficulty-aware daily challenges, varied localized clues, and compact gameplay

Commits: [`762fc763`](https://github.com/F404X/cartigma/commit/762fc763d9c9965d3d00cebc37a251c7307e9ab8)

### v1.10.3b — 2026-11-14 — Correção de bug

fix(i18n): load translated clue resources before game engine

Commits: [`d207ba01`](https://github.com/F404X/cartigma/commit/d207ba01d5966efd1763ea43c33f63c7efdb9308)

### v1.10.2b — 2026-11-14 — Atualização geral

feat(i18n): localize geography clue templates and landscape vocabulary in 19 languages

Commits: [`52b8627f`](https://github.com/F404X/cartigma/commit/52b8627f9fabd054b8cac06b407a30e7f68f2c1c)

### v1.9.2b — 2026-11-14 — Atualização geral

feat(i18n): add full 19-language interface message catalogue

Commits: [`0e2a995b`](https://github.com/F404X/cartigma/commit/0e2a995bc2600ca67198d0d47c39580b9b90a857)

### v1.8.2b — 2026-11-14 — Atualização geral

style: yellow-first utilitarian visual system and one-viewport responsive game layout

Commits: [`c8ff6da8`](https://github.com/F404X/cartigma/commit/c8ff6da88571db04710d6afa20212a4341021d3a)

### v1.7.2b — 2026-11-14 — Atualização geral

refactor(ui): compact single-screen layout with parallel evidence and guess panels

Commits: [`6dea724a`](https://github.com/F404X/cartigma/commit/6dea724a9a0c98f2d039b3958ba5dc5324e7ba48)

### v1.6.2b — 2026-11-14 — Registro técnico — sem incremento

test: guard against CARTO API key requirement in map tiles

Commits: [`bb734d4e`](https://github.com/F404X/cartigma/commit/bb734d4ecf83361a4fc0f2774ab1b5b6d48b2729)

### v1.6.2b — 2026-11-14 — Registro técnico — sem incremento

docs: clarify keyless OSM tiles, attribution and Pages publishing

Commits: [`0240384d`](https://github.com/F404X/cartigma/commit/0240384d0b98dcda6abcd91b415bcce561afa6ed)

### v1.6.2b — 2026-11-14 — Atualização geral

style(map): apply dark visual treatment to OpenStreetMap raster tiles

Commits: [`b1067373`](https://github.com/F404X/cartigma/commit/b1067373dd1fb4f59982da474b9dcd6ff7b61152)

### v1.5.2b — 2026-11-14 — Correção de bug

fix(map): replace CARTO API-key tiles with keyless OpenStreetMap tiles

Commits: [`938c0467`](https://github.com/F404X/cartigma/commit/938c0467d9f8f4c0d87d8ffb06d61ecd8958c5b4)

### v1.5.1b — 2026-11-14 — Registro técnico — sem incremento

ci: publish GeoDetective on GitHub Pages on main pushes

Commits: [`917040d2`](https://github.com/F404X/cartigma/commit/917040d2e3877f82ffbc9dbeacc32036635e0f84)

### v1.5.1b — 2026-11-14 — Registro técnico — sem incremento

test: assert empty history placeholder after starting new case

Commits: [`aaf9f53c`](https://github.com/F404X/cartigma/commit/aaf9f53c52f219ccbafba9d1dbfdb5e5d756c736)

### v1.5.1b — 2026-11-14 — Registro técnico — sem incremento

docs: reflect elevation hint, Cloudflare root and automated tests

Commits: [`ca276ed7`](https://github.com/F404X/cartigma/commit/ca276ed75131ade18808939c09d178fd71cf80cb)

### v1.5.1b — 2026-11-14 — Registro técnico — sem incremento

ci: run GeoDetective smoke tests on pushes and pull requests

Commits: [`f9e16d14`](https://github.com/F404X/cartigma/commit/f9e16d149abd2cbbae71cd57e6268b2168660e11)

### v1.5.1b — 2026-11-14 — Registro técnico — sem incremento

test: add dependency-free gameplay and dataset smoke tests

Commits: [`dbee8a03`](https://github.com/F404X/cartigma/commit/dbee8a030237b92a815380caeef201b29d4fd4a8)

### v1.5.1b — 2026-11-14 — Atualização geral

feat: enrich geographic evidence with optional terrain elevation data

Commits: [`8122dadb`](https://github.com/F404X/cartigma/commit/8122dadbef545386b071e88961868c06208cb732)

### v1.4.1b — 2026-11-14 — Registro técnico — sem incremento

docs: document gameplay, data limitations and Cloudflare Pages deployment

Commits: [`9180158b`](https://github.com/F404X/cartigma/commit/9180158b85aaa5ce7ac4edcb4e2d6e2a6b05d29b)

### v1.4.1b — 2026-11-14 — Registro técnico — sem incremento

assets: add custom GeoDetective compass favicon

Commits: [`84882ccb`](https://github.com/F404X/cartigma/commit/84882ccbb20dd1decd6e546cf6cc98ca5f3fe097)

### v1.4.1b — 2026-11-14 — Correção de bug

fix: load geographical locations before the game engine

Commits: [`16db87dd`](https://github.com/F404X/cartigma/commit/16db87dd1d337f3815ffc26eead49b0489ff8446)

### v1.4.0b — 2026-11-14 — Atualização geral

feat: implement daily puzzles, hints, maps and guess scoring

Commits: [`1ef3a391`](https://github.com/F404X/cartigma/commit/1ef3a39167bcc250b3745a49b54cfca6fdf8b445)

### v1.3.0b — 2026-11-14 — Atualização geral

data: add geographically diverse location catalogue

Commits: [`d8d840b5`](https://github.com/F404X/cartigma/commit/d8d840b539b643fdf26395bfc3c598828abedb4d)

### v1.2.0b — 2026-11-14 — Atualização geral

style: build responsive cartography-inspired dark interface

Commits: [`ee66dd45`](https://github.com/F404X/cartigma/commit/ee66dd45f9fe90f688a099c14748dbcc454617be)

### v1.1.0b — 2026-11-14 — Atualização geral

feat: initialize GeoDetective static site

Commits: [`7e38b3c1`](https://github.com/F404X/cartigma/commit/7e38b3c158de963b0c0dd48d43b756c3779d785f)
