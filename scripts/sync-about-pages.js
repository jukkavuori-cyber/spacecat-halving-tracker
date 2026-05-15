// Generate translated /about/ pages from the English source.
// Each language has its own dictionary of full-text replacements.
//
// Run via `node scripts/sync-about-pages.js` or as part of `predev`/`prebuild`.

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const SRC = resolve(root, 'public/about/index.html');

// ── Translations ────────────────────────────────────────────────────────
// Each entry: a verbatim English string → its translation. Applied in order.
const T = {
  es: {
    title: 'Qué es el Halving de Bitcoin? — SpaceCat',
    description: 'El halving de Bitcoin reduce la recompensa por bloque a la mitad cada 210.000 bloques (~4 años). Aprende cómo funciona, por qué importa y rastrea el próximo en vivo.',
    descriptionShort: 'El halving de Bitcoin reduce la recompensa por bloque a la mitad cada 210.000 bloques. Aprende cómo funciona y por qué impulsa los ciclos de Bitcoin.',
    canonical: 'https://spacecat.academy/es/about/',
    ogUrl: 'https://spacecat.academy/es/about/',
    locale: 'es_ES',
    navSub: 'Contador del Halving de Bitcoin',
    navCta: 'RASTREADOR EN VIVO',
    heroLabel: 'Bitcoin 101',
    h1: '¿Qué es el Halving de Bitcoin?',
    heroP: 'Cada 210.000 bloques —aproximadamente cuatro años— la recompensa que los mineros obtienen por encontrar un nuevo bloque se reduce a la mitad. Es uno de los eventos más importantes y predecibles de la política monetaria de Bitcoin.',
    s1Label: 'El mecanismo',
    s1H2: '¿Cómo funciona?',
    s1P1: 'El código de Bitcoin fue escrito de modo que <strong>solo existirán 21 millones de BTC</strong>. Las nuevas monedas entran en circulación como recompensas por bloque — pagos a los mineros que validan transacciones y aseguran la red.',
    s1P2: 'Cuando Bitcoin se lanzó en 2009, la recompensa era de <strong>50 BTC por bloque</strong>. Después de cada 210.000 bloques, esa recompensa se reduce automáticamente a la mitad por el protocolo. Este evento se llama el <strong>halving</strong> (o "halvening").',
    card1Title: 'Tiempo de bloque',
    card1Body: 'Bitcoin apunta a un nuevo bloque cada 10 minutos de media. La red ajusta la dificultad de minado cada 2.016 bloques para mantener este ritmo.',
    card2Title: 'Ciclo de ~4 años',
    card2Body: '210.000 bloques × 10 minutos = ~1.458 días ≈ 4 años. Este calendario predecible hace que el halving sea único entre los eventos monetarios.',
    card3Title: 'Shock de oferta',
    card3Body: 'Tras cada halving, la emisión diaria de nuevos BTC cae un 50%. La demanda, sin embargo, no cae automáticamente — creando un desequilibrio oferta-demanda.',
    card4Title: 'Grabado en piedra',
    card4Body: 'Ningún gobierno, empresa o persona puede cambiar el calendario del halving. Es aplicado por consenso a través de decenas de miles de nodos en todo el mundo.',
    s2Label: 'Historial de halvings',
    s2H2: 'Cuatro halvings, cuatro ciclos',
    s2P: 'Cada halving ha precedido históricamente a un nuevo mercado alcista de Bitcoin — aunque el momento varía y el rendimiento pasado no garantiza resultados futuros.',
    thHash: '#',
    thDate: 'Fecha',
    thBlock: 'Bloque',
    thReward: 'Recompensa',
    thPrice: 'Precio en el Halving',
    thPeak: 'Pico del Ciclo',
    rNov2012: '28 nov 2012',
    rJul2016: '9 jul 2016',
    rMay2020: '11 may 2020',
    rApr2024: '19 abr 2024',
    rDec2013: '(dic 2013)',
    rDec2017: '(dic 2017)',
    rNov2021: '(nov 2021)',
    cycleOngoing: 'Ciclo en curso',
    badgeNow: 'AHORA',
    s3Label: 'Por qué importa',
    s3H2: 'Oferta, demanda y ciclos',
    s3P1: 'La oferta total de Bitcoin está <strong>limitada a 21 millones de monedas</strong>. A fecha de 2025, ya se han minado más de 19,8 millones de BTC. El halving ralentiza dramáticamente la nueva emisión — para el año 2140, los 21 millones habrán sido minados.',
    s3P2: 'A diferencia de las monedas fiat, que pueden imprimirse sin límite, Bitcoin tiene un calendario de oferta conocido y fijo. Esta <strong>escasez programática</strong> es la base de la tesis del "oro digital".',
    s3Highlight: 'Tras el halving de 2024, los mineros reciben <strong>3,125 BTC por bloque</strong>. A $80.000 por BTC, son aproximadamente $450 de recompensa por bloque, o unos $65.000 al día para toda la red — frente a $130.000 antes del halving.',
    s3P3: 'Esta compresión de los ingresos de los mineros obliga a los menos eficientes a cerrar, reduciendo temporalmente el hashrate antes de que operaciones más eficientes tomen el relevo. También reduce la presión vendedora de los mineros que antes tenían que vender más BTC para cubrir costes.',
    s4Label: 'Sobre SpaceCat',
    s4H2: 'Por qué construimos este rastreador',
    s4P1: 'SpaceCat es un <strong>panel del halving de Bitcoin en tiempo real</strong> que muestra exactamente dónde estamos en el ciclo actual. Combina datos blockchain en vivo con historial de precios y análisis del ciclo en una sola vista.',
    s4P2: 'El rastreador se conecta directamente a <strong>mempool.space</strong> para datos de bloques en vivo y usa <strong>Binance</strong> para el historial de precios. Todos los datos se obtienen en el lado del cliente — sin servidores, sin tracking, sin cuentas.',
    s4P3: '¿Preguntas o feedback? Escríbenos a',
    embedH3: '📦 Incrustar el countdown',
    embedP: 'Añade el countdown en vivo del halving SpaceCat a tu propio sitio con una sola línea:',
    embedTitleAttr: 'Countdown del Halving de Bitcoin',
    embedNote: 'Uso libre, sin atribución requerida (pero un enlace de vuelta se agradece 💜).',
    fcard1Title: 'Bloques en vivo',
    fcard1Body: 'Los nuevos bloques aparecen en tiempo real vía conexión WebSocket a mempool.space. El contador de bloques se actualiza en cuanto se encuentra un bloque.',
    fcard2Title: 'Historial de precio',
    fcard2Body: 'Gráfico de precio BTC con marcos temporales 1S, 3M, 6M, 1A y 2A, más una superposición de comparación con el Ciclo III para ver similitudes de patrón.',
    fcard3Title: 'Miedo y Codicia',
    fcard3Body: 'El Índice de Miedo y Codicia de Alternative.me da una instantánea del sentimiento del mercado, de miedo extremo a codicia extrema.',
    fcard4Title: 'SpaceCat',
    fcard4Body: 'El gato viaja desde la rampa del Halving IV hasta la luna en el Bloque 1.050.000. Su posición muestra exactamente cuánto hemos avanzado en el ciclo.',
    ctaH2: 'Rastrea el próximo halving en vivo',
    ctaP: 'Bloques en tiempo real, historial de precios, countdown y análisis del ciclo — todo en un solo lugar.',
    ctaBtn: '🚀 ABRIR RASTREADOR EN VIVO',
    footerCopy: '© 2026',
    footerTagline: 'Contador del Halving de Bitcoin',
    footerData: 'Datos:',
    liveLink: '/es/',
  },

  fi: {
    title: 'Mikä on Bitcoinin puolittuminen? — SpaceCat',
    description: 'Bitcoinin puolittuminen leikkaa lohkopalkkion puoleen joka 210 000 lohkon välein (~4 vuotta). Opi miten se toimii, miksi sillä on merkitystä, ja seuraa seuraavaa livenä.',
    descriptionShort: 'Bitcoinin puolittuminen leikkaa lohkopalkkion puoleen joka 210 000 lohkon välein. Opi miten se toimii ja miksi se ohjaa Bitcoinin syklejä.',
    canonical: 'https://spacecat.academy/fi/about/',
    ogUrl: 'https://spacecat.academy/fi/about/',
    locale: 'fi_FI',
    navSub: 'Bitcoinin Puolittumislaskuri',
    navCta: 'LIVE-SEURANTA',
    heroLabel: 'Bitcoin 101',
    h1: 'Mikä on Bitcoinin puolittuminen?',
    heroP: 'Joka 210 000 lohkon välein — noin neljä vuotta — louhijoiden saama palkkio uuden lohkon löytämisestä leikataan puoleen. Se on yksi Bitcoinin rahapolitiikan tärkeimmistä ja ennakoitavimmista tapahtumista.',
    s1Label: 'Mekanismi',
    s1H2: 'Miten se toimii?',
    s1P1: 'Bitcoinin koodi kirjoitettiin niin, että <strong>vain 21 miljoonaa BTC:tä tulee koskaan olemaan olemassa</strong>. Uudet kolikot tulevat liikkeelle lohkopalkkioina — maksuina louhijoille, jotka vahvistavat transaktioita ja turvaavat verkkoa.',
    s1P2: 'Kun Bitcoin julkaistiin 2009, palkkio oli <strong>50 BTC per lohko</strong>. Joka 210 000 lohkon jälkeen palkkio puolittuu automaattisesti protokollan toimesta. Tätä tapahtumaa kutsutaan <strong>puolittumiseksi</strong> (englanniksi "halving").',
    card1Title: 'Lohkoaika',
    card1Body: 'Bitcoin tavoittelee uutta lohkoa keskimäärin 10 minuutin välein. Verkko säätää louhinnan vaikeustasoa 2 016 lohkon välein säilyttääkseen tämän tahdin.',
    card2Title: '~4 vuoden sykli',
    card2Body: '210 000 lohkoa × 10 minuuttia = ~1 458 päivää ≈ 4 vuotta. Tämä ennustettava aikataulu tekee puolittumisesta ainutlaatuisen rahatapahtumana.',
    card3Title: 'Tarjontasokki',
    card3Body: 'Jokaisen puolittumisen jälkeen uusien BTC:iden päivittäinen liikkeellelasku putoaa 50 %. Kysyntä ei kuitenkaan automaattisesti laske — luoden epätasapainon tarjonnan ja kysynnän välille.',
    card4Title: 'Koodattu kiveen',
    card4Body: 'Mikään hallitus, yritys tai henkilö ei voi muuttaa puolittumisen aikataulua. Sen takaa konsensus kymmenissä tuhansissa noodeissa ympäri maailmaa.',
    s2Label: 'Puolittumishistoria',
    s2H2: 'Neljä puolittumista, neljä sykliä',
    s2P: 'Jokainen puolittuminen on historiallisesti edeltänyt uutta Bitcoinin nousumarkkinaa — vaikka ajoitus vaihtelee eikä menneisyys takaa tulevia tuloksia.',
    thHash: '#',
    thDate: 'Päivämäärä',
    thBlock: 'Lohko',
    thReward: 'Palkkio',
    thPrice: 'Hinta puolittumishetkellä',
    thPeak: 'Syklin huippu',
    rNov2012: '28. marrasta 2012',
    rJul2016: '9. heinäk. 2016',
    rMay2020: '11. toukok. 2020',
    rApr2024: '19. huhtik. 2024',
    rDec2013: '(joulu 2013)',
    rDec2017: '(joulu 2017)',
    rNov2021: '(marras 2021)',
    cycleOngoing: 'Sykli käynnissä',
    badgeNow: 'NYT',
    s3Label: 'Miksi sillä on merkitystä',
    s3H2: 'Tarjonta, kysyntä ja syklit',
    s3P1: 'Bitcoinin kokonaistarjonta on <strong>rajoitettu 21 miljoonaan kolikkoon</strong>. Vuoteen 2025 mennessä yli 19,8 miljoonaa BTC:tä on jo louhittu. Puolittuminen hidastaa uutta liikkeellelaskua dramaattisesti — vuoteen 2140 mennessä kaikki 21 miljoonaa on louhittu.',
    s3P2: 'Toisin kuin fiat-valuutat, joita voidaan painaa rajatta, Bitcoinilla on tunnettu ja kiinteä tarjonta-aikataulu. Tämä <strong>ohjelmoitu niukkuus</strong> on "digitaalisen kullan" -teesin perusta.',
    s3Highlight: '2024-puolittumisen jälkeen louhijat saavat <strong>3,125 BTC per lohko</strong>. $80 000:n BTC-hinnalla se on noin $450 palkkio per lohko, eli koko verkolle noin $65 000 päivässä — alas $130 000:sta ennen puolittumista.',
    s3P3: 'Tämä louhijoiden tulojen puristus pakottaa vähemmän tehokkaat louhijat sulkemaan, mikä tilapäisesti laskee hashrate-tasoa ennen kuin tehokkaammat operaatiot ottavat vallan. Se myös vähentää myyntipainetta louhijoilta, joiden piti aiemmin myydä enemmän BTC:tä kulujen kattamiseksi.',
    s4Label: 'Tietoa SpaceCatista',
    s4H2: 'Miksi rakensimme tämän seurannan',
    s4P1: 'SpaceCat on <strong>reaaliaikainen Bitcoinin puolittumis-dashboard</strong> joka näyttää tarkalleen missä olemme nykyisessä puolittumissyklissä. Se yhdistää livedataan blockchainista, hintahistoriaan ja syklianalytiikkaan yhdessä näkymässä.',
    s4P2: 'Seuraaja yhdistää suoraan <strong>mempool.space</strong>:iin live-lohkodatalle ja käyttää <strong>Binancea</strong> hintahistoriaan. Kaikki data haetaan asiakaspuolella — ei palvelimia, ei seurantaa, ei tilejä.',
    s4P3: 'Kysymyksiä tai palautetta? Tavoitat meidät osoitteesta',
    embedH3: '📦 Upota laskuri',
    embedP: 'Lisää SpaceCat-puolittumislaskuri omalle sivullesi yhdellä rivillä:',
    embedTitleAttr: 'Bitcoinin puolittumislaskuri',
    embedNote: 'Vapaa käyttö, ei vaadi maininnan (mutta paluulinkki on aina mukava 💜).',
    fcard1Title: 'Live-lohkot',
    fcard1Body: 'Uudet lohkot ilmestyvät reaaliajassa WebSocket-yhteydellä mempool.space:en. Lohkolaskuri päivittyy sillä hetkellä kun lohko löytyy.',
    fcard2Title: 'Hintahistoria',
    fcard2Body: 'BTC-hintakaavio aikajaksoilla 1V, 3K, 6K, 1V ja 2V sekä Cycle III -vertailupäällystys hahmottelua varten.',
    fcard3Title: 'Pelko ja ahneus',
    fcard3Body: 'Alternative.me Fear & Greed -indeksi antaa kuvan markkinatunnelmasta äärimmäisestä pelosta äärimmäiseen ahneuteen.',
    fcard4Title: 'SpaceCat',
    fcard4Body: 'Kissa matkaa Halving IV -laukaisualustalta kuuhun lohkossa 1 050 000. Sen sijainti näyttää tarkalleen kuinka pitkällä syklissä olemme.',
    ctaH2: 'Seuraa seuraavaa puolittumista livenä',
    ctaP: 'Live-lohkot, hintahistoria, ajastin ja syklianalytiikka — kaikki yhdessä paikassa.',
    ctaBtn: '🚀 AVAA LIVE-SEURANTA',
    footerCopy: '© 2026',
    footerTagline: 'Bitcoinin Puolittumislaskuri',
    footerData: 'Lähteet:',
    liveLink: '/fi/',
  },

  pt: {
    title: 'O que é o Halving do Bitcoin? — SpaceCat',
    description: 'O halving do Bitcoin corta a recompensa por bloco ao meio a cada 210.000 blocos (~4 anos). Aprenda como funciona, por que importa e acompanhe o próximo ao vivo.',
    descriptionShort: 'O halving do Bitcoin corta a recompensa por bloco ao meio a cada 210.000 blocos. Aprenda como funciona e por que ele move os ciclos do Bitcoin.',
    canonical: 'https://spacecat.academy/pt/about/',
    ogUrl: 'https://spacecat.academy/pt/about/',
    locale: 'pt_BR',
    navSub: 'Rastreador do Halving do Bitcoin',
    navCta: 'RASTREADOR AO VIVO',
    heroLabel: 'Bitcoin 101',
    h1: 'O que é o Halving do Bitcoin?',
    heroP: 'A cada 210.000 blocos — aproximadamente quatro anos — a recompensa que os mineradores ganham por encontrar um novo bloco é cortada ao meio. É um dos eventos mais importantes e previsíveis da política monetária do Bitcoin.',
    s1Label: 'O mecanismo',
    s1H2: 'Como funciona?',
    s1P1: 'O código do Bitcoin foi escrito de forma que <strong>apenas 21 milhões de BTC existirão</strong>. Novas moedas entram em circulação como recompensas por bloco — pagamentos aos mineradores que validam transações e protegem a rede.',
    s1P2: 'Quando o Bitcoin foi lançado em 2009, a recompensa era de <strong>50 BTC por bloco</strong>. A cada 210.000 blocos, essa recompensa é cortada automaticamente ao meio pelo protocolo. Este evento é chamado de <strong>halving</strong>.',
    card1Title: 'Tempo de bloco',
    card1Body: 'O Bitcoin mira um novo bloco a cada 10 minutos em média. A rede ajusta a dificuldade de mineração a cada 2.016 blocos para manter esse ritmo.',
    card2Title: 'Ciclo de ~4 anos',
    card2Body: '210.000 blocos × 10 minutos = ~1.458 dias ≈ 4 anos. Esse cronograma previsível torna o halving único entre os eventos monetários.',
    card3Title: 'Choque de oferta',
    card3Body: 'Após cada halving, a emissão diária de novos BTC cai 50%. A demanda, no entanto, não cai automaticamente — criando um desequilíbrio entre oferta e demanda.',
    card4Title: 'Gravado em pedra',
    card4Body: 'Nenhum governo, empresa ou pessoa pode mudar o cronograma do halving. Ele é aplicado por consenso em dezenas de milhares de nós ao redor do mundo.',
    s2Label: 'Histórico de halvings',
    s2H2: 'Quatro halvings, quatro ciclos',
    s2P: 'Cada halving precedeu historicamente um novo mercado de alta do Bitcoin — embora o timing varie e o desempenho passado não garanta resultados futuros.',
    thHash: '#',
    thDate: 'Data',
    thBlock: 'Bloco',
    thReward: 'Recompensa',
    thPrice: 'Preço no Halving',
    thPeak: 'Pico do Ciclo',
    rNov2012: '28 nov 2012',
    rJul2016: '9 jul 2016',
    rMay2020: '11 mai 2020',
    rApr2024: '19 abr 2024',
    rDec2013: '(dez 2013)',
    rDec2017: '(dez 2017)',
    rNov2021: '(nov 2021)',
    cycleOngoing: 'Ciclo em curso',
    badgeNow: 'AGORA',
    s3Label: 'Por que importa',
    s3H2: 'Oferta, demanda e ciclos',
    s3P1: 'A oferta total do Bitcoin é <strong>limitada a 21 milhões de moedas</strong>. Até 2025, mais de 19,8 milhões de BTC já foram minerados. O halving desacelera dramaticamente a nova emissão — até o ano 2140, todos os 21 milhões terão sido minerados.',
    s3P2: 'Diferente das moedas fiat, que podem ser impressas sem limite, o Bitcoin tem um cronograma de oferta conhecido e fixo. Essa <strong>escassez programática</strong> é a base da tese do "ouro digital".',
    s3Highlight: 'Após o halving de 2024, os mineradores recebem <strong>3,125 BTC por bloco</strong>. A $80.000 por BTC, isso é cerca de $450 de recompensa por bloco, ou cerca de $65.000 por dia para toda a rede — contra $130.000 antes do halving.',
    s3P3: 'Essa compressão da receita dos mineradores força os menos eficientes a desligarem, reduzindo temporariamente o hashrate antes que operações mais eficientes assumam. Também reduz a pressão vendedora de mineradores que antes precisavam vender mais BTC para cobrir custos.',
    s4Label: 'Sobre o SpaceCat',
    s4H2: 'Por que construímos este rastreador',
    s4P1: 'O SpaceCat é um <strong>painel do halving do Bitcoin em tempo real</strong> que mostra exatamente onde estamos no ciclo atual. Combina dados blockchain ao vivo com histórico de preço e análise de ciclo em uma única visão.',
    s4P2: 'O rastreador se conecta diretamente ao <strong>mempool.space</strong> para dados de bloco ao vivo e usa a <strong>Binance</strong> para histórico de preço. Todos os dados são buscados no lado do cliente — sem servidores, sem rastreamento, sem contas.',
    s4P3: 'Dúvidas ou feedback? Fale com a gente em',
    embedH3: '📦 Incorpore o countdown',
    embedP: 'Adicione o countdown ao vivo do halving SpaceCat ao seu próprio site com uma única linha:',
    embedTitleAttr: 'Countdown do Halving do Bitcoin',
    embedNote: 'Uso livre, sem atribuição obrigatória (mas um link de volta é apreciado 💜).',
    fcard1Title: 'Blocos ao vivo',
    fcard1Body: 'Novos blocos aparecem em tempo real via conexão WebSocket com a mempool.space. O contador de blocos atualiza no momento em que um bloco é encontrado.',
    fcard2Title: 'Histórico de preço',
    fcard2Body: 'Gráfico de preço BTC com períodos 1S, 3M, 6M, 1A e 2A, mais uma sobreposição de comparação com o Ciclo III para identificar similaridades de padrão.',
    fcard3Title: 'Medo e Ganância',
    fcard3Body: 'O Índice de Medo e Ganância da Alternative.me dá uma fotografia do sentimento de mercado, de medo extremo a ganância extrema.',
    fcard4Title: 'SpaceCat',
    fcard4Body: 'O gato viaja da rampa do Halving IV até a lua no Bloco 1.050.000. Sua posição mostra exatamente o quanto avançamos no ciclo.',
    ctaH2: 'Acompanhe o próximo halving ao vivo',
    ctaP: 'Blocos em tempo real, histórico de preço, countdown e análise de ciclo — tudo em um só lugar.',
    ctaBtn: '🚀 ABRIR RASTREADOR AO VIVO',
    footerCopy: '© 2026',
    footerTagline: 'Rastreador do Halving do Bitcoin',
    footerData: 'Dados:',
    liveLink: '/pt/',
  },
};

