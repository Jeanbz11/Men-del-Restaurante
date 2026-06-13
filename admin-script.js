import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getFirestore, collection, query, where, getDocs, orderBy, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

const firebaseConfig = {
    // PEGA AQUÍ TU MISMO BLOQUE DE CONFIGURACIÓN DE FIREBASE
    apiKey: "AIzaSyABS_dDTMu7mvUioUwqFMNOlNy7JsiWp0c",
    authDomain: "sistema-pedidos-restaurantes.firebaseapp.com",
    projectId: "sistema-pedidos-restaurantes",
    storageBucket: "sistema-pedidos-restaurantes.firebasestorage.app",
    messagingSenderId: "56931323022",
    appId: "1:56931323022:web:312bf9658f91f407e24ddf"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function loadDailySales() {
    const params = new URLSearchParams(window.location.search);
    const localId = params.get('local');
    if (!localId) return alert("Falta el local en la URL");

    document.getElementById('today-date').textContent = new Date().toLocaleDateString();

    try {
        // 1. Obtener nombre del local
        const restDoc = await getDoc(doc(db, "restaurantes", localId));
        if (restDoc.exists()) {
            document.getElementById('admin-title').textContent = `Diario: ${restDoc.data().nombre}`;
        }

        // 2. Definir el rango de tiempo de "HOY" (desde las 00:00:00)
        const startOfDay = new Date();
        startOfDay.setHours(0,0,0,0);

        // 3. Consultar pedidos en Firebase
        const q = query(
            collection(db, `restaurantes/${localId}/pedidos`),
            where("fechaEnvio", ">=", startOfDay),
            orderBy("fechaEnvio", "desc")
        );

        const snapshot = await getDocs(q);
        let totalDaily = 0;
        let countDaily = 0;
        const tableBody = document.getElementById('sales-table-body');
        tableBody.innerHTML = '';

        snapshot.forEach(docSnap => {
            const pedido = docSnap.data();
            totalDaily += pedido.total;
            countDaily++;

            const hora = pedido.fechaEnvio?.toDate().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) || '--:--';
            
            const row = `
                <tr class="hover:bg-gray-50">
                    <td class="p-4 text-gray-500">${hora}</td>
                    <td class="p-4 font-bold text-blue-600">Mesa ${pedido.mesa}</td>
                    <td class="p-4 text-gray-600 text-xs">${pedido.productos.map(p => `${p.quantity}x ${p.name}`).join(', ')}</td>
                    <td class="p-4 text-right font-bold">$${pedido.total.toFixed(2)}</td>
                </tr>
            `;
            tableBody.innerHTML += row;
        });

        // 4. Actualizar Dashboard
        document.getElementById('total-today').textContent = `$${totalDaily.toFixed(2)}`;
        document.getElementById('count-today').textContent = countDaily;
        const avg = countDaily > 0 ? totalDaily / countDaily : 0;
        document.getElementById('avg-today').textContent = `$${avg.toFixed(2)}`;

    } catch (error) {
        console.error(error);
        alert("Error al cargar ventas. ¿Revisaste tus índices en Firebase?");
    }
}

loadDailySales();