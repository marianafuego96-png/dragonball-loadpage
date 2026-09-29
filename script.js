// ===========================
// creacion de varibles y const, api publica de dragon ball z // 
// ===========================
const API_BASE = 'https://dragonball-api.com/api/characters';
const LIMITE_POR_PAGINA = 12;

let personajesActuales = []; //var//
let paginaActual = 1;
let totalPaginas = 1;

// Referencias a elementos del DOM// 
const grid = document.getElementById('grid');
const estadoEl = document.getElementById('estado');
const paginacionEl = document.getElementById('paginacion');
const infoPaginaEl = document.getElementById('infoPagina');
const btnAnterior = document.getElementById('btnAnterior');
const btnSiguiente = document.getElementById('btnSiguiente');
const inputBuscar = document.getElementById('buscarNombre');
const selectRaza = document.getElementById('filtrarRaza');

const modalOverlay = document.getElementById('modalOverlay');
const modalContenido = document.getElementById('modalContenido');
const modalCerrar = document.getElementById('modalCerrar');

// Cache // 
const cacheDetalle = new Map();

/**
  crea la URL de consulta a la API segun  la pagina y el filtro de raza
 */
function construirUrl(pagina, raza) {
  const params = new URLSearchParams({
    page: pagina,
    limit: LIMITE_POR_PAGINA
  });
  if (raza) params.set('race', raza);
  return `${API_BASE}?${params.toString()}`;
}

/**
 * devuelve los personajes desde la API pública y actualiza la vista al user
 */
async function cargarPersonajes(pagina = 1) {
  const raza = selectRaza.value;
  mostrarCargando();

  try {
    const res = await fetch(construirUrl(pagina, raza));

    if (!res.ok) {
      throw new Error(`La API respondió con estado ${res.status}`);
    }

    const data = await res.json();

    // API con dos formatos de respuesta:
    // - Sin filtros: todo 
    // - Con filtro de raza
    if (Array.isArray(data)) {
      personajesActuales = data;
      paginaActual = 1;
      totalPaginas = 1;
    } else {
      personajesActuales = data.items || [];
      paginaActual = data.meta?.currentPage || pagina;
      totalPaginas = data.meta?.totalPages || 1;
    }

    renderTarjetas(personajesActuales);
    actualizarPaginacion();
    poblarFiltroRazas(personajesActuales);
  } catch (error) {
    console.error('Error al cargar personajes:', error); // logs de error// 
    mostrarError();
  }
}

function mostrarCargando() {
  estadoEl.textContent = 'Cargando personajes...';
  grid.innerHTML = '';

  paginacionEl.classList.add('oculto');
}

function mostrarError() {
  estadoEl.textContent = 'No se pudieron cargar los personajes. Intentá de nuevo más tarde.';
  grid.innerHTML = '';
}

/**
 * crea las tarjetas de personajes en el grid
 */
function renderTarjetas(personajes) {
  estadoEl.textContent = '';

  if (!personajes.length) {
    estadoEl.textContent = 'No se encontraron personajes con esos filtros.';
    grid.innerHTML = '';
    return;
  }


  grid.innerHTML = personajes.map(p => `
    <div class="tarjeta" data-nombre="${p.name.toLowerCase()}" data-id="${p.id}">
      <div class="imagen-wrap">
        <img src="${p.image}" alt="${p.name}" loading="lazy">
      </div>
      <div class="info">
        <h3>${p.name}</h3>
        <div class="dato"><strong>Raza:</strong> ${p.race || 'Desconocida'}</div>
        <div class="dato"><strong>Afiliación:</strong> ${p.affiliation || 'Desconocida'}</div>
        <div class="ki-bar-wrap">
          <div class="dato ki-label"><strong>Ki:</strong> ${p.ki || '0'}</div>
          <div class="ki-bar-track">
            <div class="ki-bar-fill" style="width: ${calcularPorcentajeKi(p)}%;"></div>
          </div>
        </div>
      </div>
    </div>
  `).join('');
}

/**
 * KI en porcentaje, aca me ayudo la IA 
 */
function calcularPorcentajeKi(personaje) {
  // Saca todo lo que no sea num o punto
  const valor = parseFloat((personaje.ki || '0').toString().replace(/[^0-9.]/g, ''));
  if (!valor || isNaN(valor)) return 5; // mínimo visible si no hay dato
  // con esto  evito que los ki gigantes aplasten a los chicos
  const porcentaje = Math.min(100, Math.log10(valor + 1) * 12);
  return porcentaje;
}

/**
 * Trae TODOS los personajes para armar la lista completa
 * de razas del selector. Se ejecuta una unica vez al iniciar.
 */
async function poblarTodasLasRazas() {
  try {
    const res = await fetch(`${API_BASE}?limit=100`);
    if (!res.ok) return;
    const data = await res.json();
    const personajes = Array.isArray(data) ? data : (data.items || []);
    poblarFiltroRazas(personajes);
  } catch (error) {
    console.error('No se pudo precargar la lista de razas:', error);
  }
}

/**
 * Llena el select de razas con las razas encontradas en los personajes
 * ya cargados, sin duplicar
 */
function poblarFiltroRazas(personajes) {
  const razaSeleccionada = selectRaza.value;
  const razasExistentes = new Set(
    Array.from(selectRaza.options).map(o => o.value)
  );

  personajes.forEach(p => {
    if (p.race && !razasExistentes.has(p.race)) {
      const opt = document.createElement('option');
      opt.value = p.race;
      opt.textContent = p.race;
      selectRaza.appendChild(opt);
      razasExistentes.add(p.race);
    }
  });

  selectRaza.value = razaSeleccionada; // mantener la selección del usuario
}

