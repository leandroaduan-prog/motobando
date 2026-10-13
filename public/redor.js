/* MotoBando — "Ao redor da parada": escolher o que tem perto (comer, dormir, serviços…) e fixar na parada.
   Usado na viagem do guia, no criador automático e no assistente de texto. Os lugares fixados viajam junto com a parada. */
const REDOR_RAIO = { pousada: 10000, hotel: 10000, turismo: 12000, shopping: 15000, oficina: 8000, servicos: 6000, posto: 8000 };
const REDOR_PRE = { pernoite: 'hotel', almoco: 'restaurante', abastecer: 'posto', foto: 'turismo', parada: 'lanchonete', saida: 'posto' };
const redorCache = new Map();
const placeId = p => (p.name || '') + '|' + (+p.lat).toFixed(4) + '|' + (+p.lng).toFixed(4);
const redorHas = (list, p) => (list || []).some(x => placeId(x) === placeId(p));
function bookingLink(name, date, nights) {
  const q = new URLSearchParams({ ss: name });
  if (date) { q.set('checkin', date); q.set('checkout', addDays(date, nights || 1)); }
  return 'https://www.booking.com/searchresults.pt-br.html?' + q;
}
function airbnbLink(name, date, nights) {
  const q = new URLSearchParams(); if (date) { q.set('checkin', date); q.set('checkout', addDays(date, nights || 1)); }
  return 'https://www.airbnb.com.br/s/' + encodeURIComponent(name) + '/homes?' + q;
}
function addDays(d, n) { const x = new Date(d + 'T12:00:00'); x.setDate(x.getDate() + n); return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`; }
// o que guardamos de cada lugar fixado (pequeno, vai junto com a viagem)
function slimPlace(p) {
  return { id: p.id || uid(), cat: p.cat, name: p.name, lat: p.lat, lng: p.lng, kind: p.kind || '', rating: p.rating || undefined, reviews: p.reviews || undefined, phone: p.phone || undefined, maps: p.maps || undefined, extra: (p.extra || '').slice(0, 80) || undefined };
}
const placeMapsLink = p => p.maps || `https://www.google.com/maps/search/?api=1&query=${p.lat},${p.lng}`;

// chips pequenos que aparecem embaixo da parada
function pinnedHTML(places) {
  if (!places || !places.length) return '';
  return `<div class="pinned">${places.map(p => { const c = CAT[p.cat] || CAT.turismo; return `<a class="pin-chip" href="${esc(placeMapsLink(p))}" target="_blank" rel="noopener" style="--pc:${c.color}"><span class="pc-ic">${ic(c.icon)}</span><span class="pc-t"><b>${esc(p.name)}</b><small>${esc(c.n)}${p.rating ? ' · ★' + f1(p.rating) : ''}</small></span></a>`; }).join('')}</div>`;
}

/* target: { name, lat, lng, type?, places?: [] }   cfg: { date, nights, edit: bool, onChange(places) } */
function aroundModal(target, cfg) {
  cfg = cfg || {};
  let places = (target.places || []).slice(), cat = cfg.cat || REDOR_PRE[target.type] || 'restaurante', list = null, loadId = 0;
  const edit = cfg.edit !== false;
  const root = $('#modalRoot');
  function save() { target.places = places.slice(); if (cfg.onChange) cfg.onChange(places.slice()); }
  function draw() {
    const lodge = cat === 'pousada' || cat === 'hotel';
    root.innerHTML = `<div class="overlay" id="arOv"><div class="modal ar-modal" role="dialog" aria-label="Ao redor da parada">
     <div class="sec-h"><div><div class="eyebrow">Ao redor da parada</div><h2 style="font-size:22px;margin:0">${esc(target.name)}</h2></div><button class="iconbtn" type="button" id="arX" aria-label="Fechar">${ic('x')}</button></div>
     ${places.length ? `<div><div class="eyebrow" style="margin-bottom:6px">Fixados nesta parada (${places.length})</div><div class="ar-pinned">${places.map((p, i) => { const c = CAT[p.cat] || CAT.turismo; return `<div class="ar-row pinned"><div class="poi-ico" style="background:${c.color}">${ic(c.icon)}</div><div class="grow"><b>${esc(p.name)}</b><span>${esc(c.n)}${p.rating ? ' · ★' + f1(p.rating) : ''}${p.extra ? ' · ' + esc(p.extra) : ''}</span></div><a class="iconbtn" href="${esc(placeMapsLink(p))}" target="_blank" rel="noopener" aria-label="Ver no Google Maps">${ic('route')}</a>${edit ? `<button class="iconbtn" type="button" data-unpin="${i}" aria-label="Tirar">${ic('x')}</button>` : ''}</div>`; }).join('')}</div></div>` : `<p class="note" style="margin:0">${edit ? 'Escolha o tipo de lugar e toque em <b>Fixar</b>. O que você fixar fica guardado nesta parada e o bando também vê.' : 'O guia ainda não fixou nada nesta parada.'}</p>`}
     <div class="chips ar-chips" style="flex-wrap:wrap;overflow:visible">${ARR_CATS.map(c => `<button class="chip" type="button" data-ac="${c}" aria-pressed="${cat === c}">${ic(CAT[c].icon)}${CAT[c].n}</button>`).join('')}</div>
     <div id="arList">${list ? '' : '<p class="empty"><span class="spinner"></span> Buscando perto de ' + esc(target.name) + '…</p>'}</div>
     ${lodge ? `<div class="ar-book"><div class="note" style="margin:0 0 6px">Quer ver mais opções com preço e datas?</div><div class="row"><a class="btn small" style="flex:1" href="${esc(bookingLink(target.name, cfg.date, cfg.nights))}" target="_blank" rel="noopener">Booking.com</a><a class="btn small" style="flex:1" href="${esc(airbnbLink(target.name, cfg.date, cfg.nights))}" target="_blank" rel="noopener">Airbnb</a></div></div>` : ''}
     <button class="btn primary btn-wide" type="button" id="arOk">Pronto</button></div></div>`;
    $('#arX').onclick = $('#arOk').onclick = () => { root.innerHTML = ''; };
    $('#arOv').onclick = e => { if (e.target.id === 'arOv') root.innerHTML = ''; };
    root.querySelectorAll('[data-ac]').forEach(b => b.onclick = () => { cat = b.dataset.ac; list = null; draw(); load(); });
    root.querySelectorAll('[data-unpin]').forEach(b => b.onclick = () => { places.splice(+b.dataset.unpin, 1); save(); draw(); paintList(); });
    if (list) paintList();
  }
  function paintList() {
    const box = $('#arList'); if (!box || !list) return;
    if (!list.length) { box.innerHTML = '<p class="empty">Não achei ' + esc(CAT[cat].n.toLowerCase()) + ' por aqui. Tente outra categoria.</p>'; return; }
    box.innerHTML = list.map((p, i) => { const on = redorHas(places, p); const c = CAT[cat];
      return `<div class="ar-row"><div class="poi-ico" style="background:${c.color}">${ic(c.icon)}</div><div class="grow"><b>${esc(p.name)}</b><span>${esc([p.kind, p.extra].filter(Boolean).join(' · ') || c.n)}</span><div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:3px">${p.rating ? `<span class="pill amber num">★ ${f1(p.rating)}${p.reviews ? ' · ' + f0(p.reviews) : ''}</span>` : ''}<span class="pill num">${f1(p.d)} km</span></div></div>
       ${edit ? `<button class="btn small ${on ? '' : 'primary'}" type="button" data-pin="${i}">${on ? 'Fixado ✓' : 'Fixar'}</button>` : `<a class="iconbtn" href="${esc(placeMapsLink(p))}" target="_blank" rel="noopener" aria-label="Ver no mapa">${ic('route')}</a>`}</div>`; }).join('');
    box.querySelectorAll('[data-pin]').forEach(b => b.onclick = () => {
      const p = list[+b.dataset.pin];
      if (redorHas(places, p)) places = places.filter(x => placeId(x) !== placeId(p));
      else { if (places.length >= 8) return toast('Já são 8 lugares fixados. Tire um para colocar outro.'); places.push(slimPlace(p)); }
      save(); const y = root.querySelector('.ar-modal').scrollTop; draw(); root.querySelector('.ar-modal').scrollTop = y;
    });
  }
  async function load() {
    const my = ++loadId, key = cat + target.lat.toFixed(3) + target.lng.toFixed(3);
    try {
      let res = redorCache.get(key);
      if (!res) { res = await GEO.near(cat, target.lat, target.lng, REDOR_RAIO[cat] || 6000); redorCache.set(key, res); }
      if (my !== loadId) return;
      list = res.map(p => ({ ...p, cat, d: GEO.hav(target, p) })).sort((a, b) => (b.named - a.named) || a.d - b.d).slice(0, 30)
        .sort((a, b) => (a.rating || b.rating) ? ((b.rating || 0) * Math.log10((b.reviews || 0) + 10) - (a.rating || 0) * Math.log10((a.reviews || 0) + 10)) : a.d - b.d);
      paintList();
    } catch (e) { if (my === loadId && $('#arList')) { $('#arList').innerHTML = `<p class="empty">Não consegui buscar agora. Tente de novo em instantes.</p><div style="text-align:center"><button class="btn" type="button" id="arRetry">${ic('refresh')}Tentar de novo</button></div>`; $('#arRetry').onclick = () => { $('#arList').innerHTML = '<p class="empty"><span class="spinner"></span> Buscando…</p>'; load(); }; } }
  }
  draw(); load();
}
