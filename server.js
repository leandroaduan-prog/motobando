// MotoBando — servidor: grupos de viagem ao vivo (WebSocket), SOS por raio e arquivos do app.
const express = require('express');
const http = require('http');
const path = require('path');
const fs = require('fs');
const { WebSocketServer } = require('ws');

const PORT = process.env.PORT || 3000;
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'rooms.json');
const ROOM_TTL_DAYS = 400; // viagens programadas para o ano inteiro

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '1mb' }));

// O service worker e o manifest não podem ficar presos em cache antigo
app.get(['/sw.js', '/manifest.webmanifest'], (req, res, next) => { res.set('Cache-Control', 'no-cache'); next(); });
app.use(express.static(path.join(__dirname, 'public'), { maxAge: '1h', index: 'index.html' }));
app.get('/healthz', (req, res) => res.json({ ok: true, rooms: rooms.size, online: wss ? wss.clients.size : 0 }));

// Link do roteiro (enviado pelo WhatsApp): só leitura
app.get('/api/roteiro/:code', (req, res) => {
  const room = rooms.get(String(req.params.code || '').toUpperCase());
  if (!room) return res.status(404).json({ error: 'Viagem não encontrada' });
  const { name, date, startTime, stops, route, mode } = room.trip;
  res.json({ code: room.code, name, date, startTime, mode, stops, route: route ? { dist_km: route.dist_km, dur_min: route.dur_min } : null, members: Object.keys(room.members).length });
});
// Busca de lugares (postos, pousadas, comida…) feita pelo servidor: tenta vários servidores do OpenStreetMap e guarda em cache
const OVERPASS_MIRRORS = ['https://overpass-api.de/api/interpreter', 'https://overpass.private.coffee/api/interpreter', 'https://maps.mail.ru/osm/tools/overpass/api/interpreter', 'https://overpass.kumi.systems/api/interpreter'];
const opCache = new Map();
// consulta todos os servidores ao mesmo tempo; fica com o primeiro que responder certo
async function overpassQuery(q) {
  const hit = opCache.get(q);
  if (hit && Date.now() - hit.t < 30 * 60 * 1000) return hit.data;
  const ctls = OVERPASS_MIRRORS.map(() => new AbortController());
  const errs = [];
  const tries = OVERPASS_MIRRORS.map((url, k) => (async () => {
    const tm = setTimeout(() => ctls[k].abort(), 30000);
    try {
      const r = await fetch(url, { method: 'POST', body: 'data=' + encodeURIComponent(q), headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'MotoBando/0.1 (app de viagem de moto)' }, signal: ctls[k].signal });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const data = await r.json();
      if (!data || !Array.isArray(data.elements)) throw new Error('resposta inválida');
      return data;
    } catch (e) { errs.push(url.split('/')[2] + ' ' + e.message); throw e; } finally { clearTimeout(tm); }
  })());
  try {
    const data = await Promise.any(tries);
    ctls.forEach(c => c.abort());
    opCache.set(q, { t: Date.now(), data });
    if (opCache.size > 500) opCache.delete(opCache.keys().next().value);
    return data;
  } catch (e) { console.warn('Overpass falhou:', errs.join(' | ')); throw new Error('Os servidores de mapa estão ocupados. Tente de novo em alguns segundos.'); }
}
app.post('/api/overpass', async (req, res) => {
  const q = String((req.body && req.body.q) || '');
  if (!q || q.length > 20000 || !/^\[out:json\]/.test(q)) return res.status(400).json({ error: 'consulta inválida' });
  try { res.json(await overpassQuery(q)); } catch (e) { res.status(502).json({ error: e.message }); }
});

