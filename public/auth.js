import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
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

const loginForm = document.getElementById('login-form');

if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = loginForm.querySelector('input[type="email"]').value;
        const password = loginForm.querySelector('input[type="password"]').value;

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // --- ATUALIZAR ESTADO PARA ONLINE ---
            const q = query(collection(db, "team"), where("email", "==", user.email));
            const querySnapshot = await getDocs(q);
            querySnapshot.forEach(async (documento) => {
                await updateDoc(doc(db, "team", documento.id), { status: "online" });
            });

            // Redirecionamento
            if (user.email === 'oteuemail@gmail.com') {
                window.location.href = "admin.html";
            } else if (user.email.includes('armazem')) {
                window.location.href = "armazem.html";
            } else if (user.email.includes('condutor')) {
                window.location.href = "condutor.html";
            } else {
                window.location.href = "admin.html";
            }

        } catch (error) {
            alert("Erro ao entrar: Dados incorretos.");
        }
    });
}