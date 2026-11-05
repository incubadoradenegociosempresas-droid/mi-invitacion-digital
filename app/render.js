// Motor de plantillas de Mi Invitación Digital. Lo usan la invitación pública (/i/) y la vista previa del editor.
(function () {
  const TEMAS = {
    elegante: { nombre: 'Elegante', fondo: '#fbf6eb', papel: '#fffdf8', texto: '#2c2520', suave: '#72665c', primario: '#b08a45', acento: '#6f7f63', fuera: '#d9cfbf', script: "'Great Vibes'", serif: "'Cormorant Garamond'", sans: "'Montserrat'", adorno: '❦', ideal: 'Boda, aniversario' },
    floral: { nombre: 'Floral', fondo: '#fcf1f1', papel: '#fffafa', texto: '#4a2c35', suave: '#86606c', primario: '#c0697d', acento: '#e7aab5', fuera: '#ead2d6', script: "'Parisienne'", serif: "'Cormorant Garamond'", sans: "'Montserrat'", adorno: '✿', ideal: 'XV años, boda, baby shower' },
    moderna: { nombre: 'Moderna', fondo: '#f4f3ef', papel: '#ffffff', texto: '#151515', suave: '#5f5f5f', primario: '#1d1d1d', acento: '#c4a46a', fuera: '#d6d4cd', script: "'Playfair Display'", serif: "'Playfair Display'", sans: "'Montserrat'", adorno: '—', ideal: 'Graduación, corporativo, boda civil' },
    fiesta: { nombre: 'Fiesta', fondo: '#fff6e6', papel: '#ffffff', texto: '#2a1846', suave: '#665683', primario: '#f0507f', acento: '#ffb703', fuera: '#ffe1b8', script: "'Pacifico'", serif: "'Baloo 2'", sans: "'Nunito'", adorno: '✦', ideal: 'Cumpleaños, baby shower, fiesta infantil' },
    noche: { nombre: 'Noche dorada', fondo: '#0f1a31', papel: '#172647', texto: '#f5edd9', suave: '#cbc0a6', primario: '#d8b45a', acento: '#8ea6d6', fuera: '#060b16', script: "'Imperial Script'", serif: "'Cormorant Garamond'", tit: "'Cinzel'", sans: "'Montserrat'", adorno: '✧', ideal: 'XV años, gala, boda de noche' },
    jardin: { nombre: 'Jardín', fondo: '#f2f5ec', papel: '#fbfdf7', texto: '#2e3a2b', suave: '#63705c', primario: '#6f8f5e', acento: '#c49f62', fuera: '#d3dccb', script: "'Great Vibes'", serif: "'Cormorant Garamond'", sans: "'Montserrat'", adorno: '❀', ideal: 'Bautizo, primera comunión, boda campestre' }
  };
  const EVENTOS = {
    boda: { nombre: 'Boda', titulo: '¡Nos casamos!', lugares: ['Ceremonia religiosa', 'Recepción'] },
    xv: { nombre: 'XV años', titulo: 'Mis XV años', lugares: ['Misa', 'Recepción'] },
    bautizo: { nombre: 'Bautizo', titulo: 'Mi bautizo', lugares: ['Ceremonia', 'Recepción'] },
    comunion: { nombre: 'Primera comunión', titulo: 'Mi primera comunión', lugares: ['Misa', 'Recepción'] },
    cumpleanos: { nombre: 'Cumpleaños', titulo: '¡Celebremos!', lugares: ['La fiesta'] },
    baby: { nombre: 'Baby shower', titulo: 'Baby shower', lugares: ['La celebración'] },
    graduacion: { nombre: 'Graduación', titulo: 'Mi graduación', lugares: ['Ceremonia', 'Fiesta'] },
    aniversario: { nombre: 'Aniversario', titulo: 'Nuestro aniversario', lugares: ['La celebración'] },
    corporativo: { nombre: 'Evento empresarial', titulo: 'Te invitamos', lugares: ['Sede'] },
    otro: { nombre: 'Otro evento', titulo: 'Te invitamos', lugares: ['Lugar'] }
  };
  const RANGO = { basica: 1, interactiva: 2, premium: 3, especial: 4 };
  const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const url = s => { const v = String(s || '').trim(); return /^https:\/\//i.test(v) ? v : ''; };
  const hayTxt = s => String(s || '').trim().length > 0;

  function luz(hex) { const h = String(hex || '').replace('#', ''); if (h.length !== 6) return 1; const [r, g, b] = [0, 2, 4].map(i => parseInt(h.substr(i, 2), 16) / 255).map(c => c <= .03928 ? c / 12.92 : Math.pow((c + .055) / 1.055, 2.4)); return .2126 * r + .7152 * g + .0722 * b; }
  function mezcla(a, b, t) { const p = x => [0, 2, 4].map(i => parseInt(x.replace('#', '').substr(i, 2), 16)); const A = p(a), B = p(b); return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join(''); }
  const hexOk = h => /^#[0-9a-f]{6}$/i.test(String(h || ''));

  function variables(plantilla, colores) {
    const t = TEMAS[plantilla] || TEMAS.elegante;
    const c = colores || {};
    const fondo = hexOk(c.fondo) ? c.fondo : t.fondo;
    const oscuro = luz(fondo) < 0.18;
    const v = {
      fondo, primario: hexOk(c.primario) ? c.primario : t.primario, acento: hexOk(c.acento) ? c.acento : t.acento,
      papel: hexOk(c.fondo) ? (oscuro ? mezcla(fondo, '#ffffff', .07) : mezcla(fondo, '#ffffff', .6)) : t.papel,
      texto: hexOk(c.fondo) ? (oscuro ? '#f5efe2' : '#2a2422') : t.texto,
      suave: hexOk(c.fondo) ? (oscuro ? '#cfc6b3' : '#6c625b') : t.suave,
      fuera: hexOk(c.fondo) ? (oscuro ? mezcla(fondo, '#000000', .5) : mezcla(fondo, '#000000', .14)) : t.fuera
    };
    v.sobrePrimario = luz(v.primario) > 0.45 ? '#1d1a17' : '#ffffff';
    return `--fondo:${v.fondo};--papel:${v.papel};--texto:${v.texto};--suave:${v.suave};--primario:${v.primario};--acento:${v.acento};--fuera:${v.fuera};--sobre-primario:${v.sobrePrimario};--f-script:${t.script},cursive;--f-serif:${t.serif},Georgia,serif;--f-sans:${t.sans},Arial,sans-serif;--f-tit:${t.tit || t.serif},Georgia,serif;`;
  }

  // Recorta lo que el paquete no incluye (la base de datos hace lo mismo para la versión pública)
  function recortar(inv) {
    const r = RANGO[inv.plan] || 1; const d = JSON.parse(JSON.stringify(inv.datos || {}));
    const lim = r === 1 ? 0 : r === 2 ? 12 : r === 3 ? 30 : 60;
    d.galeria = (Array.isArray(d.galeria) ? d.galeria : []).slice(0, lim);
    if (r < 2) { delete d.musica; delete d.itinerario; delete d.vestimenta; }
    if (r < 3) { delete d.regalos; delete d.padrinos; delete d.hospedaje; }
    if (r < 4) { delete d.sobre; delete d.efectos; }
    return { ...inv, datos: d, rsvp: r >= 2, firmas: r >= 4, marca: r < 4 };
  }

  function fechaLarga(f) { if (!/^\d{4}-\d{2}-\d{2}$/.test(f || '')) return ''; const [y, m, d] = f.split('-').map(Number); const dt = new Date(y, m - 1, d); return `${DIAS[dt.getDay()]} ${d} de ${MESES[m - 1]} de ${y}`; }
  function fechaCorta(f) { if (!/^\d{4}-\d{2}-\d{2}$/.test(f || '')) return ''; const [y, m, d] = f.split('-'); return `${d} · ${m} · ${y}`; }
  function hora12(h) { if (!/^\d{1,2}:\d{2}$/.test(h || '')) return esc(h || ''); let [H, M] = h.split(':').map(Number); const s = H >= 12 ? 'p.m.' : 'a.m.'; H = H % 12 || 12; return `${H}:${String(M).padStart(2, '0')} ${s}`; }
  function mapaBusqueda(l) { return 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent([l.nombre, l.direccion].filter(Boolean).join(', ')); }
  function mapaEmbed(l) { return 'https://maps.google.com/maps?q=' + encodeURIComponent([l.nombre, l.direccion].filter(Boolean).join(', ')) + '&z=15&output=embed'; }
  function calendario(d, l) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d.fecha || '')) return '';
    const h = /^\d{1,2}:\d{2}$/.test((l && l.hora) || d.hora || '') ? ((l && l.hora) || d.hora) : '12:00';
    const [y, m, dd] = d.fecha.split('-'); const [H, M] = h.split(':').map(Number);
    const ini = `${y}${m}${dd}T${String(H).padStart(2, '0')}${String(M).padStart(2, '0')}00`;
    const fin = `${y}${m}${dd}T${String(Math.min(H + 5, 23)).padStart(2, '0')}${String(M).padStart(2, '0')}00`;
    const txt = [d.titulo || 'Evento', d.anfitriones].filter(Boolean).join(' · ');
    return 'https://calendar.google.com/calendar/render?action=TEMPLATE&text=' + encodeURIComponent(txt) + '&dates=' + ini + '/' + fin + '&ctz=America/Mexico_City' + (l ? '&location=' + encodeURIComponent([l.nombre, l.direccion].filter(Boolean).join(', ')) : '');
  }

  function html(inv, op) {
    const d = inv.datos || {}; const ev = EVENTOS[inv.tipo_evento] || EVENTOS.otro; const t = TEMAS[inv.plantilla] || TEMAS.elegante;
    const titulo = hayTxt(d.titulo) ? d.titulo : ev.titulo;
    const nombres = hayTxt(d.anfitriones) ? d.anfitriones : (op.previa ? 'Sus nombres aquí' : '');
    const portada = url(d.portada);
    const lugares = (Array.isArray(d.lugares) ? d.lugares : []).filter(l => l && (hayTxt(l.nombre) || hayTxt(l.direccion)));
    const s = [];
    const pase = inv.pase;

    s.push(`<section class="hero ${portada ? '' : 'sin-foto'}">${portada ? `<div class="foto" style="background-image:url('${esc(portada)}')"></div>` : ''}<div class="velo"></div>
      <div class="cont"><div class="tit">${esc(titulo)}</div><div class="nom">${esc(nombres)}</div>
      ${hayTxt(d.subtitulo) ? `<p class="sub" style="color:inherit">${esc(d.subtitulo)}</p>` : ''}
      ${d.fecha ? `<div class="fecha">${esc(fechaCorta(d.fecha))}</div>` : ''}
      ${pase ? `<div class="pase">Este pase es para<b>${esc(pase.nombre)}</b>${pase.lugares} ${pase.lugares === 1 ? 'lugar reservado' : 'lugares reservados'}</div>` : ''}
      </div><div class="flecha">⌄</div></section>`);

    if (hayTxt(d.mensaje) || hayTxt(d.padres)) {
      s.push(`<section class="revelar"><div class="adorno">${t.adorno}</div>${hayTxt(d.mensaje) ? `<p style="font-size:22px;color:var(--texto)">${esc(d.mensaje)}</p>` : ''}
        ${hayTxt(d.padres) ? `<div class="etq" style="margin-top:22px">Con la bendición de</div><p>${esc(d.padres)}</p>` : ''}</section>`);
    }

    if (d.fecha) {
      s.push(`<section class="revelar"><div class="etq">Faltan</div><h2>${esc(fechaLarga(d.fecha))}</h2>${d.hora ? `<p>${hora12(d.hora)}</p>` : ''}
        <div class="cuenta" data-fecha="${esc(d.fecha)}" data-hora="${esc(d.hora || '12:00')}"><div><b>0</b><span>días</span></div><div><b>0</b><span>horas</span></div><div><b>0</b><span>min</span></div><div><b>0</b><span>seg</span></div></div>
        <div class="btns"><a class="btn sec" target="_blank" rel="noopener" href="${calendario(d, lugares[0])}">📅 Agregar a mi calendario</a></div></section>`);
    }

    if (lugares.length) {
      s.push(`<section class="revelar"><div class="etq">Dónde</div><h2>${lugares.length > 1 ? 'Los lugares' : 'El lugar'}</h2>${lugares.map((l, i) => `
        <div class="tarjeta"><div class="hora">${esc(l.titulo || ev.lugares[i] || 'Lugar')}${l.hora ? ' · ' + hora12(l.hora) : ''}</div><h3>${esc(l.nombre || '')}</h3>${hayTxt(l.direccion) ? `<p>${esc(l.direccion)}</p>` : ''}
        <iframe class="mapa" loading="lazy" referrerpolicy="no-referrer-when-downgrade" src="${mapaEmbed(l)}" title="Mapa"></iframe>
        <div class="btns"><a class="btn" target="_blank" rel="noopener" href="${esc(url(l.mapa) || mapaBusqueda(l))}">📍 Cómo llegar</a></div></div>`).join('')}</section>`);
    }

    const itin = (Array.isArray(d.itinerario) ? d.itinerario : []).filter(x => x && (hayTxt(x.hora) || hayTxt(x.actividad)));
    if (itin.length) s.push(`<section class="revelar"><div class="etq">Programa</div><h2>Itinerario</h2><div class="itin">${itin.map(x => `<div><b>${hora12(x.hora)}</b><span>${esc(x.actividad)}</span></div>`).join('')}</div></section>`);

    if (hayTxt(d.vestimenta)) s.push(`<section class="revelar"><div class="etq">Código de vestimenta</div><h2>Vestimenta</h2><p style="color:var(--texto)">${esc(d.vestimenta)}</p></section>`);
    if (hayTxt(d.padrinos)) s.push(`<section class="revelar"><div class="etq">Nos acompañan</div><h2>Padrinos</h2><p style="color:var(--texto)">${esc(d.padrinos)}</p></section>`);

    const gal = (d.galeria || []).map(url).filter(Boolean);
    if (gal.length) s.push(`<section class="revelar"><div class="etq">Momentos</div><h2>Galería</h2><div class="gal">${gal.map(g => `<img loading="lazy" src="${esc(g)}" alt="">`).join('')}</div></section>`);

    const rg = d.regalos || {};
    const mesas = (Array.isArray(rg.mesas) ? rg.mesas : []).filter(m => m && hayTxt(m.nombre));
    if (hayTxt(rg.texto) || mesas.length || hayTxt(rg.clabe)) {
      s.push(`<section class="revelar"><div class="etq">Mesa de regalos</div><h2>Regalos</h2>${hayTxt(rg.texto) ? `<p>${esc(rg.texto)}</p>` : ''}
        ${mesas.length ? `<div class="btns">${mesas.map(m => url(m.url) ? `<a class="btn sec" target="_blank" rel="noopener" href="${esc(url(m.url))}">🎁 ${esc(m.nombre)}</a>` : `<span class="btn sec">🎁 ${esc(m.nombre)}</span>`).join('')}</div>` : ''}
        ${hayTxt(rg.clabe) ? `<div class="tarjeta"><div class="hora">Depósito o transferencia</div>${hayTxt(rg.banco) ? `<p>${esc(rg.banco)}</p>` : ''}${hayTxt(rg.titular) ? `<p>${esc(rg.titular)}</p>` : ''}<div class="clabe">${esc(rg.clabe)}</div><div class="btns"><button class="btn" data-copiar="${esc(rg.clabe)}">Copiar</button></div></div>` : ''}</section>`);
    }
    if (hayTxt(d.hospedaje)) s.push(`<section class="revelar"><div class="etq">Para quienes vienen de fuera</div><h2>Hospedaje</h2><p style="color:var(--texto)">${esc(d.hospedaje)}</p></section>`);

    if (inv.rsvp) {
      const max = pase ? pase.lugares : Math.min(Math.max(Number(d.rsvp_max) || 6, 1), 20);
      s.push(`<section class="revelar" id="confirmar"><div class="etq">${d.rsvp_fecha ? 'Antes del ' + esc(fechaLarga(d.rsvp_fecha)) : 'Te esperamos'}</div><h2>Confirma tu asistencia</h2>
        ${hayTxt(d.rsvp_mensaje) ? `<p>${esc(d.rsvp_mensaje)}</p>` : ''}
        <form class="form" id="f-rsvp"><label>Tu nombre</label><input name="nombre" required maxlength="120" autocomplete="name" value="${pase ? esc(pase.nombre) : ''}">
        <label>¿Nos acompañas?</label><div class="si-no"><button type="button" class="on" data-asiste="1">Sí, ahí estaré</button><button type="button" data-asiste="0">No podré ir</button></div>
        <div id="f-per"><label>¿Cuántas personas? ${pase ? '(máximo ' + max + ')' : ''}</label><select name="personas">${Array.from({ length: max }, (_, i) => `<option value="${i + 1}" ${pase && i + 1 === max ? 'selected' : ''}>${i + 1}</option>`).join('')}</select></div>
        <label>WhatsApp (opcional)</label><input name="telefono" inputmode="tel" maxlength="20" autocomplete="tel">
        ${inv.firmas ? `<label>Déjales un mensaje (opcional)</label><textarea name="mensaje" maxlength="600"></textarea>` : ''}
        <button class="btn" type="submit">Enviar confirmación</button><div class="aviso" id="f-aviso"></div></form></section>`);
    }

    s.push(`<div class="pie">${esc(nombres || titulo)}</div>`);
    if (inv.marca) s.push(`<div class="marca">Invitación creada con Mi Invitación Digital<br><a target="_blank" rel="noopener" href="https://wa.me/${INV.KARINA}?text=${encodeURIComponent('Hola, quiero una invitación digital como esta')}">¿Quieres una así para tu evento?</a></div>`);
    return s.join('');
  }

  function montar(raiz, inv, op = {}) {
    inv = op.previa ? recortar(inv) : inv;
    const d = inv.datos || {};
    document.body.className = 't-' + (TEMAS[inv.plantilla] ? inv.plantilla : 'elegante');
    document.documentElement.setAttribute('style', variables(inv.plantilla, d.colores));
    raiz.innerHTML = `<div class="inv">${html(inv, op)}</div>`;
    const extras = document.getElementById('inv-extras') || Object.assign(document.createElement('div'), { id: 'inv-extras' });
    extras.innerHTML = ''; document.body.appendChild(extras);

    // cuenta regresiva
    const c = raiz.querySelector('.cuenta');
    clearInterval(window.__invReloj);
    if (c) {
      const [y, m, dd] = c.dataset.fecha.split('-').map(Number); const [H, M] = (/^\d{1,2}:\d{2}$/.test(c.dataset.hora) ? c.dataset.hora : '12:00').split(':').map(Number);
      const meta = new Date(y, m - 1, dd, H, M).getTime(); const b = c.querySelectorAll('b');
      const tic = () => { let x = Math.max(0, meta - Date.now()) / 1000; const v = [Math.floor(x / 86400), Math.floor(x % 86400 / 3600), Math.floor(x % 3600 / 60), Math.floor(x % 60)]; v.forEach((n, i) => b[i].textContent = n); };
      tic(); window.__invReloj = setInterval(tic, 1000);
    }
    // aparecer al hacer scroll
    const obs = 'IntersectionObserver' in window ? new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('ver'); obs.unobserve(e.target); } }), { threshold: .12 }) : null;
    raiz.querySelectorAll('.revelar').forEach(el => obs ? obs.observe(el) : el.classList.add('ver'));
    // galería
    const visor = document.createElement('div'); visor.className = 'visor'; visor.innerHTML = '<img alt=""><button aria-label="Cerrar">×</button>'; extras.appendChild(visor);
    raiz.querySelectorAll('.gal img').forEach(im => im.addEventListener('click', () => { visor.querySelector('img').src = im.src; visor.classList.add('on'); }));
    visor.addEventListener('click', () => visor.classList.remove('on'));
    // copiar CLABE
    raiz.querySelectorAll('[data-copiar]').forEach(bt => bt.addEventListener('click', () => { navigator.clipboard && navigator.clipboard.writeText(bt.dataset.copiar); bt.textContent = '¡Copiado!'; setTimeout(() => bt.textContent = 'Copiar', 1800); }));
    // música
    let audio = null;
    const mus = d.musica && url(d.musica.url);
    if (mus) {
      audio = new Audio(mus); audio.loop = true; audio.preload = 'none';
      const bt = document.createElement('button'); bt.className = 'musica'; bt.textContent = '♪'; bt.setAttribute('aria-label', 'Música');
      const sonar = () => audio.play().then(() => { bt.classList.add('sonando'); bt.textContent = '❚❚'; }).catch(() => {});
      bt.onclick = () => { if (audio.paused) sonar(); else { audio.pause(); bt.classList.remove('sonando'); bt.textContent = '♪'; } };
      extras.appendChild(bt);
      if (!op.previa) { const primera = () => { if (audio.paused && !window.__invPausado) sonar(); window.removeEventListener('pointerdown', primera); }; window.addEventListener('pointerdown', primera); }
      window.__invSonar = sonar;
    }
    // efectos
    if (d.efectos && d.efectos !== 'ninguno' && ['petalos', 'brillos', 'confeti'].includes(d.efectos)) {
      const ef = document.createElement('div'); ef.className = 'efectos ' + d.efectos; const col = ['#f0507f', '#ffb703', '#5ec2b7', '#8e7cf0', '#ffffff'];
      for (let i = 0; i < 18; i++) { const p = document.createElement('i'); p.style.left = Math.random() * 100 + '%'; p.style.animationDuration = (9 + Math.random() * 9) + 's'; p.style.animationDelay = (-Math.random() * 15) + 's'; p.style.setProperty('--dx', (Math.random() * 120 - 60) + 'px'); if (d.efectos === 'confeti') p.style.background = col[i % col.length]; ef.appendChild(p); }
      extras.appendChild(ef);
    }
    // sobre
    if (d.sobre && !op.sinSobre) {
      const sb = document.createElement('div'); sb.className = 'sobre';
      const ini = String(d.anfitriones || '♥').trim().split(/\s*(?:&|y|e)\s*/i).filter(Boolean).map(x => x[0]).join('&').slice(0, 5) || '♥';
      sb.innerHTML = `<div class="caja"><div class="tapa"></div><div class="sello">${esc(ini)}</div><div class="txt">Toca para abrir</div></div>`;
      sb.addEventListener('click', () => { sb.classList.add('abierto'); window.__invSonar && window.__invSonar(); setTimeout(() => sb.remove(), 1700); });
      extras.appendChild(sb);
    }
    // confirmación
    const f = raiz.querySelector('#f-rsvp');
    if (f) {
      let asiste = true;
      f.querySelectorAll('[data-asiste]').forEach(b => b.addEventListener('click', () => { asiste = b.dataset.asiste === '1'; f.querySelectorAll('[data-asiste]').forEach(x => x.classList.toggle('on', x === b)); f.querySelector('#f-per').style.display = asiste ? '' : 'none'; }));
      f.addEventListener('submit', async e => {
        e.preventDefault(); const av = f.querySelector('#f-aviso'); const bt = f.querySelector('button[type=submit]');
        if (op.previa) { av.textContent = 'Así lo verán tus invitados. En la vista previa no se guardan confirmaciones.'; return; }
        const fd = new FormData(f); bt.disabled = true; av.textContent = 'Enviando…';
        try {
          const r = await fetch(INV.SUPABASE_URL + '/rest/v1/rpc/inv_confirmar', { method: 'POST', headers: { 'Content-Type': 'application/json', apikey: INV.SUPABASE_KEY }, body: JSON.stringify({ p_slug: op.slug, p_nombre: fd.get('nombre'), p_asiste: asiste, p_personas: Number(fd.get('personas') || 1), p_telefono: fd.get('telefono') || null, p_mensaje: fd.get('mensaje') || null, p_pase: op.pase || null }) });
          const j = await r.json();
          if (j && j.ok) { f.outerHTML = `<div class="gracias">${asiste ? '¡Gracias por confirmar! Te esperamos 🤍' : 'Gracias por avisarnos. ¡Te vamos a extrañar!'}</div>`; try { localStorage.setItem('rsvp-' + op.slug, '1'); } catch (_) {} }
          else { av.textContent = (j && j.error) || 'No se pudo enviar. Intenta de nuevo.'; bt.disabled = false; }
        } catch (_) { av.textContent = 'Sin conexión. Intenta de nuevo.'; bt.disabled = false; }
      });
    }
  }

  window.InvRender = { TEMAS, EVENTOS, RANGO, montar, recortar, variables };
})();
