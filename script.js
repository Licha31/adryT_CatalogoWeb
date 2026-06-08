// ===== CONFIGURACIÓN =====
const SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQGf0lwuT50XetPllLnXTwAolc4HKlJcTLJcWAsyVLZQ85JTZnZ8augLLATB-c3Ke4Kildour8C2T4X/pub?output=csv";
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

// ===== AGRUPAR POR CATEGORÍA =====
function agruparPorCategoria(productos) {
  const grupos = {};
  for (const p of productos) {
    const cat = p.categoria || "otros";
    if (!grupos[cat]) grupos[cat] = [];
    grupos[cat].push(p);
  }
  return grupos;
}

// ===== CREAR CARD DE CATEGORÍA =====
function crearCardCategoria(categoria, variantes) {
  const primera = variantes[0];
  const precioDesde = Math.min(...variantes.map(v => Number(v.precio)));
  return `
    <div class="card" onclick="abrirModal('${categoria}')">
      <img src="${primera.imagen_url}" alt="${categoria}" 
           onerror="this.src='https://via.placeholder.com/400x200?text=Sin+imagen'" />
      <div class="card-body">
        <h3>${categoria.charAt(0).toUpperCase() + categoria.slice(1)}</h3>
        <p>${variantes.length} variedad${variantes.length > 1 ? 'es' : ''} disponible${variantes.length > 1 ? 's' : ''}</p>
        <span class="precio">Desde $${precioDesde.toLocaleString("es-AR")}</span>
      </div>
    </div>
  `;
}

// ===== CREAR ITEM DE VARIANTE EN MODAL =====
function crearItemVariante(variante) {
  const precio = Number(variante.precio).toLocaleString("es-AR");
  const mensaje = encodeURIComponent(`Hola! Me gustaria encargar: ${variante.nombre}`);
  return `
    <div class="modal-item">
      <img src="${variante.imagen_url}" alt="${variante.nombre}"
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

// ===== ABRIR MODAL =====
let gruposGlobal = {};

function abrirModal(categoria) {
  const variantes = gruposGlobal[categoria];
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

// Cerrar al hacer click fuera
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
    gruposGlobal = agruparPorCategoria(productos);
    grid.innerHTML = Object.entries(gruposGlobal)
      .map(([cat, variantes]) => crearCardCategoria(cat, variantes))
      .join("");
  } catch (error) {
    grid.innerHTML = `<p class="loading">Error cargando productos. Intentá de nuevo más tarde.</p>`;
    console.error(error);
  }
}

cargarProductos();