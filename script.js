// ===== CONFIGURACIÓN =====
const SHEET_CSV_URL = `https://docs.google.com/spreadsheets/d/e/2PACX-1vQGf0lwuT50XetPllLnXTwAolc4HKlJcTLJcWAsyVLZQ85JTZnZ8augLLATB-c3Ke4Kildour8C2T4X/pub?output=csv&t=${Date.now()}`;
const WHATSAPP = "5492645128012";

// ===== HELPERS DE IMÁGENES =====
function idsToUrls(campo) {
  if (!campo) return [];
  return campo.split("|").map(id => id.trim()).filter(Boolean)
    .map(id => `https://drive.google.com/thumbnail?id=${id}&sz=w1000`);
}

// ===== PARSEAR CSV =====
function parseCSV(text) {
  const lines = text.trim().split("\n");
  const headers = lines[0].split(",").map(h => h.trim());
  return lines.slice(1).map(line => {
    const values = [];
    let current = "";
    let inQuotes = false;
    for (let char of line) {
      if (char === '"') { inQuotes = !inQuotes; }
      else if (char === "," && !inQuotes) { values.push(current.trim()); current = ""; }
      else { current += char; }
    }
    values.push(current.trim());
    return Object.fromEntries(headers.map((h, i) => [h, values[i] || ""]));
  });
}

// ===== CREAR CARD DE CATEGORÍA =====
function crearCardCategoria(general, variantes) {
  const precioDesde = Math.min(...variantes.map(v => Number(v.precio)));
  const imgs = idsToUrls(general.imagen_url).length
    ? idsToUrls(general.imagen_url)
    : idsToUrls(variantes[0]?.imagen_url);
  const portada = imgs[0] || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='200'%3E%3Crect width='100%25' height='100%25' fill='%23f9e4e4'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%237b2d2d' font-family='sans-serif' font-size='18'%3ESin imagen%3C/text%3E%3C/svg%3E";
  return `
    <div class="card" onclick="abrirModal('${general.categoria}')">
      <img src="${portada}" alt="${general.nombre}" 
           onerror="this.src='data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='200'%3E%3Crect width='100%25' height='100%25' fill='%23f9e4e4'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%237b2d2d' font-family='sans-serif' font-size='18'%3ESin imagen%3C/text%3E%3C/svg%3E'" />
      <div class="card-body">
        <h3>${general.nombre}</h3>
        <p>${general.descripcion}</p>
        <span class="precio">Desde $${precioDesde.toLocaleString("es-AR")}</span>
      </div>
    </div>
  `;
}

// ===== CREAR ITEM DE VARIANTE EN MODAL =====
let carruselContador = 0;
let fotosPorCarrusel = {};

function crearItemVariante(variante) {
  const precio = Number(variante.precio).toLocaleString("es-AR");
  const mensaje = encodeURIComponent(`Hola! Me gustaria consultar por: ${variante.nombre}`);
  const imgs = idsToUrls(variante.imagen_url);
  const fotos = imgs.length ? imgs : ["data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='200'%3E%3Crect width='100%25' height='100%25' fill='%23f9e4e4'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%237b2d2d' font-family='sans-serif' font-size='18'%3ESin imagen%3C/text%3E%3C/svg%3E"];
  const carruselId = `carrusel-${carruselContador++}`;
  fotosPorCarrusel[carruselId] = fotos;

  const slides = fotos.map((src, i) => `
    <img src="${src}" alt="${variante.nombre}" class="carrusel-img ${i === 0 ? "active" : ""}"
         onclick='abrirLightbox("${carruselId}", ${i}, "${variante.nombre.replace(/"/g, "&quot;")}")'
         onerror="this.src='data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='200'%3E%3Crect width='100%25' height='100%25' fill='%23f9e4e4'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%237b2d2d' font-family='sans-serif' font-size='18'%3ESin imagen%3C/text%3E%3C/svg%3E'" />
  `).join("");

  const controles = fotos.length > 1 ? `
    <button class="carrusel-btn prev" onclick="moverCarrusel('${carruselId}', -1)">‹</button>
    <button class="carrusel-btn next" onclick="moverCarrusel('${carruselId}', 1)">›</button>
    <div class="carrusel-dots">
      ${fotos.map((_, i) => `<span class="dot ${i === 0 ? "active" : ""}"></span>`).join("")}
    </div>
  ` : "";

  return `
    <div class="modal-item">
      <div class="carrusel" id="${carruselId}" data-indice="0" data-total="${fotos.length}">
        ${slides}
        ${controles}
      </div>
      <div class="modal-item-info">
        <h4>${variante.nombre}</h4>
        <p>${variante.descripcion}</p>
        <div class="modal-item-footer">
          <span class="precio">$${precio}</span>
          <a href="https://wa.me/${WHATSAPP}?text=${mensaje}" target="_blank" class="btn-whatsapp-small">
            📲 Pedir
          </a>
        </div>
      </div>
    </div>
  `;
}

