// MotoBando — criador de viagens automáticas.
// Rota real (OSRM), dias pela "puxada", pernoites, postos pela autonomia da moto, descanso, almoço,
// pontos turísticos, estradas de terra, 3 orçamentos e fronteiras. Notas do Google quando há chave.
const fs = require('fs');
const path = require('path');

module.exports = function setupPlanner(app, { nominatim, nearOSM, overpassQuery, DATA_DIR }) {
  const GKEY = () => process.env.GOOGLE_PLACES_KEY || '';
  const CODES = () => (process.env.PREMIUM_CODES || '').split(',').map(s => s.trim().toUpperCase()).filter(Boolean);
  const FREE_PLANS = 1;

  /* ---------- uso do plano grátis ---------- */
  const USAGE_FILE = path.join(DATA_DIR, 'usage.json');
  let usage = {};
  try { usage = JSON.parse(fs.readFileSync(USAGE_FILE, 'utf8')); } catch (e) {}
  const saveUsage = () => { try { fs.mkdirSync(DATA_DIR, { recursive: true }); fs.writeFileSync(USAGE_FILE, JSON.stringify(usage)); } catch (e) {} };

  /* ---------- geometria ---------- */
  const rad = d => d * Math.PI / 180;
  const hav = (a, b) => { const dLa = rad(b.lat - a.lat), dLo = rad(b.lng - a.lng); const x = Math.sin(dLa / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLo / 2) ** 2; return 2 * 6371 * Math.asin(Math.sqrt(Math.min(1, x))); };
  function build(coords) { const cum = [0]; for (let i = 1; i < coords.length; i++) cum.push(cum[i - 1] + hav({ lat: coords[i - 1][0], lng: coords[i - 1][1] }, { lat: coords[i][0], lng: coords[i][1] })); return { coords, cum, total: cum[cum.length - 1] }; }
  function pointAt(R, km) { km = Math.max(0, Math.min(R.total, km)); let lo = 0, hi = R.cum.length - 1; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (R.cum[m] <= km) lo = m; else hi = m; } const t = (km - R.cum[lo]) / ((R.cum[hi] - R.cum[lo]) || 1); const a = R.coords[lo], b = R.coords[hi]; return { lat: a[0] + (b[0] - a[0]) * t, lng: a[1] + (b[1] - a[1]) * t }; }
  function project(R, p) { const kx = Math.cos(rad(p.lat)) * 111.32, ky = 110.57; let best = { d2: Infinity, km: 0 }; for (let i = 0; i < R.coords.length - 1; i++) { const a = R.coords[i], b = R.coords[i + 1]; const ax = (a[1] - p.lng) * kx, ay = (a[0] - p.lat) * ky, bx = (b[1] - p.lng) * kx, by = (b[0] - p.lat) * ky; const dx = bx - ax, dy = by - ay, L = dx * dx + dy * dy; let t = L ? -(ax * dx + ay * dy) / L : 0; t = Math.max(0, Math.min(1, t)); const px = ax + t * dx, py = ay + t * dy, d2 = px * px + py * py; if (d2 < best.d2) best = { d2, km: R.cum[i] + t * (R.cum[i + 1] - R.cum[i]) }; } return { km: best.km, off: Math.sqrt(best.d2) }; }
  function thin(coords, step = 0.08) { if (coords.length < 3) return coords; const out = [coords[0]]; let last = coords[0]; for (let i = 1; i < coords.length - 1; i++) { const c = coords[i]; if (hav({ lat: last[0], lng: last[1] }, { lat: c[0], lng: c[1] }) >= step) { out.push(c); last = c; } } out.push(coords[coords.length - 1]); return out; }

  async function fetchJSON(url, opts = {}, ms = 20000) {
    const ctl = new AbortController(); const tm = setTimeout(() => ctl.abort(), ms);
    try { const r = await fetch(url, { ...opts, signal: ctl.signal }); if (!r.ok) throw new Error('HTTP ' + r.status + ' ' + (await r.text()).slice(0, 200)); return await r.json(); }
    finally { clearTimeout(tm); }
  }
  async function osrm(points) {
    const p = points.map(x => `${(+x.lng).toFixed(5)},${(+x.lat).toFixed(5)}`).join(';');
    const j = await fetchJSON(`https://router.project-osrm.org/route/v1/driving/${p}?overview=full&geometries=geojson`, { headers: { 'User-Agent': 'MotoBando/0.1' } }, 30000);
    if (!j.routes || !j.routes.length) throw new Error('Não encontrei rota entre esses pontos');
    const r = j.routes[0];
    return { coords: thin(r.geometry.coordinates.map(c => [c[1], c[0]])), dist_km: r.distance / 1000, dur_min: r.duration / 60 };
  }

  /* ---------- lugares: Google (com notas) ou OpenStreetMap ---------- */
  const GTYPES = { hosp: ['lodging'], comida: ['restaurant'], posto: ['gas_station'], turismo: ['tourist_attraction'], apoio: ['car_repair'], descanso: ['cafe', 'restaurant', 'gas_station'], camping: ['campground'] };
  const PRICE = { PRICE_LEVEL_FREE: 0, PRICE_LEVEL_INEXPENSIVE: 1, PRICE_LEVEL_MODERATE: 2, PRICE_LEVEL_EXPENSIVE: 3, PRICE_LEVEL_VERY_EXPENSIVE: 4 };
  const FIELDS = 'places.id,places.displayName,places.rating,places.userRatingCount,places.priceLevel,places.location,places.formattedAddress,places.googleMapsUri,places.primaryTypeDisplayName,places.nationalPhoneNumber,places.websiteUri';
  const gNorm = (cat, x) => ({ cat, id: x.id, name: (x.displayName || {}).text || 'Sem nome', lat: x.location.latitude, lng: x.location.longitude, kind: (x.primaryTypeDisplayName || {}).text || '', rating: x.rating || null, reviews: x.userRatingCount || 0, price: x.priceLevel in PRICE ? PRICE[x.priceLevel] : null, extra: (x.formattedAddress || '').split(',').slice(0, 2).join(','), phone: x.nationalPhoneNumber || '', web: x.websiteUri || '', maps: x.googleMapsUri || '', named: true, src: 'google' });
  const placeCache = new Map();
  async function places(cat, lat, lng, rk) {
    const key = `${cat}:${lat.toFixed(3)}:${lng.toFixed(3)}:${rk}`;
    const hit = placeCache.get(key); if (hit && Date.now() - hit.t < 6 * 3600e3) return hit.list;
    let list = [];
    if (GKEY() && GTYPES[cat]) {
      try {
        const j = await fetchJSON('https://places.googleapis.com/v1/places:searchNearby', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': GKEY(), 'X-Goog-FieldMask': FIELDS }, body: JSON.stringify({ includedTypes: GTYPES[cat], maxResultCount: 20, rankPreference: 'POPULARITY', languageCode: 'pt-BR', locationRestriction: { circle: { center: { latitude: lat, longitude: lng }, radius: Math.min(50000, rk * 1000) } } }) }, 15000);
        list = (j.places || []).map(x => gNorm(cat, x));
      } catch (e) { console.warn('Google Places falhou:', e.message.slice(0, 160)); }
    }
    if (!list.length) {
      const osmCat = { descanso: 'posto', camping: 'hosp' }[cat] || cat;
      try { list = (await nearOSM(osmCat, lat, lng, rk)).map(p => ({ ...p, cat, src: 'osm' })); } catch (e) { list = []; }
    }
    placeCache.set(key, { t: Date.now(), list }); if (placeCache.size > 3000) placeCache.delete(placeCache.keys().next().value);
    return list;
  }
  async function textSearch(q, lat, lng, rk) {
    if (!GKEY()) return [];
    try {
      const j = await fetchJSON('https://places.googleapis.com/v1/places:searchText', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': GKEY(), 'X-Goog-FieldMask': FIELDS }, body: JSON.stringify({ textQuery: q, maxResultCount: 8, languageCode: 'pt-BR', locationBias: { circle: { center: { latitude: lat, longitude: lng }, radius: Math.min(50000, rk * 1000) } } }) }, 15000);
      return (j.places || []).map(x => gNorm('apoio', x));
    } catch (e) { return []; }
  }
  // nota ponderada pelo número de avaliações; sem Google, usa sinais do mapa
  const score = p => p.rating ? p.rating * Math.log10((p.reviews || 0) + 10) : (p.named ? 4 : 3) + (p.phone ? 0.3 : 0) + (p.web ? 0.3 : 0);
  function pickLodging(list) {
    if (!list.length) return null;
    const isBudget = p => /hostel|camping|pousada|motel|albergue|guest/i.test(p.kind + ' ' + p.name);
    const isLux = p => /resort|spa|palace|grand|boutique|5 estrelas|luxo/i.test(p.name + ' ' + p.kind);
    const ok = list.filter(p => !p.rating || p.rating >= 3.8);
    const L = ok.length ? ok : list;
    const best = f => [...L].sort((a, b) => f(b) - f(a))[0];
    return {
      economica: best(p => score(p) - (p.price != null ? p.price * 1.4 : (isBudget(p) ? -0.5 : 1.2)) + (isBudget(p) ? 1 : 0)),
      custo: best(p => score(p) / (1 + 0.22 * (p.price != null ? p.price : 2)) + (p.rating >= 4.4 ? 0.4 : 0)),
      conforto: best(p => score(p) + (p.price != null ? p.price * 0.9 : 0) + (isLux(p) ? 1.5 : 0) + (p.rating >= 4.6 ? 1 : 0)),
    };
  }
  const bestOf = (list, R, maxOff = 8) => list.map(p => ({ p, pr: project(R, p) })).filter(x => x.pr.off <= maxOff).sort((a, b) => (score(b.p) - b.pr.off * 0.25) - (score(a.p) - a.pr.off * 0.25))[0];
  const stopOf = (type, x, R, extra = {}) => x ? { id: Math.random().toString(36).slice(2, 9), type, km: Math.round(x.pr.km * 10) / 10, off: Math.round(x.pr.off * 10) / 10, name: x.p.name, lat: x.p.lat, lng: x.p.lng, rating: x.p.rating, reviews: x.p.reviews, price: x.p.price, kind: x.p.kind, maps: x.p.maps || '', phone: x.p.phone || '', cat: x.p.cat, ...extra } : null;

  async function countryAt(p) {
    try { const j = await nominatim(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=5&lat=${p.lat.toFixed(4)}&lon=${p.lng.toFixed(4)}`); return ((j.address || {}).country_code || '').toLowerCase(); } catch (e) { return ''; }
  }
  async function placeName(p) {
    try { const j = await nominatim(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=10&lat=${p.lat.toFixed(4)}&lon=${p.lng.toFixed(4)}`); const a = j.address || {}; return { name: a.city || a.town || a.village || a.municipality || j.name || '', cc: (a.country_code || '').toLowerCase() }; } catch (e) { return { name: '', cc: '' }; }
  }

  /* ---------- o planejador ---------- */
  async function plan(inp, job) {
    const step = (pct, msg) => { job.progress = pct; job.msg = msg; };
    step(5, 'Traçando a rota');
    const pts = [inp.origin, ...(inp.via || []), inp.dest];
    const given = inp.route && Array.isArray(inp.route.coords) ? inp.route.coords.map(c => [+c[0], +c[1]]).filter(c => Number.isFinite(c[0]) && Number.isFinite(c[1])).slice(0, 8000) : null;
    const rt = given && given.length > 1 && +inp.route.dist_km > 0 && +inp.route.dur_min > 0 ? { coords: given, dist_km: +inp.route.dist_km, dur_min: +inp.route.dur_min } : await osrm(pts);
    const R = build(rt.coords);
    const total = R.total;
    const daily = Math.max(80, Math.min(1200, +inp.dailyKm || 350));
    const nDays = Math.max(1, Math.round(total / daily + 0.25));
    const perDay = total / nDays;
    const avgKmh = Math.max(35, (rt.dist_km / (rt.dur_min / 60)) * 0.92);
    const moto = inp.moto || {}; const kml = Math.max(8, +moto.kml || 22) * 0.95, tank = Math.max(5, +moto.tanque || 15);
    const range = tank * kml, reserve = Math.max(30, range * 0.15), safe = Math.max(60, range - reserve);
    const fuelPrice = +inp.fuelPrice || 6.29;
    const prefs = inp.prefs || {};

    // dias
    const days = [];
    for (let d = 0; d < nDays; d++) days.push({ n: d + 1, fromKm: d * perDay, toKm: (d + 1) * perDay, stops: [], offroad: [] });

    // pernoites (inclui hospedagem no destino)
    for (const day of days) {
      step(10 + Math.round(35 * day.n / nDays), `Procurando onde dormir no dia ${day.n}`);
      const p = pointAt(R, day.toKm);
      let list = await places('hosp', p.lat, p.lng, 15);
      if (list.length < 3) list = list.concat(await places('hosp', p.lat, p.lng, 35));
      const near = list.filter(x => hav(p, x) <= 40);
      day.lodging = pickLodging(near);
      day.lodgingAlts = near.sort((a, b) => score(b) - score(a)).slice(0, 12).map(x => ({ name: x.name, lat: x.lat, lng: x.lng, rating: x.rating, reviews: x.reviews, price: x.price, kind: x.kind, maps: x.maps || '' }));
      const pn = await placeName(p); day.endName = pn.name; day.endCC = pn.cc;
    }

    // combustível pela autonomia da moto
    step(50, 'Escolhendo os postos pela autonomia da sua moto');
    const fuelStops = []; let pos = 0, guard = 0;
    while (total - pos > safe && guard++ < 40) {
      const target = pos + safe * 0.82;
      const p = pointAt(R, target);
      const list = await places('posto', p.lat, p.lng, 8);
      const x = bestOf(list.filter(s => { const pr = project(R, s); return pr.km > pos + 20 && pr.km <= pos + safe; }), R, 3) || bestOf(list, R, 6);
      if (x && x.pr.km > pos + 10) { fuelStops.push(stopOf('abastecer', x, R)); pos = x.pr.km; }
      else { fuelStops.push({ id: 'f' + guard, type: 'abastecer', km: Math.round(target), name: 'Abastecer por aqui (sem posto confirmado no mapa)', lat: p.lat, lng: p.lng, cat: 'posto', warn: true }); pos = target; }
    }

    // almoço e descanso
    for (const day of days) {
      step(55 + Math.round(15 * day.n / nDays), `Paradas de almoço e descanso do dia ${day.n}`);
      const dk = day.toKm - day.fromKm;
      const inDay = s => s.km >= day.fromKm && s.km < day.toKm;
      day.stops.push(...fuelStops.filter(inDay));
      if (dk >= 140) {
        // almoço perto do meio-dia: km rodado entre a saída e 12h (descontando paradas), sem passar do fim do dia
        const startMin = (+(inp.startTime || '07:00').slice(0, 2)) * 60 + (+(inp.startTime || '07:00').slice(3, 5));
        const rideToNoon = Math.max(1.5, (12 * 60 - startMin - 30) / 60);
        const lk = day.fromKm + Math.min(Math.max(dk * 0.35, rideToNoon * avgKmh), dk - 30);
        const p = pointAt(R, lk);
        const x = bestOf(await places('comida', p.lat, p.lng, 8), R, 6);
        if (x) day.stops.push(stopOf('almoco', x, R));
      }
      // descanso a cada ~2h de estrada sem outra parada perto
      for (let k = day.fromKm + 2 * avgKmh; k < day.toKm - 40; k += 2 * avgKmh) {
        if (day.stops.some(s => Math.abs(s.km - k) < 40)) continue;
        const p = pointAt(R, k);
        const x = bestOf(await places('descanso', p.lat, p.lng, 6), R, 4);
        if (x) day.stops.push(stopOf('parada', x, R, { note: 'Descanso: alongar, água, café' }));
      }
    }

    // pontos turísticos
    if (prefs.turismo !== false) {
      for (const day of days) {
        step(72 + Math.round(12 * day.n / nDays), `Pontos turísticos do dia ${day.n}`);
        const found = [];
        for (const f of (GKEY() ? [0.33, 0.66, 1] : [0.5, 1])) {
          const p = pointAt(R, day.fromKm + (day.toKm - day.fromKm) * f);
          for (const t of await places('turismo', p.lat, p.lng, 12)) { const pr = project(R, t); if (pr.off <= 12 && !found.some(x => x.p.name === t.name)) found.push({ p: t, pr }); }
        }
        found.sort((a, b) => score(b.p) - score(a.p)).slice(0, 2).forEach(x => day.stops.push(stopOf('foto', x, R)));
      }
    }

    // estradas de terra / trilhas perto dos pernoites
    if (prefs.offroad) {
      for (const day of days) {
        step(85, `Estradas de terra perto do pernoite do dia ${day.n}`);
        const p = pointAt(R, day.toKm);
        try {
          const j = await overpassQuery(`[out:json][timeout:20];way["highway"="track"]["name"](around:15000,${p.lat.toFixed(4)},${p.lng.toFixed(4)});out center tags 8;`);
          day.offroad = (j.elements || []).filter(e => e.center).map(e => ({ name: e.tags.name, lat: e.center.lat, lng: e.center.lon, surface: e.tags.surface || '', grade: e.tags.tracktype || '' })).slice(0, 5);
        } catch (e) { day.offroad = []; }
      }
    }

    // horários e datas
    const start = new Date((inp.startDate || new Date().toISOString().slice(0, 10)) + 'T' + (inp.startTime || '07:00') + ':00');
    for (const day of days) {
      day.stops.sort((a, b) => a.km - b.km);
      const d = new Date(start.getTime() + (day.n - 1) * 864e5);
      day.date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      let t = (+(inp.startTime || '07:00').slice(0, 2)) * 60 + (+(inp.startTime || '07:00').slice(3, 5)), last = day.fromKm;
      const dur = { abastecer: 15, parada: 20, almoco: 60, foto: 30 };
      for (const s of day.stops) { t += (s.km - last) / avgKmh * 60; s.time = `${String(Math.floor(t / 60) % 24).padStart(2, '0')}:${String(Math.round(t % 60)).padStart(2, '0')}`; t += dur[s.type] || 15; last = s.km; }
      t += (day.toKm - last) / avgKmh * 60;
      day.arrive = `${String(Math.floor(t / 60) % 24).padStart(2, '0')}:${String(Math.round(t % 60) % 60).padStart(2, '0')}`;
      day.km = Math.round(day.toKm - day.fromKm);
      day.rideH = Math.round((day.toKm - day.fromKm) / avgKmh * 10) / 10;
    }

    // fronteiras
    step(90, 'Conferindo se a rota cruza fronteiras');
    const borders = [];
    const ccStart = (await placeName(inp.origin)).cc;
    const seq = [{ km: 0, cc: ccStart }, ...days.map(d => ({ km: d.toKm, cc: d.endCC }))];
    for (let i = 1; i < seq.length; i++) {
      if (!seq[i].cc || !seq[i - 1].cc || seq[i].cc === seq[i - 1].cc) continue;
      let a = seq[i - 1].km, b = seq[i].km;
      for (let k = 0; k < 6 && b - a > 8; k++) { const m = (a + b) / 2; const c = await countryAt(pointAt(R, m)); if (c === seq[i - 1].cc) a = m; else b = m; }
      const p = pointAt(R, (a + b) / 2);
      const pn = await placeName(p);
      const desp = await textSearch('despachante aduaneiro', p.lat, p.lng, 30);
      borders.push({ km: Math.round((a + b) / 2), from: seq[i - 1].cc, to: seq[i].cc, lat: p.lat, lng: p.lng, near: pn.name, despachantes: desp.slice(0, 6).map(x => ({ name: x.name, rating: x.rating, reviews: x.reviews, phone: x.phone, maps: x.maps, extra: x.extra })) });
    }

    // orçamentos
    step(96, 'Calculando os três orçamentos');
    const nights = days.length;
    const fuelL = total / kml, fuelCost = fuelL * fuelPrice;
    const NIGHT = { 0: 0, 1: 150, 2: 280, 3: 520, 4: 900 }, DEF_NIGHT = { economica: 130, custo: 260, conforto: 550 }, FOOD = { economica: 80, custo: 150, conforto: 300 };
    const tiers = {};
    for (const t of ['economica', 'custo', 'conforto']) {
      const lodging = days.reduce((s, d) => s + (d.lodging && d.lodging[t] && d.lodging[t].price != null ? NIGHT[d.lodging[t].price] : DEF_NIGHT[t]), 0);
      const food = FOOD[t] * Math.max(1, nights);
      tiers[t] = { lodging: Math.round(lodging), food: Math.round(food), fuel: Math.round(fuelCost), total: Math.round(lodging + food + fuelCost) };
    }
    step(100, 'Pronto');
    return { origin: inp.origin, dest: inp.dest, via: inp.via || [], total_km: Math.round(total), ride_h: Math.round(total / avgKmh * 10) / 10, dailyKm: daily, days, tiers, fuel: { liters: Math.round(fuelL), price: fuelPrice, range: Math.round(range) }, borders, google: !!GKEY(), route: { coords: rt.coords, dist_km: Math.round(rt.dist_km * 10) / 10, dur_min: Math.round(rt.dur_min) } };
  }

  /* ---------- rotas HTTP ---------- */
  const jobs = new Map();
  setInterval(() => { for (const [id, j] of jobs) if (Date.now() - j.t > 3600e3) jobs.delete(id); }, 600e3).unref();

  app.get('/api/plan/status', (req, res) => {
    const uid = String(req.query.user || ''); const code = String(req.query.code || '').toUpperCase();
    res.json({ used: usage[uid] || 0, free: FREE_PLANS, premium: CODES().includes(code), google: !!GKEY() });
  });
  app.post('/api/plan', (req, res) => {
    const b = req.body || {};
    const uid = String(b.userId || '').slice(0, 40); const code = String(b.code || '').toUpperCase();
    const ok = p => p && Number.isFinite(+p.lat) && Number.isFinite(+p.lng);
    if (!uid || !ok(b.origin) || !ok(b.dest)) return res.status(400).json({ error: 'Informe origem e destino.' });
    const premium = CODES().includes(code);
    if (!premium && (usage[uid] || 0) >= FREE_PLANS) return res.status(402).json({ error: 'premium', msg: 'Você já usou a viagem automática grátis. Com o Bando+ você cria quantas quiser.' });
    const id = Math.random().toString(36).slice(2, 12);
    const job = { t: Date.now(), status: 'running', progress: 0, msg: 'Começando' };
    jobs.set(id, job);
    plan({ ...b, origin: { ...b.origin, lat: +b.origin.lat, lng: +b.origin.lng }, dest: { ...b.dest, lat: +b.dest.lat, lng: +b.dest.lng }, via: (b.via || []).filter(ok).slice(0, 5).map(v => ({ ...v, lat: +v.lat, lng: +v.lng })) }, job)
      .then(result => { job.status = 'done'; job.result = result; if (!premium) { usage[uid] = (usage[uid] || 0) + 1; saveUsage(); } })
      .catch(e => { job.status = 'error'; job.error = e.message || 'Erro ao montar a viagem'; console.warn('Planejador:', e.message); });
    res.json({ id });
  });
  app.get('/api/plan/:id', (req, res) => {
    const j = jobs.get(req.params.id); if (!j) return res.status(404).json({ error: 'Planejamento não encontrado' });
    res.json({ status: j.status, progress: j.progress, msg: j.msg, error: j.error, result: j.status === 'done' ? j.result : undefined });
  });
  // opções da região para "escolher outro lugar" e busca por perto com notas
  app.get('/api/places', async (req, res) => {
    const cat = String(req.query.cat || ''), lat = +req.query.lat, lng = +req.query.lng, rk = Math.max(1, Math.min(50, +req.query.r || 10));
    if (!GTYPES[cat] && !['trilha'].includes(cat) || !Number.isFinite(lat) || !Number.isFinite(lng)) return res.status(400).json({ error: 'pedido inválido' });
    try { const list = await places(cat, lat, lng, rk); res.json(list.map(p => ({ ...p, d: Math.round(hav({ lat, lng }, p) * 10) / 10 })).sort((a, b) => score(b) - score(a))); }
    catch (e) { res.status(502).json({ error: 'busca indisponível' }); }
  });
  app.get('/api/despachantes', async (req, res) => {
    const lat = +req.query.lat, lng = +req.query.lng; if (!Number.isFinite(lat)) return res.status(400).json({ error: 'pedido inválido' });
    res.json({ google: !!GKEY(), list: await textSearch('despachante aduaneiro', lat, lng, 30) });
  });
  return { places, hasGoogle: () => !!GKEY() };
};
