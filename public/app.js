/* MotoBando — app web (PWA). Grupo ao vivo por WebSocket, GPS real, mapa OpenStreetMap. */
'use strict';
const $ = s => document.querySelector(s);
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const f1 = n => (+n).toLocaleString('pt-BR', { maximumFractionDigits: 1 });
const f0 = n => Math.round(+n).toLocaleString('pt-BR');
const brl = n => (+n).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const uid = () => Math.random().toString(36).slice(2, 10);
const hhmm = d => d ? `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}` : '--:--';
const helloMsg = () => ({ t: 'hello', user: { id: ME.id, name: ME.name, motoName: (MOTOS[ME.moto.model] || {}).n, color: ME.color, sangue: ME.sangue || '' }, code: CODE, sosCfg: ME.sosCfg });
const ini = n => String(n || '?').trim().slice(0, 2).toUpperCase();
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
};
function toast(msg, ms = 3500) { const r = $('#toastRoot'); r.innerHTML = `<div class="toast">${msg}</div>`; clearTimeout(toast.t); toast.t = setTimeout(() => r.innerHTML = '', ms); }
function vibrate(p) { try { navigator.vibrate && navigator.vibrate(p); } catch (e) {} }

/* ================= ESTADO LOCAL ================= */
const ME = Object.assign({
  id: uid() + uid(), name: '', color: COLORS[Math.floor(Math.random() * COLORS.length)],
  moto: { model: 'nx500', fuel: 100, bagagem: true, estilo: 'normal', real: 0, markKm: 0, tanque: 15, kmlBase: 25 },
  preco: 6.29, odo: 0, lastOil: 0, oilEvery: 6000,
  sosCfg: { receive: true, radius: 30 }, bigAlert: { on: true, km: 10, sound: true }, keepAwake: true
}, store.get('mb-me', {}));
ME.moto = Object.assign({ model: 'nx500', fuel: 100, bagagem: true, estilo: 'normal', real: 0, markKm: 0, tanque: 15, kmlBase: 25 }, ME.moto || {});
const saveMe = () => store.set('mb-me', ME);
saveMe();
let CODE = store.get('mb-code', null);
let ROOM = store.get('mb-room', null); // última cópia (funciona sem sinal)
const UI = { tab: 'mapa', nav: false, road: false, near: false, nearRef: 'me', nearCat: 'posto', nearRes: null, poi: null, picking: false, userMovedMap: 0, notices: [], rain: null, rainKey: '', sosMine: null, sosIn: [], bigSeen: {}, big: null, fitted: false, wsOk: false };
/* pasta "Minhas viagens": cópia local de cada viagem (o guia guarda a viagem inteira para recriar se o servidor esquecer) */
let TRIPS = store.get('mb-trips', {});
store.set('mb-folderOpen', false); // a pasta abre fechada quando o app é aberto
function saveTripLocal(room) {
  if (!room || !room.members[ME.id]) return;
  const m = room.members[ME.id], guide = room.trip.guideId === ME.id, prev = TRIPS[room.code];
  let saved = prev ? prev.saved !== false : true; if (!prev && UI.draftNext) { saved = false; UI.draftNext = false; }
  TRIPS[room.code] = { saved, gone: false, status: room.trip.status || 'planejada', code: room.code, name: room.trip.name, date: room.trip.date, startTime: room.trip.startTime, mode: room.trip.mode, role: m.role, guide,
    stops: room.trip.stops.length, dist: room.trip.route ? room.trip.route.dist_km : null, members: Object.keys(room.members).length, updatedAt: Date.now(),
    snap: guide ? { trip: room.trip, expenses: room.expenses } : null,
    copy: guide ? null : { name: room.trip.name, startTime: room.trip.startTime, mode: room.trip.mode, stops: room.trip.stops, checklist: room.trip.checklist } };
  store.set('mb-trips', TRIPS);
}
function dropTripLocal(code) { delete TRIPS[code]; store.set('mb-trips', TRIPS); }
function openTrip(code) { const t = TRIPS[code]; send({ t: 'join', code, member: memberPayload(t && t.role === 'garupa' ? 'garupa' : (t && t.guide ? 'guia' : 'integrante')), snap: t && t.snap }); toast('Abrindo a viagem…'); }
const urlCode = (location.pathname.match(/^\/r\/([A-Z0-9-]+)/i) || [])[1];

