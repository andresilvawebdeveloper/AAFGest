import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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
const datesCollection = collection(db, "prazos");

window.openDateModal = () => document.getElementById('dateModal').style.display = 'block';
window.closeDateModal = () => document.getElementById('dateModal').style.display = 'none';

document.getElementById('dateForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const newDate = {
        desc: document.getElementById('dDesc').value,
        date: document.getElementById('dDate').value,
        type: document.getElementById('dType').value,
        reminderDays: document.getElementById('dReminder').value
    };
    await addDoc(datesCollection, newDate);
    closeDateModal();
    e.target.reset();
});

onSnapshot(datesCollection, (snapshot) => {
    const tableBody = document.querySelector('#prazosTable tbody');
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
        let statusText = 'Em dia';

        if (diffDays < 0) {
            badgeClass = 'badge-red';
            statusText = 'EXPIRADO';
        } else if (diffDays <= d.reminderDays) {
            badgeClass = 'badge-orange';
            statusText = `Alerta: ${diffDays} dias`;
        }

        tableBody.innerHTML += `
            <tr>
                <td><strong>${d.desc}</strong></td>
                <td>${d.date}</td>
                <td>${d.type}</td>
                <td>${d.reminderDays} dias antes</td>
                <td><span class="badge ${badgeClass}">${statusText}</span></td>
                <td>
                    <button class="btn-delete" onclick="deleteDate('${id}')"><i class='bx bx-trash'></i></button>
                </td>
            </tr>
        `;
    });
});

window.deleteDate = async (id) => {
    if(confirm("Remover este registo?")) await deleteDoc(doc(db, "prazos", id));
}

// Exportar para PDF
window.exportPrazosPDF = function() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.text("Relatório de Prazos Operacionais - AAFGest", 14, 20);
    doc.autoTable({
        html: '#prazosTable',
        startY: 30,
        columns: [0, 1, 2, 3, 4] // Ignora coluna de ações
    });
    doc.save("Prazos_AAFGest.pdf");
}