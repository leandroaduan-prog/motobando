/* MotoBando — geometria da rota e serviços abertos de mapa (OSRM, Nominatim, Overpass, Open-Meteo) */
const GEO = (() => {
  const R_EARTH = 6371;
  const rad = d => d * Math.PI / 180;
  function hav(a, b) {
    const dLa = rad(b.lat - a.lat), dLo = rad(b.lng - a.lng);
    const x = Math.sin(dLa / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLo / 2) ** 2;
    return 2 * R_EARTH * Math.asin(Math.sqrt(Math.min(1, x)));
  }
  // rota: coords [[lat,lng]], cum = km acumulado em cada ponto
  function build(coords) {
    const cum = [0];
    for (let i = 1; i < coords.length; i++) cum.push(cum[i - 1] + hav({ lat: coords[i - 1][0], lng: coords[i - 1][1] }, { lat: coords[i][0], lng: coords[i][1] }));
    return { coords, cum, total: cum[cum.length - 1] || 0 };
  }
  // projeta um ponto na rota: km ao longo dela e distância até ela (km)
  function project(R, lat, lng, hintIdx) {
    if (!R || R.coords.length < 2) return null;
    const kx = Math.cos(rad(lat)) * 111.32, ky = 110.57;
    let best = { d2: Infinity, km: 0, idx: 0 };
    const n = R.coords.length;
    let from = 0, to = n - 1;
    if (hintIdx != null) { from = Math.max(0, hintIdx - 400); to = Math.min(n - 1, hintIdx + 400); }
    for (let pass = 0; pass < 2; pass++) {
      for (let i = from; i < to; i++) {
        const a = R.coords[i], b = R.coords[i + 1];
        const ax = (a[1] - lng) * kx, ay = (a[0] - lat) * ky, bx = (b[1] - lng) * kx, by = (b[0] - lat) * ky;
        const dx = bx - ax, dy = by - ay, L = dx * dx + dy * dy;
        let t = L ? -(ax * dx + ay * dy) / L : 0; t = Math.max(0, Math.min(1, t));
        const px = ax + t * dx, py = ay + t * dy, d2 = px * px + py * py;
        if (d2 < best.d2) best = { d2, km: R.cum[i] + t * (R.cum[i + 1] - R.cum[i]), idx: i };
      }
      if (hintIdx == null || best.d2 < 4) break; // ok
      from = 0; to = n - 1; // longe do palpite: procura na rota toda
    }
    return { km: best.km, off: Math.sqrt(best.d2), idx: best.idx };
  }
  function pointAt(R, km) {
    if (!R || !R.coords.length) return null;
    km = Math.max(0, Math.min(R.total, km));
    let lo = 0, hi = R.cum.length - 1;
    while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (R.cum[mid] <= km) lo = mid; else hi = mid; }
    const seg = R.cum[hi] - R.cum[lo] || 1, t = (km - R.cum[lo]) / seg;
    const a = R.coords[lo], b = R.coords[hi];
    return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, Math.atan2((b[1] - a[1]) * Math.cos(rad(a[0])), b[0] - a[0]) * 180 / Math.PI];
  }
  // reduz a quantidade de pontos (mantém um ponto a cada ~minStep km e as curvas)
  function thin(coords, minStepKm = 0.08) {
    if (coords.length < 3) return coords;
    const out = [coords[0]]; let last = coords[0];
    for (let i = 1; i < coords.length - 1; i++) {
      const c = coords[i];
      if (hav({ lat: last[0], lng: last[1] }, { lat: c[0], lng: c[1] }) >= minStepKm) { out.push(c); last = c; }
    }
    out.push(coords[coords.length - 1]);
    return out;
  }
  async function getJSON(url, opts = {}, ms = 20000) {
    const ctl = new AbortController(); const tm = setTimeout(() => ctl.abort(), ms);
    try {
      const r = await fetch(url, { ...opts, signal: ctl.signal });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return await r.json();
    } finally { clearTimeout(tm); }
  }
  // rota de carro/moto passando por todas as paradas (servidor público do OSRM)
  async function route(points) {
    const path = points.map(p => `${p.lng.toFixed(5)},${p.lat.toFixed(5)}`).join(';');
    const j = await getJSON(`https://router.project-osrm.org/route/v1/driving/${path}?overview=full&geometries=geojson&steps=false`);
    if (!j.routes || !j.routes.length) throw new Error('Rota não encontrada');
    const r = j.routes[0];
    const coords = thin(r.geometry.coordinates.map(c => [c[1], c[0]]));
    return { coords, dist_km: Math.round(r.distance / 100) / 10, dur_min: Math.round(r.duration / 60) };
  }
  async function search(q, near, world) {
    let url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=6${world ? '' : '&countrycodes=br'}&accept-language=pt-BR&q=${encodeURIComponent(q)}`;
    if (near) url += `&viewbox=${near.lng - 1},${near.lat + 1},${near.lng + 1},${near.lat - 1}`;
    const j = await getJSON(url);
    return j.map(x => ({ name: x.name || x.display_name.split(',')[0], display: x.display_name.split(',').slice(0, 3).join(','), lat: +x.lat, lng: +x.lon }));
  }
  async function reverse(lat, lng) {
    try {
      const j = await getJSON(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=14&accept-language=pt-BR&lat=${lat}&lon=${lng}`);
      const a = j.address || {};
      return j.name || a.village || a.town || a.city || a.suburb || a.road || 'Ponto no mapa';
    } catch (e) { return 'Ponto no mapa'; }
  }
  const OVERPASS = ['https://overpass-api.de/api/interpreter', 'https://overpass.private.coffee/api/interpreter'];
  async function overpass(q) {
    // 1º: pelo nosso servidor (mais confiável no celular); se ele falhar, tenta direto
    try { return await getJSON('/api/overpass', { method: 'POST', body: JSON.stringify({ q }), headers: { 'Content-Type': 'application/json' } }, 60000); }
    catch (e) {
      let err = e;
      for (const u of OVERPASS) {
        try { return await getJSON(u, { method: 'POST', body: 'data=' + encodeURIComponent(q), headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }, 25000); }
        catch (e2) { err = e2; }
      }
      throw new Error('servidores de mapa ocupados');
    }
  }
  const FILTERS = {
    posto: ['["amenity"="fuel"]'],
    hosp: ['["tourism"~"^(hotel|guest_house|hostel|motel|camp_site|chalet|apartment)$"]'],
    comida: ['["amenity"~"^(restaurant|cafe|fast_food)$"]'],
    turismo: ['["tourism"~"^(viewpoint|attraction|museum)$"]', '["natural"="waterfall"]', '["natural"="peak"]["name"]'],
    trilha: ['["highway"~"^(track|path)$"]["name"]', '["route"~"^(hiking|mtb)$"]'],
    apoio: ['["shop"~"^(motorcycle|motorcycle_repair|tyres|car_repair)$"]', '["craft"="mechanic"]']
  };
  const TYPE_PT = { hotel: 'Hotel', guest_house: 'Pousada', hostel: 'Hostel', motel: 'Motel', camp_site: 'Camping', chalet: 'Chalé', apartment: 'Apartamento', restaurant: 'Restaurante', cafe: 'Café', fast_food: 'Lanchonete', viewpoint: 'Mirante', attraction: 'Atração', museum: 'Museu', waterfall: 'Cachoeira', peak: 'Pico', motorcycle: 'Loja/oficina de moto', motorcycle_repair: 'Oficina de moto', tyres: 'Borracharia', car_repair: 'Oficina', mechanic: 'Mecânico', fuel: 'Posto' };
  function describe(cat, t) {
    const kind = TYPE_PT[t.tourism] || TYPE_PT[t.amenity] || TYPE_PT[t.natural] || TYPE_PT[t.shop] || TYPE_PT[t.craft] || '';
    let sub = '';
    if (cat === 'trilha') {
      if (t.route === 'mtb' || t.bicycle === 'designated' || t['mtb:scale']) sub = 'Bike';
      else if (t.highway === 'track' || t.motorcycle === 'yes' || t.motor_vehicle === 'yes') sub = 'Moto / 4x4';
      else sub = 'A pé';
    }
    const extra = [t.brand, t['addr:street'], t.opening_hours === '24/7' ? 'Aberto 24h' : '', t.ele ? t.ele + ' m' : ''].filter(Boolean).slice(0, 2).join(' · ');
    return { kind, sub, extra };
  }
  async function near(cat, lat, lng, radius = 8000) {
    // rápido: buscador do OpenStreetMap pelo nosso servidor (trilhas usam o Overpass)
    if (cat !== 'trilha') {
      try {
        const list = await getJSON(`/api/near?cat=${cat}&lat=${lat.toFixed(4)}&lng=${lng.toFixed(4)}&r=${Math.round(radius / 1000)}`, {}, 25000);
        if (Array.isArray(list) && list.length) return list;
      } catch (e) { /* cai para o Overpass */ }
    }
    const parts = FILTERS[cat].map(f => `nwr(around:${radius},${lat.toFixed(5)},${lng.toFixed(5)})${f};`).join('');
    const j = await overpass(`[out:json][timeout:20];(${parts});out center tags 60;`);
    const seen = new Set();
    return j.elements.map(e => {
      const p = e.type === 'node' ? { lat: e.lat, lng: e.lon } : e.center ? { lat: e.center.lat, lng: e.center.lon } : null;
      if (!p) return null;
      const t = e.tags || {};
      const d = describe(cat, t);
      const name = t.name || t.brand || d.kind || CAT[cat].n;
      const key = name + Math.round(p.lat * 500) + Math.round(p.lng * 500);
      if (seen.has(key)) return null; seen.add(key);
      return { cat, name, ...p, kind: d.kind, sub: d.sub, extra: d.extra, phone: t.phone || t['contact:phone'] || '', web: t.website || t['contact:website'] || '', named: !!t.name };
    }).filter(Boolean);
  }
  // postos de combustível a até ~1 km da rota
  async function postosAlongRoute(R) {
    if (!R || R.total < 1) return [];
    const pts = []; for (let km = 0; km <= R.total; km += 2.5) pts.push(pointAt(R, km));
    pts.push(pointAt(R, R.total));
    const chunks = []; for (let i = 0; i < pts.length; i += 120) chunks.push(pts.slice(Math.max(0, i - 1), i + 120));
    const out = [];
    for (const ch of chunks) {
      const line = ch.map(p => `${p[0].toFixed(5)},${p[1].toFixed(5)}`).join(',');
      const j = await overpass(`[out:json][timeout:40];nwr(around:1000,${line})["amenity"="fuel"];out center tags;`);
      for (const e of j.elements) {
        const p = e.type === 'node' ? { lat: e.lat, lng: e.lon } : e.center ? { lat: e.center.lat, lng: e.center.lon } : null;
        if (!p) continue;
        const pr = project(R, p.lat, p.lng); if (!pr || pr.off > 1.3) continue;
        const t = e.tags || {};
        out.push({ ...p, km: Math.round(pr.km * 10) / 10, name: t.name || t.brand || 'Posto' });
      }
    }
    out.sort((a, b) => a.km - b.km);
    return out.filter((p, i) => !i || Math.abs(p.km - out[i - 1].km) > 0.15 || p.name !== out[i - 1].name);
  }
  // previsão de chuva nos pontos da rota, na hora em que o bando vai passar
  async function rainAlong(R, kmToDate) {
    if (!R || R.total < 1) return [];
    const kms = []; for (let km = 0; km <= R.total; km += Math.max(20, R.total / 12)) kms.push(km);
    kms.push(R.total);
    const pts = kms.map(k => pointAt(R, k));
    const j = await getJSON(`https://api.open-meteo.com/v1/forecast?latitude=${pts.map(p => p[0].toFixed(3)).join(',')}&longitude=${pts.map(p => p[1].toFixed(3)).join(',')}&hourly=precipitation_probability,precipitation&timezone=America%2FSao_Paulo&forecast_days=7`);
    const arr = Array.isArray(j) ? j : [j];
    return arr.map((f, i) => {
      const when = kmToDate(kms[i]);
      const key = `${when.getFullYear()}-${String(when.getMonth() + 1).padStart(2, '0')}-${String(when.getDate()).padStart(2, '0')}T${String(when.getHours()).padStart(2, '0')}:00`;
      const k = f.hourly.time.indexOf(key);
      return { km: kms[i], when, prob: k >= 0 ? f.hourly.precipitation_probability[k] : null, mm: k >= 0 ? f.hourly.precipitation[k] : null };
    });
  }

  /* ---------- opções de rota para moto (Valhalla): rápida, alternativa e passeio ---------- */
  const VALHALLA = 'https://valhalla1.openstreetmap.de';
  function decode6(str) {
    const out = []; let i = 0, lat = 0, lng = 0;
    while (i < str.length) {
      let b, sh = 0, r = 0; do { b = str.charCodeAt(i++) - 63; r |= (b & 31) << sh; sh += 5; } while (b >= 32); lat += (r & 1) ? ~(r >> 1) : (r >> 1);
      sh = 0; r = 0; do { b = str.charCodeAt(i++) - 63; r |= (b & 31) << sh; sh += 5; } while (b >= 32); lng += (r & 1) ? ~(r >> 1) : (r >> 1);
      out.push([lat / 1e6, lng / 1e6]);
    }
    return out;
  }
  const ROADY = /^(Rodovia|Rodoanel|Estrada|Ruta|Carretera|Camino|Autopista|Via |Rota|Serra|Paso|Cuesta|Panamericana|Interoce)/i, REF = /^(BR|SP|RJ|MG|PR|SC|RS|GO|MT|MS|BA|CE|ES|PE|TO|RN|RP|RN|Ruta|CO|PE|AR|CH)[- ]?\d/i;
  const ROAD_ALIAS = { 'SP-098': 'Mogi-Bertioga', 'SP-021': 'Rodoanel', 'SP-150': 'Anchieta', 'SP-160': 'Imigrantes', 'SP-099': 'Tamoios', 'SP-055': 'Rio-Santos / Padre Manoel da Nóbrega', 'SP-070': 'Ayrton Senna', 'SP-065': 'Dom Pedro I', 'BR-381': 'Fernão Dias', 'BR-116': 'Dutra / Régis', 'SP-125': 'Oswaldo Cruz', 'SP-123': 'Campos do Jordão', 'SP-171': 'Paraty–Cunha', 'PR-410': 'Estrada da Graciosa', 'SC-390': 'Serra do Rio do Rastro', 'RS-486': 'Rota do Sol', 'MG-010': 'Serra do Cipó', 'BR-354': 'Garganta do Registro' };
  function roadNames(pairs) {
    const by = new Map();
    pairs.forEach(([n, km], i) => { if (!(ROADY.test(n) || REF.test(n))) return; const o = by.get(n) || { n, km: 0, first: i }; o.km += km; by.set(n, o); });
    let list = [...by.values()].filter(o => o.km >= 3);
    // prefere o nome (Rodovia X) ao número quando os dois cobrem o mesmo trecho
    list.sort((a, b) => a.first - b.first);
    const names = new Set(list.map(o => o.n));
    return list.filter(o => !(REF.test(o.n) && ROAD_ALIAS[o.n] && names.has('Rodovia ' + ROAD_ALIAS[o.n]))).map(o => ({ n: ROAD_ALIAS[o.n] ? `${ROAD_ALIAS[o.n]} (${o.n})` : o.n.replace(/^Rodovia /, 'Rod. '), km: Math.round(o.km) }));
  }
  async function valhalla(points, { highways = 1, terra = false, alternates = 0 } = {}) {
    const body = {
      locations: points.map(p => ({ lat: +p.lat, lon: +p.lng, type: 'break' })), costing: 'motorcycle',
      costing_options: { motorcycle: { use_highways: highways, use_tolls: highways >= 0.9 ? 0.5 : 0.2, use_trails: terra ? 0.6 : 0, exclude_unpaved: !terra } },
      units: 'kilometers', language: 'pt-BR', directions_type: 'maneuvers'
    };
    if (alternates && points.length === 2) body.alternates = alternates;
    const d = await getJSON(VALHALLA + '/route', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }, 35000);
    const trips = [d.trip, ...(d.alternates || []).map(a => a.trip)].filter(Boolean);
    return trips.map(t => {
      let coords = []; const pairs = [];
      t.legs.forEach(l => { const c = decode6(l.shape); coords = coords.length ? coords.concat(c.slice(1)) : c; (l.maneuvers || []).forEach(m => (m.street_names || []).forEach(n => pairs.push([n, m.length || 0]))); });
      return { coords: thin(coords), dist_km: Math.round(t.summary.length * 10) / 10, dur_min: Math.round(t.summary.time / 60), toll: !!t.summary.has_toll, ferry: !!t.summary.has_ferry, roads: roadNames(pairs), shapes: t.legs.map(l => l.shape) };
    });
  }
  // curvas: quantos km da rota são de curva de verdade (janela de 1 km com mais de 140° de mudança de direção),
  // ignorando 8 km de cada ponta para não contar as ruas da cidade
  function curviness(coords) {
    const R = build(coords); if (R.total < 2) return { km: 0, lvl: 1, best: null };
    const step = 0.1, hd = []; for (let k = 0; k <= R.total; k += step) hd.push(pointAt(R, k)[2]);
    const t = [0]; for (let i = 1; i < hd.length; i++) { let d = Math.abs(hd[i] - hd[i - 1]); if (d > 180) d = 360 - d; t.push(d < 3 ? 0 : d); }
    const W = 10, skip = Math.min(Math.round(8 / step), Math.floor(t.length / 4)); let km = 0, run = 0, best = null, start = 0;
    let s = 0; for (let j = 0; j < Math.min(W, t.length); j++) s += t[j];
    for (let i = 0; i + W < t.length; i++) {
      const curvy = i >= skip && i < t.length - skip && s >= 140;
      if (curvy) { km += step; if (!run) start = i; run += step; if (!best || run > best.len) best = { from: start * step, len: run }; } else run = 0;
      s += t[i + W] - t[i];
    }
    const share = km / R.total, lvl = share < 0.06 ? 1 : share < 0.12 ? 2 : share < 0.2 ? 3 : share < 0.32 ? 4 : 5;
    return { km: Math.round(km), lvl, best: best && best.len >= 2 ? { from: Math.round(best.from), to: Math.round(best.from + best.len) } : null };
  }
  async function elevation(coords) {
    try {
      const R = build(coords), n = Math.min(100, Math.max(10, Math.round(R.total / 2)));
      const pts = []; for (let i = 0; i < n; i++) pts.push(pointAt(R, R.total * i / (n - 1)));
      const j = await getJSON(`https://api.open-meteo.com/v1/elevation?latitude=${pts.map(p => p[0].toFixed(4)).join(',')}&longitude=${pts.map(p => p[1].toFixed(4)).join(',')}`, {}, 15000);
      const e = (j.elevation || []).filter(Number.isFinite); if (e.length < 2) return null; let up = 0, down = 0; for (let i = 1; i < e.length; i++) { const d = e[i] - e[i - 1]; if (d > 0) up += d; else down -= d; }
      return { up: Math.round(up), down: Math.round(down), max: Math.round(Math.max(...e)), min: Math.round(Math.min(...e)) };
    } catch (x) { return null; }
  }
  async function dirtKm(opt) {
    let km = 0;
    for (const shape of opt.shapes || []) {
      const d = await getJSON(VALHALLA + '/trace_attributes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ encoded_polyline: shape, shape_match: 'map_snap', costing: 'motorcycle', filters: { attributes: ['edge.surface', 'edge.length', 'edge.unpaved'], action: 'include' } }) }, 30000);
      (d.edges || []).forEach(e => { if (e.unpaved || /dirt|gravel|compacted|path|impassable/.test(e.surface || '')) km += e.length || 0; });
    }
    return Math.round(km);
  }
  function sameRoute(a, b) {
    if (Math.abs(a.dist_km - b.dist_km) / Math.max(a.dist_km, b.dist_km) > 0.04) return false;
    const RB = build(b.coords), RA = build(a.coords); let near = 0, n = 0;
    for (let k = RA.total * 0.05; k < RA.total * 0.95; k += RA.total / 25) { const p = pointAt(RA, k); const pr = project(RB, p[0], p[1]); n++; if (pr && pr.off < 0.6) near++; }
    return n && near / n > 0.85;
  }
  function onRoute(R, c) { if (c.fechada || c.semRota) return false; const pa = project(R, c.a[0], c.a[1]), pb = project(R, c.b[0], c.b[1]); return pa && pb && pa.off < 6 && pb.off < 6 && Math.abs(pa.km - pb.km) > c.km * 0.4; }
  async function routeOptions(points, { terra = false } = {}) {
    const two = points.length === 2;
    const [A, B] = await Promise.all([
      valhalla(points, { highways: 1, terra, alternates: two ? 2 : 0 }).catch(() => []),
      valhalla(points, { highways: 0.2, terra, alternates: two ? 1 : 0 }).catch(() => [])
    ]);
    let all = [...A, ...B];
    if (!all.length) { const r = await route(points); return [{ ...r, key: 'rapida', t: 'Rápida', roads: [], curv: curviness(r.coords), src: 'osrm' }]; }
    const uniq = []; all.forEach(o => { if (!uniq.some(u => sameRoute(u, o))) uniq.push(o); });
    uniq.forEach(o => { o.curv = curviness(o.coords); });
    uniq.sort((a, b) => a.dur_min - b.dur_min);
    const fast = uniq[0]; fast.key = 'rapida'; fast.t = 'Rápida';
    const rest = uniq.slice(1).filter(o => o.dur_min < fast.dur_min * 2.3);
    const out = [fast];
    const curvy = rest.filter(o => o.curv.km > fast.curv.km * 1.3 + 3).sort((a, b) => b.curv.km - a.curv.km)[0];
    rest.filter(o => o !== curvy).sort((a, b) => a.dur_min - b.dur_min).slice(0, 2).forEach((o, i) => { o.key = i ? 'alternativa2' : 'alternativa'; o.t = i ? 'Outra alternativa' : 'Alternativa'; out.push(o); });
    if (curvy) { curvy.key = 'passeio'; curvy.t = 'Passeio'; out.push(curvy); }
    const fastNames = new Set(fast.roads.map(r => r.n));
    out.forEach(o => {
      o.diff = o === fast ? o.roads.slice().sort((a, b) => b.km - a.km).slice(0, 3) : o.roads.filter(r => !fastNames.has(r.n)).sort((a, b) => b.km - a.km).slice(0, 3);
      const R = build(o.coords); o.classics = (typeof CLASSICAS !== 'undefined' ? CLASSICAS : []).filter(c => onRoute(R, c)).map(c => c.id);
    });
    return out;
  }
  function classicsNear(coords, exclude = [], max = 6) {
    if (typeof CLASSICAS === 'undefined' || !coords || coords.length < 2) return [];
    const R = build(coords), lim = Math.max(25, Math.min(90, R.total * 0.18));
    return CLASSICAS.filter(c => !exclude.includes(c.id)).map(c => {
      const pa = project(R, c.a[0], c.a[1]), pb = project(R, c.b[0], c.b[1]);
      return { c, off: Math.min(pa.off, pb.off), ka: pa.km, kb: pb.km };
    }).filter(x => x.off <= lim).sort((x, y) => x.off - y.off).slice(0, max);
  }
  return { hav, build, project, pointAt, route, search, reverse, near, postosAlongRoute, rainAlong, routeOptions, curviness, elevation, dirtKm, classicsNear, thin };
})();