/* ================= CONEXÃO ================= */
let ws = null, wsRetry = 0, wsQueue = [];
function connect() {
  const url = (location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host + '/ws';
  try { ws = new WebSocket(url); } catch (e) { return scheduleReconnect(); }
  ws.onopen = () => {
    wsRetry = 0; UI.wsOk = true; setNet();
    sendNow(helloMsg());
    if (myPos) sendNow({ t: 'pos', ...myPos });
    const q = wsQueue; wsQueue = []; q.forEach(sendNow);
  };
  ws.onmessage = e => { let m; try { m = JSON.parse(e.data); } catch (x) { return; } onMsg(m); };
  ws.onclose = () => { UI.wsOk = false; setNet(); scheduleReconnect(); };
  ws.onerror = () => { try { ws.close(); } catch (e) {} };
}
function scheduleReconnect() { clearTimeout(connect.t); connect.t = setTimeout(connect, Math.min(15000, 1000 * 2 ** wsRetry++)); }
function sendNow(m) { if (ws && ws.readyState === 1) ws.send(JSON.stringify(m)); else return false; return true; }
function send(m) { if (!sendNow(m) && m.t !== 'pos') wsQueue.push(m); }
function setNet() { const n = $('#net'); if (n) { n.className = 'net ' + (UI.wsOk ? 'on' : 'off'); n.title = UI.wsOk ? 'Conectado' : 'Sem conexão: tentando de novo'; } }
window.addEventListener('online', () => { if (!UI.wsOk) { wsRetry = 0; connect(); } });

function onMsg(m) {
  switch (m.t) {
    case 'joined':
      if (UI.batch) { UI.batch.codes.push(m.code); break; }
      CODE = m.code; store.set('mb-code', CODE); if (urlCode) history.replaceState(null, '', '/'); break;
    case 'room': {
      saveTripLocal(m.room);
      if (UI.batch) { if (UI.batch.resolve) { const r = UI.batch.resolve; UI.batch.resolve = null; r(); } break; }
      if (!CODE || m.room.code !== CODE) { if (!ROOM && !$('#v-home').hidden && !document.activeElement.matches('input,select')) showHome(); break; } // outra viagem minha: só atualiza a pasta
      const first = !ROOM || ROOM.code !== m.room.code;
      if (!first && ROOM.trip.status !== m.room.trip.status && m.room.trip.guideId !== ME.id) { if (m.room.trip.status === 'andamento') { toast('O guia começou a viagem! Bora rodar.', 6000); vibrate([300, 150, 300]); } else if (m.room.trip.status === 'encerrada') toast('Viagem encerrada pelo guia. Valeu, bando!', 6000); }
      ROOM = m.room; store.set('mb-room', ROOM);
      if (first) { UI.fitted = false; enterRoom(); }
      refresh();
      break;
    }
    case 'pos': if (ROOM && ROOM.members[m.id]) { ROOM.members[m.id].pos = m.pos; ROOM.members[m.id].online = true; onPositions(); } break;
    case 'left':
      if (m.missing && m.code && TRIPS[m.code]) {
        // o servidor reiniciou e esqueceu a viagem: o guia recria com a cópia guardada; os outros esperam o guia
        if (TRIPS[m.code].guide && TRIPS[m.code].snap) { openTrip(m.code); break; }
        TRIPS[m.code].gone = true; store.set('mb-trips', TRIPS); CODE = null; ROOM = null; store.set('mb-code', null); store.set('mb-room', null);
        toast('O servidor reiniciou. Peça para o guia abrir a viagem e depois toque nela de novo.', 7000); showHome(); break;
      }
      if (CODE) dropTripLocal(CODE); CODE = null; ROOM = null; store.set('mb-code', null); store.set('mb-room', null); if (m.reason) toast(m.reason); showHome(); break;
    case 'error': toast(esc(m.msg)); if (m.code && TRIPS[m.code] && !TRIPS[m.code].guide) { TRIPS[m.code].gone = true; store.set('mb-trips', TRIPS); if (!ROOM) showHome(); } break;
    case 'notice': {
      const txt = { stop: `${esc(m.name)} pediu parada`, fuel: `${esc(m.name)} precisa abastecer`, regroup: `${esc(m.name)}: vamos reagrupar no próximo ponto seguro`, ok: `${esc(m.name)}: tudo certo` }[m.kind] || esc(m.name);
      UI.notices.push({ txt, kind: m.kind, ts: Date.now() }); toast(txt, 6000); vibrate([300, 150, 300]); beep();
      updateMapOverlays();
      break;
    }
    case 'sos:new': if (!UI.sosIn.find(s => s.id === m.sos.id)) { UI.sosIn.push(m.sos); showIncomingSOS(m.sos); } break;
    case 'sos:mine': UI.sosMine = m.sos; renderSOS(); break;
    case 'sos:update':
      if (UI.sosMine && UI.sosMine.id === m.sos.id) { const before = UI.sosMine.responders.length; UI.sosMine = m.sos; if (m.sos.responders.length > before) { toast(`${esc(m.sos.responders[m.sos.responders.length - 1].name)} está indo até você`); vibrate(300); } if (UI.tab === 'sos') renderSOS(); }
      break;
    case 'sos:ended':
      if (m.mine) { UI.sosMine = null; renderSOS(); }
      else { UI.sosIn = UI.sosIn.filter(s => s.id !== m.id); toast(`${esc(m.name)} encerrou o SOS. Está tudo bem.`); if ($('#sosIncoming')) $('#modalRoot').innerHTML = ''; drawSosMarkers(); }
      break;
  }
}

/* ================= GPS ================= */
let myPos = null, gpsWatch = null, lastSent = 0, lastSentPos = null, simTimer = null, wakeLock = null;
const SIM = { on: false, km: 0, speed: 60 };
function startGPS() {
  if (!('geolocation' in navigator) || gpsWatch !== null || SIM.on) return;
  gpsWatch = navigator.geolocation.watchPosition(p => {
    if (SIM.on) return;
    setMyPos({ lat: p.coords.latitude, lng: p.coords.longitude, acc: p.coords.accuracy, spd: p.coords.speed != null ? p.coords.speed * 3.6 : null, hdg: p.coords.heading });
  }, err => {
    UI.gpsErr = err.code === 1 ? 'Permita o acesso à localização para o bando ver você no mapa.' : 'Procurando sinal de GPS…';
    updateMapOverlays();
  }, { enableHighAccuracy: true, maximumAge: 4000, timeout: 20000 });
}
function setMyPos(p) {
  UI.gpsErr = null;
  myPos = { ...p, ts: Date.now() };
  const now = Date.now();
  const moved = !lastSentPos || GEO.hav(lastSentPos, myPos) > 0.04;
  const wait = (moved ? 4000 : 20000) - (now - lastSent);
  clearTimeout(setMyPos.trail);
  if (wait <= 0) sendPos();
  else if (moved) setMyPos.trail = setTimeout(sendPos, wait); // garante que a última posição sempre chega
  if (ROOM && ROOM.members[ME.id]) ROOM.members[ME.id].pos = myPos;
  onPositions();
}
function sendPos() { if (myPos && sendNow({ t: 'pos', ...myPos, sim: SIM.on })) { lastSent = Date.now(); lastSentPos = myPos; } }
function setSim(on, speed) {
  SIM.on = on; if (speed) SIM.speed = speed;
  clearInterval(simTimer);
  if (on) {
    const R = routeModel(); if (!R) { SIM.on = false; toast('Monte a rota primeiro para simular'); return; }
    if (gpsWatch !== null) { navigator.geolocation.clearWatch(gpsWatch); gpsWatch = null; }
    const pr = myPos ? GEO.project(R, myPos.lat, myPos.lng) : null; SIM.km = pr && pr.off < 1 ? pr.km : 0;
    simTimer = setInterval(() => {
      SIM.km = Math.min(R.total, SIM.km + SIM.speed / 3600);
      const p = GEO.pointAt(R, SIM.km); setMyPos({ lat: p[0], lng: p[1], acc: 5, spd: SIM.speed > 200 ? 80 : SIM.speed, hdg: p[2] });
      if (SIM.km >= R.total) { setSim(false); toast('Simulação chegou ao destino'); }
    }, 1000);
  } else startGPS();
}
async function keepAwake(on) {
  try {
    if (on && ME.keepAwake && 'wakeLock' in navigator && !wakeLock) { wakeLock = await navigator.wakeLock.request('screen'); wakeLock.addEventListener('release', () => { wakeLock = null; }); }
    if (!on && wakeLock) { await wakeLock.release(); wakeLock = null; }
  } catch (e) {}
}
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') { if (ROOM) keepAwake(true); if (!UI.wsOk) { wsRetry = 0; connect(); } } });

/* ================= MODELO DA VIAGEM ================= */
let _R = null, _Rkey = '';
function routeModel() {
  const r = ROOM && ROOM.trip.route; if (!r || !r.coords || r.coords.length < 2) return null;
  const key = r.coords.length + ':' + r.dist_km + ':' + r.coords[0] + r.coords[r.coords.length - 1];
  if (key !== _Rkey) { _R = GEO.build(r.coords); _Rkey = key; _projCache = {}; }
  return _R;
}
let _projCache = {};
function proj(lat, lng, cacheKey) {
  const R = routeModel(); if (!R) return null;
  const hint = cacheKey && _projCache[cacheKey] ? _projCache[cacheKey].idx : null;
  const p = GEO.project(R, lat, lng, hint); if (cacheKey && p) _projCache[cacheKey] = p; return p;
}
const isGuide = () => ROOM && ROOM.trip.guideId === ME.id;
const isSolo = () => ROOM && ROOM.trip.mode === 'solo';
const meM = () => ROOM && ROOM.members[ME.id];
const membersArr = () => ROOM ? Object.values(ROOM.members) : [];
const riders = () => membersArr().filter(m => m.role !== 'garupa');
const garupaOf = id => membersArr().find(m => m.role === 'garupa' && m.garupaOf === id);
const fresh = m => m.pos && Date.now() - m.pos.ts < 3 * 60 * 1000;
function posOf(m) { return m.id === ME.id && myPos ? myPos : m.pos; }
function stopsKm() {
  if (!ROOM) return [];
  return ROOM.trip.stops.map((s, i) => { const p = proj(s.lat, s.lng); return { ...s, i, km: p ? p.km : null }; });
}
// km ao longo da rota de cada piloto (garupa usa a moto do piloto)
function riderKms() {
  return riders().map(m => { const p = posOf(m); if (!p) return { m, km: null }; const pr = proj(p.lat, p.lng, m.id); return { m, km: pr ? pr.km : null, off: pr ? pr.off : null, stale: !fresh(m) && m.id !== ME.id }; });
}
function myRiderId() { const mm = meM(); return mm && mm.role === 'garupa' && mm.garupaOf ? mm.garupaOf : ME.id; }
function myKm() { const r = riderKms().find(x => x.m.id === myRiderId()); return r && r.km != null ? r.km : null; }
function tripStart() {
  const t = ROOM.trip; const d = t.date ? new Date(t.date + 'T' + (t.startTime || '07:00') + ':00') : new Date();
  if (!t.date) { const [h, mi] = (t.startTime || '07:00').split(':'); d.setHours(+h, +mi, 0, 0); }
  return d;
}
// hora prevista em cada km: velocidade média da rota + tempo das paradas
function timeAt(km) {
  const r = ROOM.trip.route; if (!r) return null;
  const avg = r.dur_min ? r.dist_km / r.dur_min : 1; // km/min
  let min = km / avg * 1.08; // um pouco mais lento que carro
  stopsKm().forEach(s => { if (s.km != null && s.km < km - 0.2) min += (STOPTYPES[s.type] || {}).min || 0; });
  return new Date(tripStart().getTime() + min * 60000);
}
// tempo até um km a partir de agora (durante a viagem)
function etaFromNow(km) {
  const mk = myKm(); const r = ROOM.trip.route; if (mk == null || !r) return timeAt(km);
  const spd = myPos && myPos.spd > 15 ? myPos.spd : (r.dist_km / (r.dur_min / 60)) / 1.08;
  return new Date(Date.now() + Math.max(0, km - mk) / spd * 3600000);
}
function motoOfRider(m) { return m.id === ME.id ? ME.moto : (m.moto && m.moto.model ? m.moto : { model: 'outra', fuel: 100, bagagem: true, estilo: 'normal' }); }
function tripPlan() {
  const R = routeModel(); if (!R) return null;
  const postos = ROOM.trip.postos || [];
  const rs = riders();
  if (isSolo() || rs.length < 2) { const mine = rs.find(m => m.id === myRiderId()) || meM(); return { base: mine, P: FUEL.plan(motoOfRider(mine), !!garupaOf(mine.id), postos, R.total) }; }
  let best = null;
  rs.forEach(m => { const P = FUEL.plan(motoOfRider(m), !!garupaOf(m.id), postos, R.total); if (!best || P.full * ((motoOfRider(m).fuel || 100) / 100) < best.P.full * ((motoOfRider(best.base).fuel || 100) / 100) || P.full < best.P.full && P.stops.length >= best.P.stops.length) best = { base: m, P }; });
  return best;
}
function myFuel() {
  const mk = myKm(); const mm = meM(); if (!mm || mm.role === 'garupa') return null;
  const k = FUEL.kml(ME.moto, !!garupaOf(ME.id)), full = FUEL.motoSpec(ME.moto).tanque * k;
  const used = mk != null ? Math.max(0, mk - (ME.moto.markKm || 0)) : 0;
  const left = full * (ME.moto.fuel || 100) / 100 - used;
  return { full, left, pct: Math.max(0, left / full * 100) };
}

/* ================= MAPA ================= */
let map = null, L_route = null, L_stops = null, L_members = null, L_postos = null, L_poi = null, L_sos = null, L_rain = null;
const mk = {};
function initMap() {
  if (map) return;
  map = L.map('map', { zoomControl: false, attributionControl: true, tap: true, zoomSnap: 0.5, worldCopyJump: false }).setView([-23.117, -46.55], 9);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap' }).addTo(map);
  L_rain = L.layerGroup().addTo(map); L_route = L.layerGroup().addTo(map); L_postos = L.layerGroup(); L_stops = L.layerGroup().addTo(map); L_poi = L.layerGroup().addTo(map); L_sos = L.layerGroup().addTo(map); L_members = L.layerGroup().addTo(map);
  map.on('dragstart zoomstart', e => { if (e.hard !== false && !map._mbProgrammatic) UI.userMovedMap = Date.now(); });
  map.on('click', async e => {
    if (UI.picking) { UI.picking = false; $('#map').classList.remove('picking'); updateMapOverlays(); const name = await GEO.reverse(e.latlng.lat, e.latlng.lng); addStop({ name, lat: e.latlng.lat, lng: e.latlng.lng }); return; }
    if (UI.poi) { UI.poi = null; renderPoiCard(); }
  });
  $('#zin').innerHTML = ic('plus'); $('#zout').innerHTML = ic('minus'); $('#zfit').innerHTML = ic('expand'); $('#zme').innerHTML = ic('target');
  const zr = document.createElement('button'); zr.className = 'iconbtn'; zr.type = 'button'; zr.id = 'zref'; zr.setAttribute('aria-label', 'Atualizar'); zr.innerHTML = ic('refresh'); zr.onclick = softRefresh; $('.map-ctrl').appendChild(zr);
  $('#zin').remove(); $('#zout').remove();
  $('#zfit').onclick = () => { UI.userMovedMap = Date.now(); fitRoute(); };
  $('#zme').onclick = () => { UI.userMovedMap = 0; if (myPos) programmatic(() => map.setView([myPos.lat, myPos.lng], Math.max(map.getZoom(), 14))); else toast('Ainda sem posição de GPS'); };
}
function programmatic(fn) { map._mbProgrammatic = true; fn(); setTimeout(() => map._mbProgrammatic = false, 400); }
function fitRoute() {
  const R = routeModel();
  if (R) programmatic(() => map.fitBounds(L.latLngBounds(R.coords), { paddingTopLeft: [20, 170], paddingBottomRight: [70, 200] }));
  else if (ROOM && ROOM.trip.stops.length) programmatic(() => map.fitBounds(L.latLngBounds(ROOM.trip.stops.map(s => [s.lat, s.lng])), { padding: [60, 160], maxZoom: 13 }));
  else if (myPos) programmatic(() => map.setView([myPos.lat, myPos.lng], 12));
}
function drawRoute() {
  if (!map || !ROOM) return;
  L_route.clearLayers(); L_stops.clearLayers(); L_postos.clearLayers();
  const R = routeModel();
  if (R) {
    L.polyline(R.coords, { color: getCss('--casing') || '#fff', weight: 10, opacity: 1, interactive: false }).addTo(L_route);
    L.polyline(R.coords, { color: '#0D6B42', weight: 6, opacity: .95, interactive: false }).addTo(L_route);
  }
  ROOM.trip.stops.forEach((s, i) => {
    const t = STOPTYPES[s.type] || STOPTYPES.parada;
    L.marker([s.lat, s.lng], { icon: L.divIcon({ className: '', html: `<div class="mk-stop" style="position:relative">${ic(t.icon)}<small>${i + 1}</small></div>`, iconSize: [36, 36], iconAnchor: [18, 18] }), keyboard: false })
      .on('click', () => { UI.poi = { name: s.name, lat: s.lat, lng: s.lng, kind: t.n, stop: true }; renderPoiCard(); }).addTo(L_stops);
  });
  (ROOM.trip.postos || []).forEach(p => L.marker([p.lat, p.lng], { icon: poiIcon('posto') }).on('click', () => { UI.poi = { ...p, cat: 'posto', kind: 'Posto · km ' + f0(p.km) }; renderPoiCard(); }).addTo(L_postos));
  if (UI.showPostos) L_postos.addTo(map); else map.removeLayer(L_postos);
  drawRain();
}
function getCss(v) { return getComputedStyle(document.documentElement).getPropertyValue(v).trim(); }
function poiIcon(cat) { const c = CAT[cat] || CAT.turismo; return L.divIcon({ className: '', html: `<div class="mk-poi" style="background:${c.color}">${ic(c.icon)}</div>`, iconSize: [30, 30], iconAnchor: [15, 15] }); }
function helmIcon(m, isMe, stale) {
  const g = garupaOf(m.id);
  return L.divIcon({ className: '', html: `<div class="mk-helm ${isMe ? 'me' : ''} ${stale ? 'stale' : ''}" style="position:relative"><i style="background:${m.color}">${ini(m.name)}</i>${g ? '<b>+1</b>' : ''}<span>${isMe ? 'Você' : esc(m.name)}</span></div>`, iconSize: [56, 54], iconAnchor: [28, 18] });
}
function drawMembers() {
  if (!map || !ROOM) return;
  const seen = new Set();
  riders().forEach(m => {
    const p = posOf(m); if (!p) return;
    const isMe = m.id === myRiderId(), stale = !isMe && !fresh(m);
    const sig = m.name + m.color + isMe + stale + (garupaOf(m.id) ? 1 : 0);
    seen.add(m.id);
    if (!mk[m.id]) mk[m.id] = L.marker([p.lat, p.lng], { icon: helmIcon(m, isMe, stale), zIndexOffset: isMe ? 1000 : 500, keyboard: false }).addTo(L_members).on('click', () => { UI.poi = { name: m.name, lat: p.lat, lng: p.lng, kind: (MOTOS[(m.moto || {}).model] || {}).n || 'Moto', member: m.id }; renderPoiCard(); });
    else mk[m.id].setLatLng([p.lat, p.lng]);
    if (mk[m.id]._sig !== sig) { mk[m.id].setIcon(helmIcon(m, isMe, stale)); mk[m.id]._sig = sig; }
  });
  Object.keys(mk).forEach(id => { if (!seen.has(id)) { L_members.removeLayer(mk[id]); delete mk[id]; } });
}
function drawSosMarkers() {
  if (!map) return; L_sos.clearLayers();
  UI.sosIn.forEach(s => { if (s.lat || s.lng) L.marker([s.lat, s.lng], { icon: L.divIcon({ className: '', html: '<div class="mk-sos">SOS</div>', iconSize: [46, 46], iconAnchor: [23, 23] }), zIndexOffset: 2000 }).on('click', () => showIncomingSOS(s)).addTo(L_sos); });
}
function drawRain() {
  if (!map) return; L_rain.clearLayers();
  const R = routeModel(); if (!R || !UI.rain) return;
  UI.rain.forEach((r, i) => {
    if (r.prob == null || r.prob < 50) return;
    const a = Math.max(0, r.km - R.total / 24), b = Math.min(R.total, r.km + R.total / 24);
    const pts = []; for (let k = a; k <= b; k += Math.max(0.5, (b - a) / 40)) { const p = GEO.pointAt(R, k); pts.push([p[0], p[1]]); }
    L.polyline(pts, { color: '#2459D6', weight: 22, opacity: .25, interactive: false }).addTo(L_rain);
  });
}
function followMe() {
  if (!map || !UI.nav || !myPos) return;
  if (Date.now() - UI.userMovedMap < 8000) return;
  programmatic(() => map.setView([myPos.lat, myPos.lng], Math.max(map.getZoom(), 14), { animate: true }));
}
function onPositions() {
  drawMembers(); followMe(); updateMapOverlays(); checkBig();
  if (UI.road) renderRoad();
}

/* ================= BARRA LINEAR (capacetes até a próxima parada) ================= */
function nextStopInfo() {
  const mk0 = myKm(); const st = stopsKm().filter(s => s.km != null).sort((a, b) => a.km - b.km);
  if (!st.length || mk0 == null) return null;
  const next = st.find(s => s.km > mk0 + 0.25) || st[st.length - 1];
  const prev = [...st].reverse().find(s => s.km <= mk0 + 0.25 && s !== next) || { name: 'Saída', km: 0 };
  return { next, prev, mk: mk0 };
}
function linearHTML() {
  const R = routeModel(); const ns = nextStopInfo();
  if (!R || !ns) return `<div class="lin"><div class="lin-head"><div class="grow"><span class="lbl">Navegação</span><span class="nm">${!R ? 'Aguardando a rota do guia' : 'Procurando você na rota…'}</span></div></div><div class="lin-foot"><span>${!R ? (isGuide() ? 'Monte a rota na aba Viagem.' : 'Assim que o guia montar a rota, a barra aparece aqui.') : (UI.gpsErr || 'Ligue o GPS e fique perto da rota.')}</span></div></div>`;
  const { next, prev, mk: mk0 } = ns; const span = Math.max(0.5, next.km - prev.km);
  const items = riderKms().filter(x => x.km != null).map(x => ({ ...x, pos: Math.max(0, Math.min(1, (x.km - prev.km) / span)), behind: x.km < prev.km ? prev.km - x.km : 0 })).sort((a, b) => a.pos - b.pos);
  const meIt = items.find(i => i.m.id === myRiderId());
  const rowLast = [-9, -9, -9];
  if (meIt) { meIt.row = 0; rowLast[0] = meIt.pos; }
  items.filter(i => i !== meIt).forEach(it => { let r = [1, 2, 0].find(r => Math.abs(it.pos - rowLast[r]) >= 0.13); if (r === undefined) r = [1, 2, 0].sort((a, b) => Math.abs(it.pos - rowLast[b]) - Math.abs(it.pos - rowLast[a]))[0]; it.row = r; rowLast[r] = it.pos; });
  const left = p => `calc(${(p * 100).toFixed(2)}% - ${(p * 20).toFixed(1)}px)`;
  const last = items[0]; const lastGap = last ? mk0 - last.km : 0;
  return `<div class="lin" role="group" aria-label="Posição do bando até a próxima parada">
  <div class="lin-head"><div class="grow"><span class="lbl">Próxima parada</span><span class="nm">${esc(next.name)}</span></div><div class="lin-dist num">${f1(Math.max(0, next.km - mk0))} km<small>chega ${hhmm(etaFromNow(next.km))}</small></div></div>
  <div class="lin-track">
   <div class="lin-line"></div><div class="lin-fill" style="width:${left(meIt ? meIt.pos : 0)}"></div>
   <div class="lin-start">${esc(prev.name)}</div>
   <div class="lin-target">${ic('flag')}</div>
   ${items.map(it => `<div class="helm ${it === meIt ? 'me' : ''}" style="left:${left(it.pos)};top:${it.row === 1 ? -4 : it.row === 2 ? 52 : (it === meIt ? 24 : 26)}px;${it.stale ? 'opacity:.55' : ''}"><i style="background:${it.m.color}">${ic('helmet')}</i><span>${it === meIt ? 'Você' : esc(it.m.name)}${garupaOf(it.m.id) ? ' +1' : ''}${it.behind > 0.3 ? ' · −' + f0(it.behind) + ' km' : ''}</span></div>`).join('')}
  </div>
  <div class="lin-foot"><span>${items.length > 1 && last ? `Último: <b>${esc(last.m.name)}</b>, ${f1(Math.max(0, lastGap))} km atrás de você` : (isSolo() ? 'Viagem solo' : 'Esperando o GPS do bando')}</span><span>${f0(Math.max(0, R.total - mk0))} km até o destino</span></div>
 </div>`;
}

/* ================= SOBREPOSIÇÕES DO MAPA ================= */
function updateMapOverlays() {
  if (!ROOM || UI.tab !== 'mapa') return;
  $('#linear').hidden = !UI.nav; if (UI.nav) $('#linear').innerHTML = linearHTML();
  // avisos
  const b = []; const R = routeModel(); const mk0 = myKm();
  UI.notices = UI.notices.filter(n => Date.now() - n.ts < 90000);
  UI.notices.slice(-1).forEach(n => b.push(`<div class="banner amber">${ic(n.kind === 'fuel' ? 'fuel' : 'hand')}<div><b>${n.txt}</b></div></div>`));
  if (UI.picking) b.push(`<div class="pick-hint"><span>Toque no mapa onde fica a parada</span><button class="btn small" type="button" id="cancelPick">Cancelar</button></div>`);
  if (UI.gpsErr && !myPos) b.push(`<div class="banner">${ic('gps')}<div>${esc(UI.gpsErr)}</div></div>`);
  if (R && mk0 != null) {
    const T = tripPlan(); const F = myFuel();
    const nf = T && T.P.stops.find(s => s.km >= mk0 - 0.3);
    if (F && F.left < 0) { /* sem dado confiável */ }
    const nextPosto = (ROOM.trip.postos || []).find(p => p.km > mk0 + 0.3);
    if (F && nextPosto && F.left < (nextPosto.km - mk0) + 20) b.push(`<div class="banner red">${ic('fuel')}<div><b>Gasolina no limite.</b> Sua estimativa: ${f0(Math.max(0, F.left))} km. Próximo posto: ${esc(nextPosto.name)}, a ${f0(nextPosto.km - mk0)} km.</div></div>`);
    else if (nf && nf.km - mk0 <= 25) b.push(`<div class="banner amber">${ic('fuel')}<div><b>${isSolo() || riders().length < 2 ? 'Abasteça' : 'Parada do grupo para abastecer'}: ${esc(nf.name)}</b>, daqui a ${f0(nf.km - mk0)} km. Depois são ${nf.nextGap} km até o próximo posto.${!isSolo() && T.base && riders().length > 1 ? ` Calculado pela moto que roda menos (${esc(T.base.name)}).` : ''}</div></div>`);
    const me = riderKms().find(x => x.m.id === myRiderId());
    if (me && me.off > 0.6) b.push(`<div class="banner">${ic('route')}<div><b>Você está fora da rota</b> (${f1(me.off)} km). Use “Voz no Google Maps” para voltar.</div></div>`);
    if (!isSolo()) { const g = groupGaps().filter(x => x.gap > (ROOM.trip.gap || 5)).sort((a, c) => c.gap - a.gap)[0]; if (g) b.push(`<div class="banner red">${ic('users')}<div><b>${esc(g.m.name)} ficou ${f1(g.gap)} km para trás.</b> Reduzam o ritmo.</div></div>`); }
    if (UI.rain) { const wet = UI.rain.filter(r => r.prob >= 50 && r.km > mk0 - 5); if (wet.length) b.push(`<div class="banner blue">${ic('rain')}<div><b>Chuva provável perto do km ${f0(wet[0].km)}</b> (${wet[0].prob}% por volta das ${hhmm(wet[0].when)}). Leve a capa à mão.</div></div>`); }
  }
  $('#banners').innerHTML = b.slice(0, UI.nav ? 1 : 2).join('');
  const cp = $('#cancelPick'); if (cp) cp.onclick = () => { UI.picking = false; $('#map').classList.remove('picking'); updateMapOverlays(); };
  // barra de informações
  const F = myFuel(); const spd = myPos && myPos.spd != null ? Math.max(0, myPos.spd) : null;
  const dest = R && mk0 != null ? Math.max(0, R.total - mk0) : (R ? R.total : null);
  const ib = $('#infobar'); ib.className = 'infobar' + (F && F.pct < 20 ? ' crit' : F && F.pct < 35 ? ' low' : '');
  ib.innerHTML = `<div><small>Velocidade</small><b class="num">${spd != null ? f0(spd) : '—'}<span class="small muted"> km/h</span></b></div>
   <div><small>Tanque (est.)</small><b class="num fuel">${F ? f0(F.pct) + '%' : '—'}</b></div>
   <div><small>Até o destino</small><b class="num">${dest != null ? f0(dest) + ' km' : '—'}</b></div>`;
  renderMapActions();
}
function renderMapActions() {
  const el = $('#mapActions');
  const html = `<button class="road-btn nav-btn" id="aNav" type="button">${UI.nav ? ic('x') + 'Sair' : ic('target') + 'Navegar'}</button>
   ${UI.nav ? `<a class="gmaps gmaps-hl" id="aG" href="${gmapsLink()}" target="_blank" rel="noopener">${ic('route')}<span><b>Voz no Google Maps</b><small>depois, volte p/ o app</small></span></a>` : `<button class="near-btn" id="aNear" type="button">${ic('search')}Buscar por perto</button>`}
   <button class="road-btn road-red" id="aRoad" type="button" aria-label="Modo estrada: botões grandes">${ic('helmet')}${UI.nav ? '' : 'Modo estrada'}</button>`;
  if (el._h !== html) { el.innerHTML = html; el._h = html;
    $('#aNav').onclick = () => { if (UI.nav) return exitNav(); UI.nav = true; UI.userMovedMap = 0; keepAwake(true); followMe(); updateMapOverlays(); };
    const n = $('#aNear'); if (n) n.onclick = () => { UI.near = true; UI.poi = null; renderPoiCard(); renderNear(); };
    $('#aRoad').onclick = () => { UI.road = true; keepAwake(true); renderRoad(); };
  } else { const g = $('#aG'); if (g) g.href = gmapsLink(); }
}
function exitNav() { UI.nav = false; fitRoute(); updateMapOverlays(); toast('Saiu da navegação', 1500); }
function gmapsLink(dest) {
  if (dest) return `https://www.google.com/maps/dir/?api=1&destination=${dest.lat},${dest.lng}&travelmode=driving`;
  const mk0 = myKm() || 0;
  const ahead = stopsKm().filter(s => s.km == null || s.km > mk0 + 0.3);
  if (!ahead.length) return 'https://www.google.com/maps';
  const last = ahead[ahead.length - 1];
  const wps = ahead.slice(0, -1).slice(0, 8).map(s => `${s.lat},${s.lng}`).join('|');
  return `https://www.google.com/maps/dir/?api=1&destination=${last.lat},${last.lng}${wps ? '&waypoints=' + encodeURIComponent(wps) : ''}&travelmode=driving`;
}
function renderPoiCard() {
  const el = $('#poiCard'); const p = UI.poi;
  if (!p) { el.hidden = true; return; }
  const c = CAT[p.cat] || null;
  const d = myPos ? GEO.hav(myPos, p) : null;
  el.hidden = false;
  el.innerHTML = `<div class="poi-card"><div class="poi-ico" style="background:${c ? c.color : '#14201A'}">${ic(c ? c.icon : p.member ? 'helmet' : 'pin')}</div><div class="grow"><h3>${esc(p.name)}</h3><p>${esc([p.kind, p.sub, p.extra].filter(Boolean).join(' · '))}</p>
   <div style="display:flex;gap:8px;flex-wrap:wrap">${d != null ? `<span class="pill green num">${f1(d)} km de você</span>` : ''}${p.rating ? `<span class="pill amber num">★ ${f1(p.rating)}${p.reviews ? ' · ' + f0(p.reviews) + ' avaliações' : ''}</span>` : ''}${p.phone ? `<span class="pill">${esc(p.phone)}</span>` : ''}</div>
   <div class="row" style="margin-top:10px"><a class="btn small" href="${gmapsLink(p)}" target="_blank" rel="noopener">${ic('route')}Ir com Google Maps</a>${isGuide() && !p.stop && !p.member ? `<button class="btn small" type="button" id="poiAdd">${ic('plus')}Virar parada</button>` : ''}</div></div>
   <button class="iconbtn" type="button" aria-label="Fechar" id="poiX">${ic('x')}</button></div>`;
  $('#poiX').onclick = () => { UI.poi = null; renderPoiCard(); };
  const a = $('#poiAdd'); if (a) a.onclick = () => { addStop({ name: p.name, lat: p.lat, lng: p.lng, type: p.cat === 'hosp' ? 'pernoite' : p.cat === 'comida' ? 'almoco' : p.cat === 'posto' ? 'abastecer' : p.cat === 'turismo' ? 'foto' : 'parada' }); UI.poi = null; renderPoiCard(); };
}

/* ================= BUSCA POR PERTO (dados reais do OpenStreetMap) ================= */
async function renderNear(reload) {
  const el = $('#near'); if (!UI.near) { el.hidden = true; return; } el.hidden = false;
  const ns = nextStopInfo();
  const ref = UI.nearRef === 'next' && ns ? { lat: ns.next.lat, lng: ns.next.lng, label: 'Perto de ' + ns.next.name } : myPos ? { lat: myPos.lat, lng: myPos.lng, label: 'Perto de você' } : null;
  const cats = ['posto', 'hosp', 'comida', 'trilha', 'apoio', 'turismo'];
  const key = UI.nearCat + (ref ? ref.lat.toFixed(2) + ref.lng.toFixed(2) : '');
  el.innerHTML = `<div class="sheet-h"><div class="sec-h"><h2 style="font-size:22px">Buscar por perto</h2><button class="iconbtn" type="button" id="nearX" aria-label="Fechar">${ic('x')}</button></div>
   <div class="seg" role="group"><button type="button" data-r="me" aria-pressed="${UI.nearRef === 'me'}">Perto de mim</button><button type="button" data-r="next" aria-pressed="${UI.nearRef === 'next'}" ${ns ? '' : 'disabled'}>Perto da próxima parada</button></div>
   <div class="chips">${cats.map(c => `<button class="chip" type="button" data-c="${c}" aria-pressed="${UI.nearCat === c}">${ic(CAT[c].icon)}${CAT[c].short || CAT[c].n}</button>`).join('')}</div></div>
   <div class="sheet-body" id="nearBody">${!ref ? '<p class="empty">Ligue o GPS para buscar perto de você.</p>' : '<p class="empty"><span class="spinner"></span> Buscando no mapa… pode levar alguns segundos</p>'}</div>`;
  $('#nearX').onclick = () => { UI.near = false; L_poi.clearLayers(); renderNear(); };
  el.querySelectorAll('[data-r]').forEach(x => x.onclick = () => { UI.nearRef = x.dataset.r; renderNear(); });
  el.querySelectorAll('[data-c]').forEach(x => x.onclick = () => { UI.nearCat = x.dataset.c; renderNear(); });
  if (!ref) return;
  try {
    if (!UI.nearRes || UI.nearRes.key !== key || reload) UI.nearRes = { key, list: await GEO.near(UI.nearCat, ref.lat, ref.lng, UI.nearCat === 'trilha' ? 5000 : UI.nearCat === 'comida' ? 5000 : 10000) };
    if (!UI.near || UI.nearRes.key !== key) return;
    const list = UI.nearRes.list.map(p => ({ ...p, d: GEO.hav(ref, p) })).sort((a, b) => (b.named - a.named) || a.d - b.d).slice(0, 40).sort((a, b) => (a.rating || b.rating) ? ((b.rating || 0) * Math.log10((b.reviews || 0) + 10) - (a.rating || 0) * Math.log10((a.reviews || 0) + 10)) : a.d - b.d);
    L_poi.clearLayers(); list.forEach(p => L.marker([p.lat, p.lng], { icon: poiIcon(p.cat) }).on('click', () => { UI.poi = p; renderPoiCard(); }).addTo(L_poi));
    $('#nearBody').innerHTML = `<p class="note">${esc(ref.label)} · ${list.length} lugares · dados do OpenStreetMap</p>` + (list.map((p, i) => `<button type="button" class="place" data-i="${i}" style="width:100%;text-align:left;background:none;border:0;border-bottom:1px solid var(--line)"><div class="poi-ico" style="background:${CAT[p.cat].color}">${ic(CAT[p.cat].icon)}</div><div class="grow"><h4>${esc(p.name)}</h4><p>${esc([p.kind, p.sub, p.extra].filter(Boolean).join(' · ') || CAT[p.cat].n)}</p>${p.rating ? `<span class="pill amber num">★ ${f1(p.rating)}${p.reviews ? ' · ' + f0(p.reviews) : ''}</span>` : ''}</div><div class="dist num">${f1(p.d)} km</div></button>`).join('') || '<p class="empty">Nada encontrado nessa categoria por aqui.</p>');
    $('#nearBody').querySelectorAll('[data-i]').forEach(x => x.onclick = () => { const p = list[+x.dataset.i]; UI.near = false; renderNear(); UI.poi = p; renderPoiCard(); UI.userMovedMap = Date.now(); programmatic(() => map.setView([p.lat, p.lng], 15)); });
  } catch (e) { if ($('#nearBody')) $('#nearBody').innerHTML = `<p class="empty">Não consegui buscar agora: ${esc(e.message)}. Tente de novo em alguns segundos.</p><div style="text-align:center"><button class="btn" type="button" id="nearRetry">${ic('refresh')}Tentar de novo</button></div>`; const r = $('#nearRetry'); if (r) r.onclick = () => renderNear(true); }
}

/* ================= ALERTA DE TELA CHEIA (alguém ficou para trás) ================= */
let audioCtx = null, beepTimer = null;
function groupGaps() {
  if (!ROOM || isSolo()) return [];
  const list = riderKms().filter(x => x.km != null && !x.stale).sort((a, b) => b.km - a.km);
  const out = []; for (let i = 1; i < list.length; i++) out.push({ m: list[i].m, gap: list[i - 1].km - list[i].km, ahead: list[i - 1].m });
  return out;
}
function checkBig() {
  if (!ROOM || !ME.bigAlert.on) { if (UI.big && !UI.big.test) closeBig(); return; }
  const lim = ME.bigAlert.km; const gaps = groupGaps();
  gaps.forEach(g => { if (g.gap < lim - 2) delete UI.bigSeen[g.m.id]; });
  const worst = gaps.filter(g => g.gap > lim).sort((a, b) => b.gap - a.gap)[0];
  if (UI.big && !UI.big.test) { if (!worst || worst.m.id !== UI.big.id) closeBig(); else { const el = $('#baDist'); if (el) el.textContent = f1(worst.gap) + ' km'; return; } }
  if (worst && !UI.bigSeen[worst.m.id]) showBig(worst.m, worst.gap, false);
}
function beep() {
  if (!ME.bigAlert.sound) return;
  try { audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)(); const t = audioCtx.currentTime;[0, 0.22].forEach(d => { const o = audioCtx.createOscillator(), g = audioCtx.createGain(); o.type = 'square'; o.frequency.value = 880; g.gain.setValueAtTime(0.0001, t + d); g.gain.exponentialRampToValueAtTime(0.25, t + d + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + d + 0.18); o.connect(g).connect(audioCtx.destination); o.start(t + d); o.stop(t + d + 0.2); }); } catch (e) {}
}
document.addEventListener('pointerdown', () => { try { if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)(); if (audioCtx.state === 'suspended') audioCtx.resume(); } catch (e) {} }, { once: true });
function showBig(m, gap, test) {
  UI.big = { id: m.id, test };
  $('#bigRoot').innerHTML = `<div class="big-alert" role="alertdialog" aria-live="assertive" aria-label="Integrante ficou para trás">
  <div class="ba-icon">${ic('users')}</div><small>${test ? 'Teste do alerta' : 'Alerta do comboio'}</small>
  <h2>${esc(m.name)} ficou para trás</h2><div class="ba-km num" id="baDist">${f1(gap)} km</div>
  <p>Diminuam o ritmo e parem no próximo ponto seguro até o bando se juntar de novo.</p>
  <div class="ba-actions"><button type="button" class="ba-stop" id="baStop">Avisar o grupo: reagrupar</button><button type="button" class="ba-ok" id="baOk">Ciente, fechar</button></div></div>`;
  if (ME.bigAlert.sound) { beep(); vibrate([400, 200, 400]); clearInterval(beepTimer); beepTimer = setInterval(() => { beep(); vibrate([400, 200, 400]); }, 2500); }
  $('#baStop').onclick = () => { UI.bigSeen[m.id] = 1; closeBig(); if (test) toast('Teste: no uso real, todo o grupo recebe o aviso'); else { send({ t: 'notice', kind: 'regroup' }); toast('Aviso enviado para todo o grupo'); } };
  $('#baOk').onclick = () => { UI.bigSeen[m.id] = 1; closeBig(); };
}
function closeBig() { UI.big = null; clearInterval(beepTimer); $('#bigRoot').innerHTML = ''; }

