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
 home:'<path d="M4 11l8-7 8 7M6 9.5V20h12V9.5"/><path d="M10 20v-5h4v5"/>', chat:'<path d="M4 5h16v11H9l-5 4z"/><path d="M8 9h8M8 12h5"/>', drop:'<path d="M12 3.5c3 4 6 7.2 6 10.5a6 6 0 0 1-12 0c0-3.3 3-6.5 6-10.5z"/>', user:'<circle cx="12" cy="8" r="3.6"/><path d="M5 20a7 7 0 0 1 14 0"/>',
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
 'Agrale': [['agraledakar300','Dakar 30.0',190,26,14,18],['agraleelefant275','Elefant 27.5',190,26,13,18],['agralesxt275','SXT 27.5',190,26,12.5,19]],
 'AJS': [['ajscadwell125','Cadwell 125',124,10,16,38],['ajstempestscramble','Tempest Scrambler 125',124,9.5,13,37]],
 'Amazonas': [['amazonasame1600cus','AME 1600 Custom',1584,54,24,11]],
 'Aprilia': [['apriliars457','RS 457',457,47.6,13,25],['rs660','RS 660',659,100,15,20],['apriliarsv4','RSV4',1099,217,17.9,14],['tuareg660','Tuareg 660',659,80,18,23],['apriliatuonov4','Tuono V4',1077,175,18.5,13]],
 'Bajaj': [['bajajavenger220cru','Avenger 220 Cruise',220,19,13,35],['bajajchetak','Chetak',0,5.5,120,1,{"bat":3.2,"auton":120,"max":120}],['dominar160','Dominar 160',160,15.5,12,42],['dominar200','Dominar 200',199,24.5,12,35],['dominar250','Dominar 250',248.8,27,13,30],['dominar400','Dominar 400',373,40,13,28],['bajajpulsarns200','Pulsar NS200',199,24.5,12,35]],
 'Benelli': [['benelliimperiale40','Imperiale 400',374,21,12,30],['leoncino','Leoncino 500',500,47.6,12.7,23],['tnt600','TNT 600i',600,82,16,19],['trk251','TRK 251',249,26,18,30],['trk502','TRK 502',500,47.6,20,22],['benellitrk502x','TRK 502X',500,47.6,20,22],['benellitrk702','TRK 702',698,70,20,21],['benellitrk702x','TRK 702X',698,70,20,21]],
 'Beta Motor': [['betarr3002t','RR 300 2T',293,40,9.5,14],['betarr3504t','RR 350 4T',349,38,9,18],['betaxtrainer300','Xtrainer 300',293,36,8.5,15]],
 'Bimota': [['bimotakb4','KB4',1043,142,19.5,16],['bimotatesih2','Tesi H2',998,231,17,12]],
 'BMW Motorrad': [['bmwc400gt','C 400 GT',350,34,12.8,28],['bmwc400x','C 400 X',350,34,12.8,28],['bmwce04','CE 04',0,42,130,1,{"bat":8.9,"auton":130,"max":130}],['f750gs','F 750 GS',853,77,15,21],['bmwf800gs','F 800 GS',895,87,15,24],['f850gs','F 850 GS',853,80,15,22],['bmwf900gs','F 900 GS',895,105,14.5,22],['f900r','F 900 R',895,85,13,23],['g310gs','G 310 GS',313,34,11.5,30],['g310r','G 310 R',313,34,11,32],['k1600','K 1600 GTL',1649,160,26.5,16],['rninet','R 12 nineT',1170,109,16,19],['bmwr18','R 18',1802,91,16,17],['gs1250','R 1250 GS',1254,136,20,18],['gs1250a','R 1250 GS Adventure',1254,136,30,18],['rt1250','R 1250 RT',1254,136,25,18],['gs1300','R 1300 GS',1300,145,19,20],['bmws1000rr','S 1000 RR',999,210,16.5,15],['s1000xr','S 1000 XR',999,170,20,15]],
 'Brough Superior': [['broughlawrence','Lawrence',997,102,17,16],['broughss100','SS100',997,100,17,16]],
 'BSA': [['bsagoldstar650','Gold Star 650',652,45,12,25]],
 'Buell': [['buellhammerhead119','Hammerhead 1190',1190,185,17,14],['buelllightningxb12','Lightning XB12S',1203,103,14.5,18]],
 'Bultaco': [['bultacopursang250','Pursang 250',246,34,9.5,14],['bultacosherpat350','Sherpa T 350',326,21,6,20]],
 'Can-Am': [['canamryker900','Ryker 900',900,82,20,16],['canamspyderf3','Spyder F3',1330,115,27,15]],
 'CFMoto': [['nk250','250NK',249,27,12,30],['cfmoto300nk','300NK',292,27.5,12.5,31],['clc450','450CL-C',449,44,13,25],['mt450','450MT',449,44,17.5,24],['nk450','450NK',449,48,14,25],['cfmoto450sr','450SR',449,46,14,22],['cfmoto700clx','700CL-X',693,70,13,20],['mt800','800MT',799,95,19,18]],
 'Dafra Motos': [['apache200','Apache RTR 200',197,21,12,35],['citycom300','Citycom 300i',278,27.6,10,26],['dafracitycomhd300','Citycom HD 300',278,27.6,10,26],['cruisym150','Cruisym 150',149,12.5,6,38],['dafracruisym300','Cruisym 300',278,27,12,26],['dafrahorizon150','Horizon 150',149,12.8,14,35],['dafrakansas150','Kansas 150',149,13.1,11.5,32],['dafranext250','Next 250',278,27,14,28],['dafranext300','Next 300',278,27,14,28],['nh190','NH 190',183,18,11,35],['dafranh300','NH 300',278,25.2,11,28],['dafraspeed150','Speed 150',149,11,15.7,30],['dafrazig110','Zig 110',107,8,5,45]],
 'Ducati': [['desertx','DesertX',937,110,21,18],['diavel','Diavel V4',1158,168,20,15],['ducatihypermotard6','Hypermotard 698 Mono',659,77.5,12,20],['ducatihypermotard9','Hypermotard 950',937,114,14.5,19],['monster','Monster 937',937,111,14,19],['multistrada950','Multistrada V2',937,113,20,17],['multistrada','Multistrada V4',1158,170,22,15],['ducatimultistradav','Multistrada V4 Rally',1158,170,30,15],['ducatipanigalev2','Panigale V2',955,155,17,16],['panigale','Panigale V4',1103,215.5,17,13],['scrambler','Scrambler 800',803,73,13.5,19],['ducatistreetfighte','Streetfighter V4',1103,208,16.5,13]],
 'Energica': [['energicaego','Ego',0,171,200,1,{"bat":21.5,"auton":200,"max":400}],['energicaexperia','Experia',0,102,220,1,{"bat":22.5,"auton":220,"max":420}]],
 'Fantic Motor': [['fanticcaballero500','Caballero 500',449,40,12,24],['fanticcaballero700','Caballero 700',689,75,14,22]],
 'FB Mondial': [['fbhps125','HPS 125',124,13.6,9.5,40],['fbhps300','HPS 300',249,23,9.5,30]],
 'GasGas': [['gasgasec300','EC 300',293,54,8.5,14],['gasgases700','ES 700',692,74,13.5,23],['gasgassm700','SM 700',692,74,13.5,23]],
 'Haojue': [['chopper150','Chopper Road 150',149,11.2,9.5,38],['dk150','DK 150',149,12,13,40],['haojuedk160','DK 160',162,15,12.5,42],['dr160','DR 160',162,15,12,45],['haojuelindy125','Lindy 125',124,8.4,5.8,35],['haojuemaster150','Master 150',149,12,10.7,38],['master250','Master Ride 250',250,19,15,30],['nk150','NK 150',149,12,12.2,40]],
 'Harley-Davidson': [['harleydavidsonbrea','Breakout 117',1923,102,18.9,18],['harleydavidsonfatb','Fat Bob 114',1868,93,13.6,18],['fatboy','Fat Boy 114',1868,94,18.9,18],['heritage','Heritage Classic 114',1868,94,18.9,18],['harleydavidsoniron','Iron 883',883,52,12.5,20],['lowrider','Low Rider S',1923,105,18.9,18],['harleydavidsonlowr','Low Rider ST',1923,105,18.9,18],['nightster','Nightster',975,89,11.7,20],['panamerica','Pan America 1250',1252,150,21.2,17],['roadglide','Road Glide',1923,105,22.7,16],['harleydavidsonroad','Road King Special',1868,93,22.7,16],['sportster','Sportster S',1252,121,11.8,19],['streetbob','Street Bob 114',1868,94,13.2,19],['streetglide','Street Glide',1923,105,22.7,16],['harleydavidsonultr','Ultra Limited',1868,93,22.7,16]],
 'Hero MotoCorp': [['herokarizmaxmr210','Karizma XMR 210',210,25.5,11,35],['herosplendorplus','Splendor Plus',97,8,9.8,65],['heroxpulse2004v','Xpulse 200 4V',199,19.1,13,38]],
 'Honda': [['hondaadv150','ADV 150',149,13.2,8,50],['adv160','ADV 160',156.9,15.8,8.1,38],['africatwin','Africa Twin CRF 1100L',1084,99.3,18.8,19],['africatwinas','Africa Twin CRF 1100L Adventure Sports',1084,99.3,24.8,19],['hondabiz110i','Biz 110i',109,8.33,5.1,52],['biz125','Biz 125',124.9,9.2,5.1,45],['cb300','CB 300F Twister',293.5,24.7,14.1,35],['cb500f','CB 500F',471,50.2,17.7,27],['hondacb600fhornet','CB 600F Hornet',599,102,19,17],['cb650r','CB 650R',649,88.4,15.4,20],['hornet750','CB 750 Hornet',755,92,15.2,21],['hondacb1000r','CB 1000R',998,142.8,16.2,16],['cbr500r','CBR 500R',471,50,17.1,25],['hondacbr600rr','CBR 600RR',599,121,18,16],['cbr650r','CBR 650R',649,88.4,15.4,20],['hondacbr1000rrrfir','CBR 1000RR-R Fireblade SP',999,216,16.1,14],['hondacbx250twister','CBX 250 Twister',249,24,16.5,27],['hondacbx750f7galo','CBX 750F (7 Galo)',747,82,22,14],['cargo160','CG 160 Cargo',162.7,14.9,14,40],['fan160','CG 160 Fan',162.7,15.1,16.1,40],['start160','CG 160 Start',162.7,14.9,14,41],['cg160','CG 160 Titan',162.7,15.1,16.1,40],['hondacrf250f','CRF 250F',249.5,22.2,6,25],['elite125','Elite 125',124,9.34,6,45],['hondaforza350','Forza 350',330,29.2,11.7,30],['goldwing','Gold Wing GL 1800',1833,126,21.1,16],['nc750x','NC 750X',745,58.6,14.1,30],['nx500','NX500',471,50.2,17.7,27],['hondanx400falcon','NX 400 Falcon',397,30.6,15.3,23],['bros160','NXR 160 Bros',162.7,14.7,12,40],['pcx160','PCX 160',156.9,16,8,44],['pop110','Pop 110i',109.1,7.9,4.2,55],['hondarebel500','Rebel 500',471,46,11.2,27],['hondarebel1100','Rebel 1100',1084,87,13.6,20],['sh150','SH 150i',149.3,14.5,7.5,38],['hondashadow750','Shadow 750',745,45.5,14.6,21],['transalp','Transalp XL750',755,92,16.9,23],['hondaxadv750','X-ADV 750',745,58.6,13.2,28],['hondaxr250tornado','XR 250 Tornado',249,23.3,11.5,26],['hondaxr300ltornado','XR 300L Tornado',293.5,24.8,13.8,30],['xre190','XRE 190',184.4,16.4,13.5,35],['xre300','XRE 300',291.6,25.6,13.8,28]],
 'Husqvarna': [['husqvarna701enduro','701 Enduro',693,74,13,23],['husqvarna701superm','701 Supermoto',693,74,13,23],['norden901','Norden 901',889,105,19,22],['svartpilen401','Svartpilen 401',399,45,13,29],['husqvarnate300','TE 300',293,54,8.5,14],['vitpilen401','Vitpilen 401',399,45,13,29]],
 'Hyosung': [['hyosungaquilagv300','Aquila GV 300S',296,30,12.5,27],['hyosungcometgt250','Comet GT 250',249,28,17,25],['hyosungcometgt650','Comet GT 650',647,73,17,18]],
 'Indian Motorcycle': [['indianchallenger','Challenger',1768,122,22.7,16],['chief','Chief',1890,101,15.1,16],['ftr','FTR 1200',1203,120,13,17],['indianpursuit','Pursuit',1768,122,22.7,15],['roadmaster','Roadmaster',1890,101,20.8,15],['scout','Scout Bobber',1250,105,13,19]],
 'Italjet': [['italjetdragster200','Dragster 200',181,17.5,9,30],['italjetdragster559','Dragster 559 Twin',550,58,15,20]],
 'Jawa': [['jawa42bobber','42 Bobber',334,30,12.5,30],['jawaperak','Perak',334,30,14,30]],
 'Kasinski': [['kasinskicometgt250','Comet GT 250',249,28,17,25],['kasinskicometgt2502','Comet GT 250R',249,28,17,25],['kasinskicometgt650','Comet GT 650R',647,81,17,18],['kasinskimirage150','Mirage 150',149,13.4,13,32],['kasinskimirage250','Mirage 250',249,28,14,24],['kasinskiwin110','Win 110',109,7.7,5,40]],
 'Kawasaki': [['kawasakieliminator','Eliminator 500',451,45,13,25],['klr650','KLR 650',652,40,23,21],['kawasakiklx300','KLX 300',292,29,7.9,26],['kawasakininja300','Ninja 300',296,39,17,24],['ninja400','Ninja 400',399,48,14,25],['kawasakininja500','Ninja 500',451,51,14,26],['ninja650','Ninja 650',649,68,15,22],['ninja1000sx','Ninja 1000SX',1043,142,19,17],['kawasakininjah2sx','Ninja H2 SX',998,200,19,14],['kawasakininjazx4r','Ninja ZX-4R',399,77,15,20],['kawasakininjazx4rr','Ninja ZX-4RR',399,77,15,20],['kawasakininjazx6r','Ninja ZX-6R',636,124,17,16],['kawasakininjazx10r','Ninja ZX-10R',998,203,17,14],['versys650','Versys 650',649,67,21,21],['versys1000','Versys 1000',1043,120,21,17],['versysx300','Versys-X 300',296,40,17,25],['kawasakivulcan900','Vulcan 900',903,50,20,19],['vulcan650','Vulcan S 650',649,61,14,22],['z400','Z400',399,48,14,25],['kawasakiz500','Z500',451,51,14,26],['z650','Z650',649,68,15,22],['kawasakiz650rs','Z650RS',649,68,15,22],['z900','Z900',948,125,17,18],['kawasakiz900rs','Z900RS',948,125,17,18],['kawasakizh2','Z H2',998,200,19,13]],
 'Keeway': [['keewaymbpm502n','MBP M502N',486,47,17,24],['keewaysuperlight12','Superlight 125',124,10.6,15,38],['keewayvieste300','Vieste 300',278,19,9.5,28]],
 'Kove Moto': [['kove450rally','450 Rally',449,51,30,22],['kove800xadventurep','800X Adventure Pro',799,95,20,21]],
 'KTM': [['duke200','200 Duke',199.5,25,13.4,35],['ktm250adventure','250 Adventure',248.8,30,14.5,32],['ktm300exc','300 EXC',293,54,9,14],['adv390','390 Adventure',373,44,14.5,28],['duke390','390 Duke',399,45,15,29],['ktm690enduror','690 Enduro R',693,74,13.5,23],['ktm690smcr','690 SMC R',693,74,13.5,23],['duke790','790 Duke',799,105,14,19],['adv890','890 Adventure',889,105,20,22],['ktm890duker','890 Duke R',889,121,14,21],['ktm990duke','990 Duke',947,123,14.5,20],['ktm1290superadvent','1290 Super Adventure R',1301,160,23,16],['adv1290','1290 Super Adventure S',1301,160,23,16],['ktm1390superduker','1390 Super Duke R',1350,190,17.5,14],['ktmrc390','RC 390',373,44,13.7,28]],
 'Kymco': [['kymcoagility16200','Agility 16+ 200',163,11.2,7,34],['kymcoak550','AK 550',550,53.5,15,21],['kymcodowntown350i','Downtown 350i',321,29,12.5,27],['kymcopeoples150','People S 150',150,13.8,6.2,36],['kymcoxcitings400','Xciting S 400',400,35.5,12.5,24]],
 'Lambretta': [['lambrettav125speci','V125 Special',124.7,10.1,6,37],['lambrettav200speci','V200 Special',169,12,6,34],['lambrettax300','X300',275,25,7.5,28]],
 'Laverda': [['laverda750sfc','750 SFC',744,75,23,15],['laverda1000jota','1000 Jota',981,90,20,14]],
 'Malaguti': [['malagutidrakon125','Drakon 125',124,13.4,10.5,38],['malagutimadison125','Madison 125',125,12.2,9,35]],
 'Matchless': [['matchlessg80','G80',498,23,17,22],['matchlessmodelx','Model X',990,20,15,17]],
 'Montesa': [['montesacota4rt260','Cota 4RT 260',259,21,1.9,22],['montesacota301rr','Cota 301RR',298,24,2,20]],
 'Moto Guzzi': [['motocalifornia1400','California 1400',1380,96,20.5,15],['motomandellov100','Mandello V100',1042,115,17,19],['stelvio','Stelvio V100',1042,115,21,19],['v7','V7 Special',853,65,21,22],['motov7stone','V7 Stone',853,65,21,22],['motov9bobber','V9 Bobber',853,65,15,21],['v85tt','V85 TT',853,80,23,21]],
 'Moto Morini': [['motocalibro650','Calibro 650',649,61,15,22],['motoseiemmezzoscr','Seiemmezzo SCR',649,61,16,23],['motoseiemmezzostr','Seiemmezzo STR',649,61,16,23],['motoxcape650','X-Cape 650',649,60,18,22]],
 'MV Agusta': [['brutale800','Brutale 800 RR',798,140,16.5,15],['mvbrutale1000rr','Brutale 1000 RR',998,208,16,12],['mvdragster800rr','Dragster 800 RR',798,140,16.5,15],['mvenduroveloce','Enduro Veloce',931,124,24,17],['mvf3800','F3 800',798,147,16.5,15],['lucky','Lucky Explorer 9.5',931,123,20,17],['mvsuperveloce800','Superveloce 800',798,147,16.5,15],['mvturismoveloce800','Turismo Veloce 800',798,110,21.5,17]],
 'MVK': [['mvkblackstar150','Black Star 150',149,11,12,32],['mvkspyder300','Spyder 300',270,19,14,24]],
 'Norton Motorcycles': [['nortoncommando961','Commando 961',961,77,15,18],['nortonv4sv','V4SV',1200,185,15,13]],
 'Peugeot Motocycles': [['peugeotdjango125','Django 125',125,10.6,8.5,36],['peugeotmetropolis4','Metropolis 400',399,35.6,13.5,24],['peugeotpm01300','PM-01 300',292,29,12.5,30],['peugeotxp400','XP400',399,36.7,13.5,23]],
 'Piaggio': [['piaggiobeverly400','Beverly 400',399,35,12,25],['piaggiomedley150','Medley 150',155,16.5,7,41],['piaggiomp3530','MP3 530',530,44,13.7,23]],
 'QJ Motor': [['qjsrk400','SRK 400',400,41.5,13.5,25],['qjsrk800rr','SRK 800RR',778,102,16,17],['qjsrt700x','SRT 700X',698,73.5,19.5,21],['qjsrv300','SRV 300',296,30.7,13.5,28]],
 'Royal Enfield': [['bullet350','Bullet 350',349,20.2,13,35],['classic350','Classic 350',349,20.2,13,35],['ct650','Continental GT 650',648,47,12.5,24],['guerrilla450','Guerrilla 450',452,40,11,28],['him411','Himalayan 411',411,24.5,15,28],['him450','Himalayan 450',452,40,17,28],['hunter350','Hunter 350',349,20.2,13,36],['interceptor650','Interceptor 650',648,47,13.7,24],['meteor350','Meteor 350',349,20.2,15,36],['scram411','Scram 411',411,24.3,15,28],['royalshotgun650','Shotgun 650',648,47,13.8,23],['supermeteor650','Super Meteor 650',648,47,15.7,23]],
 'Sachs': [['sachsmadass125','MadAss 125',124,8.5,5,40],['sachsroadster650','Roadster 650',644,50,20,20]],
 'Sherco': [['sherco300sefactory','300 SE Factory',293,50,9.8,14],['sherco300seffactor','300 SEF Factory',304,42,9.8,18],['sherco500seffactor','500 SEF Factory',478,55,9.8,16]],
 'Shineray': [['shinerayjet50','Jet 50',49,2.7,3,48],['jet125','Jet 125',124,7.2,3,42],['shinerayphoenix50','Phoenix 50',49,2.7,3,48],['shinerayrio125efi','Rio 125 EFI',124,8,4.2,40],['shinerayshes','SHE S',0,4,70,1,{"bat":2.0,"auton":70,"max":70}],['shi175','SHI 175',175,13,13,35],['storm200','Storm 200',198,20.4,13,32],['shinerayurban150','Urban 150',149,12.9,9,36],['worker125','Worker 125',124,7.2,14,40],['shinerayworker150','Worker 150',149,9,14,38],['xy150','XY 150 Jet',150,11.5,12,38]],
 'Sundown Motos': [['sundownhunter100','Hunter 100',97,7,10,42],['sundownmax125','Max 125',124,12.5,13,34],['sundownstx200','STX 200',199,16.7,10.6,26],['sundownvblade250','VBlade 250',248,19.5,14,25],['sundownweb100','Web 100',97,7.5,4,42]],
 'Suzuki': [['suzukibandit650','Bandit 650',656,85,19,18],['suzukibandit1250','Bandit 1250',1255,98,19,15],['suzukiboulevardm10','Boulevard M109R',1783,128,19.5,14],['boulevard','Boulevard M800',805,53,15.5,19],['suzukiboulevardm15','Boulevard M1500',1462,80,18,15],['suzukiburgman125','Burgman 125',124,9,6,38],['burgman400','Burgman 400',400,29,13.5,25],['suzukiburgman650ex','Burgman 650 Executive',638,55,15,18],['suzukidr650se','DR 650 SE',644,43,13,20],['suzukidrz400e','DR-Z400E',398,48,10,22],['yes125','EN 125 Yes',124,12,14,35],['suzukigladius650','Gladius 650',645,72,14.5,21],['suzukigs500e','GS 500E',487,48,17,22],['suzukigsx750f','GSX 750F',748,92,20,16],['suzukigsx8r','GSX-8R',776,83,14,23],['gsx8s','GSX-8S',776,83,14,23],['suzukigsxr750','GSX-R750',750,150,17,15],['suzukigsxr1000r','GSX-R1000R',999,202,16,14],['gsxs750','GSX-S750',749,114,16,18],['suzukigsxs1000','GSX-S1000',999,152,19,16],['suzukigsxs1000gt','GSX-S1000GT',999,152,19,16],['hayabusa','Hayabusa (GSX1300R)',1340,190,20,15],['intruder125','Intruder 125',124,11,10.3,36],['suzukisv650','SV 650',645,73,14.5,24],['dl650','V-Strom 650 XT',645,71,20,23],['suzukivstrom800','V-Strom 800',776,84,20,22],['vstrom800','V-Strom 800DE',776,84,20,22],['suzukivstrom1050de','V-Strom 1050 DE',1037,107,20,20],['vstrom1050','V-Strom 1050 XT',1037,107,20,20]],
 'SWM': [['swmsuperdual650t','Superdual 650 T',600,54,18,22],['swmsuperdual650x','Superdual 650 X',600,54,18,22]],
 'SYM': [['symcruisym300','Cruisym 300',278,26,12,27],['symmaxsym400','Maxsym 400',399,34,13,25],['symmaxsymtl508','Maxsym TL 508',508,45,12.5,21]],
 'Traxx': [['traxxdunna600','Dunna 600',590,35,19,20],['traxxfly150','Fly 150',149,12.2,10,33],['traxxsky125','Sky 125',125,8.8,5,38]],
 'Triumph Motorcycles': [['triumphbonnevilleb','Bonneville Bobber',1200,78,12,22],['triumphbonnevilles','Bonneville Speedmaster',1200,78,12,22],['triumphbonnevillet','Bonneville T100',900,65,14.5,24],['bonneville','Bonneville T120',1200,80,14.5,21],['triumphdaytona660','Daytona 660',660,95,14,20],['triumphdaytona675r','Daytona 675 R',675,128,17.4,16],['triumphrocket3gt','Rocket 3 GT',2458,167,18,14],['rocket3','Rocket 3 R',2458,167,18,14],['scrambler400','Scrambler 400 X',398,40,13,28],['triumphscrambler90','Scrambler 900',900,65,12,23],['triumphscrambler12','Scrambler 1200 XE',1200,90,15,21],['speed400','Speed 400',398,40,13,30],['triumphspeedtriple','Speed Triple 1200 RS',1160,180,15.5,16],['street_twin','Speed Twin 900',900,65,12,24],['triumphspeedtwin12','Speed Twin 1200',1200,100,14.5,20],['triumphstreettripl','Street Triple 765 RS',765,130,15,19],['tiger660','Tiger 660 Sport',660,81,17.2,22],['triumphtiger800xc','Tiger 800 XC',800,95,19,19],['triumphtiger800xr','Tiger 800 XR',800,95,19,19],['tiger850','Tiger 850 Sport',888,85,20,20],['tiger900','Tiger 900 GT',888,108,20,21],['triumphtiger900ral','Tiger 900 Rally Pro',888,108,20,21],['triumphtiger1200ex','Tiger 1200 Explorer',1160,150,30,18],['tiger1200','Tiger 1200 GT',1160,150,20,18],['triumphtiger1200ra','Tiger 1200 Rally',1160,150,20,18],['trident660','Trident 660',660,81,14,21]],
 'TVS Motor Company': [['tvsapacherr310','Apache RR 310',312.2,34,11,30],['tvsapachertr2004v','Apache RTR 200 4V',197.7,20.8,12,36],['tvsronin225','Ronin 225',225.9,20.4,14,38]],
 'Vespa': [['vespagts300super','GTS 300 Super',278,23.8,8.5,30],['vespaprimavera150','Primavera 150',155,12.5,8,40],['vespasprint150','Sprint 150',155,12.5,8,40]],
 'Victory Motorcycles': [['victorygunner','Gunner',1731,97,17,17],['victoryoctane','Octane',1179,104,12.9,18],['victoryvegas','Vegas',1731,97,17,17]],
 'Vincent Motorcycles': [['vincentblackshadow','Black Shadow',998,55,16,18]],
 'Voge': [['300rally','300 Rally',292,28.5,11,31],['ac525x','525ACX',494,47,15,24],['ds525x','525DSX',494,47.6,16.5,24],['voge900dsx','900DSX',895,95,17,23]],
 'Voltz Motors': [['voltzev1sport','EV1 Sport',0,4,100,1,{"bat":2.7,"auton":100,"max":180}],['voltzevs','EVS',0,6,120,1,{"bat":2.45,"auton":120,"max":180}]],
 'Yamaha': [['yamahabolt950','Bolt 950',942,54,12,20],['crosser150','Crosser 150',149,12.4,12,38],['yamahacrypton115','Crypton 115',114,8.2,4.2,42],['yamahadragstar650','Drag Star 650',649,40,16,19],['yamahadt180','DT 180',176,16.6,9,18],['yamahadt200','DT 200',195,25,10.5,16],['yamahadt200r','DT 200R',195,25,12.6,16],['factor150','Factor 150',149,12.4,15.2,40],['yamahafazer150','Fazer 150',149,12.4,15.2,40],['fz25','Fazer 250 (FZ25)',249,21.5,14,32],['fazer150','Fazer FZ15',149,12.4,11.9,40],['yamahafjr1300','FJR 1300',1298,146,25,16],['fluo125','Fluo 125',125,9.5,4.6,43],['yamahafz6','FZ6',600,98,19.4,18],['lander250','Lander 250 (XTZ 250)',249,20.9,13.6,32],['yamahamidnightstar','Midnight Star 950',942,53.6,17,19],['mt03','MT-03',321,42,14,22],['mt07','MT-07',689,74.8,14,22],['mt09','MT-09',890,119,14,20],['yamahamt10','MT-10',998,166,17,14],['neo125','Neo 125',125,9.8,4.2,40],['nmax160','NMAX 160',155,15.4,7.1,40],['yamahar1','R1',998,200,17,14],['r3','R3',321,42,14,22],['yamahar6','R6',599,118,17,16],['yamahar7','R7',689,73.4,13,22],['yamahar15','R15',155,18.8,11,42],['yamahard135','RD 135',132,16,13,22],['yamahard350lc','RD 350 LC',347,59,20,14],['superTenere','Super Ténéré 1200',1199,112,23,17],['yamahatmax560','TMAX 560',562,47.6,15,21],['tracer9','Tracer 9 GT',890,119,18.7,20],['yamahatnr250','Ténéré 250',249,21,16,30],['yamahatnr660xt660z','Ténéré 660 (XT 660Z)',660,48,23,21],['tenere700','Ténéré 700',689,73.4,16,23],['yamahatnr700worldr','Ténéré 700 World Raid',689,73.4,23,23],['yamahavmax1200','V-Max 1200',1198,140,15,12],['yamahavmax1700','V-Max 1700',1679,200,15,10],['yamahavirago250','Virago 250',248,21,9.5,28],['yamahavirago535','Virago 535',535,44,13.5,20],['yamahaxj6f','XJ6 F',600,77.5,17.3,19],['xj6','XJ6 N',600,77.5,17.3,19],['xmax250','XMAX 250',249,22.8,13.2,30],['yamahaxsr700','XSR 700',689,73.4,14,23],['yamahaxsr900','XSR 900',890,119,14,20],['yamahaxt600e','XT 600E',595,45,15,19],['yamahaxt660r','XT 660R',660,48,15,20],['yamahaxtz125','XTZ 125',124,12.5,10.6,35],['yamahaybr125','YBR 125',124,10.2,13,38]],
 'Zero Motorcycles': [['zerodsrx','DSR/X',0,100,180,1,{"bat":17.3,"auton":180,"max":290}],['zerosrf','SR/F',0,110,180,1,{"bat":17.3,"auton":180,"max":270}]],
 'Zontes': [['zontes350d','350 D',349,36.7,12,28],['zontes350e','350 E',349,36.7,16,28],['zontes350gk','350 GK',348,39.4,17,27],['zontes350m','350 M',349,36.7,12,28],['zontes350r','350 R',348,39.4,15,27],['zontes350r1','350 R1',348,39.4,15,27],['zontes350t','350 T',348,39.4,19,26],['zontes350tx','350 TX',348,39.4,19,26],['zontes350v','350 V',348,39.4,15,28],['zontes703f','703 F',699,97,22,20]],
 'Outra': [['outra','Outra moto (vou informar)',0,0,15,25]]
};
const MOTO_ALIAS = {};
const MOTOS = {};
const MARCA_CURTA = { 'BMW Motorrad': 'BMW', 'Triumph Motorcycles': 'Triumph', 'Dafra Motos': 'Dafra', 'Indian Motorcycle': 'Indian', 'Norton Motorcycles': 'Norton', 'Peugeot Motocycles': 'Peugeot', 'Sundown Motos': 'Sundown', 'TVS Motor Company': 'TVS', 'Victory Motorcycles': 'Victory', 'Vincent Motorcycles': 'Vincent', 'Voltz Motors': 'Voltz', 'Zero Motorcycles': 'Zero', 'Hero MotoCorp': 'Hero', 'Kove Moto': 'Kove', 'Beta Motor': 'Beta', 'Fantic Motor': 'Fantic' };
for (const [marca, lista] of Object.entries(MOTO_MARCAS)) for (const [id, modelo, cc, cv, tanque, kml, el] of lista) MOTOS[id] = { n: marca === 'Outra' ? modelo : (MARCA_CURTA[marca] || marca) + ' ' + modelo, modelo, marca, cc, cv, tanque, kml, el: el || null };
for (const [a, b] of Object.entries(MOTO_ALIAS)) if (MOTOS[b]) MOTOS[a] = MOTOS[b];
const marcaDe = id => (MOTOS[id] || MOTOS.outra).marca;
// seletor em 2 etapas: primeiro a marca, depois o modelo
function motoPickerHTML(pfx, model) {
  model = MOTO_ALIAS[model] || model || 'nx500'; const m = marcaDe(model);
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
