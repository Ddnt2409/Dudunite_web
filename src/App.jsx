import { useState } from 'react';

export default function App() {
  const [escola, setEscola] = useState('');
  const [produto, setProduto] = useState('');
  const [quantidade, setQuantidade] = useState('');
  const [sabores, setSabores] = useState('');

  function handleSubmit() {
    if (!escola || !produto || !quantidade) {
      alert('Por favor, preencha todos os campos obrigatórios!');
      return;
    }
    alert(`Pedido salvo:
    Escola: ${escola}
    Produto: ${produto}
    Quantidade: ${quantidade}
    Sabores: ${sabores || 'N/A'}`);
    
    setEscola('');
    setProduto('');
    setQuantidade('');
    setSabores('');
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="bg-white rounded-3xl shadow-lg p-8 max-w-md w-full">
        <h1 className="text-3xl font-bold mb-6 text-orangeDark text-center">ERP - Dudunitê</h1>

        <input
          type="text"
          placeholder="Nome da escola"
          value={escola}
          onChange={(e) => setEscola(e.target.value)}
          className="w-full p-3 mb-4 border border-orangeMid rounded-xl focus:outline-none focus:ring-2 focus:ring-orangeMid"
          required
        />

        <select
          value={produto}
          onChange={(e) => setProduto(e.target.value)}
          className="w-full p-3 mb-4 border border-orangeMid rounded-xl focus:outline-none focus:ring-2 focus:ring-orangeMid"
          required
        >
          <option value="" disabled>Tipo de produto</option>
          <option value="brw7x7">Brownie 7x7</option>
          <option value="brw6x6">Brownie 6x6</option>
          <option value="pkt5x5">Pocket 5x5</option>
          <option value="pkt6x6">Pocket 6x6</option>
          <option value="esc">Escondidinho</option>
        </select>

        <input
          type="number"
          placeholder="Quantidade"
          value={quantidade}
          onChange={(e) => setQuantidade(e.target.value)}
          className="w-full p-3 mb-4 border border-orangeMid rounded-xl focus:outline-none focus:ring-2 focus:ring-orangeMid"
          min="1"
          required
        />

        <input
          type="text"
          placeholder="Sabores (ex: ninho, oreo...)"
          value={sabores}
          onChange={(e) => setSabores(e.target.value)}
          className="w-full p-3 mb-6 border border-orangeMid rounded-xl focus:outline-none focus:ring-2 focus:ring-orangeMid"
        />

        <button
          onClick={handleSubmit}
          className="w-full bg-orangeMid hover:bg-orangeDark text-white font-bold py-3 rounded-xl transition-colors"
        >
          Salvar Pedido
        </button>
      </div>
    </main>
  );
}
