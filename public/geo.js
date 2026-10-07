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
  return { hav, build, project, pointAt, route, search, reverse, near, postosAlongRoute, rainAlong };
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