/* ================= MODO ESTRADA ================= */
function renderRoad() {
  const root = $('#roadRoot'); if (!UI.road) { root.innerHTML = ''; return; }
  const F = myFuel(); const ns = nextStopInfo();
  root.innerHTML = `<div class="road" role="dialog" aria-label="Modo estrada">
  ${isSolo() || riders().length < 2 ? `<div class="road-next"><small>Próxima parada</small><b>${ns ? esc(ns.next.name) : '—'}</b><span class="num">${ns ? 'em ' + f0(Math.max(0, ns.next.km - ns.mk)) + ' km · ' + hhmm(etaFromNow(ns.next.km)) : 'sem rota ou GPS'}</span></div>` : linearHTML()}
  <div class="road-stats"><div><small>Tanque (est.)</small><b class="num">${F ? f0(F.pct) + '%' : '—'}</b></div><div><small>Autonomia</small><b class="num">${F ? f0(Math.max(0, F.left)) + ' km' : '—'}</b></div></div>
  <div class="road-grid" style="grid-template-rows:1fr 1fr 1fr">
   <button type="button" class="rb-stop" id="rbStop">${ic('hand')}Pedir parada</button>
   <button type="button" class="rb-fuel" id="rbFuel">${ic('fuel')}Preciso abastecer</button>
   <button type="button" class="rb-fuel" id="rbFilled">${ic('check')}Abasteci</button>
   <button type="button" class="rb-fuel" id="rbOk">${ic('users')}Tudo certo</button>
   <button type="button" class="rb-sos" id="rbSos">${ic('alert')}SOS</button>
   <button type="button" class="rb-exit" id="rbExit">${ic('x')}Sair</button>
  </div></div>`;
  $('#rbStop').onclick = () => { if (isSolo()) toast('Viagem solo: ninguém para avisar'); else { send({ t: 'notice', kind: 'stop' }); toast('Pedido de parada enviado ao grupo'); } };
  $('#rbFuel').onclick = () => { if (!isSolo()) { send({ t: 'notice', kind: 'fuel' }); toast('Grupo avisado: você precisa abastecer'); } UI.road = false; renderRoad(); go('mapa'); UI.near = true; UI.nearCat = 'posto'; UI.nearRef = 'me'; renderNear(); };
  $('#rbFilled').onclick = () => { filled(); renderRoad(); };
  $('#rbOk').onclick = () => { if (!isSolo()) { send({ t: 'notice', kind: 'ok' }); toast('Grupo avisado: tudo certo'); } };
  $('#rbSos').onclick = () => { UI.road = false; renderRoad(); go('sos'); startSOSCountdown(); };
  $('#rbExit').onclick = () => { UI.road = false; renderRoad(); if (!UI.nav) keepAwake(false); };
}
function filled() { ME.moto.fuel = 100; ME.moto.markKm = myKm() || 0; saveMe(); syncMember(); toast('Tanque cheio registrado'); updateMapOverlays(); }

/* ================= HOME / ENTRADA ================= */
function showHome() {
  pushNav('home');
  ['mapa', 'viagem', 'sos', 'moto', 'contas', 'plan'].forEach(k => $('#v-' + k).hidden = true);
  $('#tabs').hidden = true; $('#v-home').hidden = false;
  $('#tripTitle').textContent = 'MotoBando'; $('#tripSub').textContent = ME.name ? 'Olá, ' + ME.name : 'Viagem de moto em bando';
  const needProfile = !ME.name;
  const motoOpts = Object.entries(MOTOS).map(([k, v]) => `<option value="${k}" ${k === ME.moto.model ? 'selected' : ''}>${v.n}</option>`).join('');
  $('#v-home').innerHTML = `<div class="pad">
   <div class="home-hero"><div class="eyebrow">MotoBando</div><h1>${needProfile ? 'Bora montar o bando?' : 'Pra onde vamos?'}</h1><p class="muted" style="margin:0">Rota, GPS do grupo, combustível, gastos e SOS na estrada.</p></div>
   ${needProfile ? `<form class="card" id="profForm" style="display:flex;flex-direction:column;gap:12px">
     <div class="field"><label for="pName">Seu nome ou apelido</label><input class="input" id="pName" maxlength="30" required autocomplete="nickname" placeholder="Ex.: Leandro"></div>
     <div class="eyebrow" style="margin-top:4px">Sua moto <span class="muted" style="text-transform:none;letter-spacing:0;font-weight:500">(se for de garupa, pode pular)</span></div>
     ${motoPickerHTML('p', ME.moto.model)}
     <button class="btn primary btn-wide" type="submit">Continuar</button>
     <button class="btn ghost btn-wide" type="button" id="haveCode">Já usei o MotoBando: tenho meu código</button></form>` : `
   ${installHTML()}
   ${urlCode ? '' : activeTripHTML() + tripListHTML()}
   ${urlCode ? `<div class="banner amber" style="box-shadow:none">${ic('users')}<div>Você recebeu o convite <b>${esc(urlCode)}</b>. Escolha como vai: pilotando ou de garupa.</div></div>` : ''}
   <form class="card" id="joinForm" style="display:flex;flex-direction:column;gap:12px">
     <div class="eyebrow">Entrar num grupo</div>
     <div class="field"><label for="jCode">Código do grupo</label><input class="input" id="jCode" required placeholder="BANDO-7K2Q" value="${esc(urlCode || '')}" autocapitalize="characters" style="font-family:var(--f-display);font-size:22px;letter-spacing:.1em"></div>
     <div class="seg" role="group" aria-label="Como você vai"><button type="button" data-jr="integrante" aria-pressed="true">Vou pilotando</button><button type="button" data-jr="garupa" aria-pressed="false">Vou de garupa</button></div>
     <button class="btn primary btn-wide" type="submit">${ic('users')}Entrar no grupo</button></form>
   <div class="eyebrow">Nova viagem</div>
   <button class="choice auto" type="button" id="newAuto">${ic('route')}<div><b>Criar viagem automática <span class="pill amber">Bando+</span></b><span>Diga de onde sai, para onde vai e quantos km por dia. O app monta rota, paradas, postos, onde comer e dormir. 1 grátis.</span></div></button>
   <button class="choice primary" type="button" id="newGroup">${ic('users')}<div><b>Criar viagem em grupo</b><span>Você é o guia: monta a rota, as paradas e manda o código</span></div></button>
   <button class="choice" type="button" id="newSolo">${ic('helmet')}<div><b>Viagem solo</b><span>Você monta tudo. Se virar grupo depois, é só ligar a chave</span></div></button>
   <details class="card"><summary style="font-weight:700;cursor:pointer;min-height:36px">Carregar viagens de exemplo</summary>
    <p class="note">Rotas clássicas de moto já montadas, uma por mês. Servem para ver como fica a pasta e para usar como modelo.</p>
    <div style="display:flex;flex-direction:column;gap:10px"><button class="btn btn-wide" type="button" id="ex15">${ic('users')}Guia: 15 viagens em grupo no ano</button><button class="btn btn-wide" type="button" id="ex10">${ic('helmet')}Solo: 10 viagens no ano</button></div></details>
   <button class="btn btn-wide" type="button" id="homeBorders">${ic('book')}Guia de fronteiras</button>
   ${needProfile ? '' : personalCodeHTML()}
   <p class="legal">Mapa © colaboradores do OpenStreetMap. Rotas: OSRM. Previsão do tempo: Open-Meteo.</p>`}
  </div>`;
  const hc = $('#haveCode'); if (hc) hc.onclick = () => { ME.name = ME.name || 'Motociclista'; saveMe(); showHome(); setTimeout(() => { const d = $('#restoreForm'); if (d) { d.closest('details').open = true; d.scrollIntoView({ block: 'center' }); $('#rCode').focus(); } }, 50); };
  const pf = $('#profForm'); if (pf) pf.onsubmit = e => { e.preventDefault(); ME.name = $('#pName').value.trim(); ME.moto.model = $('#pModelo').value; saveMe(); if (UI.wsOk) sendNow(helloMsg()); renderAvatar(); showHome(); };
  bindMotoPicker('p');
  let joinRole = 'integrante';
  document.querySelectorAll('[data-jr]').forEach(b => b.onclick = () => { joinRole = b.dataset.jr; document.querySelectorAll('[data-jr]').forEach(x => x.setAttribute('aria-pressed', x === b)); });
  const jf = $('#joinForm'); if (jf) jf.onsubmit = e => { e.preventDefault(); let c = $('#jCode').value.trim().toUpperCase().replace(/\s/g, ''); if (!c.startsWith('BANDO-')) c = 'BANDO-' + c.replace(/^BANDO/, ''); send({ t: 'join', code: c, member: memberPayload(joinRole) }); toast('Entrando…'); };
  const ng = $('#newGroup'); if (ng) ng.onclick = () => createTrip('grupo');
  bindTripList();
  const ib = $('#installBtn'); if (ib) ib.onclick = doInstall;
  bindPersonalCode();
  const na = $('#newAuto'); if (na) na.onclick = showPlanner;
  const gb = $('#homeBorders'); if (gb) gb.onclick = showBorders;
  const e15 = $('#ex15'); if (e15) e15.onclick = () => loadExamples('grupo', 15, 24);
  const e10 = $('#ex10'); if (e10) e10.onclick = () => loadExamples('solo', 10, 35);
  const ns = $('#newSolo'); if (ns) ns.onclick = () => createTrip('solo');
}
const todayStr = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const tripPhase = t => t.status === 'encerrada' ? 'feita' : (t.status === 'andamento' || t.date === todayStr()) ? 'andamento' : (t.date && t.date < todayStr()) ? 'feita' : 'proxima';
function activeTripHTML() { return ''; }
function tripListHTML() {
  const list = Object.values(TRIPS).filter(t => t.saved !== false).sort((a, b) => String(a.date || '9').localeCompare(String(b.date || '9')));
  const act = list.filter(t => tripPhase(t) === 'andamento' && !t.gone), next = list.filter(t => tripPhase(t) === 'proxima'), past = list.filter(t => tripPhase(t) === 'feita').reverse();
  const card = (t, kind) => { const d = t.date ? new Date(t.date + 'T12:00:00') : null; const role = t.mode === 'solo' ? 'Solo' : t.guide ? 'Guia' : t.role === 'garupa' ? 'Garupa' : 'Integrante';
    return `<div class="trip-card ${t.gone ? 'gone' : ''} ${kind}"><button type="button" class="trip-open" data-open="${esc(t.code)}"><span class="trip-date">${d ? `<b>${d.getDate()}</b>${d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}` : '<b>?</b>data'}</span><span class="trip-info"><b>${esc(t.name)}</b><span>${esc(role)} · ${t.stops} parada${t.stops === 1 ? '' : 's'}${t.dist ? ' · ' + f0(t.dist) + ' km' : ''}${t.mode !== 'solo' && t.members > 1 ? ' · ' + t.members + ' pessoas' : ''}${t.gone ? ' · não existe mais' : ''}</span></span></button>
     <div class="trip-acts">${kind === 'feita' ? `<button class="btn small" type="button" data-dup="${esc(t.code)}">${ic('refresh')}Repetir</button>` : t.guide ? `<button class="iconbtn" type="button" data-dup="${esc(t.code)}" aria-label="Duplicar como modelo">${ic('copy')}</button>` : ''}<button class="iconbtn" type="button" data-rm="${esc(t.code)}" aria-label="Remover da pasta">${ic('trash')}</button></div></div>`; };
  const big = t => `<button type="button" class="active-trip" data-open="${esc(t.code)}"><span class="live-dot"></span><span style="flex:1;min-width:0;text-align:left"><small>Viagem em andamento</small><b>${esc(t.name)}</b><span>${t.mode === 'solo' ? 'Solo' : t.members + ' pessoas'} · toque para entrar</span></span>${ic('route')}</button>`;
  const open = store.get('mb-folderOpen', false);
  return `${act.length ? `<section class="home-active"><div class="eyebrow" style="color:var(--road)">Viagem em andamento</div>${act.map(big).join('')}</section>` : ''}
   <section class="folder ${open ? 'open' : ''}">
    <button type="button" class="folder-head" id="folderToggle" aria-expanded="${open}"><span><b>Minhas viagens</b><small>${next.length} próxima${next.length === 1 ? '' : 's'} · ${past.length} realizada${past.length === 1 ? '' : 's'}</small></span><span class="chev">${ic('chev')}</span></button>
    <div class="folder-body" ${open ? '' : 'hidden'}>
     ${!list.length ? `<p class="note" style="margin:0">Sua pasta está vazia. Crie uma viagem logo abaixo, entre num grupo com o código ou carregue as viagens de exemplo.</p><button class="btn btn-wide" type="button" id="folderEx">${ic('list')}Ver viagens de exemplo</button>` : `<div class="eyebrow">Próximas (${next.length})</div>${next.length ? `<div class="trip-list">${next.map(t => card(t, 'proxima')).join('')}</div>` : '<p class="note" style="margin:0">Nenhuma viagem marcada. Crie uma abaixo.</p>'}`}
     ${past.length ? `<details><summary class="eyebrow" style="cursor:pointer;min-height:40px;display:flex;align-items:center">Realizadas (${past.length}) · toque para ver e repetir</summary><div class="trip-list" style="margin-top:8px">${past.map(t => card(t, 'feita')).join('')}</div></details>` : ''}
    </div></section>`;
}
function bindTripList() {
  document.querySelectorAll('[data-open]').forEach(b => b.onclick = () => openTrip(b.dataset.open));
  const fx = $('#folderEx'); if (fx) fx.onclick = () => { const d = [...document.querySelectorAll('#v-home details')].find(x => x.querySelector('#ex15')); if (d) { d.open = true; d.scrollIntoView({ behavior: 'smooth', block: 'center' }); } };
  const ft = $('#folderToggle'); if (ft) ft.onclick = () => { const o = !store.get('mb-folderOpen', false); store.set('mb-folderOpen', o); ft.parentElement.classList.toggle('open', o); ft.setAttribute('aria-expanded', o); ft.nextElementSibling.hidden = !o; };
  document.querySelectorAll('[data-rm]').forEach(b => b.onclick = () => {
    const t = TRIPS[b.dataset.rm]; if (!t) return;
    $('#modalRoot').innerHTML = `<div class="overlay center"><div class="incoming" style="border-color:var(--line)"><h2 style="margin:0;font-family:var(--f-display);font-size:26px">Remover “${esc(t.name)}”?</h2><p class="muted" style="margin:0">${t.guide && t.mode !== 'solo' && t.members > 1 ? 'Você sai do grupo e o papel de guia passa para outra pessoa.' : 'A viagem sai da sua pasta.'}</p><div class="row"><button class="btn" style="flex:1;color:var(--sos)" type="button" id="rmYes">Remover</button><button class="btn primary" style="flex:1" type="button" id="rmNo">Manter</button></div></div></div>`;
    $('#rmYes').onclick = () => { $('#modalRoot').innerHTML = ''; if (!t.gone) send({ t: 'join', code: t.code, member: memberPayload(t.guide ? 'guia' : t.role), snap: t.snap }), setTimeout(() => send({ t: 'leave' }), 600); dropTripLocal(t.code); showHome(); };
    $('#rmNo').onclick = () => $('#modalRoot').innerHTML = '';
  });
  document.querySelectorAll('[data-dup]').forEach(b => b.onclick = () => {
    const t = TRIPS[b.dataset.dup]; if (!t || !(t.snap || t.copy)) return toast('Abra a viagem uma vez para poder repetir');
    const tr = t.snap ? t.snap.trip : t.copy;
    const repeat = tripPhase(t) === 'feita';
    UI.draftNext = true; send({ t: 'create', trip: { name: repeat ? tr.name : tr.name + ' (cópia)', date: '', startTime: tr.startTime, mode: tr.mode, stops: tr.stops, checklist: tr.checklist, route: tr.route || null, postos: tr.postos || [] }, member: memberPayload('guia') });
    UI.afterCreate = true; toast(repeat ? 'Viagem repetida! Escolha a nova data em “Dados da viagem”.' : 'Viagem duplicada. Ajuste a data.', 6000);
  });
}
// cria as viagens de exemplo uma a uma e guarda na pasta
async function loadExamples(mode, n, every) {
  if (!UI.wsOk) return toast('Sem conexão com o servidor. Tente de novo.');
  const dates = exemploDatas(n, every); const pick = mode === 'solo' ? [1, 4, 5, 7, 8, 11, 2, 3, 6, 9] : [...Array(15).keys()];
  UI.batch = { codes: [] };
  for (let i = 0; i < n; i++) {
    const ex = EXEMPLOS[pick[i]];
    const stops = ex.st.map(([name, lat, lng, ty]) => ({ id: uid(), name, lat, lng, type: EX_TYPE[ty], note: '' }));
    await new Promise(res => { UI.batch.resolve = res; send({ t: 'create', trip: { name: ex.n, date: dates[i], startTime: '07:00', mode, stops }, member: memberPayload('guia') }); setTimeout(res, 4000); });
    toast(`Criando exemplos… ${i + 1} de ${n}`);
  }
  UI.batch = null;
  if (CODE) send({ t: 'join', code: CODE, member: memberPayload(), snap: TRIPS[CODE] && TRIPS[CODE].snap }); // volta para a viagem aberta
  toast(`${n} viagens de exemplo salvas na sua pasta. A rota é calculada quando você abre cada uma.`, 6000);
  showHome();
}
function goHome() { CODE = null; store.set('mb-code', null); ROOM = null; UI.road = false; renderRoad(); showHome(); }
// código pessoal: é o próprio identificador do aparelho, em grupos de 4 para ficar fácil de anotar
const myCode = () => ME.id.toUpperCase().replace(/[^A-Z0-9]/g, '').match(/.{1,4}/g).join('-');
function personalCodeHTML() {
  return `<details class="card"><summary style="font-weight:700;cursor:pointer;min-height:40px;display:flex;align-items:center">Meu código MotoBando · trocar de celular</summary>
   <p class="note">Com este código você recupera suas viagens em outro celular, ou depois de instalar o app de novo. Guarde num lugar seguro e não passe para ninguém.</p>
   <div class="code-box"><code style="font-size:18px;letter-spacing:.06em">${esc(myCode())}</code><button class="btn small" type="button" id="copyMy">${ic('copy')}Copiar</button></div>
   <a class="btn wa btn-wide" style="margin-top:10px" href="https://wa.me/?text=${encodeURIComponent('Meu código MotoBando (não compartilhar): ' + myCode())}" target="_blank" rel="noopener">${ic('wa')}Mandar para mim no WhatsApp</a>
   <form id="restoreForm" style="display:flex;flex-direction:column;gap:10px;margin-top:14px"><div class="field"><label for="rCode">Já usei o MotoBando em outro celular</label><input class="input" id="rCode" placeholder="Cole aqui o seu código" autocapitalize="characters"></div><button class="btn btn-wide" type="submit">${ic('refresh')}Trazer minhas viagens</button></form></details>`;
}
function bindPersonalCode() {
  const c = $('#copyMy'); if (c) c.onclick = () => copyText(myCode(), 'Código copiado');
  const f = $('#restoreForm'); if (f) f.onsubmit = async e => {
    e.preventDefault(); const id = $('#rCode').value.replace(/[^a-z0-9]/gi, '').toLowerCase(); if (id.length < 10) return toast('Código incompleto. Confira e tente de novo.');
    let who; try { who = await fetch('/api/quem-sou?user=' + id).then(r => r.json()); } catch (x) { return toast('Sem conexão. Tente de novo.'); }
    if (!who.trips) return toast('Não achei viagens com esse código. Confira se digitou certo.');
    ME.id = id; if (who.name) ME.name = who.name; saveMe(); TRIPS = {}; store.set('mb-trips', TRIPS); CODE = null; store.set('mb-code', null);
    toast(`Bem-vindo de volta, ${esc(who.name || 'motociclista')}! Trazendo ${who.trips} viage${who.trips === 1 ? 'm' : 'ns'}…`, 5000);
    try { ws && ws.close(); } catch (x) {} await syncTripsFromServer(); showHome();
  };
}
function memberPayload(role) { return { id: ME.id, name: ME.name, color: ME.color, sangue: ME.sangue || '', role: role || (meM() || {}).role || 'integrante', garupaOf: (meM() || {}).garupaOf || '', moto: ME.moto, checks: (meM() || {}).checks || {} }; }
function createTrip(mode) {
  const d = new Date(); d.setDate(d.getDate() + ((6 - d.getDay() + 7) % 7 || 7)); // próximo sábado
  const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  UI.draftNext = true; send({ t: 'create', trip: { name: mode === 'solo' ? 'Minha viagem' : 'Viagem do bando', date, startTime: '07:00', mode }, member: memberPayload('guia') });
  UI.afterCreate = true;
  toast('Criando a viagem…');
}
function syncMember() { if (ROOM && meM()) send({ t: 'member', patch: { moto: ME.moto, name: ME.name, color: ME.color, sangue: ME.sangue || '' } }); }

