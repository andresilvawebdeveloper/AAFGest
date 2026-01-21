import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, updateEmail, updatePassword } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, getDoc, updateDoc, query, collection, where, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = { /* Teu Config aqui */ };
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// 1. Carregar dados atuais
auth.onAuthStateChanged(async (user) => {
    if (user) {
        document.getElementById('profEmail').value = user.email;
        
        // Procurar o utilizador na coleção 'team'
        const q = query(collection(db, "team"), where("email", "==", user.email));
        const snapshot = await getDocs(q);
        snapshot.forEach(d => {
            const data = d.data();
            document.getElementById('profName').value = data.name;
            if(data.photoURL) {
                document.getElementById('photoDisplay').innerHTML = `<img src="${data.photoURL}" style="width:100%; height:100%; object-fit:cover;">`;
            }
        });
    }
});

// 2. Guardar Alterações
document.getElementById('profileForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    const newName = document.getElementById('profName').value;
    const newEmail = document.getElementById('profEmail').value;
    const newPass = document.getElementById('profPass').value;

    try {
        // Atualizar no Auth (Email e Pass)
        if (newEmail !== user.email) await updateEmail(user, newEmail);
        if (newPass) await updatePassword(user, newPass);

        // Atualizar no Firestore (Nome)
        const q = query(collection(db, "team"), where("email", "==", user.email));
        const snapshot = await getDocs(q);
        snapshot.forEach(async (d) => {
            await updateDoc(doc(db, "team", d.id), { 
                name: newName,
                email: newEmail 
            });
        });

        alert("Perfil atualizado com sucesso!");
    } catch (error) {
        alert("Erro: Para alterar dados sensíveis, deves ter feito login recentemente.");
        console.error(error);
    }
});