// Hreflang block (shared)
const HREFLANG = [
  `<link rel="alternate" hreflang="en" href="https://spacecat.academy/about/" />`,
  `<link rel="alternate" hreflang="es" href="https://spacecat.academy/es/about/" />`,
  `<link rel="alternate" hreflang="fi" href="https://spacecat.academy/fi/about/" />`,
  `<link rel="alternate" hreflang="pt" href="https://spacecat.academy/pt/about/" />`,
  `<link rel="alternate" hreflang="x-default" href="https://spacecat.academy/about/" />`,
].map(s => '  ' + s).join('\n');

// ── Build translated source from English template ──────────────────────
const src = readFileSync(SRC, 'utf8');

function translate(lang, t) {
  let html = src;

  // Head changes
  html = html.replace('<html lang="en">', `<html lang="${lang}">`);
  html = html.replace(
    /<title>What is the Bitcoin Halving\? — SpaceCat<\/title>/,
    `<title>${t.title}</title>`
  );
  html = html.replace(
    /<meta name="description" content="[^"]*"/,
    `<meta name="description" content="${t.description}"`
  );
  html = html.replace(
    /<link rel="canonical" href="https:\/\/spacecat\.academy\/about\/" \/>/,
    `<link rel="canonical" href="${t.canonical}" />\n${HREFLANG}`
  );
  html = html.replace(
    /<meta property="og:url"\s+content="https:\/\/spacecat\.academy\/about\/" \/>/,
    `<meta property="og:url"        content="${t.ogUrl}" />`
  );
  html = html.replace(
    /<meta property="og:title"\s+content="What is the Bitcoin Halving\? — SpaceCat" \/>/,
    `<meta property="og:title"      content="${t.title}" />`
  );
  // OG description (both occurrences)
  html = html.replace(
    /<meta property="og:description" content="The Bitcoin halving cuts the block reward in half every 210,000 blocks\. Learn how it works and why it drives Bitcoin cycles\." \/>/,
    `<meta property="og:description" content="${t.descriptionShort}" />`
  );
  html = html.replace(
    /<meta property="og:site_name"\s+content="SpaceCat" \/>/,
    `<meta property="og:site_name"  content="SpaceCat" />\n  <meta property="og:locale"     content="${t.locale}" />`
  );
  html = html.replace(
    /<meta name="twitter:title"\s+content="What is the Bitcoin Halving\? — SpaceCat" \/>/,
    `<meta name="twitter:title"      content="${t.title}" />`
  );
  html = html.replace(
    /<meta name="twitter:description" content="The Bitcoin halving cuts the block reward in half every 210,000 blocks\. Learn how it works and why it drives Bitcoin cycles\." \/>/,
    `<meta name="twitter:description" content="${t.descriptionShort}" />`
  );

  // Nav
  html = html.replace(/<div class="sub">Bitcoin Halving Tracker<\/div>/, `<div class="sub">${t.navSub}</div>`);
  html = html.replace(/<a class="nav-cta" href="\/">/, `<a class="nav-cta" href="${t.liveLink}">`);
  html = html.replace(/<span class="dot"><\/span>LIVE TRACKER/, `<span class="dot"></span>${t.navCta}`);

  // Hero
  html = html.replace(/<div class="hero-label">Bitcoin 101<\/div>/, `<div class="hero-label">${t.heroLabel}</div>`);
  html = html.replace(/<h1>What is the Bitcoin Halving\?<\/h1>/, `<h1>${t.h1}</h1>`);
  html = html.replace(
    /<p>Every 210,000 blocks — roughly four years[^<]+<\/p>/,
    `<p>${t.heroP}</p>`
  );

  // Section 1: Mechanism
  html = html.replace(/<div class="section-label">The mechanism<\/div>/, `<div class="section-label">${t.s1Label}</div>`);
  html = html.replace(/<h2>How does it work\?<\/h2>/, `<h2>${t.s1H2}</h2>`);
  html = html.replace(
    /<p>Bitcoin's code was written so that <strong>only 21 million BTC will ever exist<\/strong>\.[^<]*<\/p>/,
    `<p>${t.s1P1}</p>`
  );
  html = html.replace(
    /<p>When Bitcoin launched in 2009[\s\S]*?halvening"\)\.<\/p>/,
    `<p>${t.s1P2}</p>`
  );
  html = html.replace(/<div class="info-title">Block Time<\/div>/, `<div class="info-title">${t.card1Title}</div>`);
  html = html.replace(/<div class="info-body">Bitcoin targets one new block[^<]*<\/div>/, `<div class="info-body">${t.card1Body}</div>`);
  html = html.replace(/<div class="info-title">~4 Year Cycle<\/div>/, `<div class="info-title">${t.card2Title}</div>`);
  html = html.replace(/<div class="info-body">210,000 blocks × 10 minutes[^<]*<\/div>/, `<div class="info-body">${t.card2Body}</div>`);
  html = html.replace(/<div class="info-title">Supply Shock<\/div>/, `<div class="info-title">${t.card3Title}</div>`);
  html = html.replace(/<div class="info-body">After each halving the daily issuance[^<]*<\/div>/, `<div class="info-body">${t.card3Body}</div>`);
  html = html.replace(/<div class="info-title">Coded in Stone<\/div>/, `<div class="info-title">${t.card4Title}</div>`);
  html = html.replace(/<div class="info-body">No government, company[^<]*<\/div>/, `<div class="info-body">${t.card4Body}</div>`);

  // Section 2: History
  html = html.replace(/<div class="section-label">Halving history<\/div>/, `<div class="section-label">${t.s2Label}</div>`);
  html = html.replace(/<h2>Four halvings, four cycles<\/h2>/, `<h2>${t.s2H2}</h2>`);
  html = html.replace(/<p>Each halving has historically preceded[^<]*<\/p>/, `<p>${t.s2P}</p>`);
  html = html.replace(/<th>Date<\/th>/, `<th>${t.thDate}</th>`);
  html = html.replace(/<th>Block<\/th>/, `<th>${t.thBlock}</th>`);
  html = html.replace(/<th>Reward<\/th>/, `<th>${t.thReward}</th>`);
  html = html.replace(/<th>Price at Halving<\/th>/, `<th>${t.thPrice}</th>`);
  html = html.replace(/<th>Cycle Peak<\/th>/, `<th>${t.thPeak}</th>`);
  html = html.replace(/Nov 28, 2012/, t.rNov2012);
  html = html.replace(/Jul 9, 2016/, t.rJul2016);
  html = html.replace(/May 11, 2020/, t.rMay2020);
  html = html.replace(/Apr 19, 2024/, t.rApr2024);
  html = html.replace(/\(Dec 2013\)/, t.rDec2013);
  html = html.replace(/\(Dec 2017\)/, t.rDec2017);
  html = html.replace(/\(Nov 2021\)/, t.rNov2021);
  html = html.replace(/<span class="next">Cycle ongoing <span class="badge">NOW<\/span><\/span>/, `<span class="next">${t.cycleOngoing} <span class="badge">${t.badgeNow}</span></span>`);

  // Section 3: Why it matters
  html = html.replace(/<div class="section-label">Why it matters<\/div>/, `<div class="section-label">${t.s3Label}</div>`);
  html = html.replace(/<h2>Supply, demand, and cycles<\/h2>/, `<h2>${t.s3H2}</h2>`);
  html = html.replace(/<p>Bitcoin's total supply is <strong>capped at 21 million coins[\s\S]*?have been mined\.<\/p>/, `<p>${t.s3P1}</p>`);
  html = html.replace(/<p>Unlike fiat currencies[\s\S]*?digital gold" thesis\.<\/p>/, `<p>${t.s3P2}</p>`);
  html = html.replace(/<p>After the 2024 halving[\s\S]*?before the halving\.<\/p>/, `<p>${t.s3Highlight}</p>`);
  html = html.replace(/<p>This compression of miner revenue[\s\S]*?cover costs\.<\/p>/, `<p>${t.s3P3}</p>`);

  // Section 4: About SpaceCat
  html = html.replace(/<div class="section-label">About SpaceCat<\/div>/, `<div class="section-label">${t.s4Label}</div>`);
  html = html.replace(/<h2>Why we built this tracker<\/h2>/, `<h2>${t.s4H2}</h2>`);
  html = html.replace(/<p>SpaceCat is a <strong>real-time Bitcoin halving dashboard<\/strong>[\s\S]*?single view\.<\/p>/, `<p>${t.s4P1}</p>`);
  html = html.replace(/<p>The tracker connects directly to <strong>mempool\.space<\/strong>[\s\S]*?accounts\.<\/p>/, `<p>${t.s4P2}</p>`);
  html = html.replace(/Questions or feedback\? Reach us at/, t.s4P3);
  html = html.replace(/>📦 Embed the countdown</, `>${t.embedH3}<`);
  html = html.replace(/<p>Add the live SpaceCat halving countdown to your own site with a single line:<\/p>/, `<p>${t.embedP}</p>`);
  html = html.replace(/title="Bitcoin Halving Countdown"/, `title="${t.embedTitleAttr}"`);
  html = html.replace(/Free to use, no attribution required \(but a link back is appreciated 💜\)\./, t.embedNote);

  // Feature info cards
  html = html.replace(/<div class="info-title">Live Blocks<\/div>/, `<div class="info-title">${t.fcard1Title}</div>`);
  html = html.replace(/<div class="info-body">New blocks appear in real-time[^<]*<\/div>/, `<div class="info-body">${t.fcard1Body}</div>`);
  html = html.replace(/<div class="info-title">Price History<\/div>/, `<div class="info-title">${t.fcard2Title}</div>`);
  html = html.replace(/<div class="info-body">BTC price chart with 1W, 3M[^<]*<\/div>/, `<div class="info-body">${t.fcard2Body}</div>`);
  html = html.replace(/<div class="info-title">Fear &amp; Greed<\/div>/, `<div class="info-title">${t.fcard3Title}</div>`);
  html = html.replace(/<div class="info-body">The Alternative\.me Fear[^<]*<\/div>/, `<div class="info-body">${t.fcard3Body}</div>`);
  html = html.replace(/<div class="info-title">SpaceCat<\/div>/, `<div class="info-title">${t.fcard4Title}</div>`);
  html = html.replace(/<div class="info-body">The cat travels from the Halving IV[^<]*<\/div>/, `<div class="info-body">${t.fcard4Body}</div>`);

  // CTA
  html = html.replace(/<h2>Track the next halving live<\/h2>/, `<h2>${t.ctaH2}</h2>`);
  html = html.replace(/<p>Real-time blocks, price history, countdown and cycle analytics — all in one place\.<\/p>/, `<p>${t.ctaP}</p>`);
  html = html.replace(/🚀 OPEN LIVE TRACKER/, t.ctaBtn);
  html = html.replace(/<a class="cta-btn" href="\/">/, `<a class="cta-btn" href="${t.liveLink}">`);

  // Footer
  html = html.replace(
    /<span>© 2025 <a href="\/">SpaceCat<\/a> — Bitcoin Halving Tracker<\/span>/,
    `<span>${t.footerCopy} <a href="${t.liveLink}">SpaceCat</a> — ${t.footerTagline}</span>`
  );
  html = html.replace(/Data: <a href="https:\/\/mempool\.space"/, `${t.footerData} <a href="https://mempool.space"`);

  return html;
}

for (const [lang, t] of Object.entries(T)) {
  const outDir = resolve(root, `public/${lang}/about`);
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
  const html = translate(lang, t);
  writeFileSync(resolve(outDir, 'index.html'), html);
  console.log(`  → public/${lang}/about/index.html generated`);
}

// Also inject hreflang into the English source if not present (idempotent)
let enHtml = readFileSync(SRC, 'utf8');
if (!enHtml.includes('hreflang="es" href="https://spacecat.academy/es/about/"')) {
  enHtml = enHtml.replace(
    /(<link rel="canonical" href="https:\/\/spacecat\.academy\/about\/" \/>)/,
    `$1\n${HREFLANG}`
  );
  writeFileSync(SRC, enHtml);
  console.log('  → public/about/index.html: hreflang alternates added');
}

console.log('Done.');