/* ================= NAVEGAÇÃO ENTRE ABAS ================= */
const TABS = [['mapa', 'Mapa', 'map'], ['viagem', 'Viagem', 'route'], ['sos', 'SOS', ''], ['moto', 'Moto', 'moto'], ['contas', 'Contas', 'wallet']];
function renderTabs() {
  $('#tabs').innerHTML = TABS.map(([k, n, i]) => k === 'sos' ? `<button class="tab tab-sos" role="tab" type="button" data-t="sos" aria-selected="${UI.tab === 'sos'}"><span class="sos-dot">SOS</span>Ajuda</button>` : `<button class="tab" role="tab" type="button" data-t="${k}" aria-selected="${UI.tab === k}">${ic(i)}${n}</button>`).join('');
  $('#tabs').querySelectorAll('.tab').forEach(b => b.onclick = () => go(b.dataset.t));
}
function go(t) {
  pushNav('trip:' + t);
  UI.tab = t;
  TABS.forEach(([k]) => $('#v-' + k).hidden = k !== t);
  renderTabs();
  if (t === 'mapa') { setTimeout(() => { map.invalidateSize(); if (!UI.fitted) { fitRoute(); UI.fitted = true; } updateMapOverlays(); }, 30); }
  if (t === 'viagem') renderViagem(); if (t === 'moto') renderMoto(); if (t === 'contas') renderContas(); if (t === 'sos') renderSOS();
}
function enterRoom() {
  $('#v-home').hidden = true; $('#v-plan').hidden = true; $('#tabs').hidden = false;
  initMap(); startGPS(); keepAwake(true);
  if (UI.afterCreate) { UI.afterCreate = false; go('viagem'); } else go(UI.tab || 'mapa');
  setTimeout(() => { if (ROOM && isGuide() && ROOM.trip.stops.length >= 2 && !ROOM.trip.route && !routing) { toast('Calculando a rota desta viagem…'); recalcRoute(); } }, 800);
}
function refresh() {
  if (!ROOM) return;
  const rs = riders(), ms = membersArr();
  $('#tripTitle').textContent = ROOM.trip.name;
  $('#tripSub').textContent = isSolo() ? `Solo${ms.length > 1 ? ' · com garupa' : ''}${ROOM.trip.route ? ' · ' + f0(ROOM.trip.route.dist_km) + ' km' : ''}` : `${rs.length} moto${rs.length > 1 ? 's' : ''} · ${ms.length} pessoa${ms.length > 1 ? 's' : ''}${ROOM.trip.route ? ' · ' + f0(ROOM.trip.route.dist_km) + ' km' : ''}`;
  drawRoute(); drawMembers(); loadRain();
  if (UI.tab === 'mapa') updateMapOverlays();
  // não redesenha formulários enquanto a pessoa digita
  const typing = document.activeElement && /INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName) && document.activeElement.type !== 'checkbox';
  if (!typing) { if (UI.tab === 'viagem') renderViagem(); if (UI.tab === 'contas') renderContas(); if (UI.tab === 'moto') renderMoto(); }
  checkBig();
  if (UI.road) renderRoad();
}
async function loadRain() {
  const R = routeModel(); if (!R) { UI.rain = null; return; }
  const key = _Rkey + ROOM.trip.date + ROOM.trip.startTime + Math.floor(Date.now() / 36e5);
  if (UI.rainKey === key) return; UI.rainKey = key;
  try { UI.rain = await GEO.rainAlong(R, km => timeAt(km) || new Date()); drawRain(); updateMapOverlays(); if (UI.tab === 'viagem') renderViagem(); } catch (e) { UI.rain = null; }
}

/* ================= EDIÇÃO DO ROTEIRO (guia) ================= */
function patchTrip(p) { send({ t: 'trip', patch: p }); }
function addStop(s) {
  if (!isGuide()) return toast('Só o guia mexe no roteiro');
  const stops = [...ROOM.trip.stops];
  const type = s.type || (stops.length === 0 ? 'saida' : stops.length === 1 ? 'pernoite' : 'parada');
  const st = { id: uid(), name: s.name, lat: s.lat, lng: s.lng, type, note: '' };
  // se já existe destino (pernoite no fim), a nova parada entra antes dele
  if (stops.length >= 2 && stops[stops.length - 1].type === 'pernoite' && type !== 'pernoite') stops.splice(stops.length - 1, 0, st); else stops.push(st);
  ROOM.trip.stops = stops;
  patchTrip({ stops }); toast(`Parada adicionada: ${esc(s.name)}`);
  recalcRoute(stops);
}
let routing = false;
async function recalcRoute(stops) {
  stops = stops || ROOM.trip.stops;
  if (stops.length < 2) { patchTrip({ route: null, postos: [] }); return; }
  routing = true; if (UI.tab === 'viagem') renderViagem();
  try {
    const r = await GEO.route(stops);
    ROOM.trip.route = r; _Rkey = ''; // local imediato
    patchTrip({ route: r });
    toast(`Rota pronta: ${f0(r.dist_km)} km. Procurando postos no caminho…`);
    const R = routeModel();
    try { const postos = await GEO.postosAlongRoute(R); ROOM.trip.postos = postos; patchTrip({ postos }); toast(postos.length === 1 ? '1 posto encontrado na rota' : `${postos.length} postos encontrados na rota`); }
    catch (e) { toast('Rota pronta, mas não consegui buscar os postos agora. Tente “Atualizar postos” depois.'); }
  } catch (e) { toast('Não consegui calcular a rota agora: ' + esc(e.message)); }
  routing = false; UI.fitted = false; if (UI.tab === 'viagem') renderViagem();
}