/* combustível: consumo efetivo e plano de paradas sobre os postos reais da rota */
const FUEL = (() => {
  function motoSpec(moto) { const m = MOTOS[moto.model] || MOTOS.outra; return moto.model === 'outra' ? { ...m, tanque: +moto.tanque || 15, kml: +moto.kmlBase || 25 } : m; }
  function kml(moto, garupa) {
    const m = motoSpec(moto); let k = +moto.real > 0 ? +moto.real : m.kml;
    k *= garupa ? 0.9 : 1; k *= moto.bagagem ? 0.95 : 1; k *= { tranquilo: 1.06, normal: 1, esportivo: 0.85 }[moto.estilo] || 1;
    return k * 0.95; // margem para estrada/serra
  }
  function plan(moto, garupa, postos, totalKm, fromKm = 0) {
    const k = kml(moto, garupa), m = motoSpec(moto), full = m.tanque * k, reserve = Math.max(25, full * 0.15);
    let f = full * (moto.fuel || 100) / 100 - Math.max(0, fromKm - (moto.markKm || 0)), last = fromKm;
    const P = (postos || []).filter(p => p.km >= fromKm - 0.1 && p.km < totalKm);
    const stops = [];
    for (let i = 0; i < P.length; i++) {
      const p = P[i]; f -= p.km - last; last = p.km;
      const next = P[i + 1] ? P[i + 1].km : totalKm;
      if (f < next - p.km + reserve) { stops.push({ ...p, lit: (full - f) / k, nextGap: Math.round(next - p.km) }); f = full; }
    }
    let gap = { len: 0 };
    const all = [{ km: 0, name: 'Saída' }, ...(postos || []), { km: totalKm, name: 'Destino' }];
    for (let i = 0; i < all.length - 1; i++) { const g = all[i + 1].km - all[i].km; if (g > gap.len) gap = { len: Math.round(g), a: all[i].name, b: all[i + 1].name, from: all[i].km }; }
    const liters = Math.max(0, totalKm - fromKm) / k;
    const endFuel = f - (totalKm - last);
    return { k, full, reserve, stops, liters, gap, start: full * (moto.fuel || 100) / 100, endFuel, dry: endFuel < 0 && !P.length };
  }
  return { motoSpec, kml, plan };
})();
