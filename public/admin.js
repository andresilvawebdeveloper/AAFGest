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
    template.querySelector('.item-qty').value = ''; // Limpa a quantidade
    container.appendChild(template);
};

window.removerLinha = (btn) => {
    const container = document.getElementById('itensContainer');
    if (container.children.length > 1) {
        btn.closest('.item-row').remove();
    }
};

// --- 2. ABERTURA E CARREGAMENTO DO MODAL ---
window.openEntregaModal = async () => {
    document.getElementById('entregaModal').style.display = 'block';
    await carregarDadosIniciais();
};

window.closeEntregaModal = () => document.getElementById('entregaModal').style.display = 'none';

async function carregarDadosIniciais() {
    // Carregar Materiais para os selects (incluindo os novos criados dinamicamente)
    const stockSnap = await getDocs(collection(db, "stock"));
    const options = ['<option value="">Selecionar Material...</option>'];
    stockSnap.forEach(doc => options.push(`<option value="${doc.data().name}">${doc.data().name}</option>`));
    
    document.querySelectorAll('.item-material').forEach(select => {
        select.innerHTML = options.join('');
    });

    // Carregar Condutores para o Modal de Atribuição
    const teamSnap = await getDocs(query(collection(db, "team"), where("role", "==", "condutor")));
    const selectCondutor = document.getElementById('assignCondutor');
    selectCondutor.innerHTML = '<option value="">Selecionar...</option>';
    teamSnap.forEach(d => selectCondutor.innerHTML += `<option value="${d.data().name}">${d.data().name}</option>`);

    // Carregar Veículos para o Modal de Atribuição
    const frotaSnap = await getDocs(collection(db, "frota"));
    const selectVeiculo = document.getElementById('assignVeiculo');
    selectVeiculo.innerHTML = '<option value="">Selecionar...</option>';
    frotaSnap.forEach(d => selectVeiculo.innerHTML += `<option value="${d.data().matricula}">${d.data().veiculo} - ${d.data().matricula}</option>`);
}

// --- 3. SALVAR ENCOMENDA (ESTADO INICIAL: PLANEAMENTO) ---
document.getElementById('entregaForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Recolher todos os itens do formulário
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
        estado: "Planeamento", // Não aparece no condutor ainda
        timestamp: serverTimestamp()
    };

    try {
        await addDoc(collection(db, "entregas"), novaEncomenda);
        alert("Encomenda planeada com sucesso!");
        closeEntregaModal();
        e.target.reset();
    } catch (error) { console.error("Erro:", error); }
});

// --- 4. MONITORIZAÇÃO DAS DUAS TABELAS (PLANEAMENTO E LOGÍSTICA) ---
function monitorizarSistema() {
    const q = query(collection(db, "entregas"), orderBy("timestamp", "desc"));
    
    onSnapshot(q, (snapshot) => {
        const ordersBody = document.getElementById('ordersBody');
        const monitorBody = document.getElementById('monitorBody');
        ordersBody.innerHTML = '';
        monitorBody.innerHTML = '';

        let pendentes = 0, emRota = 0, concluidasHoje = 0;
        const hoje = new Date().toISOString().split('T')[0];

        snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const id = docSnap.id;
            
            // Criar lista de itens para mostrar na tabela
            const listaItens = data.itens.map(i => `• ${i.quantidade} ${i.material}`).join('<br>');

            if (data.estado === "Planeamento") {
                pendentes++;
                ordersBody.innerHTML += `
                    <tr>
                        <td data-label="Data">${data.dataAgendada}</td>
                        <td data-label="Cliente">${data.cliente}</td>
                        <td data-label="Itens">${listaItens}</td>
                        <td><button class="btn-primary" onclick="abrirAtribuicao('${id}')">Enviar p/ Entrega</button></td>
                    </tr>`;
            } else {
                if (data.estado === "Em Rota") emRota++;
                if (data.estado === "Concluída" && data.dataAgendada === hoje) concluidasHoje++;

                monitorBody.innerHTML += `
                    <tr>
                        <td data-label="Cliente">${data.cliente}</td>
                        <td data-label="Logística">${data.condutor || '-'}<br><small>${data.veiculo || '-'}</small></td>
                        <td data-label="Itens">${listaItens}</td>
                        <td data-label="Estado"><span class="badge ${getBadgeClass(data.estado)}">${data.estado}</span></td>
                        <td><button class="btn-small" onclick="verDetalhes('${id}')">Ver</button></td>
                    </tr>`;
            }
        });

        document.getElementById('statsPendentes').innerText = pendentes;
        document.getElementById('statsRota').innerText = emRota;
        document.getElementById('statsConcluidas').innerText = concluidasHoje;
    });
}

// --- 5. ATRIBUIR E MOVER PARA ENTREGA ---
window.abrirAtribuicao = (id) => {
    document.getElementById('assignId').value = id;
    document.getElementById('assignModal').style.display = 'block';
    carregarDadosIniciais(); // Recarrega condutores/veículos
};

window.closeAssignModal = () => document.getElementById('assignModal').style.display = 'none';

document.getElementById('assignForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('assignId').value;
    
    await updateDoc(doc(db, "entregas", id), {
        condutor: document.getElementById('assignCondutor').value,
        veiculo: document.getElementById('assignVeiculo').value,
        estado: "Pendente" // Agora o condutor vê na App dele
    });

    closeAssignModal();
    alert("Entrega iniciada!");
});

function getBadgeClass(estado) {
    if (estado === "Pendente") return "badge-blue";
    if (estado === "Em Rota") return "badge-orange";
    if (estado === "Concluída") return "badge-green";
    return "";
}

monitorizarSistema();