/* ================= VIAGEM ================= */
function shareRouteText() {
  const st = stopsKm();
  return `MotoBando · ${ROOM.trip.name}\n${fmtDate(ROOM.trip.date)} · saída ${ROOM.trip.startTime}${ROOM.trip.route ? ' · ' + f0(ROOM.trip.route.dist_km) + ' km' : ''}\n\n` +
    st.map((s, i) => `${s.km != null && ROOM.trip.route ? hhmm(timeAt(s.km)) : (i + 1) + '.'}  ${s.name}${s.km != null ? ' (km ' + f0(s.km) + ')' : ''}`).join('\n') +
    `\n\nRoteiro e mapa: ${location.origin}/r/${ROOM.code}`;
}
function shareAllText() { return shareRouteText() + `\n\nPara ir junto: abra o link, faça seu cadastro (nome e moto) e entre com o código ${ROOM.code}`; }
function shareCodeText() { return `Bora rodar junto? Entra no meu bando no MotoBando.\nViagem: ${ROOM.trip.name}, ${fmtDate(ROOM.trip.date)}\n\n1. Abra o link: ${location.origin}/r/${ROOM.code}\n2. Faça seu cadastro (nome e moto)\n3. Entre com o código: ${ROOM.code}`; }
const waLink = t => 'https://wa.me/?text=' + encodeURIComponent(t);
function fmtDate(d) { if (!d) return 'data a combinar'; const x = new Date(d + 'T12:00:00'); return x.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' }); }
function copyText(t, ok) { (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(() => toast(ok)).catch(() => toast('Não deu para copiar. Use o botão do WhatsApp.')); }

function renderViagem() {
  if (!ROOM) return;
  const solo = isSolo(), G = isGuide(), mm = meM(), T = tripPlan(), R = routeModel(), draft = isDraft();
  const st = stopsKm(), ms = membersArr(), rs = riders();
  const tot = ROOM.trip.checklist.length, myDone = ROOM.trip.checklist.filter(c => (mm.checks || {})[c.id]).length;
  const doneOf = m => ROOM.trip.checklist.filter(c => (m.checks || {})[c.id]).length;
  const ready = ms.filter(m => doneOf(m) >= tot).length;
  const items = st.map(s => ({ k: s.km != null ? s.km : 1e9 + s.i, s }));
  if (T) T.P.stops.forEach(f => { if (!st.some(s => s.type === 'abastecer' && s.km != null && Math.abs(s.km - f.km) < 1)) items.push({ k: f.km + 0.01, fuel: f }); });
  items.sort((a, b) => a.k - b.k);
  const wet = UI.rain ? UI.rain.filter(r => r.prob >= 50) : [];
  $('#v-viagem').innerHTML = `<div class="pad">
  <div class="sign"><div class="eyebrow">${solo ? 'Viagem solo' : 'Viagem do bando'} · ${esc(fmtDate(ROOM.trip.date))}</div><h1>${esc(ROOM.trip.name)}</h1>
   <div class="sign-row"><span><b class="num">${R ? f0(R.total) : '—'}</b> km</span><span>Saída <b>${esc(ROOM.trip.startTime)}</b></span>${R ? `<span>Chegada <b class="num">${hhmm(timeAt(R.total))}</b></span>` : ''}<span><b>${rs.length}</b> moto${rs.length > 1 ? 's' : ''} · <b>${ms.length}</b> pessoa${ms.length > 1 ? 's' : ''}</span></div></div>
  ${ROOM.trip.status === 'andamento' ? `<div class="active-trip" style="cursor:default"><span class="live-dot"></span><span style="flex:1;min-width:0"><small>Viagem em andamento</small><b>Boa estrada!</b><span>Começou às ${hhmm(new Date(ROOM.trip.startedAt || Date.now()))}</span></span></div>` : ''}
  ${G && ROOM.trip.status !== 'andamento' ? `<button class="btn primary btn-wide start-btn" type="button" id="startTrip">${ic('flag')}Começar a viagem agora</button>` : ''}
  ${G && ROOM.trip.status === 'andamento' ? `<button class="btn btn-wide" type="button" id="endTrip">${ic('check')}Encerrar a viagem</button>` : ''}
  ${G ? `<details class="card" ${ROOM.trip.stops.length ? '' : 'open'}><summary style="font-weight:700;cursor:pointer;min-height:32px">Nome, data e horário de saída</summary>
   <form id="tripForm" style="display:flex;flex-direction:column;gap:12px;margin-top:12px">
    <div class="field"><label for="tName">Nome</label><input class="input" id="tName" maxlength="60" value="${esc(ROOM.trip.name)}"></div>
    <div class="row"><div class="field"><label for="tDate">Data</label><input class="input" id="tDate" type="date" value="${esc(ROOM.trip.date || '')}"></div><div class="field"><label for="tTime">Saída</label><input class="input" id="tTime" type="time" value="${esc(ROOM.trip.startTime)}"></div></div>
    </form></details>` : ''}
  ${G ? `<div class="card mode-switch"><div class="toggle-row"><div><b>${solo ? 'Viagem solo' : 'Viagem em grupo'}</b><div class="note">${solo ? 'Ligue para virar grupo: você vira o guia e manda a rota e o código para quem vai junto.' : 'Você é o guia. Desligue para voltar a ser viagem solo.'}</div></div><input type="checkbox" class="switch" id="modeSwitch" ${solo ? '' : 'checked'} aria-label="Viagem em grupo"></div></div>` : ''}


  <section style="display:flex;flex-direction:column;gap:10px">
   <div class="sec-h"><h2>Roteiro e paradas</h2>${G ? '<span class="pill green">Você edita</span>' : '<span class="pill">Definido pelo guia</span>'}</div>
   ${routing ? `<div class="banner" style="box-shadow:none"><span class="spinner"></span><div>Calculando a rota e procurando postos…</div></div>` : ''}
   ${wet.length ? `<div class="banner blue" style="box-shadow:none">${ic('rain')}<div><b>Chuva provável na rota:</b> ${wet.slice(0, 3).map(w => `km ${f0(w.km)} (${w.prob}%, ${hhmm(w.when)})`).join(', ')}.</div></div>` : ''}
   <div class="card">
    ${st.length ? `<ol class="timeline">${items.map(it => {
      if (it.fuel) { const f = it.fuel; return `<li class="tl fuel"><div class="time num">${hhmm(timeAt(f.km))}</div><div class="rail"><span class="dot">${ic('fuel')}</span></div><div class="body"><b>Abastecer${solo ? '' : ' (grupo)'}: ${esc(f.name)}</b><span>Km ${f0(f.km)} · calculado pela moto ${solo || rs.length < 2 ? 'sua' : 'que roda menos: ' + esc(T.base.name)} · depois, ${f.nextGap} km até o próximo posto</span></div><div></div></li>`; }
      const s = it.s, t = STOPTYPES[s.type] || STOPTYPES.parada;
      return `<li class="tl"><div class="time num">${s.km != null && R ? hhmm(timeAt(s.km)) : (s.i + 1) + 'ª'}</div><div class="rail"><span class="dot">${ic(t.icon)}</span></div><div class="body"><b>${esc(s.name)}</b><span>${s.km != null ? 'Km ' + f0(s.km) + ' · ' : ''}${t.n}${t.min ? ' · ' + t.min + ' min' : ''}</span>
       ${G ? `<div class="row" style="margin-top:8px;gap:6px"><select class="input" data-type="${s.id}" style="width:auto;min-height:46px;padding:8px">${Object.entries(STOPTYPES).map(([k, v]) => `<option value="${k}" ${k === s.type ? 'selected' : ''}>${v.n}</option>`).join('')}</select>
        <button class="iconbtn" type="button" data-up="${s.id}" aria-label="Subir" ${s.i === 0 ? 'disabled' : ''}>${ic('up')}</button><button class="iconbtn" type="button" data-down="${s.id}" aria-label="Descer" ${s.i === st.length - 1 ? 'disabled' : ''}>${ic('down')}</button><button class="iconbtn" type="button" data-del="${s.id}" aria-label="Remover">${ic('trash')}</button></div>` : ''}</div><div></div></li>`;
    }).join('')}</ol>` : `<p class="empty">${G ? 'Comece pela saída: busque o lugar, use sua localização ou toque no mapa.' : 'O guia ainda não montou o roteiro.'}</p>`}
    ${G ? `<div style="display:flex;flex-direction:column;gap:10px;border-top:1px solid var(--line);padding-top:12px;margin-top:6px">
      <form id="searchForm" class="row"><div class="field"><label for="sQ">${st.length ? 'Adicionar parada' : 'Ponto de saída'}</label><input class="input" id="sQ" placeholder="Ex.: Monte Verde MG, Pico Agudo…" required></div><button class="btn primary" type="submit">${ic('search')}Buscar</button></form>
      <div id="searchRes" class="results"></div>
      <div class="row"><button class="btn" type="button" id="pickMap" style="flex:1">${ic('pin')}Tocar no mapa</button><button class="btn" type="button" id="useMe" style="flex:1">${ic('gps')}Minha localização</button></div>
      ${st.length >= 2 ? `<button class="btn ghost" type="button" id="reroute">${ic('refresh')}Recalcular rota e postos</button>` : ''}
    </div>` : ''}
   </div>
  </section>

  <section style="display:flex;flex-direction:column;gap:10px">
   <div class="sec-h"><h2>${solo ? 'Quem vai' : 'O bando'}</h2><span class="pill">${ms.filter(m => m.online).length} online</span></div>
   <div class="card">${ms.map(m => {
      const role = m.role === 'guia' ? (solo ? 'Piloto' : 'Guia') : m.role === 'garupa' ? 'Garupa' : '';
      const pilot = m.role === 'garupa' && m.garupaOf ? ROOM.members[m.garupaOf] : null;
      const sub = m.role === 'garupa' ? (pilot ? `Na garupa de ${pilot.name} · divide os gastos` : 'Garupa: escolha de quem') : ((MOTOS[(m.moto || {}).model] || {}).n || 'Moto') + (garupaOf(m.id) ? ' · com garupa' : '');
      const d = doneOf(m);
      return `<div class="member">${m.id === ME.id && ME.photo ? `<img class="avatar" src="${ME.photo}" alt="">` : `<div class="avatar" style="background:${m.color}">${esc(ini(m.name))}</div>`}<div class="grow"><b>${esc(m.name)}${m.id === ME.id ? ' (você)' : ''}</b> ${role ? `<span class="pill ${role === 'Garupa' ? '' : 'green'}">${role}</span>` : ''} <span class="pill ${m.online ? 'green' : ''}" style="padding:1px 6px">${m.online ? 'online' : 'offline'}</span>${m.sangue ? ` <span class="pill blood" title="Tipo sanguíneo">${ic('drop')}${esc(m.sangue)}</span>` : ''}<div class="sub">${esc(sub)}</div></div><div style="text-align:right"><div class="small num ${d >= tot ? 'pos' : 'muted'}">${d >= tot ? 'Pronto' : d + '/' + tot}</div><div class="prog"><i style="width:${tot ? d / tot * 100 : 0}%"></i></div></div></div>`;
    }).join('')}
    <div style="display:flex;flex-direction:column;gap:10px;margin-top:10px">
     <div class="field"><label for="myRole">Como eu vou</label><select class="input" id="myRole">${mm.role === 'guia' ? '<option value="guia" selected>Pilotando (guia)</option>' : `<option value="integrante" ${mm.role === 'integrante' ? 'selected' : ''}>Pilotando</option>`}${mm.role !== 'guia' ? rs.filter(r => r.id !== ME.id).map(r => `<option value="g:${r.id}" ${mm.role === 'garupa' && mm.garupaOf === r.id ? 'selected' : ''}>De garupa com ${esc(r.name)}</option>`).join('') : ''}</select></div>
     ${G && rs.length > 1 && !solo ? `<div class="field"><label for="passGuide">Passar o papel de guia</label><select class="input" id="passGuide"><option value="">Continuar como guia</option>${rs.filter(r => r.id !== ME.id).map(r => `<option value="${r.id}">${esc(r.name)}</option>`).join('')}</select></div>` : ''}
     <p class="note" style="margin:0">O garupa entra com o mesmo código, escolhe “Vou de garupa” e aparece junto da moto do piloto (+1). Ele vê tudo e entra na divisão de gastos.</p>
    </div>
   </div>
  </section>

  <section style="display:flex;flex-direction:column;gap:10px">
   <div class="sec-h"><h2>Checklist de saída</h2><span class="pill ${ready === ms.length ? 'green' : 'amber'}">${ready} de ${ms.length} prontos</span></div>
   <div class="card"><div class="eyebrow" style="margin-bottom:4px">O seu · ${myDone}/${tot}</div>
    ${ROOM.trip.checklist.map(c => `<label class="check"><input type="checkbox" data-ck="${esc(c.id)}" ${(mm.checks || {})[c.id] ? 'checked' : ''}><span>${esc(c.t)}</span>${G ? `<button class="del iconbtn" style="border:0;background:none;margin-left:auto" type="button" data-ckdel="${esc(c.id)}" aria-label="Tirar item">${ic('x')}</button>` : ''}</label>`).join('')}
    ${G ? `<form id="ckForm" class="row" style="margin-top:10px"><div class="field"><label for="ckText">Item novo${solo ? '' : ' para o grupo'}</label><input class="input" id="ckText" maxlength="70" placeholder="Ex.: Viseira limpa" required></div><button class="btn" type="submit">${ic('plus')}Incluir</button></form>` : ''}
   </div>
  </section>

  ${!solo && T && rs.length > 1 ? `<section style="display:flex;flex-direction:column;gap:10px">
   <div class="sec-h"><h2>Combustível do grupo</h2></div>
   <div class="card"><div class="banner amber" style="box-shadow:none;margin-bottom:8px">${ic('fuel')}<div>As paradas do grupo usam a moto que <b>roda menos com o que tem no tanque</b>: ${esc(T.base.name)}, ${f0(T.P.full)} km por tanque.</div></div>
    <table class="fuel-table">${rs.map(m => { const mo = motoOfRider(m); const P = FUEL.plan(mo, !!garupaOf(m.id), ROOM.trip.postos || [], R ? R.total : 0); return `<tr><td><b>${esc(m.name)}</b> ${m.id === T.base.id ? '<span class="pill amber">Base do cálculo</span>' : ''}<br><span class="note">${esc((MOTOS[mo.model] || {}).n || 'Moto')}${garupaOf(m.id) ? ' · com garupa' : ''} · sai com ${mo.fuel || 100}%</span></td><td class="num"><b>${f0(P.full)} km</b><br><span class="note">por tanque</span></td></tr>`; }).join('')}</table>
    <p class="note" style="margin:8px 0 0">${(ROOM.trip.postos || []).length} postos encontrados a até 1 km da rota. ${T.P.gap.len ? `Maior trecho sem posto: ${T.P.gap.len} km (${esc(T.P.gap.a)} → ${esc(T.P.gap.b)}).` : ''}</p></div>
  </section>` : ''}

  ${!solo ? `<section style="display:flex;flex-direction:column;gap:10px">
   <div class="sec-h"><h2>Modo comboio</h2></div>
   <div class="card" style="display:flex;flex-direction:column;gap:14px">
    <div class="toggle-row"><div><b>Aviso no mapa quando alguém ficar para trás</b><div class="note">${G ? 'Vale para o grupo todo' : 'Definido pelo guia'}</div></div><select class="input" id="gapSel" style="width:auto" ${G ? '' : 'disabled'}>${[3, 5, 8, 12].map(v => `<option value="${v}" ${ROOM.trip.gap == v ? 'selected' : ''}>${v} km</option>`).join('')}</select></div>
    <div class="toggle-row"><div><b>Alerta de tela cheia</b> <span class="pill red">Opcional</span><div class="note">A tela pisca em vermelho quando alguém passa do limite</div></div><input type="checkbox" class="switch" id="baOn" ${ME.bigAlert.on ? 'checked' : ''}></div>
    ${ME.bigAlert.on ? `<div class="toggle-row"><span>Disparar quando passar de</span><select class="input" id="baKm" style="width:auto">${[5, 10, 15, 20].map(v => `<option value="${v}" ${ME.bigAlert.km == v ? 'selected' : ''}>${v} km</option>`).join('')}</select></div>
    <div class="toggle-row"><span>Som e vibração</span><input type="checkbox" class="switch" id="baSound" ${ME.bigAlert.sound ? 'checked' : ''}></div>
    <button class="btn btn-wide" type="button" id="baTest">${ic('alert')}Testar o alerta</button>` : ''}
   </div></section>` : ''}

  <section style="display:flex;flex-direction:column;gap:10px">
   <div class="sec-h"><h2>Configurações</h2></div>
   <div class="card" style="display:flex;flex-direction:column;gap:14px">
    <div class="toggle-row"><div><b>Tela sempre acesa</b><div class="note">O GPS só atualiza com o app aberto. Deixe o celular no suporte com o app na tela.</div></div><input type="checkbox" class="switch" id="awake" ${ME.keepAwake ? 'checked' : ''}></div>
    <div class="toggle-row"><div><b>Mostrar postos no mapa</b></div><input type="checkbox" class="switch" id="showPostos" ${UI.showPostos ? 'checked' : ''}></div>
    <div class="toggle-row"><div><b>Simular meu GPS na rota</b><div class="note">Para testar em casa: seu capacete anda pela rota e o bando vê.</div></div><input type="checkbox" class="switch" id="simOn" ${SIM.on ? 'checked' : ''} ${R ? '' : 'disabled'}></div>
    ${SIM.on ? `<div class="toggle-row"><span>Velocidade da simulação</span><div class="seg" role="group">${[[60, '60 km/h'], [600, '10x'], [3000, '50x']].map(([v, l]) => `<button type="button" data-sim="${v}" aria-pressed="${SIM.speed == v}">${l}</button>`).join('')}</div></div>` : ''}
   </div>
  </section>

  <section class="card" style="display:flex;flex-direction:column;gap:12px">
   <div><div class="eyebrow">Compartilhar</div><b>${solo ? 'Mande o roteiro para quem fica em casa (o código vai junto, para o garupa entrar)' : 'Mande o roteiro e o código para o bando'}</b></div>
   <a class="btn wa btn-wide" href="${waLink(shareAllText())}" target="_blank" rel="noopener">${ic('wa')}Enviar pelo WhatsApp</a>
   <div class="code-box"><div><div class="note">Código do grupo</div><code>${esc(ROOM.code)}</code></div><button class="btn small" type="button" id="copyCode">${ic('copy')}Copiar</button></div>
  </section>

  <div class="trip-actions">
   ${G ? `<button class="btn primary btn-wide" type="button" id="saveTrip">${ic('check')}${draft ? 'Salvar em Minhas viagens' : 'Salvar'}</button>` : ''}
   <button class="btn btn-wide" type="button" id="exitTrip">${ic('logout')}Sair da viagem</button>
  </div>
 </div>`;
  const v = $('#v-viagem');
  const tf = $('#tripForm'); if (tf) { tf.onsubmit = e => { e.preventDefault(); saveTripNow(); }; tf.oninput = () => { UI.tripDirty = true; }; }
  const svB = $('#saveTrip'); if (svB) svB.onclick = () => { saveTripNow(); renderViagem(); };
  $('#exitTrip').onclick = () => exitTripPrompt();
  const stB = $('#startTrip'); if (stB) stB.onclick = () => { ROOM.trip.status = 'andamento'; ROOM.trip.startedAt = Date.now(); patchTrip({ status: 'andamento' }); toast('Viagem em andamento! O bando foi avisado.'); go('mapa'); if (!UI.nav) { UI.nav = true; UI.userMovedMap = 0; keepAwake(true); updateMapOverlays(); followMe(); } };
  const enB = $('#endTrip'); if (enB) enB.onclick = () => { ROOM.trip.status = 'encerrada'; patchTrip({ status: 'encerrada' }); toast('Viagem encerrada. Ela fica nas viagens já feitas.'); renderViagem(); };
  const mSw = $('#modeSwitch'); if (mSw) mSw.onchange = e => {
    const toGroup = e.target.checked; ROOM.trip.mode = toGroup ? 'grupo' : 'solo'; patchTrip({ mode: ROOM.trip.mode });
    if (toGroup) showInvite(); else toast('Agora é viagem solo');
  };
  $('#copyCode').onclick = () => copyText(ROOM.code, 'Código copiado');
  const sf = $('#searchForm'); if (sf) sf.onsubmit = async e => {
    e.preventDefault(); const q = $('#sQ').value.trim(); const box = $('#searchRes'); box.innerHTML = '<p class="empty"><span class="spinner"></span> Buscando…</p>';
    try {
      const near = ROOM.trip.stops.length ? ROOM.trip.stops[ROOM.trip.stops.length - 1] : myPos;
      const res = await GEO.search(q, near);
      box.innerHTML = res.length ? res.map((r, i) => `<button type="button" data-res="${i}">${esc(r.name)}<small>${esc(r.display)}</small></button>`).join('') : '<p class="empty">Nada encontrado. Tente com a cidade, ex.: “Pico Agudo, Santo Antônio do Pinhal”.</p>';
      box.querySelectorAll('[data-res]').forEach(b => b.onclick = () => { const r = res[+b.dataset.res]; box.innerHTML = ''; $('#sQ').value = ''; addStop(r); });
    } catch (err) { box.innerHTML = `<p class="empty">Não consegui buscar agora (${esc(err.message)}).</p>`; }
  };
  const pm = $('#pickMap'); if (pm) pm.onclick = () => { UI.picking = true; go('mapa'); $('#map').classList.add('picking'); updateMapOverlays(); };
  const um = $('#useMe'); if (um) um.onclick = async () => { if (!myPos) return toast('Ainda sem GPS. Permita a localização.'); addStop({ name: await GEO.reverse(myPos.lat, myPos.lng), lat: myPos.lat, lng: myPos.lng }); };
  const rr = $('#reroute'); if (rr) rr.onclick = () => recalcRoute();
  const move = (id, dir) => { const s = [...ROOM.trip.stops]; const i = s.findIndex(x => x.id === id), j = i + dir; if (j < 0 || j >= s.length) return; [s[i], s[j]] = [s[j], s[i]]; ROOM.trip.stops = s; patchTrip({ stops: s }); recalcRoute(s); };
  v.querySelectorAll('[data-up]').forEach(b => b.onclick = () => move(b.dataset.up, -1));
  v.querySelectorAll('[data-down]').forEach(b => b.onclick = () => move(b.dataset.down, 1));
  v.querySelectorAll('[data-del]').forEach(b => b.onclick = () => { const s = ROOM.trip.stops.filter(x => x.id !== b.dataset.del); ROOM.trip.stops = s; patchTrip({ stops: s }); recalcRoute(s); toast('Parada removida'); });
  v.querySelectorAll('[data-type]').forEach(sel => sel.onchange = () => { const s = ROOM.trip.stops.map(x => x.id === sel.dataset.type ? { ...x, type: sel.value } : x); patchTrip({ stops: s }); });
  v.querySelectorAll('[data-ck]').forEach(c => c.onchange = () => { const checks = { ...(mm.checks || {}), [c.dataset.ck]: c.checked }; mm.checks = checks; send({ t: 'member', patch: { checks } }); });
  v.querySelectorAll('[data-ckdel]').forEach(b => b.onclick = e => { e.preventDefault(); patchTrip({ checklist: ROOM.trip.checklist.filter(c => c.id !== b.dataset.ckdel) }); });
  const cf = $('#ckForm'); if (cf) cf.onsubmit = e => { e.preventDefault(); patchTrip({ checklist: [...ROOM.trip.checklist, { id: uid(), t: $('#ckText').value.trim() }] }); };
  $('#myRole').onchange = e => { const val = e.target.value; if (val.startsWith('g:')) send({ t: 'member', patch: { role: 'garupa', garupaOf: val.slice(2) } }); else if (val === 'integrante') send({ t: 'member', patch: { role: 'integrante', garupaOf: '' } }); };
  const pg = $('#passGuide'); if (pg) pg.onchange = e => { if (e.target.value) { send({ t: 'guide', id: e.target.value }); toast('Papel de guia passado'); } };
  const gs = $('#gapSel'); if (gs) gs.onchange = e => patchTrip({ gap: +e.target.value });
  const bo = $('#baOn'); if (bo) bo.onchange = e => { ME.bigAlert.on = e.target.checked; saveMe(); renderViagem(); if (!ME.bigAlert.on) closeBig(); };
  const bk = $('#baKm'); if (bk) bk.onchange = e => { ME.bigAlert.km = +e.target.value; UI.bigSeen = {}; saveMe(); };
  const bs = $('#baSound'); if (bs) bs.onchange = e => { ME.bigAlert.sound = e.target.checked; saveMe(); };
  const bt = $('#baTest'); if (bt) bt.onclick = () => showBig({ name: 'Fulano', id: 'teste' }, ME.bigAlert.km + 1, true);
  $('#awake').onchange = e => { ME.keepAwake = e.target.checked; saveMe(); keepAwake(e.target.checked); };
  $('#showPostos').onchange = e => { UI.showPostos = e.target.checked; drawRoute(); };
  $('#simOn').onchange = e => { setSim(e.target.checked); renderViagem(); if (SIM.on) toast('Simulando: vá para o mapa e toque em Navegar'); };
  v.querySelectorAll('[data-sim]').forEach(b => b.onclick = () => { SIM.speed = +b.dataset.sim; renderViagem(); });
}

/* salvar / sair da viagem */
const isDraft = () => !!(ROOM && TRIPS[ROOM.code] && TRIPS[ROOM.code].saved === false);
function saveTripNow(silent) {
  if (!ROOM) return;
  if (isGuide() && $('#tName')) { const name = $('#tName').value.trim() || ROOM.trip.name, date = $('#tDate').value, startTime = $('#tTime').value || '07:00'; if (name !== ROOM.trip.name || date !== (ROOM.trip.date || '') || startTime !== ROOM.trip.startTime) patchTrip({ name, date, startTime }); }
  UI.tripDirty = false;
  saveTripLocal(ROOM); if (TRIPS[ROOM.code]) { TRIPS[ROOM.code].saved = true; store.set('mb-trips', TRIPS); }
  if (!silent) toast('Viagem salva em Minhas viagens');
}
function exitTripPrompt(after) {
  if (!ROOM) return after ? after() : showHome();
  const done = () => { $('#modalRoot').innerHTML = ''; goHome(); if (after) after(); };
  const draft = isDraft(), dirty = UI.tripDirty;
  $('#modalRoot').innerHTML = `<div class="overlay center"><div class="incoming" style="border-color:var(--line)">
   <h2 style="margin:0;font-family:var(--f-display);font-size:26px">${draft ? 'Salvar esta viagem?' : 'Sair da viagem?'}</h2>
   <p class="muted" style="margin:0">${draft ? 'Salvando, ela fica guardada em Minhas viagens e você pode abrir de novo quando quiser.' : dirty ? 'Você mudou nome, data ou horário. Quer salvar antes de sair?' : 'Ela continua guardada em Minhas viagens.'}</p>
   <div style="display:flex;flex-direction:column;gap:10px">
    <button class="btn primary btn-wide" type="button" id="exSave">${ic('check')}Salvar e sair</button>
    <button class="btn btn-wide" type="button" id="exNo" style="color:var(--sos)">${draft ? 'Sair sem salvar (apagar)' : 'Sair sem salvar'}</button>
    <button class="btn ghost btn-wide" type="button" id="exBack">Continuar na viagem</button>
   </div></div></div>`;
  $('#exSave').onclick = () => { saveTripNow(true); toast('Viagem salva em Minhas viagens'); done(); };
  $('#exNo').onclick = () => {
    UI.tripDirty = false;
    if (draft) { const code = ROOM.code; $('#modalRoot').innerHTML = ''; setSim(false); send({ t: 'leave' }); dropTripLocal(code); CODE = null; ROOM = null; store.set('mb-code', null); store.set('mb-room', null); showHome(); toast('Viagem descartada'); if (after) after(); }
    else done();
  };
  $('#exBack').onclick = () => $('#modalRoot').innerHTML = '';
}
const needExitPrompt = () => !!ROOM && (isDraft() || UI.tripDirty);

function showInvite() {
  $('#modalRoot').innerHTML = `<div class="overlay"><div class="modal" role="dialog" aria-label="Convidar o bando">
   <div class="sec-h"><h2>Virou viagem em grupo!</h2><button class="iconbtn" type="button" id="invX" aria-label="Fechar">${ic('x')}</button></div>
   <p class="muted" style="margin:0">Você agora é o guia. A rota e as paradas já estão montadas. Mande o convite: quem receber faz o cadastro (nome e moto) e entra com o código.</p>
   <div class="code-box"><div><div class="note">Código do grupo</div><code>${esc(ROOM.code)}</code></div></div>
   <a class="btn wa btn-wide" href="${waLink(shareAllText())}" target="_blank" rel="noopener">${ic('wa')}Enviar convite pelo WhatsApp</a>
   <button class="btn btn-wide" type="button" id="invOk">Depois eu mando</button></div></div>`;
  $('#invX').onclick = $('#invOk').onclick = () => $('#modalRoot').innerHTML = '';
}

/* ================= MOTO ================= */
function renderMoto() {
  if (!ROOM) return;
  const mo = ME.moto, m = FUEL.motoSpec(mo), R = routeModel(), mm = meM();
  const amGarupa = mm && mm.role === 'garupa';
  const P = R ? FUEL.plan(mo, !!garupaOf(ME.id), ROOM.trip.postos || [], R.total) : null;
  const F = myFuel();
  const oilLeft = ME.lastOil + ME.oilEvery - ME.odo;
  $('#v-moto').innerHTML = `<div class="pad">
  ${amGarupa ? `<div class="banner" style="box-shadow:none">${ic('users')}<div>Você está indo de <b>garupa</b>. O combustível é calculado pela moto de quem pilota.</div></div>` : ''}
  <section style="display:flex;flex-direction:column;gap:10px">
   <div class="sec-h"><h2>Minha moto</h2></div>
   <div class="field"><label for="meName">Meu nome no grupo</label><input class="input" id="meName" maxlength="30" value="${esc(ME.name)}"></div>
   <p class="note" style="margin:0">Escolha a marca e depois o modelo: a ficha aparece sozinha.</p>
   ${motoPickerHTML('m', mo.model)}
   ${mo.model === 'outra' ? `<div class="row"><div class="field"><label for="oTank">Tanque (L)</label><input class="input num" id="oTank" type="number" inputmode="decimal" step="0.1" value="${mo.tanque}"></div><div class="field"><label for="oKml">Consumo (km/L)</label><input class="input num" id="oKml" type="number" inputmode="decimal" step="0.5" value="${mo.kmlBase}"></div></div>` : `
   <div class="spec-grid">
    ${m.el ? `<div class="spec"><small>Motor</small><b>Elétrico</b></div>
    <div class="spec"><small>Potência</small><b class="num">${f1(m.cv)}<em>cv</em></b></div>
    <div class="spec"><small>Bateria</small><b class="num">${f1(m.el.bat)}<em>kWh</em></b></div>
    <div class="spec"><small>Autonomia</small><b class="num">${m.el.max > m.el.auton ? m.el.auton + '–' + m.el.max : m.el.auton}<em>km</em></b></div>` : `<div class="spec"><small>Cilindrada</small><b class="num">${f1(m.cc)}<em>cc</em></b></div>
    <div class="spec"><small>Potência</small><b class="num">${f1(m.cv)}<em>cv</em></b></div>
    <div class="spec"><small>Tanque</small><b class="num">${f1(m.tanque)}<em>L</em></b></div>
    <div class="spec"><small>Consumo médio</small><b class="num">${f1(m.kml)}<em>km/L</em></b></div>`}
   </div><p class="note" style="margin:0">${m.el ? 'Moto elétrica: o app usa a menor autonomia como alcance de uma carga para planejar as paradas. Os postos mostrados são de combustível; confira antes onde recarregar.' : 'Dados de fábrica aproximados. Se souber o seu consumo real, informe abaixo.'}</p>`}
  </section>
  ${amGarupa ? '' : `
  <section class="card" style="display:flex;flex-direction:column;gap:12px">
   <div class="eyebrow">Combustível agora</div>
   <div class="stepper"><button type="button" id="fuelDn" aria-label="Menos">${ic('minus')}</button><output class="num" id="fuelLbl">${F ? f0(F.pct) : mo.fuel}%</output><button type="button" id="fuelUp" aria-label="Mais">${ic('plus')}</button></div>
   <button class="btn primary btn-wide" type="button" id="filled">${ic('fuel')}Abasteci: tanque cheio</button>
   <div class="toggle-row"><span>Com bagagem / baú</span><input type="checkbox" class="switch" id="bagagem" ${mo.bagagem ? 'checked' : ''}></div>
   <div class="toggle-row"><span>Ritmo</span><div class="seg" role="group">${['tranquilo', 'normal', 'esportivo'].map(e => `<button type="button" data-e="${e}" aria-pressed="${mo.estilo === e}">${e[0].toUpperCase() + e.slice(1)}</button>`).join('')}</div></div>
   <div class="row"><div class="field"><label for="realK">Meu consumo real (km/L)</label><input class="input num" id="realK" type="number" inputmode="decimal" step="0.5" min="0" placeholder="${m.kml}" value="${mo.real || ''}"></div>
    <div class="field"><label for="preco">Litro (R$)</label><input class="input num" id="preco" type="number" inputmode="decimal" step="0.01" value="${ME.preco}"></div></div>
   ${garupaOf(ME.id) ? `<p class="note" style="margin:0">Com garupa (${esc(garupaOf(ME.id).name)}): o cálculo já considera o peso extra.</p>` : ''}
  </section>
  <section style="display:flex;flex-direction:column;gap:10px">
   <div class="sec-h"><h2>Nesta rota</h2>${R ? `<span class="pill">${f0(R.total)} km</span>` : ''}</div>
   ${P ? `<div class="big-result"><div><small>1 tanque rende</small><b class="num">${f0(P.full)} km</b></div><div><small>Gasolina</small><b class="num">${f1(P.liters)} L</b></div><div><small>Custo</small><b class="num">${brl(P.liters * ME.preco).replace(/,\d\d$/, '')}</b></div></div>
   <div class="card"><div class="eyebrow" style="margin-bottom:6px">Onde abastecer (postos reais da rota)</div>
    ${P.stops.length ? P.stops.map(s => `<div class="member"><div class="avatar" style="background:var(--amber)">${ic('fuel')}</div><div class="grow"><b>${esc(s.name)}</b><div class="sub">Km ${f0(s.km)} · ~${f1(s.lit)} L · próximo posto a ${s.nextGap} km</div></div><a class="iconbtn" href="${gmapsLink(s)}" target="_blank" rel="noopener" aria-label="Abrir no Google Maps">${ic('route')}</a></div>`).join('') : `<div class="member"><div class="avatar" style="background:var(--road)">${ic('check')}</div><div class="grow"><b>${(ROOM.trip.postos || []).length ? 'Dá para fazer a rota sem parar' : 'Ainda sem postos carregados'}</b><div class="sub">${(ROOM.trip.postos || []).length ? 'Saindo com ' + mo.fuel + '% no tanque' : 'O guia pode tocar em “Recalcular rota e postos”'}</div></div></div>`}
    ${P.gap.len ? `<div class="banner amber" style="margin-top:10px;box-shadow:none">${ic('alert')}<div><b>Maior trecho sem posto:</b> ${esc(P.gap.a)} → ${esc(P.gap.b)}, ${P.gap.len} km.</div></div>` : ''}
    <p class="note" style="margin:10px 0 0">O alerta dispara quando o que sobra no tanque não cobre a distância até o próximo posto mais ${f0(P.reserve)} km de reserva.</p></div>` : '<p class="empty card">Quando o guia montar a rota, o cálculo aparece aqui.</p>'}
  </section>`}
  <section style="display:flex;flex-direction:column;gap:10px">
   <div class="sec-h"><h2>Manutenção</h2></div>
   <div class="card" style="display:flex;flex-direction:column;gap:10px">
    <div class="row"><div class="field"><label for="odo">Km atual da moto</label><input class="input num" id="odo" type="number" inputmode="numeric" value="${ME.odo || ''}"></div><div class="field"><label for="lastOil">Última troca de óleo (km)</label><input class="input num" id="lastOil" type="number" inputmode="numeric" value="${ME.lastOil || ''}"></div></div>
    ${ME.odo ? `<div class="toggle-row"><span>Troca de óleo</span><span class="pill ${oilLeft - (R ? R.total : 0) < 500 ? 'amber' : 'green'} num">${oilLeft > 0 ? 'faltam ' + f0(oilLeft) + ' km' : 'vencida'}</span></div>` : '<p class="note" style="margin:0">Informe o km da moto para acompanhar a troca de óleo (a cada 6.000 km).</p>'}
   </div>
  </section>
 </div>`;
  const rer = () => { saveMe(); syncMember(); renderMoto(); updateMapOverlays(); };
  $('#meName').onchange = e => { ME.name = e.target.value.trim() || ME.name; rer(); };
  bindMotoPicker('m', id => { mo.model = id; mo.real = 0; rer(); });
  const ot = $('#oTank'); if (ot) ot.onchange = e => { mo.tanque = +e.target.value || 15; rer(); };
  const ok = $('#oKml'); if (ok) ok.onchange = e => { mo.kmlBase = +e.target.value || 25; rer(); };
  const step = d => { const F2 = myFuel(); const cur = F2 ? F2.pct : mo.fuel; mo.fuel = Math.max(5, Math.min(100, Math.round((cur + d) / 10) * 10)); mo.markKm = myKm() || 0; rer(); };
  const fd = $('#fuelDn'); if (fd) fd.onclick = () => step(-10);
  const fu = $('#fuelUp'); if (fu) fu.onclick = () => step(10);
  const fl = $('#filled'); if (fl) fl.onclick = () => { filled(); renderMoto(); };
  const bg = $('#bagagem'); if (bg) bg.onchange = e => { mo.bagagem = e.target.checked; rer(); };
  $('#v-moto').querySelectorAll('[data-e]').forEach(b => b.onclick = () => { mo.estilo = b.dataset.e; rer(); });
  const rk = $('#realK'); if (rk) rk.onchange = e => { mo.real = +e.target.value || 0; rer(); };
  const pr = $('#preco'); if (pr) pr.onchange = e => { ME.preco = +e.target.value || 0; rer(); };
  $('#odo').onchange = e => { ME.odo = +e.target.value || 0; saveMe(); renderMoto(); };
  $('#lastOil').onchange = e => { ME.lastOil = +e.target.value || 0; saveMe(); renderMoto(); };
}

/* ================= CONTAS ================= */
function balances() { const b = {}; membersArr().forEach(m => b[m.id] = 0); ROOM.expenses.forEach(e => { const sp = e.split.filter(id => id in b); if (!sp.length || !(e.by in b)) return; b[e.by] += e.v; sp.forEach(id => b[id] -= e.v / sp.length); }); return b; }
function settle(b) { const cr = [], db = []; Object.entries(b).forEach(([id, v]) => { if (v > 0.009) cr.push({ id, v }); else if (v < -0.009) db.push({ id, v: -v }); }); cr.sort((a, c) => c.v - a.v); db.sort((a, c) => c.v - a.v); const out = []; let i = 0, j = 0; while (i < db.length && j < cr.length) { const x = Math.min(db[i].v, cr[j].v); out.push({ from: db[i].id, to: cr[j].id, v: x }); db[i].v -= x; cr[j].v -= x; if (db[i].v < 0.01) i++; if (cr[j].v < 0.01) j++; } return out; }
function renderContas() {
  if (!ROOM) return;
  const ms = membersArr(), b = balances(), st = settle(b), total = ROOM.expenses.reduce((a, e) => a + e.v, 0);
  const nm = id => (ROOM.members[id] || { name: 'Saiu do grupo' }).name, col = id => (ROOM.members[id] || { color: '#888' }).color;
  $('#v-contas').innerHTML = `<div class="pad">
  <div class="banner" style="box-shadow:none;border-color:var(--line)">${ic('users')}<div><b>Garupa também divide.</b> Se o garupa estiver cadastrado no grupo, ele entra na divisão dos gastos como todo mundo.</div></div>
  <section style="display:flex;flex-direction:column;gap:10px">
   <div class="sec-h"><h2>Gastos em conjunto</h2><span class="pill green num">${brl(total)}</span></div>
   <div class="card">${ROOM.expenses.map(e => `<div class="exp"><div class="avatar" style="background:${col(e.by)}">${esc(ini(nm(e.by)))}</div><div class="grow"><b>${esc(e.d)}</b><div class="sub">${esc(nm(e.by))} pagou · ${e.split.length === ms.length ? (ms.length > 1 ? 'dividido entre todos' : 'só seu') : 'entre ' + e.split.map(id => esc(nm(id))).join(', ')}</div></div><div class="val num">${brl(e.v)}</div><button class="del iconbtn" style="border:0;background:none" type="button" data-dx="${e.id}" aria-label="Apagar gasto">${ic('trash')}</button></div>`).join('') || '<p class="empty">Nenhum gasto ainda.</p>'}</div>
  </section>
  <section class="card" style="display:flex;flex-direction:column;gap:12px">
   <div class="eyebrow">Lançar gasto</div>
   <form id="expForm" style="display:flex;flex-direction:column;gap:12px">
    <div class="field"><label for="eD">O que foi</label><input class="input" id="eD" maxlength="60" placeholder="Ex.: Pousada, churrasco, passeio" required></div>
    <div class="row"><div class="field"><label for="eV">Valor (R$)</label><input class="input num" id="eV" type="number" inputmode="decimal" min="0" step="0.01" required></div>
     <div class="field"><label for="eBy">Quem pagou</label><select class="input" id="eBy">${ms.map(m => `<option value="${m.id}" ${m.id === ME.id ? 'selected' : ''}>${esc(m.name)}</option>`).join('')}</select></div></div>
    <div class="field"><label>Dividir entre</label><div class="splitbox">${ms.map(m => `<label><input type="checkbox" name="sp" value="${m.id}" checked>${esc(m.name)}${m.role === 'garupa' ? ' (garupa)' : ''}</label>`).join('')}</div></div>
    <button class="btn primary btn-wide" type="submit">${ic('plus')}Lançar gasto</button>
   </form>
  </section>
  ${ms.length > 1 ? `<section style="display:flex;flex-direction:column;gap:10px">
   <div class="sec-h"><h2>Saldo de cada um</h2></div>
   <div class="bal">${ms.map(m => `<div><small>${esc(m.name)}</small><b class="num ${b[m.id] > 0.009 ? 'pos' : b[m.id] < -0.009 ? 'neg' : ''}">${b[m.id] > 0.009 ? '+' : ''}${brl(b[m.id])}</b></div>`).join('')}</div></section>
  <section style="display:flex;flex-direction:column;gap:10px">
   <div class="sec-h"><h2>Quem paga quem</h2><span class="pill">${st.length} Pix</span></div>
   <div class="card">${st.map(s => `<div class="settle"><b>${esc(nm(s.from))}</b><span class="arrow">paga para</span><b>${esc(nm(s.to))}</b><span class="val num">${brl(s.v)}</span></div>`).join('') || '<p class="muted" style="margin:0">Tudo certo, ninguém deve nada.</p>'}</div></section>` : ''}
 </div>`;
  $('#v-contas').querySelectorAll('[data-dx]').forEach(x => x.onclick = () => send({ t: 'exp:del', id: x.dataset.dx }));
  $('#expForm').onsubmit = e => { e.preventDefault(); const split = [...document.querySelectorAll('input[name=sp]:checked')].map(i => i.value); if (!split.length) return toast('Escolha pelo menos uma pessoa'); send({ t: 'exp:add', exp: { d: $('#eD').value.trim(), v: +$('#eV').value || 0, by: $('#eBy').value, split } }); toast('Gasto lançado'); $('#eD').value = ''; $('#eV').value = ''; };
}

/* ================= SOS ================= */
let sosCount = null, sosType = 'pane';
function startSOSCountdown() {
  if (UI.sosMine || sosCount) return;
  let n = 5; sosCount = { n }; renderSOS(); vibrate(200);
  sosCount.timer = setInterval(() => { n--; sosCount.n = n; if (n <= 0) { clearInterval(sosCount.timer); sosCount = null; sendSOS(); } else { renderSOS(); vibrate(150); } }, 1000);
}
function sendSOS() { send({ t: 'sos', sosType, lat: myPos ? myPos.lat : 0, lng: myPos ? myPos.lng : 0 }); toast(myPos ? 'SOS enviado' : 'SOS enviado para o seu grupo (sem GPS, não deu para avisar quem está por perto)'); vibrate([500, 200, 500]); renderSOS(); }
function renderSOS() {
  const el = $('#v-sos'); if (!el || UI.tab !== 'sos') return;
  const emerg = `<div class="emerg"><a href="tel:192" style="text-decoration:none;color:inherit"><div><b>192</b><small>SAMU</small></div></a><a href="tel:193" style="text-decoration:none;color:inherit"><div><b>193</b><small>Bombeiros</small></div></a><a href="tel:191" style="text-decoration:none;color:inherit"><div><b>191</b><small>PRF (rodovia federal)</small></div></a></div>`;
  let body;
  const s = UI.sosMine;
  if (s) {
    body = `<div class="sos-wrap">
    ${s.type === 'acidente' ? `<div class="banner red" style="box-shadow:none;text-align:left;width:100%">${ic('phone')}<div><b>Se houver ferido, ligue agora.</b> O SOS do MotoBando chama motociclistas por perto, mas não substitui o resgate.</div></div>${emerg}` : ''}
    <div><div class="eyebrow" style="color:var(--sos)">SOS ativo · ${esc((SOSTYPES[s.type] || {}).n || '')}</div><h2 style="margin:4px 0 0;font-family:var(--f-display);font-size:28px">Alerta enviado para ${s.notified} pessoa${s.notified === 1 ? '' : 's'}</h2><p class="small muted" style="margin:4px 0 0">Seu grupo e quem usa o MotoBando a até ${ME.sosCfg.radius} km (cada um escolhe o raio). Sua localização fica visível só enquanto o SOS estiver ativo.</p></div>
    <div class="card" style="width:100%"><div class="eyebrow" style="text-align:left;margin-bottom:2px">Indo até você</div>
     ${s.responders.length ? s.responders.map(r => `<div class="resp"><div class="avatar" style="background:${r.color || '#475569'}">${esc(ini(r.name))}</div><div style="flex:1;min-width:0"><b>${esc(r.name)}</b> ${r.group ? '<span class="pill green">Seu grupo</span>' : '<span class="pill">Comunidade</span>'}<div class="note">${esc(r.moto || '')}${r.km != null ? ' · a ' + f1(r.km) + ' km' : ''}</div></div></div>`).join('') : '<p class="small muted" style="margin:6px 0">Aguardando resposta…</p>'}
    </div>
    ${s.type !== 'acidente' ? emerg : ''}
    <button class="btn btn-wide" type="button" id="sosEnd">${ic('check')}Estou bem, encerrar SOS</button></div>`;
  } else {
    body = `<div class="sos-wrap">
    <div><h2 style="margin:0;font-family:var(--f-display);font-size:30px">Precisa de ajuda na estrada?</h2><p class="small muted" style="margin:4px 0 0">O alerta vai para o seu grupo e para quem usa o MotoBando perto de você.</p></div>
    <div class="sos-types">${Object.entries(SOSTYPES).map(([k, v]) => `<button class="sos-type" type="button" data-st="${k}" aria-pressed="${sosType === k}" ${sosCount ? 'disabled' : ''}>${ic(v.icon)}${v.n}</button>`).join('')}</div>
    <button class="sos-big ${sosCount ? 'counting' : ''}" type="button" id="sosBtn">${sosCount ? `<span class="num">${sosCount.n}</span><small>Toque para cancelar</small>` : 'SOS<small>Toque para pedir ajuda</small>'}</button>
    <p class="note" style="margin:-6px 0 0">${sosCount ? 'Enviando em ' + sosCount.n + ' segundos…' : 'Você tem 5 segundos para cancelar.'}${myPos ? '' : ' Sem GPS agora: só o seu grupo será avisado.'}</p>
    ${emerg}</div>`;
  }
  el.innerHTML = `<div class="pad">${body}
   <section class="card" style="display:flex;flex-direction:column;gap:12px">
    <div class="eyebrow">Ajudar outros motociclistas</div>
    <div class="toggle-row"><div><b>Receber SOS de quem está por perto</b><div class="note">Sempre grátis. Funciona com o app aberto.</div></div><input type="checkbox" class="switch" id="sosRecv" ${ME.sosCfg.receive ? 'checked' : ''}></div>
    <div class="toggle-row"><span>Raio</span><div class="seg" role="group">${[10, 30, 50].map(r => `<button type="button" data-rad="${r}" aria-pressed="${ME.sosCfg.radius === r}">${r} km</button>`).join('')}</div></div>
   </section>
   <p class="note" style="margin:0">Use com responsabilidade: alerta falso atrapalha quem precisa de verdade.</p></div>`;
  el.querySelectorAll('[data-st]').forEach(b => b.onclick = () => { sosType = b.dataset.st; renderSOS(); });
  const btn = $('#sosBtn'); if (btn) btn.onclick = () => { if (sosCount) { clearInterval(sosCount.timer); sosCount = null; renderSOS(); toast('SOS cancelado'); } else startSOSCountdown(); };
  const end = $('#sosEnd'); if (end) end.onclick = () => send({ t: 'sos:end', id: UI.sosMine.id });
  $('#sosRecv').onchange = e => { ME.sosCfg.receive = e.target.checked; saveMe(); send({ t: 'cfg', sosCfg: ME.sosCfg }); };
  el.querySelectorAll('[data-rad]').forEach(b => b.onclick = () => { ME.sosCfg.radius = +b.dataset.rad; saveMe(); send({ t: 'cfg', sosCfg: ME.sosCfg }); renderSOS(); });
}
function showIncomingSOS(s) {
  drawSosMarkers(); vibrate([600, 200, 600, 200, 600]); beep();
  const d = myPos && (s.lat || s.lng) ? GEO.hav(myPos, s) : null;
  const t = SOSTYPES[s.type] || { n: 'Pedido de ajuda' };
  const inGroup = ROOM && ROOM.members[s.from.id];
  $('#modalRoot').innerHTML = `<div class="overlay center"><div class="incoming" id="sosIncoming" role="alertdialog" aria-label="Alerta de SOS">
   <div class="eyebrow" style="color:var(--sos)">SOS${d != null ? ' a ' + f1(d) + ' km de você' : ''}</div>
   <h2 style="margin:0;font-family:var(--f-display);font-size:30px;line-height:1.05">${esc(t.n)}</h2>
   <div class="member" style="border:0;padding:0"><div class="avatar" style="background:${s.from.color || '#475569'}">${esc(ini(s.from.name))}</div><div class="grow"><b>${esc(s.from.name)}</b> <span class="pill ${inGroup ? 'green' : ''}">${inGroup ? 'Seu grupo' : 'Comunidade'}</span><div class="sub">${esc(s.from.moto || '')}</div></div>${s.from.sangue ? `<span class="pill blood big" title="Tipo sanguíneo">${ic('drop')}${esc(s.from.sangue)}</span>` : ''}</div>
   <div class="row"><button class="btn primary" type="button" id="goHelp" style="flex:1">Estou indo</button><button class="btn" type="button" id="noHelp" style="flex:1">Agora não posso</button></div>
   ${s.lat || s.lng ? `<a class="btn btn-wide" href="${gmapsLink(s)}" target="_blank" rel="noopener">${ic('route')}Rota até ele no Google Maps</a>` : ''}
  </div></div>`;
  $('#goHelp').onclick = () => { send({ t: 'sos:go', id: s.id }); $('#modalRoot').innerHTML = ''; toast(`${esc(s.from.name)} foi avisado que você está a caminho`); if (s.lat || s.lng) openMapsWithHelp(gmapsLink(s)); };
  $('#noHelp').onclick = () => $('#modalRoot').innerHTML = '';
}

/* ================= PLANOS ================= */
function openPremium(msg) {
  const li = a => a.map(t => `<li>${ic('check')}<span>${t}</span></li>`).join('');
  $('#modalRoot').innerHTML = `<div class="overlay" id="ov"><div class="modal" role="dialog" aria-label="Planos">
  <div class="sec-h"><h2>Planos do MotoBando</h2><button class="iconbtn" type="button" id="pX" aria-label="Fechar">${ic('x')}</button></div>
  <div class="plan"><h3>Grátis <span>R$ 0</span></h3><ul>${li(['1 viagem automática para experimentar', 'Grupo de até 6 motos com GPS ao vivo', 'Rota, paradas e checklist do guia', 'Ficha da moto e cálculo de combustível', 'Divisão de gastos', '<b>SOS da comunidade, sempre grátis</b>'])}</ul></div>
  <div class="plan hl"><h3>Bando+ <span class="num">R$ 14,90<small>/mês</small></span></h3><p class="small" style="margin:0">ou R$ 119/ano</p><ul>${li(['<b>Viagens automáticas ilimitadas</b>', 'Grupos de até 30 motos', 'Previsão de chuva na rota', 'Mapa offline (na versão de loja)', 'Diário da viagem e resumo para postar', 'Manutenção da moto'])}</ul><button class="btn primary" type="button" id="pTry">Avise-me quando lançar</button></div>
  <div class="plan"><h3>Motoclube <span class="num">R$ 49,90<small>/mês</small></span></h3><ul>${li(['Tudo do Bando+ para o clube', 'Vários guias e agenda de passeios', 'Página do clube'])}</ul></div>
  ${msg ? `<div class="banner amber" style="box-shadow:none">${ic('crown')}<div>${esc(msg)}</div></div>` : ''}
  <form id="codeForm" class="row"><div class="field"><label for="pCode">Tenho um código de acesso</label><input class="input" id="pCode" value="${esc(ME.premiumCode || '')}" autocapitalize="characters" placeholder="Código"></div><button class="btn" type="submit">Usar</button></form></div></div>`;
  $('#pX').onclick = () => $('#modalRoot').innerHTML = '';
  $('#ov').onclick = e => { if (e.target.id === 'ov') $('#modalRoot').innerHTML = ''; };
  $('#pTry').onclick = () => { $('#modalRoot').innerHTML = ''; toast('Anotado! Avisamos quando a assinatura abrir.'); };
  $('#codeForm').onsubmit = async e => { e.preventDefault(); ME.premiumCode = $('#pCode').value.trim().toUpperCase(); saveMe(); const st = await planStatus(); $('#modalRoot').innerHTML = ''; UI.premium = !!(st && st.premium); renderAvatar(); toast(st && st.premium ? 'Bando+ liberado neste aparelho' : 'Código não reconhecido'); };
}


/* ================= CRIADOR DE VIAGENS AUTOMÁTICAS ================= */
const TIERS = { economica: { n: 'Econômica', d: 'Pousadas simples e comida boa e barata' }, custo: { n: 'Custo-benefício', d: 'Os mais bem avaliados pelo preço' }, conforto: { n: 'Conforto total', d: 'Os melhores hotéis e restaurantes' } };
const STOP_ICON = { abastecer: 'fuel', parada: 'star', almoco: 'food', foto: 'camera', pernoite: 'bed', saida: 'flag' };
const STOP_NAME = { abastecer: 'Abastecer', parada: 'Descanso', almoco: 'Almoço', foto: 'Ponto turístico', pernoite: 'Pernoite' };
UI.pf = Object.assign({ origin: null, dest: null, via: null, date: '', time: '07:00', daily: 350, turismo: true, offroad: false, preco: ME.preco || 6.29 }, store.get('mb-planform', {}));
const stars = p => p && p.rating ? `<span class="pill amber num">★ ${f1(p.rating)}${p.reviews ? ' · ' + f0(p.reviews) : ''}</span>` : '';
const priceTag = p => p && p.price != null ? `<span class="pill num">${'$'.repeat(Math.max(1, p.price))}</span>` : '';
function hideAllViews() { ['home', 'plan', 'mapa', 'viagem', 'sos', 'moto', 'contas'].forEach(k => { const el = $('#v-' + k); if (el) el.hidden = true; }); $('#tabs').hidden = true; }
async function planStatus() { try { return await fetch(`/api/plan/status?user=${encodeURIComponent(ME.id)}&code=${encodeURIComponent(ME.premiumCode || '')}`).then(r => r.json()); } catch (e) { return null; } }

async function showPlanner() {
  pushNav(UI.plan ? 'planres' : 'plan');
  hideAllViews(); $('#v-plan').hidden = false; $('#tripTitle').textContent = 'Viagem automática'; $('#tripSub').textContent = 'O MotoBando monta tudo para você';
  if (UI.plan) return renderPlanResult();
  const st = await planStatus();
  const pf = UI.pf; const spec = FUEL.motoSpec(ME.moto);
  if (!pf.date) { const d = new Date(); d.setDate(d.getDate() + 7); pf.date = d.toISOString().slice(0, 10); }
  const placeField = (key, label, ph) => `<div class="field"><label for="pf_${key}">${label}</label>
    ${pf[key] ? `<div class="code-box" style="border-style:solid"><div style="min-width:0"><b>${esc(pf[key].name)}</b><div class="note">${esc(pf[key].display || '')}</div></div><button class="btn small" type="button" data-clear="${key}">Trocar</button></div>`
      : `<div class="row"><div class="field"><input class="input" id="pf_${key}" placeholder="${ph}"></div><button class="btn" type="button" data-find="${key}">${ic('search')}</button>${key === 'origin' ? `<button class="btn" type="button" id="pfMe" aria-label="Usar minha localização">${ic('gps')}</button>` : ''}</div><div class="results" id="pfr_${key}"></div>`}</div>`;
  const step = (n, t) => `<div class="step-h"><span class="step-n">${n}</span><h2>${t}</h2></div>`;
  $('#v-plan').innerHTML = `<div class="pad">
   <div class="sign"><div class="eyebrow">Criador automático</div><h1>Viagem montada pra você</h1><div class="sign-row"><span>Responda 5 passos. O app monta rota, paradas, postos, onde comer e dormir, com 3 orçamentos.</span></div></div>

   <section class="card step-card">${step(1, 'Para onde você vai')}
    ${placeField('origin', 'Saindo de', 'Cidade ou endereço')}
    ${placeField('dest', 'Indo para', 'Ex.: Florianópolis, Bariloche, Ushuaia…')}
    ${placeField('via', 'Passando por (opcional)', 'Ex.: Gramado')}
   </section>

   <section class="card step-card">${step(2, 'Quando')}
    <div class="row"><div class="field"><label for="pfDate">Dia da saída</label><input class="input" id="pfDate" type="date" value="${esc(pf.date)}"></div><div class="field"><label for="pfTime">Horário</label><input class="input" id="pfTime" type="time" value="${esc(pf.time)}"></div></div>
   </section>

   <section class="card step-card">${step(3, 'Quantos km por dia')}
     <div class="chips" style="flex-wrap:wrap">${[200, 300, 400, 500, 600, 800].map(k => `<button class="chip" type="button" data-daily="${k}" aria-pressed="${pf.daily == k}">${k} km</button>`).join('')}</div>
     <div class="stepper"><button type="button" id="dDn" aria-label="Menos">${ic('minus')}</button><output class="num" id="dLbl">${pf.daily} km/dia</output><button type="button" id="dUp" aria-label="Mais">${ic('plus')}</button></div>
     <p class="note" style="margin:0">Até 300 km o dia é tranquilo. Acima de 500 km é puxada forte, com pouco tempo para passeio.</p>
   </section>

   <section class="card step-card">${step(4, 'O que incluir')}
    <div class="toggle-row"><div><b>Pontos turísticos no caminho</b><div class="note">Mirantes, cachoeiras e atrações perto da rota</div></div><input type="checkbox" class="switch" id="pfTur" ${pf.turismo ? 'checked' : ''}></div>
    <div class="toggle-row"><div><b>Estradas de terra e trilhas</b><div class="note">Sugestões fora de estrada perto dos pernoites</div></div><input type="checkbox" class="switch" id="pfOff" ${pf.offroad ? 'checked' : ''}></div>
   </section>

   <section class="card step-card">${step(5, 'Sua moto e combustível')}
    <div class="row"><div class="field"><label>Sua moto</label><div class="small" style="font-weight:600">${esc(spec.n)} · ${spec.el ? 'elétrica, ~' + spec.el.auton + ' km por carga' : f1(spec.tanque) + ' L · ~' + f1(+ME.moto.real || spec.kml) + ' km/L'}</div><div class="note">Troque na aba Moto de qualquer viagem.</div></div><div class="field" style="flex:0 1 120px"><label for="pfPreco">Litro (R$)</label><input class="input num" id="pfPreco" type="number" inputmode="decimal" step="0.01" value="${pf.preco}"></div></div>
   </section>

   ${st && !st.premium ? `<div class="banner ${st.used >= st.free ? 'red' : 'amber'}" style="box-shadow:none">${ic('crown')}<div>${st.used >= st.free ? '<b>Você já usou sua viagem automática grátis.</b> Com o Bando+ você cria quantas quiser.' : '<b>Grátis: 1 viagem automática</b> para você experimentar. Depois, faz parte do Bando+.'}</div></div>` : ''}
   ${st && !st.google ? `<div class="banner" style="box-shadow:none">${ic('star')}<div>As notas do Google ainda não estão ligadas. Por enquanto os lugares são escolhidos pelo OpenStreetMap.</div></div>` : ''}
   <button class="btn primary btn-wide start-btn" type="button" id="pfGo">${ic('route')}Montar minha viagem</button>
   <div class="trip-actions">
    <button class="btn btn-wide" type="button" id="pfBorders">${ic('book')}Guia de fronteiras</button>
    <button class="btn ghost btn-wide" type="button" id="plBack">Voltar para o início</button>
   </div>
  </div>`;
  const savePf = () => store.set('mb-planform', UI.pf);
  $('#plBack').onclick = () => { UI.plan = null; showHome(); };
  document.querySelectorAll('[data-clear]').forEach(b => b.onclick = () => { pf[b.dataset.clear] = null; savePf(); showPlanner(); });
  document.querySelectorAll('[data-find]').forEach(b => b.onclick = async () => {
    const key = b.dataset.find, q = $('#pf_' + key).value.trim(); if (!q) return;
    const box = $('#pfr_' + key); box.innerHTML = '<p class="empty"><span class="spinner"></span> Buscando…</p>';
    try { const res = await GEO.search(q.replace(/countrycodes/g, ''), null, true);
      box.innerHTML = res.map((r, i) => `<button type="button" data-pick="${i}">${esc(r.name)}<small>${esc(r.display)}</small></button>`).join('') || '<p class="empty">Nada encontrado. Tente com a cidade e o estado ou país.</p>';
      box.querySelectorAll('[data-pick]').forEach(x => x.onclick = () => { pf[key] = res[+x.dataset.pick]; savePf(); showPlanner(); });
    } catch (e) { box.innerHTML = '<p class="empty">Não consegui buscar agora.</p>'; }
  });
  const me = $('#pfMe'); if (me) me.onclick = () => navigator.geolocation.getCurrentPosition(async p => { const name = await GEO.reverse(p.coords.latitude, p.coords.longitude); pf.origin = { name, display: 'Sua localização', lat: p.coords.latitude, lng: p.coords.longitude }; savePf(); showPlanner(); }, () => toast('Permita a localização para usar onde você está'));
  document.querySelectorAll('[data-daily]').forEach(b => b.onclick = () => { pf.daily = +b.dataset.daily; savePf(); showPlanner(); });
  $('#dDn').onclick = () => { pf.daily = Math.max(100, pf.daily - 50); savePf(); showPlanner(); };
  $('#dUp').onclick = () => { pf.daily = Math.min(1200, pf.daily + 50); savePf(); showPlanner(); };
  $('#pfDate').onchange = e => { pf.date = e.target.value; savePf(); };
  $('#pfTime').onchange = e => { pf.time = e.target.value || '07:00'; savePf(); };
  $('#pfTur').onchange = e => { pf.turismo = e.target.checked; savePf(); };
  $('#pfOff').onchange = e => { pf.offroad = e.target.checked; savePf(); };
  $('#pfPreco').onchange = e => { pf.preco = +e.target.value || 6.29; ME.preco = pf.preco; saveMe(); savePf(); };
  $('#pfBorders').onclick = () => showBorders();
  $('#pfGo').onclick = runPlan;
}
async function runPlan() {
  const pf = UI.pf;
  if (!pf.origin || !pf.dest) return toast('Escolha de onde sai e para onde vai');
  const spec = FUEL.motoSpec(ME.moto);
  let r;
  try {
    r = await fetch('/api/plan', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: ME.id, code: ME.premiumCode || '', origin: pf.origin, dest: pf.dest, via: pf.via ? [pf.via] : [], dailyKm: pf.daily, startDate: pf.date, startTime: pf.time, prefs: { turismo: pf.turismo, offroad: pf.offroad }, moto: { tanque: spec.tanque, kml: +ME.moto.real || spec.kml }, fuelPrice: pf.preco }) });
  } catch (e) { return toast('Sem conexão com o servidor'); }
  const j = await r.json();
  if (r.status === 402) { openPremium(j.msg); return; }
  if (!r.ok) return toast(esc(j.error || 'Não consegui montar a viagem'));
  $('#v-plan').innerHTML = `<div class="pad"><div class="sign"><div class="eyebrow">Montando sua viagem</div><h1>${esc(pf.origin.name)} → ${esc(pf.dest.name)}</h1></div>
   <div class="card" style="display:flex;flex-direction:column;gap:12px;align-items:center;text-align:center;padding:28px 16px"><span class="spinner" style="width:42px;height:42px;border-width:5px"></span><b id="plMsg" style="font-size:17px">Começando…</b><div class="prog" style="width:100%;height:10px;margin:0"><i id="plBar" style="width:2%"></i></div><p class="note" style="margin:0">Estamos buscando os melhores lugares em cada trecho. Viagens longas levam até 1 ou 2 minutos.</p></div></div>`;
  const id = j.id;
  for (let i = 0; i < 240; i++) {
    await new Promise(res => setTimeout(res, 1500));
    let s; try { s = await fetch('/api/plan/' + id).then(x => x.json()); } catch (e) { continue; }
    if ($('#plMsg')) { $('#plMsg').textContent = s.msg || ''; $('#plBar').style.width = (s.progress || 2) + '%'; }
    if (s.status === 'done') { UI.plan = s.result; UI.planTier = 'custo'; return renderPlanResult(); }
    if (s.status === 'error') { toast(esc(s.error)); UI.plan = null; return showPlanner(); }
  }
  toast('Demorou demais. Tente de novo.'); showPlanner();
}
function lodgingOf(day) { return day.lodgingPick || (day.lodging && day.lodging[UI.planTier]) || null; }
function borderHTML(b) {
  const P = FRONTEIRAS.paises[b.to] || null; const from = (FRONTEIRAS.paises[b.from] || {}).nome || (b.from === 'br' ? 'Brasil' : b.from.toUpperCase());
  const gm = `https://www.google.com/maps/search/despachante+aduaneiro/@${b.lat},${b.lng},12z`;
  return `<div class="card border-card"><div class="eyebrow" style="color:var(--amber)">Fronteira no km ${f0(b.km)}${b.near ? ' · perto de ' + esc(b.near) : ''}</div>
   <h3 style="margin:4px 0 8px;font-family:var(--f-display);font-size:24px">${esc(from)} → ${esc(P ? P.nome : b.to.toUpperCase())}</h3>
   <ul class="tips">${[...(P ? P.itens : ['Confira as exigências no consulado do país.']), ...FRONTEIRAS.geral.itens.slice(0, 4)].map(t => `<li>${esc(t)}</li>`).join('')}</ul>
   <div class="eyebrow" style="margin-top:10px">Despachantes perto da fronteira</div>
   ${b.despachantes && b.despachantes.length ? b.despachantes.map(d => `<div class="member"><div class="grow"><b>${esc(d.name)}</b> ${stars(d)}<div class="sub">${esc([d.phone, d.extra].filter(Boolean).join(' · '))}</div></div>${d.maps ? `<a class="iconbtn" href="${d.maps}" target="_blank" rel="noopener" aria-label="Abrir no Google Maps">${ic('route')}</a>` : ''}</div>`).join('') : `<a class="btn btn-wide" href="${gm}" target="_blank" rel="noopener">${ic('search')}Ver despachantes no Google Maps</a>`}
   ${P && P.fontes.length ? `<p class="note" style="margin:8px 0 0">Fontes: ${P.fontes.map(f => `<a href="${f[1]}" target="_blank" rel="noopener">${esc(f[0])}</a>`).join(' · ')}. Checado em ${fmtDateBR(FRONTEIRAS.verificado)}. Confirme no consulado antes de viajar.</p>` : ''}</div>`;
}
function fmtDateBR(d) { const x = new Date(d + 'T12:00:00'); return x.toLocaleDateString('pt-BR'); }
function renderPlanResult() {
  pushNav('planres');
  const P = UI.plan; const T = UI.planTier;
  $('#tripTitle').textContent = `${P.origin.name} → ${P.dest.name}`; $('#tripSub').textContent = `${f0(P.total_km)} km · ${P.days.length} dia${P.days.length > 1 ? 's' : ''}`;
  const stopRow = (s, di, si) => `<li class="tl"><div class="time num">${s.time || ''}</div><div class="rail"><span class="dot">${ic(STOP_ICON[s.type] || 'pin')}</span></div><div class="body"><b>${esc(s.name)}</b><span>${STOP_NAME[s.type] || ''} · km ${f0(s.km)}${s.off > 1 ? ' · ' + f1(s.off) + ' km fora da rota' : ''}${s.note ? ' · ' + esc(s.note) : ''}</span><div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:4px">${stars(s)}${priceTag(s)}${s.warn ? '<span class="pill red">sem posto confirmado</span>' : ''}</div></div><button class="btn small" type="button" data-swap="${di}:${si}">Trocar</button></li>`;
  $('#v-plan').innerHTML = `<div class="pad">
   <button class="btn btn-wide" type="button" id="plBack2">${ic('x')}Descartar e voltar</button>
   <div class="sign"><div class="eyebrow">Sua viagem automática</div><h1>${esc(P.origin.name)} → ${esc(P.dest.name)}</h1>
    <div class="sign-row"><span><b class="num">${f0(P.total_km)}</b> km</span><span><b>${P.days.length}</b> dia${P.days.length > 1 ? 's' : ''}</span><span><b class="num">${f1(P.ride_h)}</b> h pilotando</span><span>~<b class="num">${f0(P.fuel.liters)}</b> L</span></div></div>
   ${!P.google ? `<div class="banner" style="box-shadow:none">${ic('star')}<div>Sem as notas do Google ligadas, escolhi os lugares pelos dados do OpenStreetMap. Com a chave do Google, as escolhas usam as avaliações reais.</div></div>` : ''}
   <section style="display:flex;flex-direction:column;gap:10px"><div class="sec-h"><h2>Escolha o estilo</h2></div>
    <div class="tier-grid">${Object.entries(TIERS).map(([k, t]) => `<button type="button" class="tier ${T === k ? 'on' : ''}" data-tier="${k}"><b>${t.n}</b><span class="tier-total num">${brl(P.tiers[k].total).replace(/,\d\d$/, '')}</span><small>${t.d}</small><small class="num">Hospedagem ${brl(P.tiers[k].lodging).replace(/,\d\d$/, '')} · Comida ${brl(P.tiers[k].food).replace(/,\d\d$/, '')} · Gasolina ${brl(P.tiers[k].fuel).replace(/,\d\d$/, '')}</small></button>`).join('')}</div>
    <p class="note" style="margin:0">Valores estimados por pessoa. Pedágios e balsas não incluídos.</p></section>
   ${P.borders.length ? `<section style="display:flex;flex-direction:column;gap:10px"><div class="sec-h"><h2>Fronteiras no caminho</h2></div>${P.borders.map(borderHTML).join('')}</section>` : ''}
   ${P.days.map((d, di) => { const L = lodgingOf(d); return `<section style="display:flex;flex-direction:column;gap:10px">
    <div class="sec-h"><h2>Dia ${d.n}</h2><span class="pill">${esc(fmtDate(d.date))} · ${f0(d.km)} km · ${f1(d.rideH)} h</span></div>
    <div class="card"><ol class="timeline">${d.stops.map((s, si) => stopRow(s, di, si)).join('')}
     <li class="tl"><div class="time num">${d.arrive || ''}</div><div class="rail"><span class="dot">${ic('bed')}</span></div><div class="body"><b>${L ? esc(L.name) : 'Sem hospedagem encontrada perto de ' + esc(d.endName || 'km ' + f0(d.toKm))}</b><span>${di === P.days.length - 1 ? 'Destino' : 'Pernoite'}${d.endName ? ' em ' + esc(d.endName) : ''}${L && L.kind ? ' · ' + esc(L.kind) : ''}</span><div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:4px">${stars(L)}${priceTag(L)}${L && L.maps ? `<a class="pill green" href="${L.maps}" target="_blank" rel="noopener">ver no Google</a>` : ''}</div></div><button class="btn small" type="button" data-lodge="${di}">Trocar</button></li></ol>
     ${d.offroad && d.offroad.length ? `<div class="eyebrow" style="margin-top:8px">Estradas de terra perto do pernoite</div>${d.offroad.map(o => `<div class="member"><div class="avatar" style="background:#15803D">${ic('trail')}</div><div class="grow"><b>${esc(o.name)}</b><div class="sub">${esc([o.surface && 'piso: ' + o.surface, o.grade].filter(Boolean).join(' · ') || 'estrada de terra')}</div></div><a class="iconbtn" href="https://www.google.com/maps/search/?api=1&query=${o.lat},${o.lng}" target="_blank" rel="noopener" aria-label="Ver no mapa">${ic('route')}</a></div>`).join('')}` : ''}
    </div></section>`; }).join('')}
   <button class="btn primary btn-wide" type="button" id="plSave">${ic('check')}Salvar na minha pasta</button>
   <button class="btn btn-wide" type="button" id="plRedo">${ic('refresh')}Mudar a puxada ou o destino</button>
  </div>`;
  $('#plBack2').onclick = () => { UI.plan = null; showHome(); };
  $('#plRedo').onclick = () => { UI.plan = null; showPlanner(); };
  document.querySelectorAll('[data-tier]').forEach(b => b.onclick = () => { UI.planTier = b.dataset.tier; P.days.forEach(d => delete d.lodgingPick); renderPlanResult(); });
  document.querySelectorAll('[data-swap]').forEach(b => b.onclick = () => { const [di, si] = b.dataset.swap.split(':').map(Number); swapPlace(P.days[di].stops[si], alt => { const s = P.days[di].stops[si]; Object.assign(s, { name: alt.name, lat: alt.lat, lng: alt.lng, rating: alt.rating, reviews: alt.reviews, price: alt.price, kind: alt.kind, maps: alt.maps || '', warn: false, off: 0 }); renderPlanResult(); }); });
  document.querySelectorAll('[data-lodge]').forEach(b => b.onclick = () => { const d = P.days[+b.dataset.lodge]; const L = lodgingOf(d); swapPlace({ cat: 'hosp', lat: L ? L.lat : 0, lng: L ? L.lng : 0, type: 'pernoite', name: L ? L.name : '' }, alt => { d.lodgingPick = alt; renderPlanResult(); }, d.lodgingAlts); });
  $('#plSave').onclick = savePlan;
}
// "escolher outro lugar": abre as opções da região
async function swapPlace(s, onPick, seed) {
  $('#modalRoot').innerHTML = `<div class="overlay" id="swOv"><div class="modal" role="dialog" aria-label="Escolher outro lugar"><div class="sec-h"><h2>Escolher outro lugar</h2><button class="iconbtn" type="button" id="swX" aria-label="Fechar">${ic('x')}</button></div><p class="note" style="margin:0">${esc(STOP_NAME[s.type] || 'Opções')} perto de ${esc(s.name)}</p><div id="swList"><p class="empty"><span class="spinner"></span> Buscando opções da região…</p></div></div></div>`;
  $('#swX').onclick = () => $('#modalRoot').innerHTML = '';
  let list = seed ? [...seed] : [];
  try { const more = await fetch(`/api/places?cat=${s.cat || 'descanso'}&lat=${s.lat}&lng=${s.lng}&r=${s.type === 'pernoite' ? 20 : 10}`).then(r => r.json()); if (Array.isArray(more)) more.forEach(m => { if (!list.some(x => x.name === m.name)) list.push(m); }); } catch (e) {}
  list = list.filter(x => x.name !== s.name);
  if (!$('#swList')) return;
  $('#swList').innerHTML = list.length ? list.slice(0, 25).map((x, i) => `<div class="place"><div class="grow"><h4>${esc(x.name)}</h4><p>${esc([x.kind, x.extra].filter(Boolean).join(' · '))}</p><div style="display:flex;gap:6px;flex-wrap:wrap">${stars(x)}${priceTag(x)}${x.d != null ? `<span class="pill num">${f1(x.d)} km</span>` : ''}${x.maps ? `<a class="pill green" href="${x.maps}" target="_blank" rel="noopener">ver no Google</a>` : ''}</div></div><button class="btn small primary" type="button" data-alt="${i}">Escolher</button></div>`).join('') : '<p class="empty">Não achei outras opções aqui.</p>';
  $('#swList').querySelectorAll('[data-alt]').forEach(b => b.onclick = () => { $('#modalRoot').innerHTML = ''; onPick(list[+b.dataset.alt]); toast('Trocado'); });
}
function savePlan() {
  const P = UI.plan; const stops = [{ id: uid(), name: P.origin.name, lat: P.origin.lat, lng: P.origin.lng, type: 'saida', note: 'Dia 1' }];
  P.days.forEach((d, di) => {
    d.stops.forEach(s => stops.push({ id: uid(), name: s.name, lat: s.lat, lng: s.lng, type: s.type === 'foto' ? 'foto' : s.type, note: `Dia ${d.n}${s.rating ? ' · ★' + f1(s.rating) : ''}` }));
    const L = lodgingOf(d);
    if (L) stops.push({ id: uid(), name: L.name, lat: L.lat, lng: L.lng, type: 'pernoite', note: `Dia ${d.n}${L.rating ? ' · ★' + f1(L.rating) : ''}` });
    else if (di === P.days.length - 1) stops.push({ id: uid(), name: P.dest.name, lat: P.dest.lat, lng: P.dest.lng, type: 'pernoite', note: 'Destino' });
  });
  UI.draftNext = true; send({ t: 'create', trip: { name: `${P.origin.name} → ${P.dest.name}`, date: P.days[0].date, startTime: UI.pf.time, mode: 'solo', stops: stops.slice(0, 100) }, member: memberPayload('guia') });
  UI.afterCreate = true; UI.plan = null; toast('Viagem salva na sua pasta. Se for em grupo, ligue a chave e mande o convite.', 6000);
}
function showBorders() {
  pushNav('borders');
  hideAllViews(); $('#v-plan').hidden = false; $('#tripTitle').textContent = 'Guia de fronteiras'; $('#tripSub').textContent = 'Checado em ' + fmtDateBR(FRONTEIRAS.verificado);
  $('#v-plan').innerHTML = `<div class="pad"><button class="btn btn-wide" type="button" id="bdBack">${ic('list')}Voltar</button>
   <div class="card"><div class="eyebrow">${esc(FRONTEIRAS.geral.titulo)}</div><ul class="tips">${FRONTEIRAS.geral.itens.map(t => `<li>${esc(t)}</li>`).join('')}</ul></div>
   ${Object.entries(FRONTEIRAS.paises).map(([k, p]) => `<details class="card"><summary style="font-weight:700;font-size:17px;cursor:pointer;min-height:36px">${esc(p.nome)}</summary><ul class="tips">${p.itens.map(t => `<li>${esc(t)}</li>`).join('')}</ul>${p.fontes.length ? `<p class="note">Fontes: ${p.fontes.map(f => `<a href="${f[1]}" target="_blank" rel="noopener">${esc(f[0])}</a>`).join(' · ')}</p>` : ''}</details>`).join('')}
   <p class="note">Regras mudam. Este guia é revisado a cada 15 dias, mas confirme sempre no consulado do país antes de viajar.</p></div>`;
  $('#bdBack').onclick = () => UI.plan ? renderPlanResult() : showHome();
}

