import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, deleteDoc, doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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
const stockCollection = collection(db, "stock");

let editId = null; 

// --- 3. FUNÇÕES DO MODAL ---
window.openModal = function(id = null, name = '', cat = '', qty = '', unit = '') {
    const modal = document.getElementById('productModal');
    const title = modal.querySelector('h2');
    
    if (id) {
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

// --- 4. GRAVAR DADOS (ADICIONAR OU ATUALIZAR) ---
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

// --- 5. RENDERIZAR TABELA E ALERTAS EM TEMPO REAL ---
onSnapshot(stockCollection, (snapshot) => {
    const tableBody = document.querySelector('.admin-table tbody');
    const alertSection = document.querySelector('.stock-alerts');
    
    tableBody.innerHTML = ''; 
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

        const row = `
            <tr>
                <td><strong>${item.name}</strong></td>
                <td>${item.category}</td>
                <td>${item.quantity}</td>
                <td>${item.unit}</td>
                <td><span class="badge ${badgeClass}">${statusText}</span></td>
                <td>
                    <button class="btn-edit" onclick="openModal('${id}', '${item.name}', '${item.category}', '${item.quantity}', '${item.unit}')">
                        <i class='bx bx-edit-alt'></i>
                    </button>
                    <button class="btn-delete" onclick="deleteProduct('${id}')">
                        <i class='bx bx-trash'></i>
                    </button>
                </td>
            </tr>
        `;
        tableBody.innerHTML += row;
    });

    // Atualizar Banner de Alerta
    if (lowStockCount > 0) {
        alertSection.style.display = 'block';
        alertSection.innerHTML = `
            <div class="alert-banner">
                <i class='bx bxs-error-circle'></i>
                <span><strong>Atenção:</strong> Existem ${lowStockCount} produtos com stock abaixo do nível de segurança.</span>
            </div>
        `;
    } else {
        alertSection.style.display = 'none';
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

// --- 7. PESQUISA EM TEMPO REAL ---
const searchInput = document.querySelector('.search-box input');
if (searchInput) {
    searchInput.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        const rows = document.querySelectorAll('.admin-table tbody tr');

        rows.forEach(row => {
            const materialName = row.querySelector('td:first-child').innerText.toLowerCase();
            const categoryName = row.querySelector('td:nth-child(2)').innerText.toLowerCase();

            if (materialName.includes(term) || categoryName.includes(term)) {
                row.style.display = "";
            } else {
                row.style.display = "none";
            }
        });
    });
}// --- 9. EXPORTAR PARA PDF ---
window.exportStockPDF = function() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Título do Documento
    doc.setFontSize(18);
    doc.text("AAFGest - Inventário de Materiais", 14, 20);
    
    doc.setFontSize(11);
    doc.setTextColor(100);
    const dataAtual = new Date().toLocaleDateString('pt-PT');
    doc.text(`Relatório gerado em: ${dataAtual}`, 14, 28);

    // Gerar a tabela a partir do HTML
    // Ignoramos a última coluna (Ações) para o PDF ficar limpo
    doc.autoTable({
        html: '.admin-table',
        startY: 35,
        columns: [
            { header: 'Material', dataKey: 'material' },
            { header: 'Categoria', dataKey: 'categoria' },
            { header: 'Qtd', dataKey: 'quantidade' },
            { header: 'Unidade', dataKey: 'unidade' },
            { header: 'Estado', dataKey: 'estado' }
        ],
        didParseCell: function(data) {
            // Remove a coluna de ícones/botões (a última)
            if (data.column.index === 5) {
                data.cell.text = '';
            }
        },
        headStyles: { fillColor: [37, 99, 235] }, // Azul AAFGest
        theme: 'striped'
    });

    // Abrir o PDF ou Fazer Download
    doc.save(`Inventario_AAFGest_${dataAtual}.pdf`);
};