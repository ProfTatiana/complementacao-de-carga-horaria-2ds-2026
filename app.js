"use strict";

const CHAVE = "conecta-baia-v1";
const comunidades = [
  { id: "cab", nome: "Cabaraquara", referencia: "Rota das Ostras" },
  { id: "cai", nome: "Caieiras", referencia: "Comunidade pesqueira" },
  { id: "mer", nome: "Mercado Municipal", referencia: "Centro de Guaratuba" },
];
const categorias = [
  { id: "ostras", nome: "Ostras frescas", imagem: "img/ostras.webp", unidades: ["dúzia", "porção"] },
  { id: "pesca", nome: "Pescados e crustáceos", imagem: "img/pesca.webp", unidades: ["kg", "porção"] },
  { id: "turismo", nome: "Turismo náutico", imagem: "img/baia.webp", unidades: ["vaga"] },
];
const statusReserva = {
  pendente: "Pendente", confirmada: "Confirmada",
  concluida: "Concluída", cancelada: "Cancelada",
};
const moeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const dataBR = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" });
const dinheiro = centavos => moeda.format(centavos / 100);
const el = id => document.getElementById(id);
const porId = (lista, id) => lista.find(item => item.id === id);
const perfil = () => porId(banco.perfis, sessao);
const produtorDo = produto => porId(banco.perfis, produto.produtorId);
const retirada = produto => produto.categoria === "turismo" ? "Visita" : "Retirada";
const buscar = valor => valor.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

