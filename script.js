import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getFirestore, collection, onSnapshot, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

// 1. Configuración de tu Firebase
const firebaseConfig = {
    apiKey: "AIzaSyABS_dDTMu7mvUioUwqFMNOlNy7JsiWp0c",
    authDomain: "sistema-pedidos-restaurantes.firebaseapp.com",
    projectId: "sistema-pedidos-restaurantes",
    storageBucket: "sistema-pedidos-restaurantes.firebasestorage.app",
    messagingSenderId: "56931323022",
    appId: "1:56931323022:web:312bf9658f91f407e24ddf"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 2. Estado de la Aplicación
const urlParams = new URLSearchParams(window.location.search);
const idRestaurante = urlParams.get('local') || 'restaurante-Alexita';

let todosLosProductos = [];
let categoriaActual = 'all';
let carrito = JSON.parse(localStorage.getItem('carrito')) || [];

// Elementos de la interfaz
const productsGrid = document.getElementById('products-grid');
const restaurantNameHeader = document.getElementById('restaurant-name');
const categoryButtons = document.querySelectorAll('.category-btn');

// 3. Traer el nombre del restaurante
async function cargarNombreRestaurante() {
    try {
        const docRef = doc(db, "restaurantes", idRestaurante);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && restaurantNameHeader) {
            restaurantNameHeader.textContent = docSnap.data().nombre;
        }
    } catch (e) {
        console.error("Error al traer nombre:", e);
    }
}

// 4. Escuchar base de datos en tiempo real
function escucharMenuFirebase() {
    const menuRef = collection(db, `restaurantes/${idRestaurante}/menu`);

    onSnapshot(menuRef, (snapshot) => {
        todosLosProductos = [];
        snapshot.forEach((doc) => {
            todosLosProductos.push({ docId: doc.id, ...doc.data() });
        });

        todosLosProductos.sort((a, b) => a.id - b.id);
        renderizarTarjetas();
    }, (error) => {
        console.error("Error al escuchar menú:", error);
    });
}

// 5. Renderizar los platos en las columnas
function renderizarTarjetas() {
    if (!productsGrid) return;
    productsGrid.innerHTML = '';

    const productosFiltrados = todosLosProductos.filter(plato => {
        return categoriaActual === 'all' || plato.category.trim() === categoriaActual.trim();
    });

    if (productosFiltrados.length === 0) {
        productsGrid.innerHTML = `<div class="col-span-full text-center py-8 text-gray-400">No hay platos en esta sección.</div>`;
        return;
    }

    productosFiltrados.forEach(plato => {
        productsGrid.innerHTML += `
            <div class="bg-gray-50 border border-gray-100 rounded-xl p-3 flex flex-col justify-between shadow-sm">
                <div>
                    <img src="${plato.image || 'https://via.placeholder.com/150'}" onerror="this.src='https://via.placeholder.com/150'" class="w-full h-32 object-cover rounded-lg mb-2 shadow-inner">
                    <h3 class="font-bold text-gray-800 text-sm leading-tight">${plato.name}</h3>
                    <p class="text-[11px] text-gray-400 capitalize mt-0.5"><i class="fas fa-tag mr-1 text-[9px]"></i>${plato.category}</p>
                </div>
                <div class="flex items-center justify-between mt-3 pt-2 border-t border-gray-100">
                    <span class="font-extrabold text-gray-900 text-base">$${Number(plato.price).toFixed(2)}</span>
                    <button onclick="agregarAlCarrito('${plato.docId}', '${plato.name}', ${plato.price})" class="bg-blue-600 hover:bg-blue-700 text-white font-bold p-1 px-3 rounded-lg text-xs flex items-center gap-1 cursor-pointer">
                        <i class="fas fa-plus text-[9px]"></i> Pedir
                    </button>
                </div>
            </div>
        `;
    });
}

// 6. Eventos de los botones de las categorías
categoryButtons.forEach(boton => {
    boton.addEventListener('click', (e) => {
        const btn = e.target.closest('.category-btn');
        if (!btn) return;
        const cat = btn.getAttribute('data-category');
        categoriaActual = (categoriaActual === cat) ? 'all' : cat;
        renderizarTarjetas();
    });
});

// ========================================================
// 7. INTERRUPTORES GLOBALES PARA EL CARRITO
// ========================================================
window.agregarAlCarrito = function(docId, name, price) {
    const itemExistente = carrito.find(item => item.id === docId);
    if (itemExistente) {
        itemExistente.cantidad++;
    } else {
        carrito.push({ id: docId, name: name, price: Number(price), cantidad: 1 });
    }
    localStorage.setItem('carrito', JSON.stringify(carrito));
    actualizarInterfazCarrito();
};

window.eliminarDelCarrito = function(docId) {
    carrito = carrito.filter(item => item.id !== docId);
    localStorage.setItem('carrito', JSON.stringify(carrito));
    actualizarInterfazCarrito();
};

