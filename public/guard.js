import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

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

// O GUARDA: Verifica se o utilizador tem permissão
onAuthStateChanged(auth, (user) => {
    if (!user) {
        // Se não houver utilizador logado, volta ao index
        console.warn("Acesso negado! Redirecionando para login...");
        window.location.href = "index.html";
    } else {
        console.log("Acesso autorizado para:", user.email);
    }
});