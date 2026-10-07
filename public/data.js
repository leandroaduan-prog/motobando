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
I.chev='<path d="M6 9l6 6 6-6"/>';I.refresh='<path d="M20 11a8 8 0 1 0-2.3 5.7M20 5v6h-6"/>';
const ic=(n,c='')=>`<svg class="ic ${c}" viewBox="0 0 24 24" aria-hidden="true">${I[n]||''}</svg>`;

/* Ficha das motos por marca — dados de fábrica aproximados: [id, modelo, cilindrada cc, potência cv, tanque L, consumo médio km/L] */
const MOTO_MARCAS = {
 'Honda': [['cg160','CG 160 Titan',162.7,15.1,14,38],['fan160','CG 160 Fan',162.7,15.1,14,40],['start160','CG 160 Start',162.7,14.9,14,41],['cargo160','CG 160 Cargo',162.7,14.9,14,40],['bros160','NXR 160 Bros',162.7,14.7,12,35],['biz125','Biz 125',124.9,9.2,5.1,45],['pop110','Pop 110i',109.5,8.4,4.2,50],['elite125','Elite 125',124.9,9.3,5.5,44],['pcx160','PCX 160',156.9,15.8,8.1,40],['adv160','ADV 160',156.9,15.8,8.1,38],['sh150','SH 150i',149.3,14.5,7.5,38],['xre190','XRE 190',184.4,16.4,12,33],['cb300','CB 300F Twister',293,24.7,14.1,30],['xre300','XRE 300 Sahara',293,25.4,13.8,27],['cb500f','CB 500F / Hornet 500',471,50,17.1,25],['nx500','NX500 (ex-CB 500X)',471,50,17.5,25],['cbr500r','CBR 500R',471,50,17.1,25],['cb650r','CB 650R',649,95,15.4,19],['cbr650r','CBR 650R',649,95,15.4,19],['transalp','XL750 Transalp',755,92,16.9,21],['nc750x','NC 750X',745,58,14.1,28],['hornet750','CB 750 Hornet',755,92,15.2,21],['africatwin','CRF1100L Africa Twin',1084,102,18.8,17],['africatwinas','Africa Twin Adventure Sports',1084,102,24.8,17],['goldwing','GL1800 Gold Wing',1833,126,21.1,15]],
 'Yamaha': [['factor150','Factor 150',149,12.4,15.2,40],['fazer150','Fazer FZ15',149,12.4,14,38],['crosser150','Crosser 150',149,12.4,12,36],['fluo125','Fluo 125',125,8.2,5.5,45],['neo125','Neo 125',125,9.5,4.2,42],['nmax160','NMAX 160',155,15.1,7.1,38],['xmax250','XMAX 250',249,22.8,13,30],['lander250','Lander 250',249,20.7,13.6,28],['fz25','Fazer FZ25',249,21.3,14,30],['r3','YZF-R3',321,42,14,24],['mt03','MT-03',321,42,14,24],['mt07','MT-07',689,74,14,21],['tenere700','Ténéré 700',689,73,16,22],['xj6','XJ6 N / F',600,77,17.3,18],['mt09','MT-09',890,119,14,17],['tracer9','Tracer 9 GT',890,119,18,18],['superTenere','XT1200Z Super Ténéré',1199,112,23,16]],
 'Suzuki': [['yes125','Yes 125',124,11.5,13,40],['intruder125','Intruder 125',125,10.8,9.8,38],['dl650','V-Strom 650',645,71,20,21],['vstrom800','V-Strom 800DE',776,84,20,21],['vstrom1050','V-Strom 1050',1037,107,20,17],['gsx8s','GSX-8S',776,82,14,21],['gsxs750','GSX-S750',749,114,16,18],['hayabusa','Hayabusa',1340,190,20,14],['burgman400','Burgman 400',400,31,13.5,27],['boulevard','Boulevard M800',805,51,15.5,19]],
 'Kawasaki': [['ninja400','Ninja 400',399,45,14,23],['z400','Z400',399,45,14,23],['versysx300','Versys-X 300',296,40,17,26],['z650','Z650',649,68,15,21],['ninja650','Ninja 650',649,68,15,21],['versys650','Versys 650',649,66,21,21],['vulcan650','Vulcan S 650',649,61,14,21],['z900','Z900',948,125,17,17],['versys1000','Versys 1000',1043,120,21,16],['ninja1000sx','Ninja 1000SX',1043,142,19,16],['klr650','KLR 650',652,40,23,22]],
 'BMW': [['g310r','G 310 R',313,34,11,28],['g310gs','G 310 GS',313,34,11,28],['f750gs','F 750 GS',853,77,15,21],['f850gs','F 850 GS / F 900 GS',895,105,15,19],['f900r','F 900 R / XR',895,105,13,19],['s1000xr','S 1000 XR',999,170,20,15],['gs1250','R 1250 GS',1254,136,20,18],['gs1250a','R 1250 GS Adventure',1254,136,30,18],['gs1300','R 1300 GS',1300,145,19,18],['rt1250','R 1250 RT',1254,136,25,18],['rninet','R nineT',1170,109,17,17],['k1600','K 1600 GT',1649,160,26.5,15]],
 'Triumph': [['speed400','Speed 400',398,40,13,28],['scrambler400','Scrambler 400 X',398,40,13,27],['trident660','Trident 660',660,81,14,21],['tiger660','Tiger Sport 660',660,81,17.2,21],['street_twin','Speed Twin 900',900,65,12,21],['bonneville','Bonneville T120',1200,80,14.5,19],['tiger850','Tiger 850 Sport',888,85,20,20],['tiger900','Tiger 900',888,108,20,19],['tiger1200','Tiger 1200',1160,150,20,16],['rocket3','Rocket 3',2458,182,18,13]],
 'Ducati': [['scrambler','Scrambler 800',803,73,13.5,19],['monster','Monster 937',937,111,14,18],['multistrada950','Multistrada V2',937,113,20,18],['multistrada','Multistrada V4',1158,170,22,15],['desertx','DesertX',937,110,21,18],['diavel','Diavel V4',1158,168,20,14],['panigale','Panigale V4',1103,215,17,12]],
 'Harley-Davidson': [['sportster','Sportster S',1252,121,11.8,17],['nightster','Nightster 975',975,90,11.7,18],['fatboy','Fat Boy 114',1868,94,18.9,17],['heritage','Heritage Classic 114',1868,94,18.9,17],['streetbob','Street Bob 114',1868,94,13.2,17],['lowrider','Low Rider S',1923,103,18.9,16],['streetglide','Street Glide',1923,105,22.7,16],['roadglide','Road Glide',1923,105,22.7,16],['panamerica','Pan America 1250',1252,150,21.2,16]],
 'KTM': [['duke200','200 Duke',199.5,25,13.5,30],['duke390','390 Duke / Adventure',373,44,14.5,25],['adv390','390 Adventure',373,44,14.5,25],['duke790','790 Duke',799,105,14,19],['adv890','890 Adventure',889,105,20,18],['adv1290','1290 Super Adventure',1301,160,23,15]],
 'Royal Enfield': [['hunter350','Hunter 350',349,20.2,13,32],['meteor350','Meteor 350',349,20.2,15,30],['classic350','Classic 350',349,20.2,13,30],['bullet350','Bullet 350',349,20.2,13,30],['scram411','Scram 411',411,24.3,15,28],['him411','Himalayan 411',411,24.3,15,27],['him450','Himalayan 450',452,40,17,27],['guerrilla450','Guerrilla 450',452,40,11,27],['interceptor650','Interceptor 650',648,47,13.7,23],['ct650','Continental GT 650',648,47,12.5,23],['supermeteor650','Super Meteor 650',648,47,15.7,22]],
 'Dafra': [['citycom300','Citycom 300i',278,22,10,30],['nh190','NH 190',183,17,13,33],['apache200','Apache RTR 200',197.8,20.5,12,32],['cruisym150','Cruisym 150',150,13.6,7,38]],
 'Shineray': [['jet125','Jet 125',125,9.5,5,45],['worker125','Worker 125',125,10,11,40],['xy150','XY 150 Jet',150,11.5,12,38],['shi175','SHI 175',175,13,13,35],['storm200','Storm 200',200,15,13,32]],
 'Haojue': [['dk150','DK 150',149,12,13,40],['chopper150','Chopper Road 150',149,12,14,38],['nk150','NK 150',149,12,13,40],['dr160','DR 160',162,14,12,36],['master250','Master Ride 250',250,19,15,30]],
 'Bajaj': [['dominar160','Dominar 160',160,17,12,35],['dominar200','Dominar 200',199.5,24.5,12,32],['dominar250','Dominar 250',248.8,27,13,30],['dominar400','Dominar 400',373,40,13,27]],
 'CFMoto': [['nk250','250NK',249,27,12,30],['nk450','450NK',449,48,14,25],['mt450','450MT',449,44,17.5,25],['mt800','800MT',799,95,19,20],['clc450','450CL-C',449,44,13,25]],
 'Voge': [['ds525x','525DSX',494,47,19,24],['300rally','300 Rally',292,29,14,28],['ac525x','525ACX',494,47,15,24]],
 'Benelli': [['trk251','TRK 251',249,26,18,30],['trk502','TRK 502 / 502X',500,47,20,23],['leoncino','Leoncino 500',500,47,13.5,23],['tnt600','TNT 600i',600,82,16,19]],
 'Husqvarna': [['svartpilen401','Svartpilen 401',399,45,13.5,25],['vitpilen401','Vitpilen 401',399,45,13.5,25],['norden901','Norden 901',889,105,19,18]],
 'Indian': [['scout','Scout',1133,101,12.5,17],['chief','Chief',1890,101,15.1,16],['ftr','FTR 1200',1203,122,13,17],['roadmaster','Roadmaster',1890,101,20.8,15]],
 'Aprilia / Moto Guzzi': [['tuareg660','Aprilia Tuareg 660',659,80,18,22],['rs660','Aprilia RS 660',659,100,15,20],['v85tt','Moto Guzzi V85 TT',853,76,23,20],['v7','Moto Guzzi V7',853,65,21,21],['stelvio','Moto Guzzi Stelvio',1042,115,21,17]],
 'MV Agusta': [['brutale800','Brutale 800',798,140,16.5,16],['lucky','Lucky Explorer 9.5',931,123,20,17]],
 'Outra': [['outra','Outra moto (vou informar)',0,0,15,25]]
};
const MOTOS = {};
for (const [marca, lista] of Object.entries(MOTO_MARCAS)) for (const [id, modelo, cc, cv, tanque, kml] of lista) MOTOS[id] = { n: (marca === 'Outra' || marca.includes('/')) ? modelo : marca + ' ' + modelo, modelo, marca, cc, cv, tanque, kml };
const marcaDe = id => (MOTOS[id] || MOTOS.outra).marca;
// seletor em 2 etapas: primeiro a marca, depois o modelo
function motoPickerHTML(pfx, model) {
  const m = marcaDe(model || 'nx500');
  return `<div class="field"><label for="${pfx}Marca">Marca</label><select class="input" id="${pfx}Marca">${Object.keys(MOTO_MARCAS).map(b => `<option value="${b}" ${b === m ? 'selected' : ''}>${b}</option>`).join('')}</select></div>
   <div class="field"><label for="${pfx}Modelo">Modelo</label><select class="input" id="${pfx}Modelo">${MOTO_MARCAS[m].map(([id, modelo]) => `<option value="${id}" ${id === model ? 'selected' : ''}>${modelo}</option>`).join('')}</select></div>`;
}
function bindMotoPicker(pfx, onChange) {
  const mb = document.getElementById(pfx + 'Marca'), mm = document.getElementById(pfx + 'Modelo'); if (!mb || !mm) return;
  mb.onchange = () => { const lista = MOTO_MARCAS[mb.value]; mm.innerHTML = lista.map(([id, modelo]) => `<option value="${id}">${modelo}</option>`).join(''); mm.focus(); onChange && onChange(lista[0][0], true); };
  mm.onchange = () => onChange && onChange(mm.value, false);
}
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
