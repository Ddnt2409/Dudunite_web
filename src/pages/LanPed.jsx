// ============================================
// QD01 – IMPORTS E CONFIGURAÇÕES INICIAIS
// ============================================

import React, { useState } from 'react';
import './LanPed.css';

// ============================================
// QD02 – COMPONENTE PRINCIPAL E STATES
// ============================================

function LanPed(props) {
  const [cidade, setCidade] = useState('');
  const [pdv, setPdv] = useState('');
  const [produto, setProduto] = useState('');
  const [quantidade, setQuantidade] = useState('');
  const [valorUnitario, setValorUnitario] = useState('');
  const [formaPagamento, setFormaPagamento] = useState('');
  const [dataVencimento, setDataVencimento] = useState('');
  const [valorTotal, setValorTotal] = useState('');
  const [pedidoExistente, setPedidoExistente] = useState(false); // para simulação futura

  const cidades = ['Gravatá', 'Recife', 'Caruaru'];

  const pdvs = {
    Gravatá: ['Pequeno Príncipe', 'Salesianas', 'Céu Azul', 'Russas', 'Bora Gastar', 'Kaduh', 'Society Show', 'Degusty'],
    Recife: ['Tio Valter', 'Vera Cruz', 'Pinheiros', 'Dourado', 'BMQ', 'CFC', 'Madre de Deus', 'Saber Viver'],
    Caruaru: ['Interativo', 'Exato Sede', 'Exato Anexo', 'Sesi', 'Motivo', 'Jesus Salvador']
  };

  const produtos = ['BRW 7x7', 'BRW 6x6', 'PKT 5x5', 'PKT 6x6', 'Escondidinho', 'DUDU'];

  // ============================================
  // QD03 – FUNÇÕES DE CÁLCULO E EVENTOS
  // ============================================

  const calcularTotal = () => {
    if (quantidade && valorUnitario) {
      const total = parseFloat(quantidade) * parseFloat(valorUnitario);
      setValorTotal(total.toFixed(2));
    }
  };

  const handleSalvar = () => {
    if (pedidoExistente) {
      const confirma = window.confirm('Este ponto de venda já tem um pedido lançado nesta produção. Deseja lançar um novo?');
      if (!confirma) return;
    }
    alert('Pedido salvo com sucesso!');
  };

  const handleDispararPedido = () => {
    alert('Função de gerar PDF e enviar para o WhatsApp da empresa será integrada aqui.');
  };

  // ============================================
  // QD04 – RENDERIZAÇÃO (RETURN)
  // ============================================

  return (
    <div className="lanped-container">
      <button
        onClick={() => props.setTela("HomePCP")}
        style={{
          alignSelf: "flex-start",
          marginBottom: "1rem",
          backgroundColor: "#8c3b1b",
          color: "#fff",
          border: "none",
          padding: "0.5rem 1rem",
          borderRadius: "6px",
          cursor: "pointer",
        }}
      >
        ⬅ Voltar
      </button>

      <h1 className="lanped-title">Lançar Pedido</h1>

      <label>Cidade</label>
      <select value={cidade} onChange={(e) => { setCidade(e.target.value); setPdv(''); }}>
        <option value="">Selecione</option>
        {cidades.map((c) => <option key={c} value={c}>{c}</option>)}
      </select>

      <label>Ponto de Venda</label>
      <select value={pdv} onChange={(e) => setPdv(e.target.value)} disabled={!cidade}>
        <option value="">Selecione</option>
        {cidade && pdvs[cidade].map((p) => <option key={p} value={p}>{p}</option>)}
      </select>

      <label>Tipo de Produto</label>
      <select value={produto} onChange={(e) => setProduto(e.target.value)}>
        <option value="">Selecione</option>
        {produtos.map((p) => <option key={p} value={p}>{p}</option>)}
      </select>

      <label>Quantidade</label>
      <input
        type="number"
        value={quantidade}
        onChange={(e) => {
          setQuantidade(e.target.value);
          calcularTotal();
        }}
      />

      <label>Valor Unitário</label>
      <input
        type="number"
        value={valorUnitario}
        onChange={(e) => {
          setValorUnitario(e.target.value);
          calcularTotal();
        }}
        placeholder="Valor sugerido da tabela de preços"
      />

      <label>Valor Total</label>
      <input type="text" value={`R$ ${valorTotal}`} readOnly />

      <button onClick={() => alert('Função de edição será ativada.')}>Alterar Pedido</button>
      <button onClick={handleDispararPedido}>Disparar Pedido</button>

      <label>Forma de Pagamento</label>
      <select value={formaPagamento} onChange={(e) => setFormaPagamento(e.target.value)}>
        <option value="">Selecione</option>
        <option value="PIX">PIX</option>
        <option value="Espécie">Espécie</option>
        <option value="Cartão">Cartão</option>
        <option value="Boleto">Boleto</option>
      </select>

      {formaPagamento === 'Boleto' && (
        <>
          <label>Anexar Nota Fiscal</label>
          <input type="file" accept=".pdf,.jpg,.png" />

          <label>Anexar Boleto Bancário</label>
          <input type="file" accept=".pdf,.jpg,.png" />
        </>
      )}

      <label>Data de Vencimento</label>
      <input
        type="date"
        value={dataVencimento}
        onChange={(e) => setDataVencimento(e.target.value)}
      />

      <button onClick={handleSalvar}>Salvar Pedido</button>
    </div>
  );
}

// ============================================
// QD99 – EXPORTAÇÃO
// ============================================

export default LanPed;
