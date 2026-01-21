import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, query, where, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyDFYV9IwOKD7w-Sj89glA80DuratJqZ1zc",
    authDomain: "aafgest.firebaseapp.com",
    projectId: "aafgest",
    storageBucket: "aafgest.firebasestorage.app",
    messagingSenderId: "406052783734",
    appId: "1:406052783734:web:f0f25e7661d9d614124157"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// --- FUNÇÕES DO MODAL ---
window.openEntregaModal = () => document.getElementById('entregaModal').style.display = 'block';
window.closeEntregaModal = () => document.getElementById('entregaModal').style.display = 'none';

// --- PREENCHER SELECTS AUTOMATICAMENTE ---
function inicializarFormulario() {
    // 1. Carregar Veículos da coleção 'prazos'
    onSnapshot(collection(db, "prazos"), (snapshot) => {
        const select = document.getElementById('entVeiculo');
        select.innerHTML = '<option value="">Selecione o Veículo</option>';
        snapshot.forEach(d => select.innerHTML += `<option value="${d.data().desc}">${d.data().desc}</option>`);
    });

    // 2. Carregar Condutores da coleção 'team'
    const q = query(collection(db, "team"), where("role", "==", "Condutor"));
    onSnapshot(q, (snapshot) => {
        const select = document.getElementById('entCondutor');
        select.innerHTML = '<option value="">Selecione o Condutor</option>';
        snapshot.forEach(d => select.innerHTML += `<option value="${d.data().name}">${d.data().name}</option>`);
    });

    // 3. Carregar Stock
    onSnapshot(collection(db, "stock"), (snapshot) => {
        const select = document.getElementById('entMaterial');
        select.innerHTML = '<option value="">Selecione o Material</option>';
        snapshot.forEach(d => select.innerHTML += `<option value="${d.data().name}">${d.data().name} (${d.data().quantity})</option>`);
    });
}
inicializarFormulario();

// --- GRAVAR NOVA ENTREGA ---
document.getElementById('entregaForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const novaEntrega = {
        cliente: document.getElementById('entCliente').value,
        dataAgendada: document.getElementById('entDataAgendada').value,
        veiculo: document.getElementById('entVeiculo').value,
        condutor: document.getElementById('entCondutor').value,
        material: document.getElementById('entMaterial').value,
        quantidade: document.getElementById('entQty').value,
        estado: "Pendente",
        timestamp: new Date()
    };
    try {
        await addDoc(collection(db, "entregas"), novaEntrega);
        closeEntregaModal();
        e.target.reset();
    } catch (err) { console.error(err); }
});

// --- RENDERIZAR TABELA COM FILTROS ---
onSnapshot(collection(db, "entregas"), (snapshot) => {
    const tbody = document.querySelector('#entregasTable tbody');
    tbody.innerHTML = '';
    snapshot.forEach(docSnap => {
        const en = docSnap.data();
        const dataFormatada = en.dataAgendada.split('-').reverse().join('/');
        
        tbody.innerHTML += `
            <tr data-agendada="${en.dataAgendada}">
                <td><strong>${en.cliente}</strong><br><small><i class='bx bx-calendar'></i> ${dataFormatada}</small></td>
                <td>${en.condutor}<br><small><i class='bx bx-car'></i> ${en.veiculo}</small></td>
                <td>${en.material}</td>
                <td>${en.quantidade}</td>
                <td><span class="badge ${en.estado === 'Pendente' ? 'badge-orange' : 'badge-green'}">${en.estado}</span></td>
                <td><button class="btn-delete" onclick="eliminarEntrega('${docSnap.id}')"><i class='bx bx-trash'></i></button></td>
            </tr>
        `;
    });
});

// --- FUNÇÕES DE FILTRO E PESQUISA ---
window.filtrarEntregas = function(periodo, btn) {
    document.querySelectorAll('.btn-filter').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    const hoje = new Date().toISOString().split('T')[0];
    const amanha = new Date(); amanha.setDate(amanha.getDate() + 1);
    const amanhaStr = amanha.toISOString().split('T')[0];

    document.querySelectorAll('#entregasTable tbody tr').forEach(row => {
        const data = row.getAttribute('data-agendada');
        if (periodo === 'todas') row.style.display = "";
        else if (periodo === 'hoje') row.style.display = (data === hoje) ? "" : "none";
        else if (periodo === 'amanha') row.style.display = (data === amanhaStr) ? "" : "none";
    });
};

window.eliminarEntrega = async (id) => {
    if(confirm("Eliminar este agendamento?")) await deleteDoc(doc(db, "entregas", id));
}