function actualizarInterfazCarrito() {
    const cartItemsContainer = document.getElementById('cart-items');
    const subtotalElement = document.getElementById('subtotal');
    if (!cartItemsContainer || !subtotalElement) return;

    cartItemsContainer.innerHTML = '';
    let totalAcumulado = 0;

    if (carrito.length === 0) {
        cartItemsContainer.innerHTML = `<p class="text-gray-500 italic py-4 text-center" id="empty-cart-message">No hay items en el pedido</p>`;
        subtotalElement.textContent = '$0.00';
        return;
    }

    carrito.forEach(item => {
        const costoItem = item.price * item.cantidad;
        totalAcumulado += costoItem;
        cartItemsContainer.innerHTML += `
            <div class="flex justify-between items-center py-2 border-b border-gray-100">
                <div>
                    <h4 class="font-medium text-sm text-gray-800">${item.name}</h4>
                    <p class="text-xs text-gray-400">${item.cantidad}x $${Number(item.price).toFixed(2)}</p>
                </div>
                <div class="flex items-center gap-2">
                    <span class="text-sm font-bold text-gray-700">$${costoItem.toFixed(2)}</span>
                    <button onclick="eliminarDelCarrito('${item.id}')" class="text-red-500 hover:text-red-700 p-1 cursor-pointer">
                        <i class="fas fa-trash text-xs"></i>
                    </button>
                </div>
            </div>
        `;
    });
    subtotalElement.textContent = `$${totalAcumulado.toFixed(2)}`;
}

const btnClearCart = document.getElementById('clear-cart');
if (btnClearCart) {
    btnClearCart.addEventListener('click', () => {
        carrito = [];
        localStorage.removeItem('carrito');
        actualizarInterfazCarrito();
    });
}

// ========================================================
// 8. 🖨️ CONEXIÓN Y LOGICA DE IMPRESIÓN DIRECTA
// ========================================================
const btnSendOrder = document.getElementById('send-order');
const selectMesa = document.getElementById('table-number');
const ticketContenedor = document.getElementById('ticket-impresion');

if (btnSendOrder) {
    btnSendOrder.addEventListener('click', () => {
        if (carrito.length === 0) {
            alert("⚠️ Tu carrito está vacío.");
            return;
        }

        const numeroMesa = selectMesa ? selectMesa.value : '';
        if (!numeroMesa) {
            alert("⚠️ Selecciona el número de mesa.");
            return;
        }

        const nombreLocal = restaurantNameHeader ? restaurantNameHeader.textContent : 'Restaurante';
        const fechaHora = new Date().toLocaleString();

        // Estructurar el HTML plano simulando el ticket físico antiguo
        let htmlTicket = `
            <div style="text-align: center; margin-bottom: 10px;">
                <h3 style="margin: 0; font-size: 14px; font-weight: bold;">${nombreLocal.toUpperCase()}</h3>
                <p style="margin: 2px 0; font-size: 11px;">*** Impresión de ticket ***</p>
                <p style="margin: 2px 0; font-size: 11px;">${fechaHora}</p>
                <h2 style="margin: 5px 0; font-size: 18px; font-weight: bold; border-top: 1px dashed #000; border-bottom: 1px dashed #bc0909; padding: 3px 0;">MESA: ${numeroMesa}</h2>
            </div>
            <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
                <thead>
                    <tr style="border-bottom: 1px solid #000;">
                        <th style="text-align: left; width: 15%;">CANT</th>
                        <th style="text-align: left; width: 60%;">DESCRIPCIÓN</th>
                        <th style="text-align: right; width: 25%;">TOTAL</th>
                    </tr>
                </thead>
                <tbody>
        `;

        let totalCuenta = 0;
        carrito.forEach(item => {
            const subtotalItem = item.price * item.cantidad;
            totalCuenta += subtotalItem;
            htmlTicket += `
                <tr>
                    <td style="padding: 3px 0; font-weight: bold;">${item.cantidad}x</td>
                    <td style="padding: 3px 0;">${item.name}</td>
                    <td style="padding: 3px 0; text-align: right;">$${subtotalItem.toFixed(2)}</td>
                </tr>
            `;
        });

        htmlTicket += `
                </tbody>
            </table>
            <div style="border-top: 1px dashed #000; margin-top: 8px; padding-top: 5px; text-align: right; font-size: 13px; font-weight: bold;">
                TOTAL COMPRA: $${totalCuenta.toFixed(2)}
            </div>
            <div style="text-align: center; margin-top: 15px; font-size: 10px;">
                ----------------------------<br>
                Generado por Sistema Ventas JPBB
                Cualquier consulta, contáctanos al WhatsApp: 0968902919
            </div>
        `;

        // Llenar el contenedor invisible e invocar la impresión del sistema operativo
        ticketContenedor.innerHTML = htmlTicket;
        
        // Ejecutar impresión nativa
        window.print();

        // Limpieza automática
        carrito = [];
        localStorage.removeItem('carrito');
        actualizarInterfazCarrito();
        if (selectMesa) selectMesa.value = '';
    });
}

// Inicialización de arranque
document.addEventListener('DOMContentLoaded', () => {
    cargarNombreRestaurante();
    escucharMenuFirebase();
    actualizarInterfazCarrito();
});