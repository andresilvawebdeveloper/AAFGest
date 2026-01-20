const express = require('express');
const app = express();
const path = require('path');
const PORT = 3000;

app.use(express.static('public'));

// Rota Principal (Login)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Simulação de Rotas de Acesso
app.get('/admin', (req, res) => res.send("Painel Administrativo - Em breve"));
app.get('/armazem', (req, res) => res.send("Painel Armazém - Em breve"));
app.get('/condutor', (req, res) => res.send("Painel Condutor - Em breve"));

app.listen(PORT, () => {
    console.log(`SilvaGest a correr em http://localhost:${PORT}`);
});