// Função para finalizar uma encomenda e atualizar o stock
window.receberEncomenda = async (encomendaId, materialNome, qtdPedida) => {
    if (confirm(`Confirmas a receção de ${qtdPedida} unidades de ${materialNome}?`)) {
        try {
            // 1. Marcar encomenda como concluída
            await updateDoc(doc(db, "encomendas", encomendaId), { estado: "Entregue" });

            // 2. SOMAR ao stock existente
            const qStock = query(collection(db, "stock"), where("name", "==", materialNome));
            const stockSnap = await getDocs(qStock);
            
            stockSnap.forEach(async (sDoc) => {
                await updateDoc(doc(db, "stock", sDoc.id), {
                    quantity: increment(qtdPedida) // Aqui usamos o positivo para somar
                });
            });

            alert("Stock atualizado com sucesso!");
        } catch (error) {
            console.error(error);
        }
    }
};