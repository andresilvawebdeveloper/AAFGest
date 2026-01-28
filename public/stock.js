import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, deleteDoc, doc, updateDoc, query, orderBy } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// 1. Configuração do Firebase
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
const stockCollection = collection(db, "stock");

let editId = null; 

// --- 3. FUNÇÕES DO MODAL ---
window.openModal = function(id = null, name = '', cat = '', qty = '', unit = '') {
    const modal = document.getElementById('productModal');
    const title = modal.querySelector('h2');
    
    if (id && id !== 'null') { // Garantir que o ID é válido
        editId = id;
        title.innerText = "Editar Material";
        document.getElementById('pName').value = name;
        document.getElementById('pCategory').value = cat;
        document.getElementById('pQty').value = qty;
        document.getElementById('pUnit').value = unit;
    } else {
        editId = null;
        title.innerText = "Adicionar Novo Material";
        document.getElementById('productForm').reset();
    }
    modal.style.display = 'block';
}

window.closeModal = function() { 
    document.getElementById('productModal').style.display = 'none'; 
    editId = null;
}

// --- 4. GRAVAR DADOS ---
const productForm = document.getElementById('productForm');
if (productForm) {
    productForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const productData = {
            name: document.getElementById('pName').value,
            category: document.getElementById('pCategory').value,
            quantity: Number(document.getElementById('pQty').value),
            unit: document.getElementById('pUnit').value,
            lastUpdate: new Date()
        };

        try {
            if (editId) {
                await updateDoc(doc(db, "stock", editId), productData);
            } else {
                await addDoc(stockCollection, productData);
            }
            closeModal();
        } catch (error) {
            console.error("Erro ao gravar:", error);
            alert("Erro ao gravar os dados.");
        }
    });
}

// --- 5. RENDERIZAR TABELA (CORRIGIDO) ---
// Adicionamos um orderBy para a lista estar sempre organizada por nome
const q = query(stockCollection, orderBy("name", "asc"));

onSnapshot(q, (snapshot) => {
    const tableBody = document.getElementById('stockTableBody'); // Usar o ID que pusemos no HTML
    if (!tableBody) return;

    let content = ''; 
    let lowStockCount = 0; 

    snapshot.forEach((docSnap) => {
        const item = docSnap.data();
        const id = docSnap.id;
        
        if (item.quantity <= 20) lowStockCount++;

        let badgeClass = 'badge-green';
        let statusText = 'OK';
        
        if (item.quantity <= 5) {
            badgeClass = 'badge-red';
            statusText = 'Crítico';
        } else if (item.quantity <= 20) {
            badgeClass = 'badge-orange';
            statusText = 'Baixo';
        }

        // Construir a string de uma vez só é mais rápido
        content += `
            <tr>
                <td data-label="Material"><strong>${item.name}</strong></td>
                <td data-label="Categoria">${item.category}</td>
                <td data-label="Quantidade">${item.quantity}</td>
                <td data-label="Unidade">${item.unit}</td>
                <td data-label="Estado"><span class="badge ${badgeClass}">${statusText}</span></td>
                <td>
                    <button class="btn-edit" onclick="openModal('${id}', '${item.name}', '${item.category}', '${item.quantity}', '${item.unit}')">
                        <i class='bx bx-edit-alt'></i>
                    </button>
                    <button class="btn-delete" onclick="deleteProduct('${id}')" style="color: #ef4444; border:none; background:none; cursor:pointer; margin-left:10px;">
                        <i class='bx bx-trash'></i>
                    </button>
                </td>
            </tr>
        `;
    });

    tableBody.innerHTML = content;

    // Atualizar Banner de Alerta (Se existir a div .stock-alerts no HTML)
    const alertSection = document.querySelector('.stock-alerts');
    if (alertSection) {
        if (lowStockCount > 0) {
            alertSection.style.display = 'block';
            alertSection.innerHTML = `
                <div class="alert-banner">
                    <i class='bx bxs-error-circle'></i>
                    <span><strong>Atenção:</strong> Existem ${lowStockCount} produtos com stock baixo.</span>
                </div>
            `;
        } else {
            alertSection.style.display = 'none';
        }
    }
});

// --- 6. REMOVER PRODUTO ---
window.deleteProduct = async function(id) {
    if (confirm("Deseja eliminar este material?")) {
        try {
            await deleteDoc(doc(db, "stock", id));
        } catch (error) {
            console.error("Erro ao remover:", error);
        }
    }
};

// --- 9. EXPORTAR PARA PDF ---
window.exportStockPDF = function() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text("AAFGest - Inventário de Materiais", 14, 20);
    
    doc.setFontSize(11);
    doc.setTextColor(100);
    const dataAtual = new Date().toLocaleDateString('pt-PT');
    doc.text(`Relatório gerado em: ${dataAtual}`, 14, 28);

    doc.autoTable({
        html: '.admin-table',
        startY: 35,
        // Ignorar a coluna de Ações (índice 5)
        columns: [0, 1, 2, 3, 4], 
        headStyles: { fillColor: [37, 99, 235] },
        theme: 'striped'
    });

    doc.save(`Inventario_AAFGest_${dataAtual}.pdf`);
};