function actualizarPaginacion() {
  // La API no pagina los resultados filtrados por raza: si hay un filtro
  // activo, se muestran todos los resultados 
  if (selectRaza.value) {
    paginacionEl.classList.add('oculto'); // CAMBIO: antes style.display = 'none'
    return;
  }
  paginacionEl.classList.remove('oculto'); // CAMBIO: antes style.display = 'flex'
  infoPaginaEl.textContent = `Página ${paginaActual} de ${totalPaginas}`;
  btnAnterior.disabled = paginaActual <= 1;
  btnSiguiente.disabled = paginaActual >= totalPaginas;
}

/**
 * Filtro  las tarjetas ya renderizadas por nombre, sin volver a pedir
 * datos a la API 
 */
function filtrarPorNombre() {
  const texto = inputBuscar.value.trim().toLowerCase();
  document.querySelectorAll('.tarjeta').forEach(tarjeta => {
    const coincide = tarjeta.dataset.nombre.includes(texto);
    // CAMBIO: toggle(clase, condición) agrega "oculto" si NO coincide y la saca si coincide
    tarjeta.classList.toggle('oculto', !coincide);
  });
}

// ===========================
// MODAL DE DETALLE
// ===========================

/**
 * Abre el modal y trae el detalle completo del personaje por id
 * Usa cache para evitar pedidos repetidos a la API , no saturar
 */
async function abrirDetalle(id) {
  modalOverlay.classList.add('activo');
  modalContenido.innerHTML = '<div class="modal-cargando">Cargando detalle...</div>';

  try {
    let personaje = cacheDetalle.get(id);

    if (!personaje) {
      const res = await fetch(`${API_BASE}/${id}`);
      if (!res.ok) throw new Error(`La API respondió con estado ${res.status}`);
      personaje = await res.json();
      cacheDetalle.set(id, personaje);
    }

    renderModal(personaje);
  } catch (error) {
    console.error('Error al cargar el detalle:', error);
    modalContenido.innerHTML = '<div class="modal-cargando">No se pudo cargar el detalle. Intentá de nuevo.</div>';
  }
}

/**
 *  contenido del modal con los datos completos del personaje
 */
function renderModal(p) {
  const transformaciones = Array.isArray(p.transformations) ? p.transformations : [];

  // Si no tiene transformaciones, el bloque queda vacio y no se muestra
  const bloqueTransformaciones = transformaciones.length ? `
    <div>
      <div class="modal-seccion-titulo">Transformaciones</div>
      <div class="modal-transformaciones">
        ${transformaciones.map(t => `
          <div class="transformacion">
            <div class="miniatura">
              <img src="${t.image}" alt="${t.name}" loading="lazy">
            </div>
            <span>${t.name}</span>
          </div>
        `).join('')}
      </div>
    </div>
  ` : '';

  modalContenido.innerHTML = `
    <div class="modal-hero">
      <img src="${p.image}" alt="${p.name}">
    </div>
    <div class="modal-identidad">
      <h2>${p.name}</h2>
      <div class="modal-badges">
        <span class="badge acento">${p.race || 'Raza desconocida'}</span>
        <span class="badge">${p.affiliation || 'Afiliación desconocida'}</span>
      </div>
    </div>
    <div class="modal-cuerpo">
      <div class="modal-datos">
        <div class="dato-item">
          <span class="valor">${p.gender || '—'}</span>
          <span class="etiqueta">Género</span>
        </div>
        <div class="dato-item">
          <span class="valor">${p.ki || '—'}</span>
          <span class="etiqueta">Ki</span>
        </div>
        <div class="dato-item">
          <span class="valor">${p.maxKi || '—'}</span>
          <span class="etiqueta">Ki máximo</span>
        </div>
        <div class="dato-item">
          <span class="valor">${p.originPlanet?.name || '—'}</span>
          <span class="etiqueta">Planeta</span>
        </div>
      </div>
      ${p.description ? `
        <div>
          <div class="modal-seccion-titulo">Descripción</div>
          <p class="modal-descripcion">${p.description}</p>
        </div>
      ` : ''}
      ${bloqueTransformaciones}
    </div>
  `;
}

function cerrarModal() {
  modalOverlay.classList.remove('activo');
}

// ===========================
// EVENTOS
// ===========================

// Un solo listener en el grid detecta qué tarjeta se le hizo clic 
grid.addEventListener('click', (evento) => {
  const tarjeta = evento.target.closest('.tarjeta');
  if (tarjeta) abrirDetalle(tarjeta.dataset.id);
});

modalCerrar.addEventListener('click', cerrarModal);

// Cerrar al hacer clic fuera del modal //
modalOverlay.addEventListener('click', (evento) => {
  if (evento.target === modalOverlay) cerrarModal();
});

// Cerrar con la tecla Escape //
document.addEventListener('keydown', (evento) => {
  if (evento.key === 'Escape') cerrarModal();
});

btnAnterior.addEventListener('click', () => {
  if (paginaActual > 1) cargarPersonajes(paginaActual - 1);
});

btnSiguiente.addEventListener('click', () => {
  if (paginaActual < totalPaginas) cargarPersonajes(paginaActual + 1);
});

selectRaza.addEventListener('change', () => cargarPersonajes(1));
inputBuscar.addEventListener('input', filtrarPorNombre);

// ===========================
// CARGA INICIAL DE LA Pag
// ===========================
cargarPersonajes(1);
poblarTodasLasRazas();