/* ================= BOTÃO VOLTAR DO CELULAR ================= */
// cada tela entra no histórico; voltar fecha a janela aberta ou volta para a tela anterior
let NAV = null, navFromPop = false;
function pushNav(id) {
  if (navFromPop || NAV === id) { NAV = id; return; }
  // trocar de aba dentro da viagem não empilha: o voltar sai direto para o Início
  const tabToTab = NAV && NAV.startsWith('trip:') && id.startsWith('trip:') && !(history.state && history.state.ov);
  if (NAV === null || tabToTab) history.replaceState({ mb: id }, ''); else history.pushState({ mb: id }, '');
  NAV = id;
}
function anyOverlay() {
  if ($('#bigRoot').innerHTML) { closeBig(); return true; }
  if ($('#modalRoot').innerHTML) { $('#modalRoot').innerHTML = ''; return true; }
  if (UI.road) { UI.road = false; renderRoad(); return true; }
  if (UI.near) { UI.near = false; renderNear(); if (L_poi) L_poi.clearLayers(); return true; }
  if (UI.poi) { UI.poi = null; renderPoiCard(); return true; }
  if (UI.picking) { UI.picking = false; $('#map').classList.remove('picking'); updateMapOverlays(); return true; }
  if (UI.nav && UI.tab === 'mapa') { exitNav(); return true; }
  return false;
}
// janelas abertas (avisos, folhas, modo estrada) também viram um passo do histórico
let ignorePop = false, closingFromPop = false;
const overlayOpen = () => !!($('#bigRoot').innerHTML || $('#modalRoot').innerHTML || $('#roadRoot').innerHTML || ($('#near') && !$('#near').hidden) || ($('#poiCard') && !$('#poiCard').hidden) || (UI.nav && UI.tab === 'mapa' && !$('#v-mapa').hidden));
function watchOverlays() {
  let was = false;
  const check = () => {
    const now = overlayOpen();
    if (now && !was && !(history.state && history.state.ov)) history.pushState({ mb: NAV, ov: true }, '');
    if (!now && was && !closingFromPop && history.state && history.state.ov) { ignorePop = true; history.back(); }
    was = now;
  };
  const mo = new MutationObserver(() => setTimeout(check, 0));
  ['#bigRoot', '#modalRoot', '#roadRoot'].forEach(sel => mo.observe($(sel), { childList: true }));
  ['#near', '#poiCard', '#linear', '#v-mapa'].forEach(sel => mo.observe($(sel), { attributes: true, attributeFilter: ['hidden'] }));
}
window.addEventListener('popstate', e => {
  if (ignorePop) { ignorePop = false; return; }
  if (overlayOpen()) { closingFromPop = true; try { while (overlayOpen() && anyOverlay()); } finally { setTimeout(() => closingFromPop = false, 0); } return; }
  const id = (e.state && e.state.mb) || 'home';
  if (id === NAV) return;
  navFromPop = true;
  try {
    if (id.startsWith('trip:') && ROOM) { if ($('#tabs').hidden) enterRoom(); go(id.slice(5)); }
    else if (id === 'plan') { UI.plan = null; showPlanner(); }
    else if (id === 'planres' && UI.plan) renderPlanResult();
    else if (id === 'borders') showBorders();
    else { if (needExitPrompt()) { const tid = 'trip:' + (UI.tab || 'viagem'); setTimeout(() => { history.pushState({ mb: tid }, ''); NAV = tid; exitTripPrompt(); }, 0); } else if (ROOM) goHome(); else showHome(); }
  } finally { navFromPop = false; NAV = id; }
});

