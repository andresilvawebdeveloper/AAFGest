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
const teamCollection = collection(db, "team");

// --- MODAL ---
window.openUserModal = () => document.getElementById('userModal').style.display = 'block';
window.closeUserModal = () => document.getElementById('userModal').style.display = 'none';

// --- ADICIONAR MEMBRO ---
document.getElementById('userForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const newUser = {
        name: document.getElementById('userName').value,
        role: document.getElementById('userRole').value,
        email: document.getElementById('userEmail').value,
        status: "offline" // Por defeito
    };
    await addDoc(teamCollection, newUser);
    closeUserModal();
    e.target.reset();
});

// --- RENDERIZAR EQUIPA ---
onSnapshot(teamCollection, (snapshot) => {
    const grid = document.getElementById('teamGrid');
    grid.innerHTML = '';
    
    snapshot.forEach((docSnap) => {
        const u = docSnap.data();
        const id = docSnap.id;
        const icon = u.role === 'Condutor' ? 'bx-truck' : (u.role === 'Armazém' ? 'bx-package' : 'bx-user');
        
        grid.innerHTML += `
            <div class="user-card">
                <button class="btn-delete" style="position: absolute; right: 15px; top: 15px;" onclick="removeUser('${id}')">×</button>
                <div class="user-avatar"><i class='bx ${icon}'></i></div>
                <h4>${u.name}</h4>
                <p>${u.email}</p>
                <span class="status-indicator status-${u.status}">
                    <div class="${u.status === 'online' ? 'dot-pulse' : ''}"></div>
                    ${u.role} • ${u.status.toUpperCase()}
                </span>
            </div>
        `;
    });
});

window.removeUser = async (id) => {
    if(confirm("Remover este colaborador?")) await deleteDoc(doc(db, "team", id));
}