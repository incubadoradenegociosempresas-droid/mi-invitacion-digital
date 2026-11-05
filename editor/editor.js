// Editor de autoservicio de Mi Invitación Digital (4-nov-2026)
(function () {
  const sb = window.supabase.createClient(INV.SUPABASE_URL, INV.SUPABASE_KEY, { auth: { persistSession: true, storageKey: 'mid-sesion' } });
  const { TEMAS, EVENTOS, RANGO } = window.InvRender;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const dinero = n => '$' + Number(n).toLocaleString('es-MX');
  const ORDEN = ['basica', 'interactiva', 'premium', 'especial'];

  let usuario = null, lista = [], inv = null, guardando = null, previaLista = false;

  function toast(t) { const el = $('#toast'); el.textContent = t; el.classList.add('on'); clearTimeout(toast.t); toast.t = setTimeout(() => el.classList.remove('on'), 2600); }
  const rango = () => RANGO[inv.plan] || 1;
  const minimo = p => ORDEN.find(x => RANGO[x] >= p);
  const ligaPublica = () => INV.BASE + '/i/?e=' + inv.slug;

  // ---------- Acceso ----------
  $('#liga-comprar').href = 'https://wa.me/' + INV.KARINA + '?text=' + encodeURIComponent('Hola, quiero una invitación digital');
  $('#ver-recuperar').onclick = () => { $('#f-recuperar').classList.toggle('oculto'); };
  $('#f-login').addEventListener('submit', async e => {
    e.preventDefault(); const f = new FormData(e.target); const m = $('#login-msg'); m.className = 'msg'; m.textContent = 'Entrando…';
    const { error } = await sb.auth.signInWithPassword({ email: String(f.get('correo')).trim().toLowerCase(), password: String(f.get('clave')).trim() });
    if (error) { m.className = 'msg mal'; m.textContent = 'Correo o contraseña incorrectos. Revisa el mensaje que te llegó por WhatsApp.'; return; }
    m.textContent = ''; iniciar();
  });
  $('#f-recuperar').addEventListener('submit', async e => {
    e.preventDefault(); const f = new FormData(e.target); const m = $('#rec-msg'); m.className = 'msg'; m.textContent = 'Revisando…';
    try {
      const r = await fetch(INV.FUNCION, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ accion: 'recuperar', correo: f.get('correo'), telefono: f.get('telefono') }) });
      const j = await r.json();
      if (!j.ok) { m.className = 'msg mal'; m.textContent = j.error || 'No se pudo.'; return; }
      m.className = 'msg ok'; m.innerHTML = 'Tu contraseña nueva es:<br><b style="font-size:18px;user-select:all">' + esc(j.clave) + '</b><br>Guárdala.';
      $('#f-login [name=correo]').value = j.usuario; $('#f-login [name=clave]').value = j.clave;
    } catch (_) { m.className = 'msg mal'; m.textContent = 'Sin conexión.'; }
  });
  $('#salir').onclick = async () => { await sb.auth.signOut(); location.reload(); };

  async function arranque() {
    let auto = null; try { auto = JSON.parse(sessionStorage.getItem('inv_auto') || 'null'); sessionStorage.removeItem('inv_auto'); } catch (_) {}
    if (auto && auto.u && auto.c) { await sb.auth.signOut(); const { error } = await sb.auth.signInWithPassword({ email: auto.u, password: auto.c }); if (!error) return iniciar(); }
    const { data } = await sb.auth.getSession();
    if (data && data.session) return iniciar();
    $('#v-login').classList.remove('oculto');
  }

  async function iniciar() {
    const { data: u } = await sb.auth.getUser(); usuario = u && u.user;
    if (!usuario) { $('#v-login').classList.remove('oculto'); return; }
    const { data, error } = await sb.from('inv_invitaciones').select('id, correo, plan, slug, plantilla, tipo_evento, datos, publicada, creada').order('creada', { ascending: false });
    if (error) { toast('No se pudo cargar tu invitación'); return; }
    lista = data || [];
    $('#v-login').classList.add('oculto');
    if (!lista.length) { $('#v-app').classList.remove('oculto'); $('#p-editar').innerHTML = '<div class="vacio">Tu cuenta todavía no tiene invitaciones. Si acabas de pagar, espera un minuto y recarga.</div>'; return; }
    sb.rpc('inv_limpiar_temporal').then(() => {});
    const sel = $('#sel-inv');
    if (lista.length > 1) { sel.classList.remove('oculto'); sel.innerHTML = lista.map(x => `<option value="${x.id}">${esc((x.datos && x.datos.anfitriones) || EVENTOS[x.tipo_evento]?.nombre || 'Invitación')} · ${esc(INV.PLANES[x.plan].nombre)}</option>`).join(''); sel.onchange = () => abrir(lista.find(x => x.id === sel.value)); }
    $('#v-app').classList.remove('oculto');
    abrir(lista[0]);
    revisarMejora();
  }

  function abrir(x) {
    inv = JSON.parse(JSON.stringify(x));
    inv.datos = inv.datos || {};
    if (!Array.isArray(inv.datos.lugares) || !inv.datos.lugares.length) inv.datos.lugares = [{ titulo: (EVENTOS[inv.tipo_evento] || EVENTOS.otro).lugares[0] }];
    $('#chip-plan').textContent = INV.PLANES[inv.plan].nombre;
    pintarEditar(); pintarInvitados(); pintarPaquete(); previa(true);
  }

  // ---------- Guardar ----------
  function estado(t) { $('#estado').textContent = t; }
  function cambio(sinPintar) {
    estado('Guardando…'); previa();
    clearTimeout(guardando);
    guardando = setTimeout(guardar, 900);
  }
  async function guardar() {
    const { error } = await sb.from('inv_invitaciones').update({ datos: inv.datos, plantilla: inv.plantilla, tipo_evento: inv.tipo_evento }).eq('id', inv.id);
    if (error) { estado('⚠️ Sin guardar'); toast('No se guardó. Revisa tu conexión.'); return; }
    estado('Guardado ✓'); const i = lista.findIndex(x => x.id === inv.id); if (i >= 0) lista[i] = JSON.parse(JSON.stringify(inv));
  }
  window.addEventListener('beforeunload', e => { if ($('#estado').textContent === 'Guardando…') { e.preventDefault(); e.returnValue = ''; } });

  // ---------- Vista previa ----------
  const ifr = $('#ifr');
  window.addEventListener('message', e => { if (e.origin === location.origin && e.data && e.data.tipo === 'inv-previa-lista') { previaLista = true; previa(true); } });
  let tPrev = null;
  function previa(arriba, conSobre) {
    if (!previaLista || !inv) return;
    clearTimeout(tPrev);
    tPrev = setTimeout(() => ifr.contentWindow.postMessage({ tipo: 'inv-previa', inv: { plan: inv.plan, plantilla: inv.plantilla, tipo_evento: inv.tipo_evento, datos: inv.datos }, arriba: !!arriba, conSobre: !!conSobre }, location.origin), 180);
  }
  $('#ver-sobre').onclick = () => previa(true, true);

  // ---------- Pestañas ----------
  $$('#pestanas button').forEach(b => b.onclick = () => {
    $$('#pestanas button').forEach(x => x.classList.toggle('on', x === b));
    const p = b.dataset.p;
    document.body.classList.toggle('ver-previa', p === 'previa');
    if (p !== 'previa') $$('.pag').forEach(x => x.classList.toggle('on', x.id === 'p-' + p));
    if (p === 'invitados') pintarInvitados();
    if (p === 'previa') previa(true);
    window.scrollTo(0, 0);
  });

  // ---------- Utilidades de datos ----------
  function obtener(ruta) { return ruta.split('.').reduce((o, k) => (o == null ? undefined : o[k]), inv.datos); }
  function poner(ruta, v) {
    const ks = ruta.split('.'); let o = inv.datos;
    ks.slice(0, -1).forEach((k, i) => { if (o[k] == null || typeof o[k] !== 'object') o[k] = /^\d+$/.test(ks[i + 1]) ? [] : {}; o = o[k]; });
    o[ks[ks.length - 1]] = v;
  }
  const campo = (ruta, etiqueta, op = {}) => {
    const v = obtener(ruta);
    const attrs = `data-k="${ruta}" ${op.max ? `maxlength="${op.max}"` : ''} ${op.ph ? `placeholder="${esc(op.ph)}"` : ''}`;
    const input = op.area ? `<textarea ${attrs}>${esc(v || '')}</textarea>` : `<input type="${op.tipo || 'text'}" ${attrs} value="${esc(v || '')}" ${op.modo ? `inputmode="${op.modo}"` : ''}>`;
    return `<label>${etiqueta}</label>${input}${op.ayuda ? `<p class="ayuda">${op.ayuda}</p>` : ''}`;
  };
  function bloque(id, titulo, minPlan, contenido, abierto) {
    const bloqueado = rango() < RANGO[minPlan];
    const cand = RANGO[minPlan] > 1 ? `<span class="candado">${bloqueado ? '🔒 ' : ''}${INV.PLANES[minPlan].nombre}</span>` : '';
    const tapa = bloqueado ? `<div class="tapa">Incluido desde el paquete ${INV.PLANES[minPlan].nombre}<button class="btn chico" data-mejorar="${minPlan}">Mejorar por ${dinero(INV.PLANES[minPlan].precio - INV.PLANES[inv.plan].precio)}</button></div>` : '';
    return `<details class="sec" id="s-${id}" ${abierto ? 'open' : ''}><summary>${titulo} ${cand}</summary><div class="in ${bloqueado ? 'bloq' : ''}"><div class="contenido">${contenido}</div>${tapa}</div></details>`;
  }

  // ---------- Pestaña Editar ----------
  function pintarEditar() {
    const abiertos = $$('#p-editar details[open]').map(d => d.id);
    const primeraVez = !abiertos.length;
    const d = inv.datos; const ev = EVENTOS[inv.tipo_evento] || EVENTOS.otro; const r = rango();
    const lim = r === 1 ? 0 : r === 2 ? 12 : r === 3 ? 30 : 60;
    const col = d.colores || {}; const t = TEMAS[inv.plantilla] || TEMAS.elegante;

    const diseno = `<label>Tipo de evento</label><select data-tipo>${Object.entries(EVENTOS).map(([k, e]) => `<option value="${k}" ${k === inv.tipo_evento ? 'selected' : ''}>${e.nombre}</option>`).join('')}</select>
      <label>Plantilla</label><div class="plantillas">${Object.entries(TEMAS).map(([k, x]) => `<button type="button" class="plantilla ${k === inv.plantilla ? 'on' : ''}" data-plantilla="${k}"><div class="muestra" style="background:${x.fondo};color:${x.primario};font-family:${x.script},cursive;border:1px solid ${x.primario}33">${x.adorno} Aa</div><b>${x.nombre}</b><small>${x.ideal}</small></button>`).join('')}</div>
      <label>Colores</label><div class="colores"><div><input type="color" data-color="primario" value="${col.primario || t.primario}"><p class="ayuda">Principal</p></div><div><input type="color" data-color="acento" value="${col.acento || t.acento}"><p class="ayuda">Acento</p></div><div><input type="color" data-color="fondo" value="${col.fondo || t.fondo}"><p class="ayuda">Fondo</p></div></div>
      <button type="button" class="liga" data-reset-colores>Usar los colores de la plantilla</button>
      ${r >= 4 ? `<label class="check"><input type="checkbox" data-sobre ${d.sobre ? 'checked' : ''}> Sobre animado al abrir</label>
      <label>Efecto</label><select data-efecto>${[['ninguno', 'Sin efecto'], ['petalos', 'Pétalos'], ['brillos', 'Brillos'], ['confeti', 'Confeti']].map(([k, n]) => `<option value="${k}" ${(d.efectos || 'ninguno') === k ? 'selected' : ''}>${n}</option>`).join('')}</select>` : `<p class="ayuda">Sobre animado y efectos de pétalos, brillos o confeti: paquete Especial.</p>`}`;

    const portada = `${campo('titulo', 'Título', { ph: ev.titulo, max: 60 })}
      ${campo('anfitriones', inv.tipo_evento === 'boda' || inv.tipo_evento === 'aniversario' ? 'Nombres de la pareja' : 'Nombre(s) de quien celebra', { ph: inv.tipo_evento === 'boda' ? 'Ana & Luis' : 'Valentina', max: 80 })}
      ${campo('subtitulo', 'Frase corta (opcional)', { ph: 'Queremos compartir este día contigo', max: 120 })}
      <div class="fila"><div>${campo('fecha', 'Fecha', { tipo: 'date' })}</div><div>${campo('hora', 'Hora', { tipo: 'time' })}</div></div>
      <label>Foto de portada</label><div class="foto-portada" style="${d.portada ? `background-image:url('${esc(d.portada)}')` : ''}">${d.portada ? '' : 'Sin foto: se verá con el fondo de la plantilla'}</div>
      <div class="botones"><label class="btn chico subir">📷 ${d.portada ? 'Cambiar foto' : 'Subir foto'}<input type="file" accept="image/*" data-subir="portada"></label>${d.portada ? '<button type="button" class="btn sec chico" data-quitar-portada>Quitar</button>' : ''}</div>
      <div class="barra-prog oculto" id="prog-portada"><i></i></div>`;

    const mensaje = `${campo('mensaje', 'Mensaje para tus invitados', { area: 1, max: 700, ph: 'Con mucho cariño te invitamos a celebrar…' })}
      ${campo('padres', 'Padres, familia o anfitriones (opcional)', { area: 1, max: 400, ph: 'Sr. Juan Pérez y Sra. María López' })}`;

    const lugares = (d.lugares || []).map((l, i) => `<div class="item">${(d.lugares.length > 1) ? `<button type="button" class="quitar" data-quitar="lugares.${i}">×</button>` : ''}
      ${campo(`lugares.${i}.titulo`, 'Qué es', { ph: ev.lugares[i] || 'Lugar', max: 40 })}${campo(`lugares.${i}.nombre`, 'Nombre del lugar', { ph: 'Jardín Los Olivos', max: 80 })}
      ${campo(`lugares.${i}.direccion`, 'Dirección', { ph: 'Calle, número, colonia, ciudad', max: 160 })}
      <div class="fila"><div>${campo(`lugares.${i}.hora`, 'Hora', { tipo: 'time' })}</div><div>${campo(`lugares.${i}.mapa`, 'Liga de Google Maps', { ph: 'Opcional', modo: 'url' })}</div></div></div>`).join('')
      + ((d.lugares || []).length < 3 ? `<button type="button" class="btn sec chico mas" data-agregar="lugares">+ Agregar otro lugar</button>` : '');

    const itin = (d.itinerario || []).map((x, i) => `<div class="item"><button type="button" class="quitar" data-quitar="itinerario.${i}">×</button><div class="fila"><div>${campo(`itinerario.${i}.hora`, 'Hora', { tipo: 'time' })}</div><div>${campo(`itinerario.${i}.actividad`, 'Actividad', { ph: 'Cena', max: 60 })}</div></div></div>`).join('')
      + `<button type="button" class="btn sec chico mas" data-agregar="itinerario">+ Agregar actividad</button>${campo('vestimenta', 'Código de vestimenta', { area: 1, max: 300, ph: 'Formal. Evitar color blanco.' })}`;

    const gal = (d.galeria || []);
    const galeria = `<p class="ayuda">${gal.length} de ${lim || 12} fotos. Se ven en el orden en que las acomodes.</p><div class="galeria">${gal.map((g, i) => `<div class="ft" style="background-image:url('${esc(g)}')">${i > 0 ? `<button type="button" class="izq" data-mover="${i}">‹</button>` : ''}<button type="button" data-quitar="galeria.${i}">×</button></div>`).join('')}</div>
      <div class="botones">${gal.length < (lim || 12) ? `<label class="btn chico subir">📷 Agregar fotos<input type="file" accept="image/*" multiple data-subir="galeria"></label>` : '<p class="ayuda">Llegaste al límite de tu paquete.</p>'}</div><div class="barra-prog oculto" id="prog-galeria"><i></i></div>`;

    const m = d.musica || {};
    const musica = `${m.url ? `<p class="ayuda">🎵 ${esc(m.titulo || 'Canción cargada')}</p><audio controls preload="none" src="${esc(m.url)}" style="width:100%;margin-top:8px"></audio>` : '<p class="ayuda">Sube tu canción en MP3 o M4A (máximo 12 MB). Suena cuando el invitado toca la pantalla.</p>'}
      <div class="botones"><label class="btn chico subir">🎵 ${m.url ? 'Cambiar canción' : 'Subir canción'}<input type="file" accept="audio/mpeg,audio/mp3,audio/mp4,audio/x-m4a,audio/aac,.mp3,.m4a" data-subir="musica"></label>${m.url ? '<button type="button" class="btn sec chico" data-quitar-musica>Quitar</button>' : ''}</div><div class="barra-prog oculto" id="prog-musica"><i></i></div>`;

    const confirmar = `<p class="ayuda">Tus invitados confirman desde la invitación y tú ves la lista en la pestaña Invitados.</p>
      <div class="fila"><div>${campo('rsvp_fecha', 'Confirmar antes del', { tipo: 'date' })}</div><div><label>Máximo de personas por confirmación</label><select data-k-num="rsvp_max">${Array.from({ length: 20 }, (_, i) => `<option ${Number(d.rsvp_max || 6) === i + 1 ? 'selected' : ''}>${i + 1}</option>`).join('')}</select></div></div>
      ${campo('rsvp_mensaje', 'Mensaje (opcional)', { max: 200, ph: 'Tu confirmación nos ayuda a organizar todo' })}
      ${r >= 3 ? '<p class="ayuda">Con los pases personalizados (pestaña Invitados) cada invitado solo puede confirmar los lugares que le asignaste.</p>' : ''}`;

    const rg = d.regalos || {};
    const regalos = `${campo('regalos.texto', 'Mensaje de regalos', { area: 1, max: 300, ph: 'Tu presencia es nuestro mejor regalo…' })}
      ${(rg.mesas || []).map((x, i) => `<div class="item"><button type="button" class="quitar" data-quitar="regalos.mesas.${i}">×</button><div class="fila"><div>${campo(`regalos.mesas.${i}.nombre`, 'Tienda', { ph: 'Liverpool', max: 40 })}</div><div>${campo(`regalos.mesas.${i}.url`, 'Liga o número de evento', { ph: 'https://…', modo: 'url' })}</div></div></div>`).join('')}
      <button type="button" class="btn sec chico mas" data-agregar="regalos.mesas">+ Agregar mesa de regalos</button>
      <div class="fila"><div>${campo('regalos.banco', 'Banco', { max: 40 })}</div><div>${campo('regalos.titular', 'Titular', { max: 80 })}</div></div>
      ${campo('regalos.clabe', 'CLABE o número de tarjeta', { max: 24, modo: 'numeric' })}
      ${campo('padrinos', 'Padrinos', { area: 1, max: 800, ph: 'Velación: …\nAnillos: …' })}
      ${campo('hospedaje', 'Hospedaje para invitados de fuera', { area: 1, max: 500 })}`;

    const publicada = !!inv.publicada;
    const publicar = `<div class="pub-estado"><span class="punto ${publicada ? 'si' : ''}"></span>${publicada ? 'Tu invitación está publicada' : 'Todavía no está publicada'}</div>
      <label>Tu liga</label><div class="liga-pub"><span>…/i/?e=</span><input id="slug" value="${esc(inv.slug)}" maxlength="60" autocapitalize="off" autocomplete="off"></div>
      <p class="ayuda">Solo minúsculas, números y guiones. Ejemplo: ana-y-luis-2027</p>
      <div class="botones"><button type="button" class="btn" id="publicar">${publicada ? 'Guardar liga' : '🚀 Publicar invitación'}</button>${publicada ? '<button type="button" class="btn sec" id="despublicar">Ocultar</button>' : ''}</div>
      ${publicada ? `<div class="botones"><button type="button" class="btn sec chico" id="copiar-liga">Copiar liga</button><a class="btn verde chico" target="_blank" rel="noopener" href="https://wa.me/?text=${encodeURIComponent('¡Estás invitado! ' + ligaPublica())}">Compartir por WhatsApp</a><a class="btn sec chico" target="_blank" rel="noopener" href="${ligaPublica()}">Abrir</a></div>` : ''}
      <p class="ayuda">Puedes seguir cambiando todo después de publicar: tus invitados siempre ven la versión más reciente.</p>`;

    $('#p-editar').innerHTML =
      bloque('diseno', '🎨 Diseño', 'basica', diseno, primeraVez) +
      bloque('portada', '💌 Portada, nombres y fecha', 'basica', portada) +
      bloque('mensaje', '📝 Mensaje y familia', 'basica', mensaje) +
      bloque('lugares', '📍 Lugares', 'basica', lugares) +
      bloque('itinerario', '🕒 Itinerario y vestimenta', 'interactiva', itin) +
      bloque('galeria', '🖼 Galería de fotos', 'interactiva', galeria) +
      bloque('musica', '🎵 Música', 'interactiva', musica) +
      bloque('confirmar', '✅ Confirmación de asistencia', 'interactiva', confirmar) +
      bloque('regalos', '🎁 Regalos, padrinos y hospedaje', 'premium', regalos) +
      bloque('publicar', '🚀 Publicar y compartir', 'basica', publicar);
    abiertos.forEach(id => { const el = document.getElementById(id); if (el) el.open = true; });
    $('#ver-sobre').hidden = !(r >= 4 && d.sobre);
    enlazarEditar();
  }

  function enlazarEditar() {
    const raiz = $('#p-editar');
    $$('[data-k]', raiz).forEach(el => el.addEventListener('input', () => { poner(el.dataset.k, el.value); cambio(); }));
    $$('[data-k-num]', raiz).forEach(el => el.addEventListener('change', () => { poner(el.dataset.kNum, Number(el.value)); cambio(); }));
    const tipo = $('[data-tipo]', raiz);
    tipo && tipo.addEventListener('change', () => {
      inv.tipo_evento = tipo.value; const ev = EVENTOS[inv.tipo_evento];
      (inv.datos.lugares || []).forEach((l, i) => { if (!l.titulo || Object.values(EVENTOS).some(e => e.lugares.includes(l.titulo))) l.titulo = ev.lugares[i] || l.titulo; });
      cambio(); pintarEditar();
    });
    $$('[data-plantilla]', raiz).forEach(b => b.addEventListener('click', () => { inv.plantilla = b.dataset.plantilla; inv.datos.colores = null; cambio(); pintarEditar(); previa(true); }));
    $$('[data-color]', raiz).forEach(el => el.addEventListener('input', () => { const t = TEMAS[inv.plantilla]; inv.datos.colores = Object.assign({ primario: t.primario, acento: t.acento, fondo: t.fondo }, inv.datos.colores || {}, { [el.dataset.color]: el.value }); cambio(); }));
    const rc = $('[data-reset-colores]', raiz); rc && rc.addEventListener('click', () => { inv.datos.colores = null; cambio(); pintarEditar(); });
    const so = $('[data-sobre]', raiz); so && so.addEventListener('change', () => { inv.datos.sobre = so.checked; cambio(); $('#ver-sobre').hidden = !so.checked; if (so.checked) previa(true, true); });
    const ef = $('[data-efecto]', raiz); ef && ef.addEventListener('change', () => { inv.datos.efectos = ef.value; cambio(); });
    $$('[data-agregar]', raiz).forEach(b => b.addEventListener('click', () => {
      const k = b.dataset.agregar; const arr = obtener(k) || [];
      const nuevo = k === 'lugares' ? { titulo: (EVENTOS[inv.tipo_evento] || EVENTOS.otro).lugares[arr.length] || 'Lugar' } : k === 'itinerario' ? { hora: '', actividad: '' } : { nombre: '', url: '' };
      poner(k, arr.concat([nuevo])); cambio(); pintarEditar();
    }));
    $$('[data-quitar]', raiz).forEach(b => b.addEventListener('click', () => {
      const ruta = b.dataset.quitar.split('.'); const i = Number(ruta.pop()); const arr = obtener(ruta.join('.')) || [];
      arr.splice(i, 1); poner(ruta.join('.'), arr); cambio(); pintarEditar();
    }));
    $$('[data-mover]', raiz).forEach(b => b.addEventListener('click', () => { const i = Number(b.dataset.mover); const g = inv.datos.galeria; [g[i - 1], g[i]] = [g[i], g[i - 1]]; cambio(); pintarEditar(); }));
    const qp = $('[data-quitar-portada]', raiz); qp && qp.addEventListener('click', () => { inv.datos.portada = ''; cambio(); pintarEditar(); });
    const qm = $('[data-quitar-musica]', raiz); qm && qm.addEventListener('click', () => { inv.datos.musica = null; cambio(); pintarEditar(); });
    $$('[data-subir]', raiz).forEach(el => el.addEventListener('change', () => subir(el.dataset.subir, Array.from(el.files || []))));
    $$('[data-mejorar]', raiz).forEach(b => b.addEventListener('click', () => mejorar(b.dataset.mejorar)));
    const pub = $('#publicar'); pub && pub.addEventListener('click', publicar);
    const desp = $('#despublicar'); desp && desp.addEventListener('click', async () => { const { error } = await sb.from('inv_invitaciones').update({ publicada: false }).eq('id', inv.id); if (!error) { inv.publicada = false; toast('Tu invitación quedó oculta'); pintarEditar(); } });
    const cop = $('#copiar-liga'); cop && cop.addEventListener('click', () => { navigator.clipboard.writeText(ligaPublica()); toast('Liga copiada'); });
  }

  // ---------- Subir archivos ----------
  function comprimir(file, max = 1600, q = .82) {
    return new Promise((ok, mal) => {
      const img = new Image(); const u = URL.createObjectURL(file);
      img.onload = () => { const s = Math.min(1, max / Math.max(img.width, img.height)); const c = document.createElement('canvas'); c.width = Math.round(img.width * s); c.height = Math.round(img.height * s); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(u); c.toBlob(b => b ? ok(b) : mal(new Error('foto')), 'image/jpeg', q); };
      img.onerror = () => { URL.revokeObjectURL(u); mal(new Error('No pudimos leer esa foto. Prueba con otra (JPG o PNG).')); };
      img.src = u;
    });
  }
  async function subirUno(blob, ext, tipo) {
    const nombre = `${inv.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await sb.storage.from('invitaciones').upload(nombre, blob, { contentType: tipo, cacheControl: '31536000', upsert: false });
    if (error) throw new Error(error.message);
    return sb.storage.from('invitaciones').getPublicUrl(nombre).data.publicUrl;
  }
  async function subir(destino, archivos) {
    if (!archivos.length) return;
    const prog = $('#prog-' + destino); prog && prog.classList.remove('oculto'); const barra = prog && prog.querySelector('i');
    try {
      if (destino === 'musica') {
        const f = archivos[0]; if (f.size > 12 * 1024 * 1024) throw new Error('La canción pesa más de 12 MB.');
        barra && (barra.style.width = '40%');
        const ext = /\.m4a$/i.test(f.name) ? 'm4a' : 'mp3';
        const u = await subirUno(f, ext, ext === 'm4a' ? 'audio/mp4' : 'audio/mpeg');
        inv.datos.musica = { url: u, titulo: f.name.replace(/\.[^.]+$/, '').slice(0, 80) };
      } else if (destino === 'portada') {
        barra && (barra.style.width = '40%');
        inv.datos.portada = await subirUno(await comprimir(archivos[0], 1800), 'jpg', 'image/jpeg');
      } else {
        const r = rango(); const lim = r === 2 ? 12 : r === 3 ? 30 : 60;
        const g = inv.datos.galeria = inv.datos.galeria || [];
        const toca = archivos.slice(0, Math.max(0, lim - g.length));
        if (toca.length < archivos.length) toast(`Solo se subieron ${toca.length}: tu paquete permite ${lim} fotos`);
        for (let i = 0; i < toca.length; i++) { g.push(await subirUno(await comprimir(toca[i]), 'jpg', 'image/jpeg')); barra && (barra.style.width = Math.round((i + 1) / toca.length * 100) + '%'); }
      }
      barra && (barra.style.width = '100%');
      cambio(); pintarEditar(); toast('Listo ✓');
    } catch (e) { toast(e.message || 'No se pudo subir'); prog && prog.classList.add('oculto'); }
  }

  // ---------- Publicar ----------
  const limpiarSlug = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/&/g, 'y').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);
  async function publicar() {
    let s = limpiarSlug($('#slug').value);
    if (/^evento-[a-z0-9]{6}$/.test(s) && inv.datos.anfitriones) { const sug = limpiarSlug(inv.datos.anfitriones + (inv.datos.fecha ? '-' + inv.datos.fecha.slice(0, 4) : '')); if (sug.length >= 3) s = sug; }
    if (s.length < 3) { toast('La liga necesita al menos 3 letras'); return; }
    if (!inv.datos.anfitriones && !inv.datos.titulo) { toast('Primero escribe los nombres en "Portada"'); return; }
    clearTimeout(guardando); await guardar();
    let { error } = await sb.from('inv_invitaciones').update({ slug: s, publicada: true }).eq('id', inv.id);
    if (error && /duplicate|unique/i.test(error.message)) { s = (s.slice(0, 54) + '-' + Math.random().toString(36).slice(2, 6)); ({ error } = await sb.from('inv_invitaciones').update({ slug: s, publicada: true }).eq('id', inv.id)); if (!error) toast('Esa liga ya estaba ocupada; te dejamos una parecida'); }
    if (error) { toast('No se pudo publicar: revisa la liga'); return; }
    inv.slug = s; inv.publicada = true; const i = lista.findIndex(x => x.id === inv.id); if (i >= 0) lista[i] = JSON.parse(JSON.stringify(inv));
    toast('¡Publicada! 🎉'); pintarEditar(); const sec = $('#s-publicar'); sec && (sec.open = true, sec.scrollIntoView({ behavior: 'smooth' }));
  }

  // ---------- Invitados ----------
  async function pintarInvitados() {
    const raiz = $('#p-invitados'); if (!inv) return;
    if (rango() < 2) { raiz.innerHTML = `<div class="paq"><h3>👥 Confirmación de asistencia</h3><p class="ayuda" style="font-size:14px">Con el paquete Interactiva tus invitados confirman desde la invitación y aquí ves quién viene y cuántas personas.</p><button class="btn ancho" data-mejorar="interactiva">Mejorar por ${dinero(990 - INV.PLANES[inv.plan].precio)}</button></div>`; $$('[data-mejorar]', raiz).forEach(b => b.onclick = () => mejorar(b.dataset.mejorar)); return; }
    raiz.innerHTML = '<div class="vacio">Cargando…</div>';
    const [{ data: rs }, { data: ps }] = await Promise.all([
      sb.from('inv_rsvp').select('id, nombre, asiste, personas, telefono, mensaje, creado, pase_id').eq('invitacion_id', inv.id).eq('oculto', false).order('creado', { ascending: false }),
      rango() >= 3 ? sb.from('inv_pases').select('id, codigo, nombre, lugares, creado').eq('invitacion_id', inv.id).order('creado') : Promise.resolve({ data: [] })
    ]);
    const r = rs || [], p = ps || [];
    const si = r.filter(x => x.asiste), per = si.reduce((a, x) => a + (x.personas || 0), 0);
    const confirmoPase = new Set(r.map(x => x.pase_id).filter(Boolean));
    raiz.innerHTML = `<div class="totales"><div><b>${per}</b><span>personas vienen</span></div><div><b>${si.length}</b><span>confirmaron</span></div><div><b>${r.length - si.length}</b><span>no podrán</span></div></div>
      <div class="botones"><button class="btn sec chico" id="recargar">↻ Actualizar</button>${rango() >= 3 ? '<button class="btn sec chico" id="csv">⬇️ Descargar Excel</button>' : ''}</div>
      ${rango() >= 3 ? `<details class="sec" open><summary>🎟 Pases personalizados <span class="candado">${p.length}</span></summary><div class="in">
        <p class="ayuda">Crea un pase por familia o invitado. Cada uno recibe su propia liga con su nombre y los lugares que le asignas.</p>
        <div class="fila"><div><label>Nombre en el pase</label><input id="pase-nombre" maxlength="120" placeholder="Familia López"></div><div><label>Lugares</label><select id="pase-lugares">${Array.from({ length: 12 }, (_, i) => `<option ${i === 1 ? 'selected' : ''}>${i + 1}</option>`).join('')}</select></div></div>
        <div class="botones"><button class="btn chico" id="pase-crear">+ Crear pase</button></div>
        <div class="lista">${p.map(x => { const l = ligaPublica() + '&p=' + x.codigo; return `<div class="r"><button class="x" data-borrar-pase="${x.id}" title="Borrar">×</button><b>${esc(x.nombre)}</b> · ${x.lugares} ${x.lugares === 1 ? 'lugar' : 'lugares'} ${confirmoPase.has(x.id) ? '<span class="si">· confirmó</span>' : ''}
          <div class="botones"><a class="btn verde chico" target="_blank" rel="noopener" href="https://wa.me/?text=${encodeURIComponent('Hola ' + x.nombre + ', ¡estás invitado! Aquí está tu pase para ' + x.lugares + (x.lugares === 1 ? ' persona' : ' personas') + ': ' + l)}">Enviar por WhatsApp</a><button class="btn sec chico" data-copiar="${esc(l)}">Copiar liga</button></div></div>`; }).join('')}</div>
        ${inv.publicada ? '' : '<p class="ayuda">⚠️ Publica tu invitación para que las ligas de los pases funcionen.</p>'}</div></details>` : ''}
      <h3 style="margin:18px 4px 6px">Confirmaciones</h3>
      <div class="lista">${r.length ? r.map(x => `<div class="r"><button class="x" data-ocultar="${x.id}" title="Quitar">×</button><b>${esc(x.nombre)}</b> · ${x.asiste ? `<span class="si">Sí · ${x.personas} ${x.personas === 1 ? 'persona' : 'personas'}</span>` : '<span class="no">No asistirá</span>'}
        ${x.telefono ? `<div class="m">📱 ${esc(x.telefono)}</div>` : ''}${x.mensaje ? `<div class="m">💬 ${esc(x.mensaje)}</div>` : ''}<div class="m">${new Date(x.creado).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' })}</div></div>`).join('') : `<div class="vacio">${inv.publicada ? 'Aún no hay confirmaciones. Comparte tu liga 💌' : 'Publica tu invitación y compártela para empezar a recibir confirmaciones.'}</div>`}</div>`;
    $('#recargar').onclick = pintarInvitados;
    const csv = $('#csv'); csv && (csv.onclick = () => {
      const filas = [['Nombre', 'Asiste', 'Personas', 'WhatsApp', 'Mensaje', 'Pase', 'Fecha']].concat(r.map(x => [x.nombre, x.asiste ? 'Sí' : 'No', x.personas, x.telefono || '', x.mensaje || '', (p.find(y => y.id === x.pase_id) || {}).nombre || '', new Date(x.creado).toLocaleString('es-MX')]));
      const txt = '﻿' + filas.map(f => f.map(v => '"' + String(v).replace(/"/g, '""') + '"').join(',')).join('\r\n');
      const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([txt], { type: 'text/csv;charset=utf-8' })); a.download = 'invitados-' + inv.slug + '.csv'; a.click();
    });
    const pc = $('#pase-crear'); pc && (pc.onclick = async () => {
      const n = $('#pase-nombre').value.trim(); if (!n) { toast('Escribe el nombre del pase'); return; }
      pc.disabled = true; const { error } = await sb.from('inv_pases').insert({ invitacion_id: inv.id, nombre: n, lugares: Number($('#pase-lugares').value) });
      pc.disabled = false; if (error) { toast('No se pudo crear el pase'); return; } toast('Pase creado'); pintarInvitados();
    });
    $$('[data-borrar-pase]', raiz).forEach(b => b.onclick = async () => { if (!confirm('¿Borrar este pase? Su liga dejará de mostrar el nombre.')) return; await sb.from('inv_pases').delete().eq('id', b.dataset.borrarPase); pintarInvitados(); });
    $$('[data-ocultar]', raiz).forEach(b => b.onclick = async () => { if (!confirm('¿Quitar esta confirmación de tu lista?')) return; await sb.rpc('inv_ocultar_rsvp', { p_id: Number(b.dataset.ocultar) }); pintarInvitados(); });
    $$('[data-copiar]', raiz).forEach(b => b.onclick = () => { navigator.clipboard.writeText(b.dataset.copiar); toast('Liga copiada'); });
  }

  // ---------- Paquete ----------
  function pintarPaquete() {
    const r = rango();
    $('#p-paquete').innerHTML = `<p class="ayuda" style="font-size:14px;text-align:center;margin:10px 0">Sube de paquete cuando quieras: solo pagas la diferencia y no pierdes nada de lo que ya capturaste.</p>` +
      ORDEN.map(k => { const p = INV.PLANES[k]; const actual = k === inv.plan; const dif = p.precio - INV.PLANES[inv.plan].precio;
        return `<div class="paq ${actual ? 'actual' : ''}"><h3>${p.nombre} ${actual ? '<span class="chip">Tu paquete</span>' : ''}</h3><div class="precio">${dinero(p.precio)}</div><ul>${INV.INCLUYE[k].map(x => `<li>${x}</li>`).join('')}</ul>
        ${RANGO[k] > r ? `<button class="btn" data-mejorar="${k}">Mejorar · pagas solo ${dinero(dif)}</button>` : ''}</div>`; }).join('');
    $$('#p-paquete [data-mejorar]').forEach(b => b.onclick = () => mejorar(b.dataset.mejorar));
  }
  function mejorar(a) {
    const liga = INV.MEJORAS[inv.plan + '_' + a];
    if (!liga) { toast('Ya tienes ese paquete'); return; }
    try { localStorage.setItem('mid-mejora', JSON.stringify({ id: inv.id, de: inv.plan, a, t: Date.now() })); } catch (_) {}
    location.href = liga + '?client_reference_id=' + encodeURIComponent(inv.id) + '&prefilled_email=' + encodeURIComponent(inv.correo || usuario.email || '');
  }
  async function revisarMejora() {
    let m = null; try { m = JSON.parse(localStorage.getItem('mid-mejora') || 'null'); } catch (_) {}
    const volvio = new URLSearchParams(location.search).get('mejora') === 'ok';
    if (!m || Date.now() - m.t > 6 * 3600_000) return;
    if (!volvio) return;
    const av = $('#aviso-mejora'); av.classList.remove('oculto'); av.textContent = '⏳ Estamos activando tu paquete ' + INV.PLANES[m.a].nombre + '…';
    for (let i = 0; i < 40; i++) {
      const { data } = await sb.from('inv_invitaciones').select('id, plan').eq('id', m.id).maybeSingle();
      if (data && RANGO[data.plan] >= RANGO[m.a]) {
        localStorage.removeItem('mid-mejora'); history.replaceState(null, '', location.pathname);
        const x = lista.find(y => y.id === m.id); if (x) x.plan = data.plan; if (inv && inv.id === m.id) { inv.plan = data.plan; abrir(inv); }
        av.textContent = '🎉 ¡Listo! Ya tienes el paquete ' + INV.PLANES[data.plan].nombre + '. Las secciones nuevas ya están abiertas.'; setTimeout(() => av.classList.add('oculto'), 9000); return;
      }
      await new Promise(r => setTimeout(r, 3000));
    }
    av.textContent = 'Tu pago se está procesando. Si en unos minutos no se activa, recarga la página o escríbenos por WhatsApp.';
  }

  arranque();
})();
