# Conecta Baía

Protótipo escolar do projeto integrador de Desenvolvimento de Sistemas sobre maricultura e pesca artesanal em Guaratuba.

## Como executar

Baixe o repositório e abra o arquivo `index.html` em um navegador moderno. Se preferir rodar em um servidor local, abra um terminal na pasta do projeto, execute `python -m http.server 8000` e acesse http://localhost:8000.

- `index.html` estrutura a vitrine, os formulários, o histórico e a rota.
- `styles.css` define a aparência e adapta as telas a celulares.
- `app.js` contém os dados iniciais, os filtros, as validações e as regras de reserva.
- `img/` contém imagens ilustrativas geradas para o projeto.

## Roteiro de teste

1. Entre como **Cliente de demonstração**. Na vitrine, filtre por categoria ou comunidade.
2. Adicione um lote ou visita ao carrinho, informe a quantidade e escolha um horário futuro. Gere a reserva e confira o protocolo e o estoque restante.
3. Entre no perfil fictício do produtor daquele lote. No painel, confirme a reserva e marque-a como concluída.
4. Volte ao perfil de cliente. No histórico, avalie a reserva e confira a média na rota.
5. Faça outra reserva e cancele para conferir a devolução da quantidade ao estoque.

O carrinho emite um protocolo por item, pois cada lote ou visita pode ter horário e ponto próprios. Preços são calculados em centavos. Os dados ficam no `localStorage` do navegador. A escolha de perfil usa `sessionStorage` e o carrinho fica em memória. Use somente dados fictícios. A troca de perfis simula o acesso de cliente e produtor sem login real. O mapa é esquemático e as reservas são demonstrativas.
