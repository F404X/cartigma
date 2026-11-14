# GeoDetective

**Uma cidade secreta. Seis tentativas. Um planeta inteiro de pistas.**

GeoDetective é um jogo de dedução geográfica feito em HTML, CSS e JavaScript. O jogador investiga uma localização real com pistas progressivas e marca palpites em um mapa mundial interativo.

## Funcionalidades

- **Desafio diário global:** a localização é selecionada deterministicamente pela data **UTC**, sendo a mesma para todas as pessoas que utilizam a mesma versão do catálogo.
- **Modo livre:** novos casos ilimitados, sem necessidade de criar conta.
- **74 localidades** distribuídas por vários continentes e biomas, com pistas geográficas editáveis em [places.js](places.js).
- **Seis tentativas:** feedback após cada palpite com distância em linha reta e direção cardinal.
- **Pistas graduais:** relevo/paisagem, faixa de latitude, região, longitude, altitude do terreno (quando disponível), duração aproximada do dia no solstício de junho, país e referência local.
- **Pontuação:** até 5.000 pontos, com penalidade por palpites adicionais e por pistas antecipadas.
- **Busca de cidades:** sugestões locais e busca opcional pela API de geocodificação da Open-Meteo.
- **Mapa mundial:** Leaflet com mosaicos públicos OpenStreetMap, estilizados em modo escuro via CSS, sem chave de API.
- **Progresso diário no navegador:** salvo em localStorage, sem dados pessoais enviados a um servidor próprio.
- **Compartilhamento:** resultado textual sem revelar diretamente a resposta do desafio.
- **Interface responsiva:** tema escuro com destaques verde-lima, adaptada para celular.

## Executar localmente

Não é necessário instalar dependências nem executar uma etapa de build. Basta servir os arquivos por HTTP:

~~~bash
python -m http.server 8000
~~~

Depois acesse http://localhost:8000.

Também é possível usar uma extensão de servidor local no VS Code.

## Publicar no Cloudflare Pages

1. Conecte o repositório **F404X/geodetective** ao Cloudflare Pages.
2. Selecione a implantação via Git.
3. Framework preset: **None**.
4. Build command: **deixar vazio** (ou `exit 0`).
5. Build output directory: **`.`** (raiz do repositório).
6. Faça o deploy.

Os arquivos de entrada são [index.html](index.html), [styles.css](styles.css), [places.js](places.js) e [app.js](app.js).

## Regras

- Um palpite vence quando a posição selecionada fica a até **100 km em linha reta** do centro da localidade-alvo.
- Você tem **6 tentativas**.
- Duas pistas são mostradas inicialmente. Novas pistas são liberadas após erros, ou podem ser reveladas antecipadamente por **300 pontos** cada.
- A pontuação decresce conforme as tentativas e a distância final.
- Ao terminar, a localização é mostrada no mapa.
- A resposta do desafio diário depende da data UTC (não do fuso do navegador).

## Fonte e precisão dos dados

- As coordenadas do catálogo são **aproximações dos centros das localidades**, não limites administrativos.
- A distância é calculada pelo método **haversine** (menor caminho sobre uma esfera), e não representa distância rodoviária.
- A duração do dia é **astronômica e aproximada** (solstício de junho, sem refração atmosférica nem horizonte local).
- As pistas de paisagem e de referências foram redigidas manualmente; podem ser ampliadas e revisadas.
- As pesquisas de localização usam [Open-Meteo Geocoding API](https://open-meteo.com/en/docs/geocoding-api). A altitude, quando disponível, é aproximada a partir da [Open-Meteo Elevation API](https://open-meteo.com/en/docs/elevation-api). Essas APIs requerem internet e estão sujeitas a limites e condições de uso.
- [Leaflet](https://leafletjs.com/) e [OpenStreetMap](https://www.openstreetmap.org/copyright) são serviços/recursos externos. Os mosaicos OSM não requerem API key, mas dependem de internet e da [política de uso dos servidores públicos](https://operations.osmfoundation.org/policies/tiles/). Não implementar pré-carregamento, scraping ou cache-busting de tiles. Para tráfego elevado, migrar para hospedagem própria ou fornecedor com capacidade apropriada.

## GitHub Pages

O site é publicado automaticamente na branch `main` pelo workflow [pages.yml](.github/workflows/pages.yml) em `https://f404x.github.io/geodetective/`. Não é necessário secret para os mosaicos do mapa; o GitHub Actions recebe automaticamente seu token temporário de implantação.

## Organização

~~~text
.
├── index.html      # Interface semântica
├── styles.css      # Tema, mapa e layout responsivo
├── places.js       # Base de localidades, pistas culturais e paisagens
├── app.js          # Estado, regras, pistas, busca, mapa e resultados
├── favicon.svg     # Ícone do projeto
├── tests/           # Testes automatizados sem dependências
├── .github/workflows/ci.yml # CI em GitHub Actions
└── README.md       # Documentação
~~~

## Próximas ideias

- Perfis de dificuldade e categorias (capitais, cidades pequenas, ilhas, montanhas).
- Estatísticas locais de histórico e sequências de vitórias.
- Proximidade do litoral e séries climáticas como pistas adicionais.
- Suporte para múltiplos idiomas.
- Testes automatizados e fontes geográficas auditáveis para todo o catálogo.

---

Projeto desenvolvido para **F404X**.