// ===== CARRUSEL =====
function moverCarrusel(id, direccion) {
  const carrusel = document.getElementById(id);
  const total = Number(carrusel.dataset.total);
  let indice = Number(carrusel.dataset.indice);

  indice = (indice + direccion + total) % total;
  carrusel.dataset.indice = indice;

  carrusel.querySelectorAll(".carrusel-img").forEach((img, i) => {
    img.classList.toggle("active", i === indice);
  });
  carrusel.querySelectorAll(".dot").forEach((dot, i) => {
    dot.classList.toggle("active", i === indice);
  });
}

let lightboxFotos = [];
let lightboxIndice = 0;

function abrirLightbox(carruselId, indice, alt) {
  lightboxFotos = fotosPorCarrusel[carruselId];
  lightboxIndice = indice;
  const lb = document.getElementById("lightbox");
  document.getElementById("lightbox-img").src = lightboxFotos[indice];
  document.getElementById("lightbox-img").alt = alt;
  lb.classList.add("active");
  document.body.style.overflow = "hidden";
  actualizarLightboxControles();
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      lb.style.opacity = "1";
      lb.querySelector("img").style.transform = "scale(1)";
    });
  });
}

function actualizarLightboxControles() {
  const controles = document.getElementById("lightbox-controles");
  if (lightboxFotos.length > 1) {
    controles.style.display = "flex";
  } else {
    controles.style.display = "none";
  }
}

function moverLightbox(direccion, event) {
  event.stopPropagation();
  lightboxIndice = (lightboxIndice + direccion + lightboxFotos.length) % lightboxFotos.length;
  document.getElementById("lightbox-img").src = lightboxFotos[lightboxIndice];
}

function cerrarLightbox() {
  const lb = document.getElementById("lightbox");
  lb.style.opacity = "0";
  lb.querySelector("img").style.transform = "scale(0.85)";
  setTimeout(() => {
    lb.classList.remove("active");
    lb.style.opacity = "";
    lb.querySelector("img").style.transform = "";
    document.body.style.overflow = "";
  }, 250);
}

// ===== ABRIR MODAL =====
let variedadesGlobal = {};

function abrirModal(categoria) {
  const variantes = variedadesGlobal[categoria];
  const modal = document.getElementById("modal");
  const modalTitle = document.getElementById("modal-title");
  const modalBody = document.getElementById("modal-body");

  modalTitle.textContent = categoria.charAt(0).toUpperCase() + categoria.slice(1);
  modalBody.innerHTML = variantes.map(crearItemVariante).join("");
  modal.classList.add("active");
  document.body.classList.add("modal-open");
}

function cerrarModal() {
  document.getElementById("modal").classList.remove("active");
  document.body.classList.remove("modal-open");
}

document.getElementById("modal").addEventListener("click", function(e) {
  if (e.target === this) cerrarModal();
});

// ===== CARGAR PRODUCTOS =====
async function cargarProductos() {
  const grid = document.getElementById("producto-grid");
  try {
    const response = await fetch(SHEET_CSV_URL);
    const text = await response.text();
    const productos = parseCSV(text);

    // Separar generales y variedades
    const generales = productos.filter(p => p.tipo === "general");
    const variedades = productos.filter(p => p.tipo === "variedad");

    // Agrupar variedades por categoría
    variedadesGlobal = {};
    for (const v of variedades) {
      if (!variedadesGlobal[v.categoria]) variedadesGlobal[v.categoria] = [];
      variedadesGlobal[v.categoria].push(v);
    }

    // Renderizar cards usando los generales
    grid.innerHTML = generales
      .map(g => crearCardCategoria(g, variedadesGlobal[g.categoria] || []))
      .join("");

  } catch (error) {
    grid.innerHTML = `<p class="loading">Error cargando productos. Intentá de nuevo más tarde.</p>`;
    console.error(error);
  }
}

cargarProductos();