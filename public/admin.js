import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, onSnapshot, addDoc, query, orderBy, serverTimestamp, getDocs, doc, updateDoc, where } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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

// --- 1. GESTÃO DE MÚLTIPLOS ITENS NO FORMULÁRIO ---
window.adicionarLinhaItem = () => {
    const container = document.getElementById('itensContainer');
    const template = container.firstElementChild.cloneNode(true);
    template.querySelector('.item-qty').value = ''; 
    container.appendChild(template);
};

window.removerLinha = (btn) => {
    const container = document.getElementById('itensContainer');
    if (container.children.length > 1) {
        btn.closest('.item-row').remove();
    }
};

// --- 2. MODAL DE NOVA ENCOMENDA ---
window.openEntregaModal = async () => {
    document.getElementById('entregaModal').style.display = 'block';
    await carregarMateriais();
};

window.closeEntregaModal = () => document.getElementById('entregaModal').style.display = 'none';

async function carregarMateriais() {
    try {
        const stockSnap = await getDocs(collection(db, "stock"));
        const options = ['<option value="">Selecionar Material...</option>'];
        stockSnap.forEach(doc => options.push(`<option value="${doc.data().name}">${doc.data().name}</option>`));
        
        document.querySelectorAll('.item-material').forEach(select => {
            select.innerHTML = options.join('');
        });
    } catch (err) { console.error("Erro ao carregar stock:", err); }
}

// --- 3. MODAL DE ATRIBUIÇÃO (LOGÍSTICA) ---
window.abrirAtribuicao = async (id) => {
    document.getElementById('assignId').value = id;
    document.getElementById('assignModal').style.display = 'block';
    await carregarDadosLogistica();
};

window.closeAssignModal = () => document.getElementById('assignModal').style.display = 'none';

async function carregarDadosLogistica() {
    try {
        // Carregar Condutores
        const teamSnap = await getDocs(query(collection(db, "team"), where("role", "==", "condutor")));
        const selectCondutor = document.getElementById('assignCondutor');
        selectCondutor.innerHTML = '<option value="">Selecionar Condutor...</option>';
        teamSnap.forEach(d => {
            selectCondutor.innerHTML += `<option value="${d.data().name}">${d.data().name}</option>`;
        });

        // Carregar Veículos
        const frotaSnap = await getDocs(collection(db, "frota"));
        const selectVeiculo = document.getElementById('assignVeiculo');
        selectVeiculo.innerHTML = '<option value="">Selecionar Veículo...</option>';
        frotaSnap.forEach(d => {
            const v = d.data();
            selectVeiculo.innerHTML += `<option value="${v.matricula}">${v.veiculo} - ${v.matricula}</option>`;
        });
    } catch (err) { console.error("Erro ao carregar logística:", err); }
}

// --- 4. GRAVAR ENCOMENDA (ESTADO: PLANEAMENTO) ---
document.getElementById('entregaForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const itens = [];
    document.querySelectorAll('.item-row').forEach(row => {
        itens.push({
            material: row.querySelector('.item-material').value,
            quantidade: Number(row.querySelector('.item-qty').value)
        });
    });

    const novaEncomenda = {
        cliente: document.getElementById('entCliente').value,
        localizacao: document.getElementById('entLocalizacao').value,
        dataAgendada: document.getElementById('entDataAgendada').value,
        itens: itens,
        estado: "Planeamento",
        timestamp: serverTimestamp()
    };

    try {
        await addDoc(collection(db, "entregas"), novaEncomenda);
        alert("Encomenda planeada com sucesso!");
        closeEntregaModal();
        e.target.reset();
    } catch (error) { console.error("Erro ao criar:", error); }
});

// --- 5. SUBMETER ATRIBUIÇÃO (MOVER PARA ENTREGA) ---
document.getElementById('assignForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('assignId').value;
    
    try {
        await updateDoc(doc(db, "entregas", id), {
            condutor: document.getElementById('assignCondutor').value,
            veiculo: document.getElementById('assignVeiculo').value,
            estado: "Pendente"
        });
        closeAssignModal();
        alert("Entrega iniciada!");
    } catch (err) { console.error("Erro ao atribuir:", err); }
});

// --- 6. MONITORIZAÇÃO DAS TABELAS ---
function monitorizarSistema() {
    const q = query(collection(db, "entregas"), orderBy("timestamp", "desc"));
    
    onSnapshot(q, (snapshot) => {
        const ordersBody = document.getElementById('ordersBody');
        const monitorBody = document.getElementById('monitorBody');
        if(!ordersBody || !monitorBody) return;

        ordersBody.innerHTML = '';
        monitorBody.innerHTML = '';

        let pendentes = 0, emRota = 0, concluidasHoje = 0;
        const hoje = new Date().toISOString().split('T')[0];

        snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const id = docSnap.id;
            const listaItens = data.itens.map(i => `• ${i.quantidade} ${i.material}`).join('<br>');

            if (data.estado === "Planeamento") {
                pendentes++;
                ordersBody.innerHTML += `
                    <tr>
                        <td>${data.dataAgendada}</td>
                        <td>${data.cliente}</td>
                        <td>${listaItens}</td>
                        <td><button class="btn-primary" onclick="abrirAtribuicao('${id}')">Enviar p/ Entrega</button></td>
                    </tr>`;
            } else {
                if (data.estado === "Em Rota") emRota++;
                if (data.estado === "Concluída" && data.dataAgendada === hoje) concluidasHoje++;

                monitorBody.innerHTML += `
                    <tr>
                        <td>${data.cliente}</td>
                        <td>${data.condutor || '-'}<br><small>${data.veiculo || '-'}</small></td>
                        <td>${listaItens}</td>
                        <td><span class="badge ${getBadgeClass(data.estado)}">${data.estado}</span></td>
                        <td><button class="btn-small" onclick="verDetalhes('${id}')">Detalhes</button></td>
                    </tr>`;
            }
        });

        document.getElementById('statsPendentes').innerText = pendentes;
        document.getElementById('statsRota').innerText = emRota;
        document.getElementById('statsConcluidas').innerText = concluidasHoje;
    });
}

function getBadgeClass(estado) {
    if (estado === "Pendente") return "badge-blue";
    if (estado === "Em Rota") return "badge-orange";
    if (estado === "Concluída") return "badge-green";
    return "";
}

// Iniciar sistema
monitorizarSistema();