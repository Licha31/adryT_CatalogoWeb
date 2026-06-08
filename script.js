// ===== CONFIGURACIÓN =====
const SHEET_CSV_URL = `https://docs.google.com/spreadsheets/d/e/2PACX-1vQGf0lwuT50XetPllLnXTwAolc4HKlJcTLJcWAsyVLZQ85JTZnZ8augLLATB-c3Ke4Kildour8C2T4X/pub?output=csv&t=${Date.now()}`;
const WHATSAPP = "5492645128012";

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
  return `
    <div class="card" onclick="abrirModal('${general.categoria}')">
      <img src="${general.imagen_url}" alt="${general.nombre}" 
           onerror="this.src='https://via.placeholder.com/400x200?text=Sin+imagen'" />
      <div class="card-body">
        <h3>${general.nombre}</h3>
        <p>${general.descripcion}</p>
        <span class="precio">Desde $${precioDesde.toLocaleString("es-AR")}</span>
      </div>
    </div>
  `;
}

// ===== CREAR ITEM DE VARIANTE EN MODAL =====
function crearItemVariante(variante) {
  const precio = Number(variante.precio).toLocaleString("es-AR");
  const mensaje = encodeURIComponent(`Hola! Me gustaria consultar por: ${variante.nombre}`);
  return `
    <div class="modal-item">
      <img src="${variante.imagen_url}" alt="${variante.nombre}"
           onclick="abrirLightbox('${variante.imagen_url}', '${variante.nombre}')"
           onerror="this.src='https://via.placeholder.com/300x200?text=Sin+imagen'" />
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

function abrirLightbox(src, alt) {
  const lb = document.getElementById("lightbox");
  document.getElementById("lightbox-img").src = src;
  document.getElementById("lightbox-img").alt = alt;
  lb.classList.add("active");
  document.body.style.overflow = "hidden";
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      lb.style.opacity = "1";
      lb.querySelector("img").style.transform = "scale(1)";
    });
  });
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
  document.body.style.overflow = "hidden";
}

function cerrarModal() {
  document.getElementById("modal").classList.remove("active");
  document.body.style.overflow = "";
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