// Busca rápida por categoria no buscador do OpenStreetMap (Nominatim): 1 pedido por segundo, com cache
const NEAR_TAGS = {
  posto: ['amenity=fuel'],
  hosp: ['tourism=hotel', 'tourism=guest_house', 'tourism=motel', 'tourism=hostel'],
  comida: ['amenity=restaurant', 'amenity=cafe', 'amenity=fast_food'],
  turismo: ['tourism=viewpoint', 'tourism=attraction', 'natural=waterfall'],
  apoio: ['shop=motorcycle', 'shop=tyres', 'shop=car_repair'],
};
const KIND_PT = { fuel: 'Posto', hotel: 'Hotel', guest_house: 'Pousada', motel: 'Motel', hostel: 'Hostel', restaurant: 'Restaurante', cafe: 'Café', fast_food: 'Lanchonete', viewpoint: 'Mirante', attraction: 'Atração', waterfall: 'Cachoeira', motorcycle: 'Loja/oficina de moto', tyres: 'Borracharia', car_repair: 'Oficina' };
const nearCache = new Map();
let nomChain = Promise.resolve();
function nominatim(url) {
  const p = nomChain.then(async () => {
    const ctl = new AbortController(); const tm = setTimeout(() => ctl.abort(), 10000);
    try {
      const r = await fetch(url, { headers: { 'User-Agent': 'MotoBando/0.1 (https://motobando.onrender.com)', 'Accept-Language': 'pt-BR' }, signal: ctl.signal });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return await r.json();
    } finally { clearTimeout(tm); await new Promise(res => setTimeout(res, 1100)); }
  });
  nomChain = p.catch(() => {});
  return p;
}
async function nearOSM(cat, lat, lng, rk) {
  if (!NEAR_TAGS[cat]) return [];
  const key = `${cat}:${lat.toFixed(2)}:${lng.toFixed(2)}:${rk}`;
  const hit = nearCache.get(key);
  if (hit && Date.now() - hit.t < 60 * 60 * 1000) return hit.list;
  const dLa = rk / 111, dLo = rk / (111 * Math.cos(lat * Math.PI / 180));
  const vb = `${(lng - dLo).toFixed(4)},${(lat + dLa).toFixed(4)},${(lng + dLo).toFixed(4)},${(lat - dLa).toFixed(4)}`;
  const list = []; const seen = new Set(); let errors = 0;
  for (const tag of NEAR_TAGS[cat]) {
    try {
      const j = await nominatim(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=40&bounded=1&extratags=1&viewbox=${vb}&q=${encodeURIComponent('[' + tag + ']')}`);
      for (const x of j) {
        const id = x.osm_type + x.osm_id; if (seen.has(id)) continue; seen.add(id);
        const et = x.extratags || {};
        const name = x.name || et.brand || et.operator || KIND_PT[x.type] || 'Sem nome';
        const addr = (x.display_name || '').split(',').slice(x.name ? 1 : 0, x.name ? 3 : 2).join(',').trim();
        list.push({ cat, name, lat: +x.lat, lng: +x.lon, kind: KIND_PT[x.type] || '', sub: '', extra: [et.opening_hours === '24/7' ? 'Aberto 24h' : '', addr].filter(Boolean).join(' · ').slice(0, 80), phone: et.phone || et['contact:phone'] || '', web: et.website || et['contact:website'] || '', named: !!x.name });
      }
    } catch (e) { errors++; }
  }
  if (!list.length && errors) throw new Error('buscador ocupado');
  nearCache.set(key, { t: Date.now(), list });
  if (nearCache.size > 1000) nearCache.delete(nearCache.keys().next().value);
  return list;
}
// criador de viagens automáticas + lugares com notas do Google (quando houver GOOGLE_PLACES_KEY)
const planner = require('./plan')(app, { nominatim, nearOSM, overpassQuery, DATA_DIR });
require('./agente')(app, { DATA_DIR });
app.get('/api/near', async (req, res) => {
  const cat = String(req.query.cat || ''); const lat = +req.query.lat, lng = +req.query.lng;
  const rk = Math.max(1, Math.min(30, +req.query.r || 10));
  if (!NEAR_TAGS[cat] || !Number.isFinite(lat) || !Number.isFinite(lng)) return res.status(400).json({ error: 'pedido inválido' });
  try { res.json(planner.hasGoogle() ? await planner.places(cat, lat, lng, rk) : await nearOSM(cat, lat, lng, rk)); }
  catch (e) { res.status(502).json({ error: 'buscador ocupado' }); }
});

// viagens de que a pessoa participa (para preencher a pasta "Minhas viagens" em qualquer aparelho)
// recuperar pelo código pessoal: devolve o nome usado nas viagens (para confirmar que é a pessoa)
app.get('/api/quem-sou', (req, res) => {
  const uid = String(req.query.user || '').slice(0, 40); let name = '', n = 0;
  for (const r of rooms.values()) { const m = r.members[uid]; if (m) { name = name || m.name; n++; } }
  res.json({ name, trips: n });
});
app.get('/api/minhas-viagens', (req, res) => {
  const uid = String(req.query.user || '').slice(0, 40); if (!uid) return res.json([]);
  const out = [];
  for (const r of rooms.values()) {
    const m = r.members[uid]; if (!m) continue;
    out.push({ code: r.code, name: r.trip.name, date: r.trip.date, startTime: r.trip.startTime, mode: r.trip.mode, status: r.trip.status || 'planejada', role: m.role, guide: r.trip.guideId === uid, stops: r.trip.stops.length, dist: r.trip.route ? r.trip.route.dist_km : null, members: Object.keys(r.members).length });
  }
  res.json(out);
});

/* contato comercial: guarda as mensagens; o dono lê em /api/contatos?key=ADMIN_KEY */
const CONTATO_FILE = path.join(DATA_DIR, 'contatos.json');
const lastContato = new Map();
app.post('/api/contato', (req, res) => {
  const b = req.body || {}; const ip = req.headers['x-forwarded-for'] || req.ip;
  if (Date.now() - (lastContato.get(ip) || 0) < 30000) return res.status(429).json({ ok: false, msg: 'Aguarde um pouco para mandar outra mensagem.' });
  const c = { ts: new Date().toISOString(), nome: clip(b.nome, 60), empresa: clip(b.empresa, 80), contato: clip(b.contato, 80), assunto: clip(b.assunto, 30), msg: clip(b.msg, 1500), user: clip(b.user, 40) };
  if (!c.nome || !c.contato || !c.msg) return res.status(400).json({ ok: false, msg: 'Preencha nome, contato e mensagem.' });
  lastContato.set(ip, Date.now());
  let all = []; try { all = JSON.parse(fs.readFileSync(CONTATO_FILE, 'utf8')); } catch (e) {}
  all.push(c); try { fs.mkdirSync(DATA_DIR, { recursive: true }); fs.writeFileSync(CONTATO_FILE, JSON.stringify(all.slice(-1000))); } catch (e) {}
  console.log('[contato]', c.assunto, c.nome, c.contato);
  res.json({ ok: true });
});
app.get('/api/contatos', (req, res) => {
  if (!process.env.ADMIN_KEY || req.query.key !== process.env.ADMIN_KEY) return res.status(403).json({ ok: false });
  let all = []; try { all = JSON.parse(fs.readFileSync(CONTATO_FILE, 'utf8')); } catch (e) {}
  res.json(all.reverse());
});

// Qualquer /r/CODIGO abre o app (ele lê o código da URL)
app.get(['/r/:code', '/r/:code/*'], (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

/* ================= ESTADO ================= */
const rooms = new Map(); // code -> room
let dirty = false;
function load() {
  try {
    const raw = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    const limit = Date.now() - ROOM_TTL_DAYS * 864e5;
    for (const r of raw) {
      if ((r.updatedAt || r.createdAt) < limit) continue;
      for (const m of Object.values(r.members)) m.online = false;
      rooms.set(r.code, r);
    }
    console.log(`Carregadas ${rooms.size} viagens`);
  } catch (e) { if (e.code !== 'ENOENT') console.error('Erro ao carregar', e.message); }
}
function persist() {
  if (!dirty) return;
  dirty = false;
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(DATA_FILE + '.tmp', JSON.stringify([...rooms.values()]));
    fs.renameSync(DATA_FILE + '.tmp', DATA_FILE);
  } catch (e) { console.error('Erro ao salvar', e.message); }
}
load();
setInterval(persist, 10000);
// ao atualizar, termina os pedidos em andamento antes de desligar
process.on('SIGTERM', () => { dirty = true; persist(); try { server.close(() => process.exit(0)); } catch (e) {} setTimeout(() => process.exit(0), 9000).unref(); });

const ALPHA = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
function newCode() {
  let c;
  do { c = 'BANDO-' + Array.from({ length: 4 }, () => ALPHA[Math.floor(Math.random() * ALPHA.length)]).join(''); } while (rooms.has(c));
  return c;
}
const uid = () => Math.random().toString(36).slice(2, 10);
const clip = (s, n = 80) => String(s == null ? '' : s).slice(0, n);
const num = (v, d = 0) => (Number.isFinite(+v) ? +v : d);

const SANGUE = ['A+','A-','B+','B-','AB+','AB-','O+','O-'];
const sangueOk = v => SANGUE.includes(v) ? v : '';
function cleanMember(m, old = {}) {
  const moto = m.moto || old.moto || {};
  return {
    id: clip(m.id || old.id, 40),
    name: clip(m.name || old.name || 'Motociclista', 30),
    color: /^#[0-9a-f]{6}$/i.test(m.color) ? m.color : (old.color || '#1F7A4D'),
    role: ['guia', 'integrante', 'garupa'].includes(m.role) ? m.role : (old.role || 'integrante'),
    sangue: m.sangue !== undefined ? sangueOk(m.sangue) : (old.sangue || ''),
    garupaOf: m.role === 'garupa' || (m.role === undefined && old.role === 'garupa') ? clip(m.garupaOf !== undefined ? m.garupaOf : old.garupaOf, 40) : '',
    moto: { model: clip(moto.model, 30), fuel: Math.max(5, Math.min(100, num(moto.fuel, 100))), bagagem: !!moto.bagagem, estilo: ['tranquilo', 'normal', 'esportivo'].includes(moto.estilo) ? moto.estilo : 'normal', real: num(moto.real, 0), markKm: num(moto.markKm, 0) },
    checks: typeof m.checks === 'object' && m.checks ? Object.fromEntries(Object.entries(m.checks).slice(0, 60).map(([k, v]) => [clip(k, 20), !!v])) : (old.checks || {}),
    pos: old.pos || null,
    online: old.online || false,
    lastSeen: old.lastSeen || Date.now(),
  };
}
function cleanTrip(p, old) {
  const t = { ...old };
  if ('name' in p) t.name = clip(p.name, 60) || 'Minha viagem';
  if ('date' in p) t.date = clip(p.date, 10);
  if ('startTime' in p) t.startTime = /^\d\d:\d\d$/.test(p.startTime) ? p.startTime : '07:00';
  if ('mode' in p) t.mode = p.mode === 'solo' ? 'solo' : 'grupo';
  if ('gap' in p) t.gap = Math.max(1, Math.min(50, num(p.gap, 5)));
  if ('status' in p) { t.status = ['planejada', 'andamento', 'encerrada'].includes(p.status) ? p.status : 'planejada'; if (t.status === 'andamento' && !t.startedAt) t.startedAt = Date.now(); if (t.status === 'encerrada') t.endedAt = Date.now(); }
  if (Array.isArray(p.stops)) t.stops = p.stops.slice(0, 100).map(s => ({ id: clip(s.id, 20) || uid(), name: clip(s.name, 70), lat: num(s.lat), lng: num(s.lng), type: clip(s.type, 12) || 'parada', note: clip(s.note, 120) }));
  if (Array.isArray(p.checklist)) t.checklist = p.checklist.slice(0, 40).map(c => ({ id: clip(c.id, 20) || uid(), t: clip(c.t, 70) }));
  if ('route' in p) t.route = p.route && Array.isArray(p.route.coords) ? { coords: p.route.coords.slice(0, 6000).map(c => [Math.round(num(c[0]) * 1e5) / 1e5, Math.round(num(c[1]) * 1e5) / 1e5]), dist_km: num(p.route.dist_km), dur_min: num(p.route.dur_min), label: clip(p.route.label, 30), via: clip(p.route.via, 160) } : null;
  if (Array.isArray(p.postos)) t.postos = p.postos.slice(0, 400).map(x => ({ lat: num(x.lat), lng: num(x.lng), name: clip(x.name, 60), km: num(x.km) }));
  return t;
}
const DEFAULT_CHECK = ['Pneus calibrados', 'Óleo no nível e corrente lubrificada', 'Tanque cheio', 'CNH e documento da moto (CRLV)', 'Capa de chuva', 'Kit de ferramentas e reparo de pneu', 'Carregador e suporte do celular', 'Água e lanche', 'Assistência 24h / seguro no celular'];

/* ================= TEMPO REAL ================= */
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws', maxPayload: 1024 * 1024 });
const sockets = new Map(); // userId -> Set<ws>
const sosList = new Map(); // id -> sos

function send(ws, obj) { if (ws.readyState === 1) ws.send(JSON.stringify(obj)); }
function toUser(userId, obj) { const s = sockets.get(userId); if (s) for (const ws of s) send(ws, obj); }
function toRoom(room, obj, exceptUser) { for (const id of Object.keys(room.members)) if (id !== exceptUser) toUser(id, obj); }
function publicRoom(room) {
  return { code: room.code, trip: room.trip, members: room.members, expenses: room.expenses, createdAt: room.createdAt };
}
function broadcastRoom(room) { room.updatedAt = Date.now(); dirty = true; toRoom(room, { t: 'room', room: publicRoom(room) }); }
function haversine(a, b) {
  const R = 6371, dLa = (b.lat - a.lat) * Math.PI / 180, dLo = (b.lng - a.lng) * Math.PI / 180;
  const x = Math.sin(dLa / 2) ** 2 + Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180) * Math.sin(dLo / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

wss.on('connection', (ws) => {
  ws.user = null; ws.code = null; ws.pos = null; ws.sosCfg = { receive: true, radius: 30 };
  ws.isAlive = true;
  ws.on('pong', () => { ws.isAlive = true; });

  ws.on('message', (buf) => {
    let m; try { m = JSON.parse(buf); } catch { return; }
    const room = ws.code ? rooms.get(ws.code) : null;
    switch (m.t) {
      case 'hello': {
        if (!m.user || !m.user.id) return;
        ws.user = { id: clip(m.user.id, 40), name: clip(m.user.name, 30), moto: clip(m.user.motoName, 40), color: m.user.color, sangue: sangueOk(m.user.sangue) };
        if (m.sosCfg) ws.sosCfg = { receive: !!m.sosCfg.receive, radius: Math.max(5, Math.min(100, num(m.sosCfg.radius, 30))) };
        if (!sockets.has(ws.user.id)) sockets.set(ws.user.id, new Set());
        sockets.get(ws.user.id).add(ws);
        // reconecta na viagem em que estava
        if (m.code && rooms.has(m.code) && rooms.get(m.code).members[ws.user.id]) attach(ws, rooms.get(m.code));
        else if (m.code) send(ws, { t: 'left', reason: 'Essa viagem não existe mais ou você saiu dela.', code: m.code, missing: !rooms.has(m.code) });
        // SOS ativos por perto
        for (const s of sosList.values()) if (s.from.id !== ws.user.id && s.notified.has(ws.user.id)) send(ws, { t: 'sos:new', sos: sosPublic(s) });
        break;
      }
      case 'cfg': if (m.sosCfg) ws.sosCfg = { receive: !!m.sosCfg.receive, radius: Math.max(5, Math.min(100, num(m.sosCfg.radius, 30))) }; break;
      case 'create': {
        if (!ws.user) return;
        const code = newCode();
        const member = cleanMember({ ...m.member, id: ws.user.id, role: 'guia' });
        const r = {
          code, createdAt: Date.now(), updatedAt: Date.now(),
          trip: cleanTrip({ name: m.trip && m.trip.name, date: m.trip && m.trip.date, startTime: (m.trip && m.trip.startTime) || '07:00', mode: m.trip && m.trip.mode, gap: 5, stops: (m.trip && Array.isArray(m.trip.stops)) ? m.trip.stops : [], checklist: (m.trip && Array.isArray(m.trip.checklist) && m.trip.checklist.length) ? m.trip.checklist : DEFAULT_CHECK.map((t, i) => ({ id: 'c' + i, t })), route: (m.trip && m.trip.route) || null, postos: (m.trip && m.trip.postos) || [] }, { guideId: ws.user.id }),
          members: { [ws.user.id]: member }, expenses: [],
        };
        rooms.set(code, r); dirty = true;
        attach(ws, r);
        break;
      }
      case 'join': {
        if (!ws.user) return;
        const code = clip(m.code, 12).toUpperCase().trim();
        const r = rooms.get(code) || rooms.get('BANDO-' + code.replace(/^BANDO-?/, ''));
        if (!r) {
          // o servidor pode ter reiniciado: o guia guarda uma cópia e recria a viagem com o mesmo código
          const snap = m.snap;
          if (snap && snap.trip && snap.trip.guideId === ws.user.id && /^BANDO-[A-Z0-9]{4}$/.test(code)) {
            const nr = { code, createdAt: Date.now(), updatedAt: Date.now(), trip: cleanTrip(snap.trip, { guideId: ws.user.id }), members: { [ws.user.id]: cleanMember({ ...m.member, id: ws.user.id, role: 'guia' }) }, expenses: Array.isArray(snap.expenses) ? snap.expenses.slice(0, 300).map(e => ({ id: clip(e.id, 20) || uid(), d: clip(e.d, 60), v: num(e.v), by: clip(e.by, 40), split: (e.split || []).slice(0, 30).map(x => clip(x, 40)), at: num(e.at, Date.now()) })) : [] };
            rooms.set(code, nr); dirty = true; attach(ws, nr); break;
          }
          return send(ws, { t: 'error', msg: 'Código não encontrado. Confira com o guia.', code });
        }
        if (Object.keys(r.members).length >= 30 && !r.members[ws.user.id]) return send(ws, { t: 'error', msg: 'Esse grupo já está cheio (30 pessoas).' });
        const old = r.members[ws.user.id] || {};
        r.members[ws.user.id] = cleanMember({ ...m.member, id: ws.user.id, role: old.role === 'guia' ? 'guia' : (m.member && m.member.role) || 'integrante' }, old);
        attach(ws, r);
        broadcastRoom(r);
        break;
      }
      case 'leave': {
        if (!room || !ws.user) return;
        const wasGuide = room.trip.guideId === ws.user.id;
        delete room.members[ws.user.id];
        for (const mm of Object.values(room.members)) if (mm.garupaOf === ws.user.id) mm.garupaOf = '';
        if (wasGuide) { const next = Object.values(room.members).find(x => x.role !== 'garupa') || Object.values(room.members)[0]; if (next) { next.role = 'guia'; room.trip.guideId = next.id; } }
        if (!Object.keys(room.members).length) rooms.delete(room.code);
        else broadcastRoom(room);
        for (const s of sockets.get(ws.user.id) || []) s.code = null;
        toUser(ws.user.id, { t: 'left' });
        dirty = true;
        break;
      }
      case 'member': {
        if (!room || !ws.user) return;
        const old = room.members[ws.user.id]; if (!old) return;
        const patch = { ...old, ...m.patch, id: ws.user.id };
        if (old.role === 'guia') patch.role = 'guia';
        if (patch.role === 'guia' && old.role !== 'guia') patch.role = 'integrante';
        room.members[ws.user.id] = cleanMember(patch, old);
        broadcastRoom(room);
        break;
      }
      case 'trip': {
        if (!room || !ws.user) return;
        if (room.trip.guideId !== ws.user.id) return send(ws, { t: 'error', msg: 'Só o guia pode mudar o roteiro.' });
        room.trip = cleanTrip(m.patch || {}, room.trip);
        broadcastRoom(room);
        break;
      }
      case 'guide': { // passar o papel de guia
        if (!room || !ws.user || room.trip.guideId !== ws.user.id) return;
        const target = room.members[m.id]; if (!target || target.role === 'garupa') return;
        room.members[ws.user.id].role = 'integrante'; target.role = 'guia'; room.trip.guideId = target.id;
        broadcastRoom(room);
        break;
      }
      case 'pos': {
        if (!ws.user) return;
        const pos = { lat: num(m.lat), lng: num(m.lng), acc: num(m.acc), spd: num(m.spd), hdg: num(m.hdg), ts: Date.now(), sim: !!m.sim };
        if (!pos.lat && !pos.lng) return;
        for (const s of sockets.get(ws.user.id) || []) s.pos = pos;
        if (room && room.members[ws.user.id]) {
          room.members[ws.user.id].pos = pos; room.members[ws.user.id].lastSeen = pos.ts;
          toRoom(room, { t: 'pos', id: ws.user.id, pos }, ws.user.id);
          dirty = true;
        }
        break;
      }
      case 'exp:add': {
        if (!room || !ws.user) return;
        const e = m.exp || {};
        const ids = Object.keys(room.members);
        const split = (Array.isArray(e.split) ? e.split : []).filter(id => ids.includes(id));
        if (!split.length || !ids.includes(e.by)) return;
        room.expenses.push({ id: uid(), d: clip(e.d, 60) || 'Gasto', v: Math.max(0, Math.round(num(e.v) * 100) / 100), by: e.by, split, at: Date.now(), addedBy: ws.user.id });
        broadcastRoom(room);
        break;
      }
      case 'exp:del': {
        if (!room) return;
        room.expenses = room.expenses.filter(e => e.id !== m.id);
        broadcastRoom(room);
        break;
      }
      case 'notice': { // pedir parada, preciso abastecer, reagrupar
        if (!room || !ws.user) return;
        toRoom(room, { t: 'notice', kind: clip(m.kind, 20), from: ws.user.id, name: room.members[ws.user.id] && room.members[ws.user.id].name, ts: Date.now() }, ws.user.id);
        break;
      }
      case 'sos': {
        if (!ws.user) return;
        const lat = num(m.lat), lng = num(m.lng);
        const s = { id: uid(), from: { id: ws.user.id, name: ws.user.name, moto: ws.user.moto, color: ws.user.color, sangue: ws.user.sangue || '' }, type: clip(m.sosType, 20), lat, lng, ts: Date.now(), code: ws.code, responders: [], notified: new Set() };
        // quem recebe: todo mundo do grupo + qualquer usuário conectado dentro do raio que ele escolheu
        const roomIds = room ? Object.keys(room.members) : [];
        for (const set of sockets.values()) for (const c of set) {
          if (!c.user || c.user.id === ws.user.id) continue;
          const inGroup = roomIds.includes(c.user.id);
          const d = c.pos && (lat || lng) ? haversine(c.pos, { lat, lng }) : null;
          if (inGroup || (c.sosCfg.receive && d !== null && d <= c.sosCfg.radius)) s.notified.add(c.user.id);
        }
        sosList.set(s.id, s);
        for (const id of s.notified) toUser(id, { t: 'sos:new', sos: sosPublic(s) });
        send(ws, { t: 'sos:mine', sos: sosPublic(s) });
        break;
      }
      case 'sos:go': {
        const s = sosList.get(m.id); if (!s || !ws.user) return;
        if (!s.responders.find(r => r.id === ws.user.id)) s.responders.push({ id: ws.user.id, name: ws.user.name, moto: ws.user.moto, color: ws.user.color, group: !!(s.code && s.code === ws.code) });
        updateSos(s);
        break;
      }
      case 'sos:end': {
        const s = sosList.get(m.id); if (!s || !ws.user || s.from.id !== ws.user.id) return;
        sosList.delete(s.id);
        for (const id of s.notified) toUser(id, { t: 'sos:ended', id: s.id, name: s.from.name });
        toUser(s.from.id, { t: 'sos:ended', id: s.id, mine: true });
        break;
      }
    }
  });

  ws.on('close', () => {
    if (!ws.user) return;
    const set = sockets.get(ws.user.id);
    if (set) { set.delete(ws); if (!set.size) sockets.delete(ws.user.id); }
    const room = ws.code && rooms.get(ws.code);
    if (room && room.members[ws.user.id] && !sockets.has(ws.user.id)) { room.members[ws.user.id].online = false; broadcastRoom(room); }
  });
});

function attach(ws, room) {
  for (const s of sockets.get(ws.user.id) || [ws]) s.code = room.code;
  ws.code = room.code;
  const mm = room.members[ws.user.id];
  if (mm) { mm.online = true; mm.lastSeen = Date.now(); }
  send(ws, { t: 'joined', code: room.code });
  broadcastRoom(room);
}
function sosPublic(s) {
  return { id: s.id, from: s.from, type: s.type, lat: s.lat, lng: s.lng, ts: s.ts, responders: s.responders.map(r => {
    const set = sockets.get(r.id); let pos = null; if (set) for (const c of set) if (c.pos) pos = c.pos;
    return { ...r, km: pos && (s.lat || s.lng) ? Math.round(haversine(pos, s) * 10) / 10 : null };
  }), notified: s.notified.size };
}
function updateSos(s) { const pub = sosPublic(s); toUser(s.from.id, { t: 'sos:update', sos: pub }); for (const r of s.responders) toUser(r.id, { t: 'sos:update', sos: pub }); }
// distância de quem está indo ajudar, atualizada a cada 15 s; SOS expira em 6 h
setInterval(() => { for (const s of sosList.values()) { if (Date.now() - s.ts > 6 * 36e5) sosList.delete(s.id); else if (s.responders.length) updateSos(s); } }, 15000);
// mantém conexões vivas
setInterval(() => { for (const ws of wss.clients) { if (!ws.isAlive) { ws.terminate(); continue; } ws.isAlive = false; try { ws.ping(); } catch {} } }, 30000);

server.listen(PORT, () => console.log(`MotoBando rodando na porta ${PORT}`));
