import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, onSnapshot, addDoc, query, orderBy, serverTimestamp, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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

// --- FUNÇÕES DE ABERTURA DO MODAL ---
window.openEntregaModal = async () => {
    document.getElementById('entregaModal').style.display = 'block';
    await carregarSelects();
};

window.closeEntregaModal = () => {
    document.getElementById('entregaModal').style.display = 'none';
};

// --- CARREGAR DADOS PARA O FORMULÁRIO ---
async function carregarSelects() {
    // 1. Carregar Condutores da coleção 'team' (ajustado para a coleção correta)
    const condSnap = await getDocs(collection(db, "team"));
    const selectCondutor = document.getElementById('entCondutor');
    selectCondutor.innerHTML = '<option value="">Selecionar Condutor...</option>';
    condSnap.forEach(doc => {
        if(doc.data().role === 'condutor') {
            selectCondutor.innerHTML += `<option value="${doc.data().name}">${doc.data().name}</option>`;
        }
    });

    // 2. Carregar Veículos
    const frotaSnap = await getDocs(collection(db, "frota"));
    const selectVeiculo = document.getElementById('entVeiculo');
    selectVeiculo.innerHTML = '<option value="">Selecionar Veículo...</option>';
    frotaSnap.forEach(doc => {
        selectVeiculo.innerHTML += `<option value="${doc.data().matricula}">${doc.data().veiculo} - ${doc.data().matricula}</option>`;
    });

    // 3. Carregar Materiais
    const stockSnap = await getDocs(collection(db, "stock"));
    const selectMaterial = document.getElementById('entMaterial');
    selectMaterial.innerHTML = '<option value="">Selecionar Material...</option>';
    stockSnap.forEach(doc => {
        selectMaterial.innerHTML += `<option value="${doc.data().name}">${doc.data().name}</option>`;
    });
}

// --- SALVAR NOVA ENCOMENDA ---
document.getElementById('entregaForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const novaEntrega = {
        cliente: document.getElementById('entCliente').value,
        localizacao: document.getElementById('entLocalizacao').value,
        dataAgendada: document.getElementById('entDataAgendada').value,
        condutor: document.getElementById('entCondutor').value,
        veiculo: document.getElementById('entVeiculo').value,
        material: document.getElementById('entMaterial').value,
        quantidade: Number(document.getElementById('entQty').value),
        estado: "Pendente",
        timestamp: serverTimestamp()
    };

    try {
        await addDoc(collection(db, "entregas"), novaEntrega);
        alert("Encomenda criada com sucesso!");
        closeEntregaModal();
        e.target.reset();
    } catch (error) {
        console.error("Erro ao criar entrega:", error);
    }
});

// --- MONITORIZAÇÃO EM TEMPO REAL ---
function monitorizarEntregas() {
    const q = query(collection(db, "entregas"), orderBy("timestamp", "desc"));
    
    onSnapshot(q, (snapshot) => {
        const tbody = document.querySelector('#monitorTable tbody');
        if(!tbody) return;

        let pendentes = 0;
        let emRota = 0;
        let concluidasHoje = 0;
        const hoje = new Date().toISOString().split('T')[0];

        tbody.innerHTML = '';

        snapshot.forEach((doc) => {
            const data = doc.data();
            const id = doc.id;

            if (data.estado === "Pendente") pendentes++;
            if (data.estado === "Em Rota") emRota++;
            if (data.estado === "Concluída" && data.dataAgendada === hoje) concluidasHoje++;

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td data-label="Data">${data.dataAgendada}</td>
                <td data-label="Cliente">${data.cliente}</td>
                <td data-label="Condutor">${data.condutor}</td>
                <td data-label="Estado">
                    <span class="badge ${getBadgeClass(data.estado)}">${data.estado}</span>
                </td>
                <td data-label="Ação">
                    <button class="btn-small" onclick="verDetalhes('${id}')">Detalhes</button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        document.getElementById('statsPendentes').innerText = pendentes;
        document.getElementById('statsRota').innerText = emRota;
        document.getElementById('statsConcluidas').innerText = concluidasHoje;
    });
}

// --- MONITORIZAÇÃO DE ESTADO DA EQUIPA (ONLINE/OFFLINE) ---
function monitorizarEquipaStatus() {
    onSnapshot(collection(db, "team"), (snapshot) => {
        // Se tiver uma secção de equipa no dashboard, ela atualiza aqui
        // Caso queira apenas atualizar uma lista simples:
        console.log("Atualização de estado da equipa detetada");
        // Aqui pode adicionar lógica para atualizar uma lista de condutores online
    });
}

function getBadgeClass(estado) {
    if (estado === "Pendente") return "badge-blue";
    if (estado === "Em Rota") return "badge-orange";
    if (estado === "Concluída") return "badge-green";
    return "";
}

// Iniciar as monitorizações
monitorizarEntregas();
monitorizarEquipaStatus();