function localISO(data = new Date()) {
  const local = new Date(data.getTime() - data.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

function dadosIniciais() {
  return {
    sequencia: 1,
    perfis: [
      { id: "cliente-demo", tipo: "cliente", nome: "Cliente de demonstração" },
      { id: "p1", tipo: "produtor", nome: "Cultivo Maré Mansa", comunidade: "cab" },
      { id: "p2", tipo: "produtor", nome: "Pesca da Enseada", comunidade: "cai" },
      { id: "p3", tipo: "produtor", nome: "Banca da Baía", comunidade: "mer" },
    ],
    produtos: [
      { id: "l1", produtorId: "p1", categoria: "ostras", nome: "Ostra nativa", unidade: "dúzia", preco: 3600, estoque: 20, colheita: localISO().slice(0, 10), ponto: "Ponto de cultivo no Cabaraquara" },
      { id: "l2", produtorId: "p2", categoria: "pesca", nome: "Camarão fresco", unidade: "kg", preco: 4800, estoque: 12, colheita: localISO().slice(0, 10), ponto: "Ponto de encontro em Caieiras" },
      { id: "l3", produtorId: "p1", categoria: "turismo", nome: "Visita guiada ao cultivo", unidade: "vaga", preco: 5500, estoque: 8, colheita: "", ponto: "Ponto de cultivo no Cabaraquara" },
      { id: "l4", produtorId: "p3", categoria: "pesca", nome: "Tainha fresca", unidade: "kg", preco: 3200, estoque: 0, colheita: localISO().slice(0, 10), ponto: "Banca no Mercado Municipal" },
    ],
    reservas: [],
    avaliacoes: [],
  };
}

function lerBanco() {
  try {
    const dados = localStorage.getItem(CHAVE);
    return dados ? JSON.parse(dados) : null;
  } catch {
    return null;
  }
}

let banco = lerBanco() ?? dadosIniciais();
let sessao = "cliente-demo";
try {
  const salvo = sessionStorage.getItem(CHAVE);
  if (porId(banco.perfis, salvo)) sessao = salvo;
} catch { /* O perfil padrão funciona com armazenamento restrito. */ }

const carrinhos = new Map();
let timerMensagem;
function avisar(texto) {
  el("mensagem").textContent = texto;
  clearTimeout(timerMensagem);
  timerMensagem = setTimeout(() => { el("mensagem").textContent = ""; }, 5500);
}

// Persiste um único documento após validar todas as alterações da operação.
async function alterar(operacao) {
  function executar() {
    const proximo = structuredClone(lerBanco() ?? banco);
    const mensagem = operacao(proximo);
    try {
      localStorage.setItem(CHAVE, JSON.stringify(proximo));
    } catch {
      throw new Error("O navegador não conseguiu salvar. Confira a permissão de armazenamento.");
    }
    banco = proximo;
    atualizar();
    if (mensagem) avisar(mensagem);
  }
  try {
    if (navigator.locks) await navigator.locks.request(CHAVE, executar);
    else executar();
    return true;
  } catch (erro) {
    avisar(erro.message);
    return false;
  }
}

function elemento(tag, texto, classe) {
  const item = document.createElement(tag);
  if (texto) item.textContent = texto;
  if (classe) item.className = classe;
  return item;
}

function botao(texto, acao, classe) {
  const item = elemento("button", texto, classe);
  item.type = "button";
  item.addEventListener("click", acao);
  return item;
}

function rotulo(texto, campo) {
  const item = elemento("label", texto);
  item.append(campo);
  return item;
}

function opcoes(campo, lista, inicial) {
  const valor = campo.value;
  campo.replaceChildren();
  if (inicial) campo.add(new Option(inicial, ""));
  lista.forEach(item => campo.add(new Option(item.nome, item.id)));
  if ([...campo.options].some(item => item.value === valor)) campo.value = valor;
}

function caixa(titulo, textos) {
  const item = elemento("article", "", "surface");
  item.append(elemento("h3", titulo));
  textos.forEach(texto => item.append(elemento("p", texto)));
  return item;
}

function renderCatalogo() {
  const busca = buscar(el("busca").value.trim());
  const categoria = el("categoria").value;
  const comunidade = el("comunidade").value;
  const disponivel = el("disponivel").checked;
  const produtos = banco.produtos.filter(produto => {
    const produtor = produtorDo(produto);
    return (!categoria || produto.categoria === categoria)
      && (!comunidade || produtor.comunidade === comunidade)
      && (!disponivel || produto.estoque > 0)
      && buscar(produto.nome + " " + produtor.nome).includes(busca);
  });
  el("resultado").textContent = produtos.length + (produtos.length === 1 ? " opção encontrada" : " opções encontradas");
  el("catalogo").replaceChildren(...produtos.map(produto => {
    const produtor = produtorDo(produto);
    const tipo = porId(categorias, produto.categoria);
    const card = el("cartao").content.cloneNode(true);
    const preencher = (campo, texto) => { card.querySelector("[data-" + campo + "]").textContent = texto; };
    const imagem = card.querySelector("img");
    imagem.src = produto.foto || tipo.imagem;
    imagem.loading = "lazy";
    imagem.addEventListener("error", () => { imagem.src = tipo.imagem; }, { once: true });
    preencher("categoria", tipo.nome);
    preencher("nome", produto.nome);
    preencher("produtor", produtor.nome);
    const comunidade = porId(comunidades, produtor.comunidade).nome;
    const origem = produto.colheita ? " · Colheita ou pesca em " + produto.colheita.split("-").reverse().join("/") : "";
    preencher("origem", comunidade + origem);
    preencher("estoque", produto.estoque ? produto.estoque + " disponível(is)" : "Esgotado");
    preencher("ponto", retirada(produto) + " · " + produto.ponto);
    preencher("preco", dinheiro(produto.preco) + " / " + produto.unidade);
    const acao = card.querySelector("button");
    acao.textContent = produto.categoria === "turismo" ? "Agendar visita" : "Reservar lote";
    acao.disabled = !produto.estoque;
    acao.addEventListener("click", () => colocarNoCarrinho(produto.id));
    return card;
  }));
}

function carrinhoAtual() {
  if (!carrinhos.has(sessao)) carrinhos.set(sessao, new Map());
  return carrinhos.get(sessao);
}

function colocarNoCarrinho(id) {
  if (perfil().tipo !== "cliente") {
    avisar("Entre em um perfil de cliente para reservar.");
    el("perfil").focus();
    return;
  }
  const produto = porId(banco.produtos, id);
  const itens = carrinhoAtual();
  if (!itens.has(id)) itens.set(id, { quantidade: 1, horario: "" });
  renderCarrinho();
  avisar(produto.nome + " no carrinho.");
  el("reservas").scrollIntoView({ block: "start" });
  el("carrinho").querySelector("input")?.focus({ preventScroll: true });
}

function atualizarTotal() {
  let total = 0;
  carrinhoAtual().forEach((item, id) => { total += item.quantidade * porId(banco.produtos, id).preco; });
  el("total").textContent = dinheiro(total);
}

function renderCarrinho() {
  const itens = carrinhoAtual();
  const linhas = el("carrinho");
  const retiradas = el("retiradas");
  linhas.replaceChildren();
  retiradas.replaceChildren();
  const cliente = perfil().tipo === "cliente";
  el("enviarReserva").disabled = !cliente || itens.size === 0;
  el("reservaForm").hidden = !cliente || itens.size === 0;
  if (!cliente || !itens.size) {
    linhas.textContent = cliente ? "Seu carrinho está vazio." : "Entre como cliente para reservar.";
    return;
  }
  itens.forEach((item, id) => {
    const produto = porId(banco.produtos, id);
    const quantidade = elemento("input");
    quantidade.type = "number";
    quantidade.min = 1;
    quantidade.max = produto.estoque;
    quantidade.required = true;
    quantidade.value = item.quantidade;
    quantidade.setAttribute("form", "reservaForm");
    quantidade.addEventListener("input", () => {
      item.quantidade = quantidade.valueAsNumber || 0;
      atualizarTotal();
    });
    const remover = botao("Remover", () => {
      itens.delete(id);
      renderCarrinho();
    }, "secondary");
    remover.setAttribute("aria-label", "Remover " + produto.nome);
    const linha = elemento("div", "", "actions");
    linha.append(rotulo(produto.nome + " · " + produto.unidade, quantidade), remover);
    linhas.append(linha);

    const data = elemento("input");
    data.type = "datetime-local";
    data.min = localISO();
    data.required = true;
    data.value = item.horario;
    data.addEventListener("input", () => { item.horario = data.value; });
    retiradas.append(rotulo(retirada(produto) + " · " + produto.nome, data));
  });
  atualizarTotal();
}

let enviandoReserva = false;
function gerarReserva(evento) {
  evento.preventDefault();
  const clienteId = sessao;
  const carrinho = carrinhoAtual();
  const itens = structuredClone([...carrinho]);
  if (enviandoReserva || !itens.length || perfil().tipo !== "cliente") return;
  enviandoReserva = true;
  el("enviarReserva").disabled = true;
  alterar(dados => {
    const codigos = [];
    for (const [id, item] of itens) {
      const produto = porId(dados.produtos, id);
      if (!produto || !Number.isInteger(item.quantidade) || item.quantidade < 1 || item.quantidade > produto.estoque) {
        throw new Error("Estoque insuficiente. Revise as quantidades no carrinho.");
      }
      if (!item.horario || !(new Date(item.horario).getTime() > Date.now())) {
        throw new Error("Escolha data e horário futuros para cada item.");
      }
      const codigo = "CB-" + String(dados.sequencia++).padStart(5, "0");
      dados.reservas.push({
        id: codigo, clienteId, produtorId: produto.produtorId, produtoId: id,
        nome: produto.nome, precoUnitario: produto.preco, quantidade: item.quantidade,
        horario: item.horario, criadaEm: new Date().toISOString(), status: "pendente",
      });
      produto.estoque -= item.quantidade;
      codigos.push(codigo);
    }
    return "Reserva registrada. Protocolo(s) " + codigos.join(", ") + ".";
  }).then(salvou => {
    if (salvou) {
      carrinho.clear();
    }
  }).finally(() => {
    enviandoReserva = false;
    renderCarrinho();
  });
}

function trocarStatus(id, novo, ator) {
  alterar(dados => {
    const reserva = porId(dados.reservas, id);
    const produtor = reserva.produtorId === ator;
    const cliente = reserva.clienteId === ator;
    const permitida = novo === "confirmada" && produtor && reserva.status === "pendente"
      || novo === "concluida" && produtor && reserva.status === "confirmada"
      || novo === "cancelada" && (cliente || produtor) && ["pendente", "confirmada"].includes(reserva.status);
    if (!permitida) throw new Error("Esta reserva já mudou de status.");
    if (novo === "cancelada") porId(dados.produtos, reserva.produtoId).estoque += reserva.quantidade;
    reserva.status = novo;
    return id + " · " + statusReserva[novo] + ".";
  });
}

function formularioAvaliacao(reserva) {
  const form = elemento("form", "", "fields");
  const nota = elemento("select");
  for (let n = 5; n >= 1; n--) nota.add(new Option(String(n), String(n)));
  const comentario = elemento("input");
  comentario.maxLength = 250;
  const enviar = elemento("button", "Registrar avaliação");
  form.append(rotulo("Nota (1 a 5)", nota), rotulo("Comentário opcional", comentario), enviar);
  form.addEventListener("submit", evento => {
    evento.preventDefault();
    const clienteId = sessao;
    alterar(dados => {
      const atual = porId(dados.reservas, reserva.id);
      if (atual.clienteId !== clienteId || atual.status !== "concluida"
          || dados.avaliacoes.some(item => item.reservaId === atual.id)) {
        throw new Error("Esta reserva não pode receber outra avaliação.");
      }
      dados.avaliacoes.push({ reservaId: atual.id, nota: Number(nota.value), comentario: comentario.value.trim() });
      return "Avaliação registrada.";
    });
  });
  return form;
}

function renderReservas() {
  const usuario = perfil();
  const alvo = el(usuario.tipo === "cliente" ? "historico" : "recebidas");
  el("historico").replaceChildren();
  el("recebidas").replaceChildren();
  if (usuario.tipo === "produtor") el("historico").textContent = "O histórico do produtor aparece no painel.";
  const produtor = usuario.tipo === "produtor";
  const reservas = banco.reservas.filter(r => (produtor ? r.produtorId : r.clienteId) === usuario.id).reverse();
  if (!reservas.length) alvo.textContent = "Nenhuma reserva registrada.";
  reservas.forEach(r => {
    const produto = porId(banco.produtos, r.produtoId);
    const outro = porId(banco.perfis, produtor ? r.clienteId : r.produtorId);
    const card = caixa(r.id + " · " + statusReserva[r.status], [
      r.nome + " × " + r.quantidade + " · " + dinheiro(r.precoUnitario * r.quantidade),
      outro.nome + " · " + retirada(produto) + " em " + dataBR.format(new Date(r.horario)),
      produto.ponto,
    ]);
    const acoes = elemento("div", "", "actions");
    if (produtor && r.status === "pendente") acoes.append(botao("Confirmar", () => trocarStatus(r.id, "confirmada", usuario.id)));
    if (produtor && r.status === "confirmada") acoes.append(botao("Marcar como concluída", () => trocarStatus(r.id, "concluida", usuario.id)));
    if (["pendente", "confirmada"].includes(r.status)) {
      acoes.append(botao("Cancelar reserva", () => trocarStatus(r.id, "cancelada", usuario.id), "secondary"));
    }
    const avaliacao = banco.avaliacoes.find(item => item.reservaId === r.id);
    if (avaliacao) card.append(elemento("p", "Avaliação · " + avaliacao.nota + "/5" + (avaliacao.comentario ? " · " + avaliacao.comentario : "")));
    else if (!produtor && r.status === "concluida") card.append(formularioAvaliacao(r));
    if (acoes.childElementCount) card.append(acoes);
    alvo.append(card);
  });
}

function renderRota() {
  el("mapa").replaceChildren();
  el("paradas").replaceChildren();
  const reservasPorId = new Map(banco.reservas.map(r => [r.id, r]));
  comunidades.forEach(comunidade => {
    const link = elemento("a", comunidade.nome);
    link.href = "#parada-" + comunidade.id;
    el("mapa").append(link);
    const ponto = caixa(comunidade.nome, [comunidade.referencia]);
    ponto.id = "parada-" + comunidade.id;
    banco.perfis.filter(p => p.comunidade === comunidade.id && p.tipo === "produtor").forEach(p => {
      const notas = banco.avaliacoes.filter(a => reservasPorId.get(a.reservaId)?.produtorId === p.id);
      const media = notas.reduce((soma, a) => soma + a.nota, 0) / notas.length;
      ponto.append(elemento("p", p.nome + " · " + (notas.length
        ? media.toLocaleString("pt-BR", { maximumFractionDigits: 1 }) + "/5 (" + notas.length + ")" : "Sem avaliações")));
    });
    el("paradas").append(ponto);
  });
}

function renderProdutor() {
  const usuario = perfil();
  const produtor = usuario.tipo === "produtor";
  el("painel").hidden = !produtor;
  el("avisoProdutor").textContent = produtor ? "Gerenciando " + usuario.nome + "." : "Entre em um perfil de produtor para gerenciar lotes e reservas.";
  if (!produtor) return;
  const lista = el("lotes");
  lista.replaceChildren();
  const produtos = banco.produtos.filter(p => p.produtorId === usuario.id);
  if (!produtos.length) lista.textContent = "Nenhum lote cadastrado.";
  produtos.forEach(produto => {
    const card = caixa(produto.nome, [dinheiro(produto.preco) + " / " + produto.unidade + " · " + produto.ponto]);
    const form = elemento("form", "", "actions");
    const estoque = elemento("input");
    estoque.type = "number";
    estoque.min = 0;
    estoque.max = 9999;
    estoque.step = 1;
    estoque.required = true;
    estoque.value = produto.estoque;
    form.append(rotulo("Estoque disponível", estoque), elemento("button", "Atualizar estoque"));
    form.addEventListener("submit", evento => {
      evento.preventDefault();
      const quantidade = estoque.valueAsNumber;
      alterar(dados => {
        const atual = porId(dados.produtos, produto.id);
        if (atual.estoque !== produto.estoque) throw new Error("O estoque mudou. Atualize a página e tente novamente.");
        atual.estoque = quantidade;
        return "Estoque atualizado.";
      });
    });
    card.append(form);
    lista.append(card);
  });
}

function atualizar() {
  opcoes(el("perfil"), banco.perfis.map(p => ({ id: p.id, nome: p.nome + " · " + p.tipo })));
  el("perfil").value = sessao;
  renderCatalogo();
  renderCarrinho();
  renderReservas();
  renderRota();
  renderProdutor();
}

function entrar(id) {
  sessao = id;
  try { sessionStorage.setItem(CHAVE, id); } catch { /* Sessão válida até recarregar. */ }
  atualizar();
}

function compatibilizarLote() {
  const categoria = porId(categorias, el("categoriaLote").value);
  opcoes(el("unidade"), categoria.unidades.map(nome => ({ id: nome, nome })));
  const campo = el("campoColheita");
  campo.hidden = categoria.id === "turismo";
  const data = campo.querySelector("input");
  data.required = !campo.hidden;
  data.disabled = campo.hidden;
  data.max = localISO().slice(0, 10);
}

opcoes(el("categoria"), categorias, "Todas");
opcoes(el("comunidade"), comunidades, "Todas");
opcoes(el("comunidadePerfil"), comunidades);
opcoes(el("categoriaLote"), categorias);
compatibilizarLote();

["busca", "categoria", "comunidade", "disponivel"].forEach(id => el(id).addEventListener("input", renderCatalogo));
el("categoriaLote").addEventListener("change", compatibilizarLote);
el("tipo").addEventListener("change", () => {
  el("campoComunidade").hidden = el("tipo").value !== "produtor";
});
el("perfilForm").addEventListener("submit", evento => {
  evento.preventDefault();
  entrar(el("perfil").value);
  avisar("Perfil ativo · " + perfil().nome + ".");
});
el("cadastroForm").addEventListener("submit", evento => {
  evento.preventDefault();
  const form = evento.currentTarget;
  const campos = new FormData(form);
  const nome = String(campos.get("nome")).trim();
  const tipo = campos.get("tipo");
  if (!nome) { avisar("Informe um nome de exibição."); return; }
  const id = crypto.randomUUID();
  alterar(dados => {
    dados.perfis.push({ id, nome, tipo, comunidade: tipo === "produtor" ? campos.get("comunidade") : null });
    return "Perfil cadastrado.";
  }).then(salvou => {
    if (salvou) {
      form.reset();
      el("campoComunidade").hidden = true;
      entrar(id);
    }
  });
});

el("loteForm").addEventListener("submit", evento => {
  evento.preventDefault();
  if (perfil().tipo !== "produtor") return;
  const form = evento.currentTarget;
  const campos = Object.fromEntries(new FormData(form));
  const nome = campos.nome.trim();
  const ponto = campos.ponto.trim();
  const foto = campos.foto.trim();
  if (!nome || !ponto) { avisar("Preencha o nome e o ponto de encontro."); return; }
  if (foto && !foto.startsWith("https://")) { avisar("Use uma URL de foto iniciada por https://."); return; }
  const produtorId = sessao;
  alterar(dados => {
    dados.produtos.push({
      id: crypto.randomUUID(), produtorId, nome, ponto, foto, categoria: campos.categoria,
      unidade: campos.unidade, preco: Math.round(Number(campos.preco) * 100),
      estoque: Number(campos.estoque), colheita: campos.colheita ?? "",
    });
    return "Cadastro publicado na vitrine local.";
  }).then(salvou => {
    if (salvou) {
      form.reset();
      compatibilizarLote();
    }
  });
});

el("reservaForm").addEventListener("submit", gerarReserva);
window.addEventListener("storage", evento => {
  if (evento.key !== CHAVE && evento.key !== null) return;
  banco = lerBanco() ?? dadosIniciais();
  if (!porId(banco.perfis, sessao)) sessao = "cliente-demo";
  carrinhos.forEach(itens => {
    itens.forEach((_, id) => { if (!porId(banco.produtos, id)) itens.delete(id); });
  });
  atualizar();
});

atualizar();
