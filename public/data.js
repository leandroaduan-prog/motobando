const I={
 pin:'<path d="M12 22s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12z"/><circle cx="12" cy="10" r="2.5"/>',
 fuel:'<path d="M4 21V5a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v16M3 21h13M15 9h2a2 2 0 0 1 2 2v6a1.5 1.5 0 0 0 3 0V8l-3-3"/><path d="M7 8h5"/>',
 food:'<path d="M7 3v8M5 3v5a2 2 0 0 0 4 0V3M7 11v10M17 3c-2 1-3 4-3 7h3v11"/>',
 bed:'<path d="M3 18V6M3 14h18v4M21 14v-2a3 3 0 0 0-3-3h-7v5"/><circle cx="7" cy="11" r="1.6"/>',
 camera:'<path d="M4 8h3l2-2.5h6L17 8h3v11H4z"/><circle cx="12" cy="13" r="3.2"/>',
 flag:'<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>',
 trail:'<path d="M3 20l6-10 4 6 3-4 5 8z"/>',
 wrench:'<path d="M15 4a4 4 0 0 0-3.8 5.2L4 16.4V20h3.6l7.2-7.2A4 4 0 0 0 20 9l-2.5 2.5-3-3L17 6a4 4 0 0 0-2-2z"/>',
 star:'<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
 map:'<path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2zM9 4v14M15 6v14"/>',
 route:'<circle cx="6" cy="18" r="2"/><circle cx="18" cy="6" r="2"/><path d="M8 18h7a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h7"/>',
 moto:'<circle cx="5.5" cy="16.5" r="3.5"/><circle cx="18.5" cy="16.5" r="3.5"/><path d="M5.5 16.5l4-6h5l4 6M12 10.5l-2-4H7M14.5 10.5l1.5-3h3"/>',
 wallet:'<path d="M3 7h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM3 7l12-3v3"/><circle cx="16.5" cy="13.5" r="1.3"/>',
 users:'<circle cx="9" cy="8" r="3.2"/><path d="M3 20a6 6 0 0 1 12 0M16 4.5a3 3 0 0 1 0 6M18 14a5 5 0 0 1 3 6"/>',
 check:'<path d="M5 12.5l4.5 4.5L19 7.5"/>',
 rain:'<path d="M7 15a4.5 4.5 0 1 1 1.3-8.8A5.5 5.5 0 0 1 18.5 9 3.5 3.5 0 0 1 18 15z"/><path d="M8 18l-1 2.5M12.5 18l-1 2.5M17 18l-1 2.5"/>',
 play:'<path d="M7 4.5v15l12-7.5z" fill="currentColor" stroke="none"/>',
 pause:'<path d="M7 4h3.5v16H7zM13.5 4H17v16h-3.5z" fill="currentColor" stroke="none"/>',
 plus:'<path d="M12 5v14M5 12h14"/>', minus:'<path d="M5 12h14"/>', x:'<path d="M6 6l12 12M18 6L6 18"/>',
 crown:'<path d="M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5z"/>',
 copy:'<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>',
 phone:'<path d="M5 3h4l2 5-2.5 1.5a11 11 0 0 0 6 6L16 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 5a2 2 0 0 1 2-2"/>',
 target:'<circle cx="12" cy="12" r="7"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/><circle cx="12" cy="12" r="2"/>',
 expand:'<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',
 trash:'<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
 alert:'<path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18v.5"/>',
 list:'<path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01"/>',
 tool:'<path d="M14 6l4 4M3 21l7-7M9 3l12 12-3 3L6 6z"/>',
 tire:'<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="3.5"/><path d="M12 3.5v5M12 15.5v5M3.5 12h5M15.5 12h5"/>',
 heart:'<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/><path d="M8 11h2l1-2 2 4 1-2h2"/>',
 search:'<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.2-4.2"/>',
 wa:'<path d="M4 20l1.3-4A8 8 0 1 1 8 19z"/><path d="M9.2 9.2c0 3 2.6 5.6 5.6 5.6l1-1.5-2-1-.9.7a4 4 0 0 1-1.9-1.9l.7-.9-1-2z"/>',
 helmet:'<path d="M4 15a8 8 0 0 1 16 0v3H4z"/><path d="M4 15h9l2-4h5"/>',
 hand:'<path d="M8 12V5.5a1.5 1.5 0 0 1 3 0V11M11 10V4.5a1.5 1.5 0 0 1 3 0V11M14 10V5.5a1.5 1.5 0 0 1 3 0V13M8 11.5a1.5 1.5 0 0 0-3 0V14a7 7 0 0 0 7 7h1a6 6 0 0 0 6-6v-3.5"/>',
 book:'<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2zM4 19V5M8 7h7"/>'
};
I.up='<path d="M12 19V5M6 11l6-6 6 6"/>';I.down='<path d="M12 5v14M6 13l6 6 6-6"/>';I.gps='<circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="8"/><path d="M12 1v3M12 20v3M1 12h3M20 12h3"/>';
I.logout='<path d="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h11"/>';I.share='<circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="M8.2 10.8l7.6-4.4M8.2 13.2l7.6 4.4"/>';
I.refresh='<path d="M20 11a8 8 0 1 0-2.3 5.7M20 5v6h-6"/>';
const ic=(n,c='')=>`<svg class="ic ${c}" viewBox="0 0 24 24" aria-hidden="true">${I[n]||''}</svg>`;

