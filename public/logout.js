import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, collection, query, where, getDocs, updateDoc, doc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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

window.logout = async function() {
    const user = auth.currentUser;

    if (user) {
        try {
            // --- ATUALIZAR ESTADO PARA OFFLINE ANTES DE SAIR ---
            const q = query(collection(db, "team"), where("email", "==", user.email));
            const snapshot = await getDocs(q);
            
            const updates = [];
            snapshot.forEach((d) => {
                updates.push(updateDoc(doc(db, "team", d.id), { status: "offline" }));
            });
            
            await Promise.all(updates);
        } catch (error) {
            console.error("Erro ao atualizar estado:", error);
        }
    }

    signOut(auth).then(() => {
        window.location.href = "index.html";
    });
}

// Detetar se fecham o separador sem carregar em Sair
window.addEventListener('beforeunload', () => {
    const user = auth.currentUser;
    if (user) {
        const q = query(collection(db, "team"), where("email", "==", user.email));
        getDocs(q).then(snapshot => {
            snapshot.forEach(d => {
                updateDoc(doc(db, "team", d.id), { status: "offline" });
            });
        });
    }
});