/* ================= GOOGLE MAPS COM VOZ: explicar e trazer de volta ================= */
// Ao sair para o Google Maps, o MotoBando fica em segundo plano e o bando para de ver você.
// A voz do Google continua mesmo com o MotoBando na frente: por isso ensinamos a voltar.
let leftForMaps = 0;
function openMapsWithHelp(url) {
  const go = () => { leftForMaps = Date.now(); store.set('mb-lastMaps', leftForMaps); window.open(url, '_blank', 'noopener'); };
  if (store.get('mb-skipMapsHelp', false)) return go();
  const ios = isIOS();
  $('#modalRoot').innerHTML = `<div class="overlay"><div class="modal" role="dialog" aria-label="Usar a voz do Google Maps">
   <div class="sec-h"><h2>Voz do Google Maps</h2><button class="iconbtn" type="button" id="gmX" aria-label="Fechar">${ic('x')}</button></div>
   <div class="banner amber" style="box-shadow:none">${ic('users')}<div><b>Importante:</b> enquanto o Google Maps estiver na tela, o bando não vê sua posição. Depois de iniciar a rota, <b>volte para o MotoBando</b>. A voz do Google continua falando.</div></div>
   <ol class="steps">
    <li><span class="step-n">1</span><div><b>No Google Maps, toque em “Iniciar”</b><br>A voz começa a falar as curvas.</div></li>
    <li><span class="step-n">2</span><div><b>Volte para o MotoBando</b><br>${ios ? 'Toque em <b>“◀ MotoBando”</b> ou <b>“◀ Safari”</b> no canto de cima, à esquerda. Ou deslize o dedo de baixo para cima, segure, e escolha o MotoBando.' : 'Toque no botão de <b>apps abertos</b> (o quadradinho ▢ ou as três barrinhas ⦀ embaixo da tela) e escolha o <b>MotoBando</b>. Ou deslize de baixo para cima e segure.'}</div></li>
    <li><span class="step-n">3</span><div><b>Pronto</b><br>O Google segue falando a rota, e o bando volta a ver você no mapa.</div></li>
   </ol>
   <label class="check" style="border:0"><input type="checkbox" id="gmSkip"><span>Já sei, não mostrar mais</span></label>
   <button class="btn primary btn-wide" type="button" id="gmGo">${ic('route')}Abrir o Google Maps</button></div></div>`;
  $('#gmX').onclick = () => $('#modalRoot').innerHTML = '';
  $('#gmGo').onclick = () => { if ($('#gmSkip').checked) store.set('mb-skipMapsHelp', true); $('#modalRoot').innerHTML = ''; go(); };
}
// qualquer link do Google Maps no app passa pela explicação
document.addEventListener('click', e => {
  const a = e.target.closest && e.target.closest('a[href*="google.com/maps"]');
  if (!a) return;
  e.preventDefault(); openMapsWithHelp(a.href);
}, true);
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState !== 'visible' || !leftForMaps || Date.now() - leftForMaps < 2500) return;
  leftForMaps = 0;
  if (myPos) sendPos();
  if (ROOM) { startGPS(); keepAwake(true); }
  $('#bigRoot').innerHTML = '';
  const el = document.createElement('div'); el.className = 'welcome-back'; el.setAttribute('role', 'status');
  el.innerHTML = `${ic('check')}<div><b>Você voltou!</b><span>A voz do Google Maps continua falando a rota. ${ROOM && !isSolo() ? 'O bando já está vendo você de novo.' : ''}</span></div>`;
  document.getElementById('app').appendChild(el);
  vibrate(150);
  setTimeout(() => el.remove(), 6000);
  el.onclick = () => el.remove();
});