/* Ficha das motos — dados de fábrica aproximados (cilindrada cc, potência cv, tanque L, consumo médio km/L) */
const MOTOS={
 cg160:{n:'Honda CG 160 Titan',cc:162.7,cv:15.1,tanque:14,kml:38},
 fan160:{n:'Honda CG 160 Fan',cc:162.7,cv:15.1,tanque:14,kml:40},
 bros160:{n:'Honda NXR 160 Bros',cc:162.7,cv:14.7,tanque:12,kml:35},
 factor150:{n:'Yamaha Factor 150',cc:149,cv:12.4,tanque:15.2,kml:40},
 fazer150:{n:'Yamaha Fazer FZ15',cc:149,cv:12.4,tanque:14,kml:38},
 crosser150:{n:'Yamaha Crosser 150',cc:149,cv:12.4,tanque:12,kml:36},
 lander250:{n:'Yamaha Lander 250',cc:249,cv:20.7,tanque:13.6,kml:28},
 fz25:{n:'Yamaha Fazer FZ25',cc:249,cv:21.3,tanque:14,kml:30},
 cb300:{n:'Honda CB 300F Twister',cc:293,cv:24.7,tanque:14.1,kml:30},
 xre190:{n:'Honda XRE 190',cc:184,cv:16.4,tanque:12,kml:33},
 xre300:{n:'Honda XRE 300 Sahara',cc:293,cv:25.4,tanque:13.8,kml:27},
 mt03:{n:'Yamaha MT-03',cc:321,cv:42,tanque:14,kml:24},
 ninja400:{n:'Kawasaki Ninja 400',cc:399,cv:45,tanque:14,kml:23},
 g310gs:{n:'BMW G 310 GS',cc:313,cv:34,tanque:11,kml:28},
 him411:{n:'Royal Enfield Himalayan 411',cc:411,cv:24.3,tanque:15,kml:27},
 him450:{n:'Royal Enfield Himalayan 450',cc:452,cv:40,tanque:17,kml:27},
 meteor350:{n:'Royal Enfield Meteor 350',cc:349,cv:20.2,tanque:15,kml:30},
 classic350:{n:'Royal Enfield Classic 350',cc:349,cv:20.2,tanque:13,kml:30},
 nx500:{n:'Honda NX500 (ex-CB 500X)',cc:471,cv:50,tanque:17.5,kml:25},
 cb500f:{n:'Honda CB 500F / Hornet 500',cc:471,cv:50,tanque:17.1,kml:25},
 cb650r:{n:'Honda CB 650R',cc:649,cv:95,tanque:15.4,kml:19},
 versys650:{n:'Kawasaki Versys 650',cc:649,cv:66,tanque:21,kml:21},
 z650:{n:'Kawasaki Z650',cc:649,cv:68,tanque:15,kml:21},
 mt07:{n:'Yamaha MT-07',cc:689,cv:74,tanque:14,kml:21},
 tenere700:{n:'Yamaha Ténéré 700',cc:689,cv:73,tanque:16,kml:22},
 tracer9:{n:'Yamaha Tracer 9 GT',cc:890,cv:119,tanque:18,kml:18},
 transalp:{n:'Honda XL750 Transalp',cc:755,cv:92,tanque:16.9,kml:21},
 africatwin:{n:'Honda CRF1100L Africa Twin',cc:1084,cv:102,tanque:18.8,kml:17},
 f850gs:{n:'BMW F 850 GS / F 900 GS',cc:895,cv:105,tanque:15,kml:19},
 gs1250:{n:'BMW R 1250 GS',cc:1254,cv:136,tanque:20,kml:18},
 gs1300:{n:'BMW R 1300 GS',cc:1300,cv:145,tanque:19,kml:18},
 tiger900:{n:'Triumph Tiger 900',cc:888,cv:108,tanque:20,kml:19},
 tiger1200:{n:'Triumph Tiger 1200',cc:1160,cv:150,tanque:20,kml:16},
 street_twin:{n:'Triumph Speed Twin 900',cc:900,cv:65,tanque:12,kml:21},
 multistrada:{n:'Ducati Multistrada V4',cc:1158,cv:170,tanque:22,kml:15},
 scrambler:{n:'Ducati Scrambler 800',cc:803,cv:73,tanque:13.5,kml:19},
 duke390:{n:'KTM 390 Duke / Adventure',cc:373,cv:44,tanque:14.5,kml:25},
 adv890:{n:'KTM 890 Adventure',cc:889,cv:105,tanque:20,kml:18},
 fatboy:{n:'Harley-Davidson Fat Boy 114',cc:1868,cv:94,tanque:18.9,kml:17},
 streetglide:{n:'Harley-Davidson Street Glide',cc:1923,cv:105,tanque:22.7,kml:16},
 sportster:{n:'Harley-Davidson Sportster S',cc:1252,cv:121,tanque:11.8,kml:17},
 pcx160:{n:'Honda PCX 160',cc:156.9,cv:15.8,tanque:8.1,kml:40},
 nmax160:{n:'Yamaha NMAX 160',cc:155,cv:15.1,tanque:7.1,kml:38},
 xmax250:{n:'Yamaha XMAX 250',cc:249,cv:22.8,tanque:13,kml:30},
 adv160:{n:'Honda ADV 160',cc:156.9,cv:15.8,tanque:8.1,kml:38},
 outra:{n:'Outra moto (vou informar)',cc:0,cv:0,tanque:15,kml:25}
};
const CAT={
 turismo:{n:'Turismo',icon:'camera',color:'#2563EB'},
 posto:{n:'Postos',icon:'fuel',color:'#0F766E'},
 hosp:{n:'Hospedagem',icon:'bed',color:'#7C3AED'},
 comida:{n:'Comida',icon:'food',color:'#C2410C'},
 trilha:{n:'Trilhas',icon:'trail',color:'#15803D'},
 apoio:{n:'Apoio mecânico',short:'Apoio',icon:'wrench',color:'#475569'}
};
const STOPTYPES={saida:{n:'Saída',icon:'flag',min:0},parada:{n:'Parada',icon:'star',min:20},abastecer:{n:'Abastecer',icon:'fuel',min:15},almoco:{n:'Almoço',icon:'food',min:60},foto:{n:'Foto / mirante',icon:'camera',min:20},pernoite:{n:'Pernoite / destino',icon:'bed',min:0}};
const SOSTYPES={pane:{n:'Pane mecânica',icon:'tool'},pneu:{n:'Pneu furado',icon:'tire'},seca:{n:'Pane seca',icon:'fuel'},acidente:{n:'Acidente',icon:'heart'}};
const COLORS=['#1F7A4D','#2F6FD6','#C2410C','#7C3AED','#A16207','#0891B2','#DB2777','#4D7C0F','#B91C1C','#0F766E','#9333EA','#EA580C'];

