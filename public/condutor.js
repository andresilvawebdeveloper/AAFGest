import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, collection, query, where, onSnapshot, updateDoc, doc, getDocs, increment } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyDFYV9IwOKD7w-Sj89glA80DuratJqZ1zc",
    authDomain: "aafgest.firebaseapp.com",
    projectId: "aafgest",
    storageBucket: "aafgest.firebasestorage.app",
    messagingSenderId: "406052783734",
    appId: "1:406052783734:web:f0f25e7661d9d614124157"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

document.getElementById('currentDate').innerText = new Date().toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long' });

onAuthStateChanged(auth, async (user) => {
    if (user) {
        const qUser = query(collection(db, "team"), where("email", "==", user.email));
        const userSnap = await getDocs(qUser);
        let nomeCompleto = "";
        
        userSnap.forEach(d => {
            nomeCompleto = d.data().name;
            document.getElementById('welcomeName').innerHTML = `Olá, <strong>${nomeCompleto.split(' ')[0]}</strong>`;
        });

        const qEntregas = query(collection(db, "entregas"), where("condutor", "==", nomeCompleto));

        onSnapshot(qEntregas, (snapshot) => {
            const list = document.getElementById('deliveryList');
            list.innerHTML = '<h3 style="margin-bottom: 15px;">Próximas Entregas</h3>';
            
            let pendentes = 0;
            let concluidas = 0;

            if (snapshot.empty) {
                list.innerHTML += '<p style="text-align:center; padding:20px; color:#94a3b8;">Sem entregas agendadas.</p>';
            }

            snapshot.forEach(docSnap => {
                const en = docSnap.data();
                const id = docSnap.id;

                if (en.estado === "Concluída") concluidas++; else pendentes++;

                const dataExibicao = en.dataAgendada.split('-').reverse().join('/');

                // Definir cores dinâmicas para o estado "Em Rota" (Laranja)
                const corEstado = en.estado === 'Pendente' ? '#3b82f6' : (en.estado === 'Em Rota' ? '#f97316' : '#22c55e');

                const card = document.createElement('div');
                card.className = `delivery-card`;
                card.style = `background: white; padding: 20px; border-radius: 20px; margin-bottom: 15px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 4px 6px rgba(0,0,0,0.02); border-left: 5px solid ${corEstado}; opacity: ${en.estado === 'Concluída' ? '0.7' : '1'}`;
                
                card.innerHTML = `
    <div class="delivery-info">
        <span style="font-size: 0.75rem; font-weight: 800; color: ${corEstado};">${dataExibicao} ${en.estado === 'Em Rota' ? '• EM ROTA' : ''}</span>
        <h4 style="margin: 5px 0; font-size: 1.1rem;">${en.cliente}</h4>
        <p style="font-size: 0.85rem; color: var(--text-light); margin-bottom: 4px;"><i class='bx bx-package'></i> ${en.material} (${en.quantidade})</p>
        <p style="font-size: 0.85rem; color: var(--text-light);"><i class='bx bx-car'></i> ${en.veiculo}</p>
    </div>
    <div class="delivery-actions" style="display: flex; gap: 10px;">
        <a href="${en.localizacao}" target="_blank" class="btn-icon" style="background: #f1f5f9; color: #64748b; width: 45px; height: 45px; border-radius: 12px; display: flex; align-items: center; justify-content: center; text-decoration: none;">
            <i class='bx bxs-navigation' style="font-size: 1.2rem;"></i>
        </a>
        ${renderBotaoAcao(id, en)}
    </div>
`;
                list.appendChild(card);
            });

            document.getElementById('countPendente').innerText = pendentes;
            document.getElementById('countConcluida').innerText = concluidas;
        });
    }
});

// Função para decidir qual botão mostrar baseado no estado
function renderBotaoAcao(id, en) {
    if (en.estado === 'Pendente') {
        return `<button class="btn-icon" onclick="iniciarRota('${id}')" style="background: #f97316; color: white; width: 45px; height: 45px; border-radius: 12px; border: none; cursor: pointer;">
                    <i class='bx bx-play' style="font-size: 1.5rem;"></i>
                </button>`;
    } else if (en.estado === 'Em Rota') {
        return `<button class="btn-icon" onclick="finalizarServico('${id}', '${en.material}', ${en.quantidade})" style="background: #22c55e; color: white; width: 45px; height: 45px; border-radius: 12px; border: none; cursor: pointer;">
                    <i class='bx bx-check' style="font-size: 1.5rem;"></i>
                </button>`;
    } else {
        return `<div style="color: #22c55e; width: 45px; text-align: center;"><i class='bx bx-check-double' style="font-size: 1.8rem;"></i></div>`;
    }
}

// 1. FUNÇÃO PARA INICIAR ROTA
window.iniciarRota = async (id) => {
    try {
        await updateDoc(doc(db, "entregas", id), { 
            estado: "Em Rota",
            horaSaida: new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })
        });
    } catch (error) {
        console.error("Erro ao iniciar rota:", error);
    }
};

// 2. FUNÇÃO PARA CONCLUIR ENTREGA E ABATER STOCK
window.finalizarServico = async (id, materialNome, qtd) => {
    if (confirm("Confirmas que este material foi entregue? O stock será atualizado automaticamente.")) {
        try {
            await updateDoc(doc(db, "entregas", id), { 
                estado: "Concluída",
                horaChegada: new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })
            });

            const stockRef = collection(db, "stock");
            const q = query(stockRef, where("name", "==", materialNome));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                querySnapshot.forEach(async (sDoc) => {
                    await updateDoc(doc(db, "stock", sDoc.id), {
                        quantity: increment(-qtd)
                    });
                });
            }
            alert("Entrega concluída!");
        } catch (error) {
            console.error("Erro ao finalizar:", error);
        }
    }
};