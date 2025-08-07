import React from 'react';
-import './HomePCP.css';
+import './HomePCP.css';

export default function HomePCP({ setTela }) {
  return (
-    <div className="homepcp-container">
+    <div className="homepcp-container">
       {/* HEADER */}
-      <header className="homepcp-header">
+      {/* aqui reaproveitamos a regra de header do ERP (padding menor, espaço entre logo e título) */}
+      <header className="homepcp-header homeerp-header">
         <img src="/LogomarcaDDnt2025Vazado.png" alt="Logo" className="logo-pcp" />
-        <h1 className="homepcp-titulo">PCP – Planejamento de Produção</h1>
+        {/* usamos a classe do título do ERP para alinhamento à direita */}
+        <h1 className="homeerp-titulo">PCP – Planejamento de Produção</h1>
       </header>

       {/* BOTÕES */}
       <main className="botoes-pcp">
         <button
           className="botao-principal botao-ativo"
           onClick={() => setTela('LanPed')}
         >
           📝<br/>Lançar Pedido
         </button>

         <button
           className="botao-principal botao-inativo"
           onClick={() => alert('Em construção')}
         >
           🍫<br/>Alimentar Sabores
         </button>
       </main>

       {/* VOLTAR */}
       <button className="botao-voltar" onClick={() => setTela('HomeERP')}>
         🔙 Voltar ao ERP
       </button>

       {/* RODAPÉ */}
       <footer className="homepcp-footer">
         Cruz • Pinheiros • Dourado • BMQ • CFC • Madre de Deus • Saber Viver •
         Interativo • Exato Sede • Exato Anexo • Society Show • Russas • Kaduh •
         Degusty • Bora Gastar • Salesianas • Céu Azul • Pequeno Príncipe •
         Tio Valter • Vera Cruz
       </footer>
     </div>
  );
  }
