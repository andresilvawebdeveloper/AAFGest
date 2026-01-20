// 1. Importar as funções necessárias do Firebase via CDN
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// 2. A tua configuração oficial do Firebase
const firebaseConfig = {
    apiKey: "AIzaSyDFYV9IwOKD7w-Sj89glA80DuratJqZ1zc",
    authDomain: "aafgest.firebaseapp.com",
    projectId: "aafgest",
    storageBucket: "aafgest.firebasestorage.app",
    messagingSenderId: "406052783734",
    appId: "1:406052783734:web:f0f25e7661d9d614124157"
};

// 3. Inicializar Firebase e serviço de Autenticação
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// 4. Capturar o formulário de login no HTML
const loginForm = document.getElementById('login-form');

if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault(); // Impede o refresh da página
        
        const email = loginForm.querySelector('input[type="email"]').value;
        const password = loginForm.querySelector('input[type="password"]').value;

        console.log("Tentativa de acesso para:", email);

        // 5. Executar o Login no Firebase
        signInWithEmailAndPassword(auth, email, password)
            .then((userCredential) => {
                const user = userCredential.user;
                console.log("Login efetuado com sucesso:", user.email);

                // --- LÓGICA DE REDIRECIONAMENTO POR PERFIL ---
                
                // 1. Se for o teu email (ADMIN)
                // Substitui 'oteuemail@gmail.com' pelo teu email real do Firebase
                if (user.email === 'oteuemail@gmail.com') {
                    window.location.href = "admin.html";
                } 
                // 2. Se o email contiver a palavra 'armazem'
                else if (user.email.includes('armazem')) {
                    window.location.href = "armazem.html";
                } 
                // 3. Se o email contiver a palavra 'condutor'
                else if (user.email.includes('condutor')) {
                    window.location.href = "condutor.html";
                } 
                // 4. Caso contrário, envia para o Admin por segurança
                else {
                    window.location.href = "admin.html";
                }
            })
            .catch((error) => {
                console.error("Erro no Firebase:", error.code);
                alert("Dados de acesso inválidos. Por favor, tente novamente.");
            });
    });
}

// 6. Segurança Extra: Verificar se o utilizador está logado (opcional)
onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log("Utilizador está ativo:", user.email);
    } else {
        console.log("Nenhum utilizador logado.");
    }
});