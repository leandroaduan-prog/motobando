// MotoBando — servidor: grupos de viagem ao vivo (WebSocket), SOS por raio e arquivos do app.
const express = require('express');
const http = require('http');
const path = require('path');
const fs = require('fs');
const { WebSocketServer } = require('ws');

const PORT = process.env.PORT || 3000;
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'rooms.json');
const ROOM_TTL_DAYS = 30;

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
process.on('SIGTERM', () => { dirty = true; persist(); process.exit(0); });

const ALPHA = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
function newCode() {
  let c;
  do { c = 'BANDO-' + Array.from({ length: 4 }, () => ALPHA[Math.floor(Math.random() * ALPHA.length)]).join(''); } while (rooms.has(c));
  return c;
}
const uid = () => Math.random().toString(36).slice(2, 10);
const clip = (s, n = 80) => String(s == null ? '' : s).slice(0, n);
const num = (v, d = 0) => (Number.isFinite(+v) ? +v : d);

function cleanMember(m, old = {}) {
  const moto = m.moto || old.moto || {};
  return {
    id: clip(m.id || old.id, 40),
    name: clip(m.name || old.name || 'Motociclista', 30),
    color: /^#[0-9a-f]{6}$/i.test(m.color) ? m.color : (old.color || '#1F7A4D'),
    role: ['guia', 'integrante', 'garupa'].includes(m.role) ? m.role : (old.role || 'integrante'),
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
  if (Array.isArray(p.stops)) t.stops = p.stops.slice(0, 30).map(s => ({ id: clip(s.id, 20) || uid(), name: clip(s.name, 70), lat: num(s.lat), lng: num(s.lng), type: clip(s.type, 12) || 'parada', note: clip(s.note, 80) }));
  if (Array.isArray(p.checklist)) t.checklist = p.checklist.slice(0, 40).map(c => ({ id: clip(c.id, 20) || uid(), t: clip(c.t, 70) }));
  if ('route' in p) t.route = p.route && Array.isArray(p.route.coords) ? { coords: p.route.coords.slice(0, 6000).map(c => [Math.round(num(c[0]) * 1e5) / 1e5, Math.round(num(c[1]) * 1e5) / 1e5]), dist_km: num(p.route.dist_km), dur_min: num(p.route.dur_min) } : null;
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
        ws.user = { id: clip(m.user.id, 40), name: clip(m.user.name, 30), moto: clip(m.user.motoName, 40), color: m.user.color };
        if (m.sosCfg) ws.sosCfg = { receive: !!m.sosCfg.receive, radius: Math.max(5, Math.min(100, num(m.sosCfg.radius, 30))) };
        if (!sockets.has(ws.user.id)) sockets.set(ws.user.id, new Set());
        sockets.get(ws.user.id).add(ws);
        // reconecta na viagem em que estava
        if (m.code && rooms.has(m.code) && rooms.get(m.code).members[ws.user.id]) attach(ws, rooms.get(m.code));
        else if (m.code) send(ws, { t: 'left', reason: 'Essa viagem não existe mais ou você saiu dela.' });
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
          trip: cleanTrip({ name: m.trip && m.trip.name, date: m.trip && m.trip.date, startTime: (m.trip && m.trip.startTime) || '07:00', mode: m.trip && m.trip.mode, gap: 5, stops: [], checklist: DEFAULT_CHECK.map((t, i) => ({ id: 'c' + i, t })), route: null, postos: [] }, { guideId: ws.user.id }),
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
        if (!r) return send(ws, { t: 'error', msg: 'Código não encontrado. Confira com o guia.' });
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
        const s = { id: uid(), from: { id: ws.user.id, name: ws.user.name, moto: ws.user.moto, color: ws.user.color }, type: clip(m.sosType, 20), lat, lng, ts: Date.now(), code: ws.code, responders: [], notified: new Set() };
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