/* ================= INSTALAR O APP NA TELA DO CELULAR ================= */
let installEvt = null;
const isStandalone = () => window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); installEvt = e; if (!$('#v-home').hidden) showHome(); });
window.addEventListener('appinstalled', () => { installEvt = null; toast('MotoBando instalado! Procure o ícone na tela do celular.', 6000); if (!$('#v-home').hidden) showHome(); });
function installHTML() {
  if (isStandalone()) return '';
  return `<button type="button" class="install-btn" id="installBtn">${ic('plus')}<span><b>Instalar o MotoBando no celular</b><small>Fica com ícone na tela, igual a um aplicativo. Leva 10 segundos.</small></span></button>`;
}
async function doInstall() {
  if (installEvt) { installEvt.prompt(); const r = await installEvt.userChoice.catch(() => null); if (r && r.outcome === 'accepted') toast('Instalando…'); installEvt = null; return; }
  const ios = isIOS();
  $('#modalRoot').innerHTML = `<div class="overlay" id="insOv"><div class="modal" role="dialog" aria-label="Instalar o MotoBando">
   <div class="sec-h"><h2>Instalar no celular</h2><button class="iconbtn" type="button" id="insX" aria-label="Fechar">${ic('x')}</button></div>
   ${ios ? `<ol class="steps"><li><span class="step-n">1</span><div><b>Toque no botão Compartilhar</b><br>É o quadrado com uma seta para cima, embaixo da tela (no Safari). <span class="share-ico">${ic('share')}</span></div></li>
     <li><span class="step-n">2</span><div><b>Role e toque em “Adicionar à Tela de Início”</b><br>Tem um ícone de quadrado com um “+”.</div></li>
     <li><span class="step-n">3</span><div><b>Toque em “Adicionar”</b>, no canto de cima.<br>Pronto: o ícone do MotoBando aparece junto dos seus aplicativos.</div></li></ol>
     <p class="note">Precisa estar no <b>Safari</b>. Se abriu o link pelo WhatsApp, toque nos três pontinhos e escolha “Abrir no Safari”.</p>`
   : `<ol class="steps"><li><span class="step-n">1</span><div><b>Toque nos três pontinhos ⋮</b><br>No canto de cima, à direita, do Chrome.</div></li>
     <li><span class="step-n">2</span><div><b>Toque em “Instalar app”</b> ou “Adicionar à tela inicial”.</div></li>
     <li><span class="step-n">3</span><div><b>Confirme em “Instalar”.</b><br>Pronto: o ícone do MotoBando aparece junto dos seus aplicativos.</div></li></ol>
     <p class="note">Se abriu o link pelo WhatsApp, toque nos três pontinhos e escolha “Abrir no Chrome” primeiro.</p>`}
   <button class="btn primary btn-wide" type="button" id="insOk">Entendi</button></div></div>`;
  $('#insX').onclick = $('#insOk').onclick = () => $('#modalRoot').innerHTML = '';
}

/* ================= PUXAR PARA BAIXO PARA ATUALIZAR ================= */
async function softRefresh() {
  toast('Atualizando…', 2500);
  syncTripsFromServer();
  try { if (gpsWatch !== null && navigator.geolocation) { navigator.geolocation.clearWatch(gpsWatch); gpsWatch = null; } } catch (e) {}
  if (SIM.on) { /* simulação continua */ } else if (ROOM) startGPS();
  if (!UI.wsOk || !ws || ws.readyState !== 1) { wsRetry = 0; try { ws && ws.close(); } catch (e) {} connect(); }
  else sendNow(helloMsg());
  if (ROOM && CODE) send({ t: 'join', code: CODE, member: memberPayload(), snap: TRIPS[CODE] && TRIPS[CODE].snap });
  if (myPos) setTimeout(sendPos, 800);
  if (map) setTimeout(() => { if (!ROOM) return; map.invalidateSize(); drawRoute(); drawMembers(); updateMapOverlays(); }, 600);
  setTimeout(() => { if (!ROOM && !$('#v-home').hidden) showHome(); toast(UI.wsOk ? 'Tudo atualizado' : 'Sem conexão agora. Tentando de novo…', 2500); }, 1500);
}
(function gestures() {
  const ind = document.createElement('div'); ind.className = 'ptr'; ind.innerHTML = `${ic('refresh')}<span>Puxe para atualizar</span>`; document.getElementById('app').appendChild(ind);
  const edge = document.createElement('div'); edge.className = 'swipe-hint'; edge.innerHTML = ic('up'); document.getElementById('app').appendChild(edge);
  let st = null;
  const visibleView = () => [...document.querySelectorAll('.view')].find(v => !v.hidden);
  const blocked = t => t.closest('input,select,textarea,.chips,.seg,.leaflet-control,.modal,.road,.big-alert,.sheet,.map-actions');
  document.addEventListener('touchstart', e => {
    if (e.touches.length !== 1 || $('#modalRoot').innerHTML || $('#bigRoot').innerHTML) { st = null; return; }
    const t = e.touches[0], target = e.target, view = visibleView();
    const inHeader = !!target.closest('#top'), onMap = !!target.closest('#map');
    // puxar para baixo: em qualquer tela pelo topo; nas telas com rolagem, quando já estão no topo
    const canPull = !UI.road && (inHeader || (view && !view.classList.contains('map-view') && view.contains(target) && view.scrollTop <= 0));
    // deslizar para os lados: fora do mapa; no mapa, só começando na borda esquerda
    const fromEdge = t.clientX < 28;
    const canSwipe = !UI.road && !blocked(target) && (!onMap || fromEdge);
    st = { x: t.clientX, y: t.clientY, t: Date.now(), canPull, canSwipe, fromEdge, mode: null };
  }, { passive: true });
  document.addEventListener('touchmove', e => {
    if (!st) return;
    const t = e.touches[0], dx = t.clientX - st.x, dy = t.clientY - st.y;
    if (!st.mode) { if (Math.abs(dy) > 12 && Math.abs(dy) > Math.abs(dx) * 1.3) st.mode = 'v'; else if (Math.abs(dx) > 12 && Math.abs(dx) > Math.abs(dy) * 1.3) st.mode = 'h'; }
    if (st.mode === 'v' && st.canPull && dy > 0) {
      const pull = Math.min(110, dy * 0.5);
      ind.classList.add('on'); ind.classList.toggle('ready', pull > 70);
      ind.querySelector('span').textContent = pull > 70 ? 'Solte para atualizar' : 'Puxe para atualizar';
      ind.style.transform = `translate(-50%, ${pull}px)`;
    } else if (st.mode === 'h' && st.canSwipe && dx > 0 && st.fromEdge) {
      edge.classList.add('on'); edge.style.transform = `translate(${Math.min(60, dx * 0.4)}px, -50%) rotate(-90deg)`;
    }
  }, { passive: true });
  document.addEventListener('touchend', e => {
    if (!st) return;
    const ready = ind.classList.contains('ready');
    ind.style.transform = ''; ind.classList.remove('on', 'ready'); edge.classList.remove('on'); edge.style.transform = '';
    const t = e.changedTouches[0], dx = t.clientX - st.x, dy = t.clientY - st.y, fast = Date.now() - st.t < 700;
    const s0 = st; st = null;
    if (s0.mode === 'v' && ready && s0.canPull) return softRefresh();
    if (s0.mode !== 'h' || !s0.canSwipe || Math.abs(dx) < 70 || Math.abs(dy) > 60 || !fast) return;
    swipe(dx > 0 ? 'right' : 'left', s0.fromEdge);
  });
  function swipe(dir, fromEdge) {
    // navegação aberta: deslizar para a direita sai dela
    if (UI.tab === 'mapa' && !$('#v-mapa').hidden) { if (dir === 'right') { if (UI.nav) exitNav(); else history.back(); } return; }
    // dentro da viagem: troca de aba (Mapa, Viagem, SOS, Moto, Contas)
    if (!$('#tabs').hidden) {
      const order = TABS.map(t => t[0]); const i = order.indexOf(UI.tab);
      const j = dir === 'left' ? i + 1 : i - 1;
      if (j >= 0 && j < order.length) go(order[j]); else if (dir === 'right') history.back();
      return;
    }
    // demais telas: deslizar para a direita volta
    if (dir === 'right' && $('#v-home').hidden) history.back();
  }
})();

/* viagens guardadas no servidor entram na pasta (instalou de novo, trocou do navegador para o app, etc.) */
async function syncTripsFromServer() {
  try {
    const list = await fetch('/api/minhas-viagens?user=' + encodeURIComponent(ME.id)).then(r => r.json());
    if (!Array.isArray(list)) return;
    let changed = false;
    for (const t of list) {
      const old = TRIPS[t.code] || {};
      TRIPS[t.code] = { ...old, ...t, saved: old.saved !== false, gone: false, snap: old.snap || null, copy: old.copy || null, updatedAt: Date.now() };
      changed = true;
    }
    if (changed) { store.set('mb-trips', TRIPS); if (!$('#v-home').hidden && !(document.activeElement && /INPUT|SELECT/.test(document.activeElement.tagName))) showHome(); }
  } catch (e) {}
}


/* ================= PERFIL: avatar no topo + menu ================= */
const SANGUE = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const avatarHTML = (cls = '') => ME.photo ? `<img class="av ${cls}" src="${ME.photo}" alt="">` : `<span class="av ${cls}" style="background:${ME.color}">${esc(ini(ME.name || '?'))}</span>`;
function renderAvatar() { const b = $('#avatarBtn'); if (b) b.innerHTML = avatarHTML() + (UI.premium ? `<span class="av-crown">${ic('crown')}</span>` : ''); }
function closeModal() { $('#modalRoot').innerHTML = ''; }
function openUserMenu() {
  const mo = (MOTOS[ME.moto.model] || {}).n;
  const item = (id, icon, t, sub) => `<button class="menu-item" type="button" id="${id}">${ic(icon)}<span><b>${t}</b>${sub ? `<small>${sub}</small>` : ''}</span><span class="chev-r">${ic('chev')}</span></button>`;
  $('#modalRoot').innerHTML = `<div class="overlay" id="ov"><div class="modal menu-sheet" role="dialog" aria-label="Menu">
   <div class="menu-head">${avatarHTML('xl')}<div class="grow"><b>${esc(ME.name || 'Visitante')}</b><span>${esc([mo, ME.sangue && 'Sangue ' + ME.sangue].filter(Boolean).join(' · ') || 'Complete seu cadastro')}</span><span class="pill ${UI.premium ? 'amber' : ''}" style="align-self:flex-start;margin-top:4px">${UI.premium ? ic('crown') + 'Bando+' : 'Plano grátis'}</span></div><button class="iconbtn" type="button" id="mX" aria-label="Fechar">${ic('x')}</button></div>
   <nav class="menu-list">
    ${item('mHome', 'home', 'Início')}
    ${item('mTrips', 'list', 'Minhas viagens', 'Em andamento, próximas e realizadas')}
    ${item('mProfile', 'user', 'Cadastro', 'Foto, nome, moto e tipo sanguíneo')}
    ${item('mPlans', 'crown', 'Planos', UI.premium ? 'Bando+ ativo' : 'Conheça o Bando+')}
    ${item('mContact', 'chat', 'Contato comercial', 'Parcerias, anúncios e motoclubes')}
   </nav></div></div>`;
  $('#mX').onclick = closeModal; $('#ov').onclick = e => { if (e.target.id === 'ov') closeModal(); };
  $('#mHome').onclick = () => { closeAllOverlays(); if (needExitPrompt()) return exitTripPrompt(); if (ROOM) goHome(); else { UI.plan = null; showHome(); } $('#v-home').scrollTop = 0; };
  $('#mTrips').onclick = () => { closeAllOverlays(); store.set('mb-folderOpen', true); if (needExitPrompt()) return exitTripPrompt(); if (ROOM) goHome(); else { UI.plan = null; showHome(); } setTimeout(() => { const f = $('#v-home .folder') || $('#v-home .home-active'); if (f) f.scrollIntoView({ block: 'start', behavior: 'smooth' }); }, 60); };
  $('#mProfile').onclick = openProfile;
  $('#mPlans').onclick = () => openPremium();
  $('#mContact').onclick = openContact;
}
function photoFromFile(file) {
  return new Promise((ok, bad) => {
    const img = new Image(), url = URL.createObjectURL(file);
    img.onload = () => { const S = 192, c = document.createElement('canvas'); c.width = c.height = S; const k = Math.min(img.width, img.height); c.getContext('2d').drawImage(img, (img.width - k) / 2, (img.height - k) / 2, k, k, 0, 0, S, S); URL.revokeObjectURL(url); ok(c.toDataURL('image/jpeg', 0.82)); };
    img.onerror = () => { URL.revokeObjectURL(url); bad(); }; img.src = url;
  });
}
function openProfile() {
  let photo = ME.photo || '';
  $('#modalRoot').innerHTML = `<div class="overlay" id="ov"><form class="modal" id="profEdit" role="dialog" aria-label="Cadastro">
   <div class="sec-h"><h2>Cadastro</h2><button class="iconbtn" type="button" id="peX" aria-label="Fechar">${ic('x')}</button></div>
   <div class="photo-edit"><label class="photo-pick" for="peFile" id="pePrev">${avatarHTML('xxl')}<span class="photo-cam">${ic('camera')}</span></label>
    <div style="display:flex;flex-direction:column;gap:8px"><label class="btn" for="peFile">${ic('camera')}${photo ? 'Trocar foto' : 'Colocar foto'}</label>${photo ? `<button class="btn ghost" type="button" id="peDel">Tirar foto</button>` : ''}</div>
    <input type="file" id="peFile" accept="image/*" hidden></div>
   <div class="field"><label for="peName">Nome ou apelido</label><input class="input" id="peName" maxlength="30" required value="${esc(ME.name || '')}"></div>
   <div class="field"><label>Tipo sanguíneo <span class="muted" style="font-weight:500">(o grupo vê, e vai junto no SOS)</span></label>
    <div class="blood-grid">${SANGUE.map(t => `<button type="button" class="blood-opt" data-bt="${t}" aria-pressed="${ME.sangue === t}">${t}</button>`).join('')}<button type="button" class="blood-opt wide" data-bt="" aria-pressed="${!ME.sangue}">Não sei / prefiro não dizer</button></div></div>
   <div class="eyebrow">Sua moto</div>
   ${motoPickerHTML('pe', ME.moto.model)}
   <div class="field"><label>Sua cor no mapa</label><div class="color-row">${COLORS.map(c => `<button type="button" class="color-opt" data-co="${c}" style="background:${c}" aria-label="Cor" aria-pressed="${ME.color === c}"></button>`).join('')}</div></div>
   <button class="btn primary btn-wide" type="submit">${ic('check')}Salvar</button></form></div>`;
  let sangue = ME.sangue || '', color = ME.color;
  bindMotoPicker('pe');
  const prev = () => { const keep = ME.photo, kc = ME.color; ME.photo = photo; ME.color = color; $('#pePrev').innerHTML = avatarHTML('xxl') + `<span class="photo-cam">${ic('camera')}</span>`; ME.photo = keep; ME.color = kc; };
  $('#peX').onclick = closeModal; $('#ov').onclick = e => { if (e.target.id === 'ov') closeModal(); };
  $('#peFile').onchange = async e => { const f = e.target.files[0]; if (!f) return; try { photo = await photoFromFile(f); prev(); } catch (x) { toast('Não consegui abrir essa foto. Tente outra.'); } };
  const del = $('#peDel'); if (del) del.onclick = () => { photo = ''; prev(); del.remove(); };
  document.querySelectorAll('[data-bt]').forEach(b => b.onclick = () => { sangue = b.dataset.bt; document.querySelectorAll('[data-bt]').forEach(x => x.setAttribute('aria-pressed', x === b)); });
  document.querySelectorAll('[data-co]').forEach(b => b.onclick = () => { color = b.dataset.co; document.querySelectorAll('[data-co]').forEach(x => x.setAttribute('aria-pressed', x === b)); prev(); });
  $('#profEdit').onsubmit = e => {
    e.preventDefault();
    ME.name = $('#peName').value.trim() || ME.name; ME.sangue = sangue; ME.color = color; ME.photo = photo; if ($('#peModelo').value) ME.moto.model = $('#peModelo').value;
    try { saveMe(); } catch (x) { ME.photo = ''; saveMe(); toast('A foto ficou grande demais para guardar. Tente outra.'); }
    if (UI.wsOk) sendNow(helloMsg()); syncMember(); closeModal(); renderAvatar();
    if (!$('#v-home').hidden) showHome(); else if (ROOM) refresh();
    toast('Cadastro salvo');
  };
}
function openContact() {
  $('#modalRoot').innerHTML = `<div class="overlay" id="ov"><form class="modal" id="ctForm" role="dialog" aria-label="Contato comercial">
   <div class="sec-h"><h2>Contato comercial</h2><button class="iconbtn" type="button" id="ctX" aria-label="Fechar">${ic('x')}</button></div>
   <p class="note" style="margin:0">Tem pousada, oficina, loja, posto ou motoclube? Quer anunciar ou fazer parceria com o MotoBando? Mande sua mensagem que a gente responde.</p>
   <div class="field"><label for="ctAss">Assunto</label><select class="input" id="ctAss"><option>Parceria</option><option>Anunciar no app</option><option>Plano Motoclube</option><option>Imprensa</option><option>Outro</option></select></div>
   <div class="field"><label for="ctNome">Seu nome</label><input class="input" id="ctNome" maxlength="60" required value="${esc(ME.name || '')}"></div>
   <div class="field"><label for="ctEmp">Empresa ou clube <span class="muted" style="font-weight:500">(se tiver)</span></label><input class="input" id="ctEmp" maxlength="80"></div>
   <div class="field"><label for="ctCont">WhatsApp ou e-mail para resposta</label><input class="input" id="ctCont" maxlength="80" required></div>
   <div class="field"><label for="ctMsg">Mensagem</label><textarea class="input" id="ctMsg" rows="4" maxlength="1500" required></textarea></div>
   <button class="btn primary btn-wide" type="submit">${ic('chat')}Enviar mensagem</button></form></div>`;
  $('#ctX').onclick = closeModal; $('#ov').onclick = e => { if (e.target.id === 'ov') closeModal(); };
  $('#ctForm').onsubmit = async e => {
    e.preventDefault(); const btn = e.target.querySelector('[type=submit]'); btn.disabled = true;
    try {
      const r = await fetch('/api/contato', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ assunto: $('#ctAss').value, nome: $('#ctNome').value, empresa: $('#ctEmp').value, contato: $('#ctCont').value, msg: $('#ctMsg').value, user: ME.id }) });
      const j = await r.json(); if (!j.ok) { btn.disabled = false; return toast(j.msg || 'Não deu para enviar. Tente de novo.'); }
      closeModal(); toast('Mensagem enviada! Obrigado pelo contato.', 5000);
    } catch (x) { btn.disabled = false; toast('Sem conexão. Tente de novo.'); }
  };
}

/* ================= INÍCIO ================= */
watchOverlays();
syncTripsFromServer();
$('#avatarBtn').onclick = openUserMenu;
document.querySelector('.logo').onclick = () => { closeAllOverlays(); if (needExitPrompt()) return exitTripPrompt(); if (ROOM) goHome(); else { UI.plan = null; showHome(); } };
function closeAllOverlays() { $('#modalRoot').innerHTML = ''; if (UI.road) { UI.road = false; renderRoad(); } if (UI.near) { UI.near = false; renderNear(); } }
document.querySelector('.logo').style.cursor = 'pointer';
renderAvatar(); planStatus().then(st => { UI.premium = !!(st && st.premium); renderAvatar(); });
setNet();
if (CODE && ROOM && ROOM.code === CODE && (!urlCode || urlCode.toUpperCase() === CODE)) { enterRoom(); refresh(); } else showHome();
connect();
setInterval(() => { if (ROOM) { drawMembers(); updateMapOverlays(); } }, 15000); // marca quem ficou sem sinal
if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}));