/* Viagens de exemplo: rotas clássicas de moto (coordenadas reais das cidades). Tipo: s=saída, p=parada, a=almoço, f=foto, d=destino */
const EXEMPLOS = [
 { n: 'Serra da Mantiqueira', st: [['Atibaia', -23.117, -46.550, 's'], ['Extrema', -22.855, -46.318, 'p'], ['Monte Verde', -22.862, -46.040, 'a'], ['Campos do Jordão', -22.739, -45.591, 'd']] },
 { n: 'Circuito das Águas', st: [['Atibaia', -23.117, -46.550, 's'], ['Bragança Paulista', -22.952, -46.542, 'p'], ['Socorro', -22.591, -46.529, 'a'], ['Águas de Lindóia', -22.476, -46.633, 'f'], ['Serra Negra', -22.612, -46.700, 'd']] },
 { n: 'Litoral Norte pela Tamoios', st: [['Atibaia', -23.117, -46.550, 's'], ['São José dos Campos', -23.179, -45.887, 'p'], ['Caraguatatuba', -23.620, -45.413, 'a'], ['Ubatuba', -23.433, -45.071, 'd']] },
 { n: 'Cunha e Paraty', st: [['Atibaia', -23.117, -46.550, 's'], ['Taubaté', -23.026, -45.555, 'p'], ['Cunha', -23.074, -44.960, 'a'], ['Paraty', -23.219, -44.713, 'd']] },
 { n: 'São Bento do Sapucaí e Gonçalves', st: [['Atibaia', -23.117, -46.550, 's'], ['Cambuí', -22.612, -46.057, 'p'], ['Gonçalves', -22.659, -45.855, 'a'], ['São Bento do Sapucaí', -22.689, -45.731, 'd']] },
 { n: 'Joanópolis e Piracaia', st: [['Atibaia', -23.117, -46.550, 's'], ['Piracaia', -23.054, -46.358, 'p'], ['Joanópolis', -22.930, -46.275, 'a'], ['Bragança Paulista', -22.952, -46.542, 'd']] },
 { n: 'Ilhabela', st: [['Atibaia', -23.117, -46.550, 's'], ['São José dos Campos', -23.179, -45.887, 'p'], ['São Sebastião (balsa)', -23.760, -45.410, 'a'], ['Ilhabela', -23.778, -45.358, 'd']] },
 { n: 'Brotas', st: [['Atibaia', -23.117, -46.550, 's'], ['Campinas', -22.906, -47.061, 'p'], ['Holambra', -22.640, -47.055, 'f'], ['Brotas', -22.284, -48.127, 'd']] },
 { n: 'Poços de Caldas', st: [['Atibaia', -23.117, -46.550, 's'], ['Bragança Paulista', -22.952, -46.542, 'p'], ['Águas da Prata', -21.937, -46.716, 'a'], ['Poços de Caldas', -21.788, -46.561, 'd']] },
 { n: 'Capitólio', st: [['Atibaia', -23.117, -46.550, 's'], ['Poços de Caldas', -21.788, -46.561, 'a'], ['Passos', -20.719, -46.610, 'p'], ['Capitólio', -20.615, -46.050, 'd']] },
 { n: 'Serra da Canastra', st: [['Atibaia', -23.117, -46.550, 's'], ['Poços de Caldas', -21.788, -46.561, 'a'], ['Passos', -20.719, -46.610, 'p'], ['São Roque de Minas', -20.249, -46.366, 'd']] },
 { n: 'São Luiz do Paraitinga', st: [['Atibaia', -23.117, -46.550, 's'], ['Taubaté', -23.026, -45.555, 'p'], ['São Luiz do Paraitinga', -23.222, -45.310, 'd']] },
 { n: 'Serra do Rio do Rastro', st: [['Florianópolis', -27.595, -48.548, 's'], ['Lauro Müller', -28.393, -49.397, 'a'], ['Bom Jardim da Serra', -28.337, -49.627, 'f'], ['Urubici', -28.015, -49.592, 'd']] },
 { n: 'Rota do Vinho e Serra Gaúcha', st: [['Bento Gonçalves', -29.171, -51.519, 's'], ['Garibaldi', -29.256, -51.534, 'p'], ['Gramado', -29.379, -50.874, 'a'], ['Canela', -29.366, -50.816, 'd']] },
 { n: 'Chapada dos Veadeiros', st: [['Brasília', -15.794, -47.882, 's'], ['Alto Paraíso de Goiás', -14.132, -47.510, 'a'], ['São Jorge', -14.172, -47.817, 'd']] }
];
const EX_TYPE = { s: 'saida', p: 'parada', a: 'almoco', f: 'foto', d: 'pernoite' };
// datas: um sábado por mês a partir do mês que vem (15 viagens = ~1 por mês; 10 viagens solo = a cada 5 semanas)
function exemploDatas(n, everyDays) {
  const d = new Date(); d.setDate(d.getDate() + 14); d.setDate(d.getDate() + ((6 - d.getDay() + 7) % 7));
  return Array.from({ length: n }, (_, i) => { const x = new Date(d.getTime() + i * everyDays * 864e5); x.setDate(x.getDate() + ((6 - x.getDay() + 7) % 7)); return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`; });
}
