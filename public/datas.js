import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// 1. Configuração do Firebase
const firebaseConfig = {
    apiKey: "AIzaSyDFYV9IwOKD7w-Sj89glA80DuratJqZ1zc",
    authDomain: "aafgest.firebaseapp.com",
    projectId: "aafgest",
    storageBucket: "aafgest.firebasestorage.app",
    messagingSenderId: "406052783734",
    appId: "1:406052783734:web:f0f25e7661d9d614124157"
};

// 2. Inicialização
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const datesCollection = collection(db, "prazos");

// --- 3. CONTROLO DO MODAL ---
window.openDateModal = () => {
    document.getElementById('dateModal').style.display = 'block';
};

window.closeDateModal = () => {
    document.getElementById('dateModal').style.display = 'none';
};

// --- 4. GUARDAR VEÍCULO / PRAZO ---
const dateForm = document.getElementById('dateForm');
if (dateForm) {
    dateForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const newDate = {
            desc: document.getElementById('dDesc').value.toUpperCase(), // Guarda a matrícula sempre em maiúsculas
            date: document.getElementById('dDate').value,
            type: document.getElementById('dType').value,
            reminderDays: Number(document.getElementById('dReminder').value),
            createdAt: new Date().toISOString()
        };

        try {
            await addDoc(datesCollection, newDate);
            closeDateModal();
            dateForm.reset();
        } catch (error) {
            console.error("Erro ao guardar na frota:", error);
            alert("Erro ao guardar os dados.");
        }
    });
}

// --- 5. RENDERIZAR TABELA DE FROTA EM TEMPO REAL ---
onSnapshot(datesCollection, (snapshot) => {
    const tableBody = document.querySelector('#prazosTable tbody');
    if (!tableBody) return;

    tableBody.innerHTML = '';
    const hoje = new Date();

    snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        const id = docSnap.id;
        const dataLimite = new Date(d.date);
        
        // Cálculo de dias restantes
        const diffTime = dataLimite - hoje;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        let badgeClass = 'badge-green';
        let statusText = 'Em Dia';

        if (diffDays < 0) {
            badgeClass = 'badge-red';
            statusText = `EXPIRADO (${Math.abs(diffDays)}d)`;
        } else if (diffDays <= d.reminderDays) {
            badgeClass = 'badge-orange';
            statusText = `Vence em ${diffDays}d`;
        }

        // Formatação da data para o padrão PT
        const dataPT = d.date.split('-').reverse().join('/');

        const row = `
            <tr>
                <td><strong><i class='bx bxs-truck'></i> ${d.desc}</strong></td>
                <td>${dataPT}</td>
                <td>${d.type}</td>
                <td>${d.reminderDays} dias antes</td>
                <td><span class="badge ${badgeClass}">${statusText}</span></td>
                <td>
                    <button class="btn-delete" onclick="deleteDate('${id}')">
                        <i class='bx bx-trash'></i>
                    </button>
                </td>
            </tr>
        `;
        tableBody.innerHTML += row;
    });
});

// --- 6. REMOVER VEÍCULO DA FROTA ---
window.deleteDate = async (id) => {
    if (confirm("Tens a certeza que queres remover este veículo/prazo da frota?")) {
        try {
            await deleteDoc(doc(db, "prazos", id));
        } catch (error) {
            console.error("Erro ao remover:", error);
        }
    }
};

// --- 7. EXPORTAR RELATÓRIO PDF ---
window.exportPrazosPDF = function() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const dataAtual = new Date().toLocaleDateString('pt-PT');

    doc.setFontSize(18);
    doc.text("AAFGest - Relatório de Frota e Prazos", 14, 20);
    
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Gerado em: ${dataAtual}`, 14, 28);

    doc.autoTable({
        html: '#prazosTable',
        startY: 35,
        columns: [0, 1, 2, 3, 4], // Ignora a coluna de ações
        headStyles: { fillColor: [30, 41, 59] }, // Cor ardósia escura
        theme: 'striped'
    });

    doc.save(`Relatorio_Frota_AAFGest_${dataAtual}.pdf`);
};