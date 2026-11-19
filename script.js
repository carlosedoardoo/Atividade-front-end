const API_PRINCIPAL = 'https://raw.githubusercontent.com/oguzhan18/regularshow-api/main/src/data/characters.json';
const IMAGENS_ESPELHO = 'https://raw.githubusercontent.com/oguzhan18/regularshow-api/main/public/';
const CHAVE_FAVORITOS = 'arquivo-do-parque-favoritos';
const TAMANHO_PAGINA = 24;

const elementos = {
  busca: document.getElementById('campo-busca'),
  cards: document.getElementById('cards-container'),
  limpar: document.getElementById('limpar-btn'),
  limparVazio: document.getElementById('limpar-vazio-btn'),
  mais: document.getElementById('carregar-mais-btn'),
  aviso: document.getElementById('aviso-fonte'),
  contador: document.getElementById('contador-resultados'),
  estadoVazio: document.getElementById('estado-vazio'),
  favoritos: document.getElementById('favoritos-btn'),
  ordenacao: document.getElementById('ordenacao'),
  surpresa: document.getElementById('surpresa-btn'),
  total: document.getElementById('total-personagens')
};

const DESTAQUES = [
  {
    name: 'Mordecai',
    species: 'Gaio-azul',
    occupation: 'Funcionário do parque',
    categories: ['Funcionários do parque'],
    image: 'https://raw.githubusercontent.com/mubashir1osmani/mordecai/e84f851eab538f8cfdf50128321e1f22f81b6bfe/Mordecai_2024.PNG.webp'
  },
  {
    name: 'Rigby',
    species: 'Guaxinim',
    occupation: 'Funcionário do parque',
    categories: ['Funcionários do parque'],
    image: 'https://raw.githubusercontent.com/Karam-08/Codealongs/c2cb8ed33ce26166f2d87839afcf33a51c0267ed/html.basics/images/Rigby_2024.PNG.webp'
  }
];

const PERSONAGENS_RESERVA = [
  ...DESTAQUES,
  { name: 'Benson', species: 'Máquina de chicletes', occupation: 'Gerente do parque', categories: ['Funcionários do parque'], image: '' },
  { name: 'Pops', species: 'Lollilandês', occupation: 'Funcionário do parque', status: 'Falecido', categories: ['Funcionários do parque'], image: '' },
  { name: 'Skips', species: 'Yeti', occupation: 'Zelador do parque', categories: ['Funcionários do parque'], image: '' },
  { name: 'Muscle Man', species: 'Humano', occupation: 'Funcionário do parque', categories: ['Funcionários do parque'], image: '' },
  { name: 'Hi Five Ghost', species: 'Fantasma', occupation: 'Funcionário do parque', categories: ['Funcionários do parque'], image: '' },
  { name: 'Eileen', species: 'Toupeira', occupation: 'Amiga do parque', categories: ['Amigos do parque'], image: '' },
  { name: 'Margaret', species: 'Pisco-de-peito-ruivo', occupation: 'Garçonete', categories: ['Amigos do parque'], image: '' },
  { name: 'Thomas', species: 'Cabra', occupation: 'Estagiário do parque', categories: ['Funcionários do parque'], image: '' }
];

const estado = {
  personagens: [],
  favoritos: carregarFavoritos(),
  somenteFavoritos: false,
  quantidadeVisivel: TAMANHO_PAGINA,
  termoBusca: '',
  ordem: 'az'
};

function carregarFavoritos() {
  try {
    const salvos = JSON.parse(localStorage.getItem(CHAVE_FAVORITOS) || '[]');
    return new Set(Array.isArray(salvos) ? salvos.map(String) : []);
  } catch (erro) {
    console.warn('Não foi possível acessar os favoritos salvos neste navegador.', erro);
    return new Set();
  }
}

function salvarFavoritos() {
  try {
    localStorage.setItem(CHAVE_FAVORITOS, JSON.stringify([...estado.favoritos]));
  } catch (erro) {
    console.warn('Os favoritos ficarão disponíveis somente enquanto esta página estiver aberta.', erro);
  }
}

function textoSimples(valor) {
  if (Array.isArray(valor)) {
    return valor.map(textoSimples).filter(Boolean).join(', ');
  }

  if (typeof valor === 'string' || typeof valor === 'number') {
    return String(valor).trim();
  }

  return '';
}

function normalizarBusca(valor) {
  return textoSimples(valor)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR');
}

function identificador(personagem) {
  return String(personagem.slug || personagem.id || normalizarBusca(personagem.name));
}

function normalizarPersonagem(personagem) {
  if (!personagem || typeof personagem.name !== 'string' || !personagem.name.trim()) {
    return null;
  }

  const info = personagem.info && typeof personagem.info === 'object'
    ? personagem.info
    : {};

  return {
    id: personagem.id ?? personagem.slug ?? normalizarBusca(personagem.name),
    slug: personagem.slug || normalizarBusca(personagem.name).replace(/\s+/g, '-'),
    name: personagem.name.trim(),
    image: typeof personagem.image === 'string' ? personagem.image : '',
    categories: Array.isArray(personagem.categories)
      ? personagem.categories.filter(categoria => typeof categoria === 'string')
      : [],
    info,
    featured: Boolean(personagem.featured)
  };
}

function normalizarLista(dados) {
  const lista = Array.isArray(dados?.characters)
    ? dados.characters
    : Array.isArray(dados?.results)
      ? dados.results
      : null;

  if (!lista) {
    throw new Error('A resposta da fonte de dados não contém uma lista de personagens.');
  }

  const personagens = lista.map(normalizarPersonagem).filter(Boolean);
  if (personagens.length === 0) {
    throw new Error('A fonte de dados não retornou personagens válidos.');
  }

  return personagens;
}

function incluirDestaques(personagens) {
  const nomesExistentes = new Set(personagens.map(personagem => normalizarBusca(personagem.name)));
  const destaquesAusentes = DESTAQUES
    .filter(personagem => !nomesExistentes.has(normalizarBusca(personagem.name)))
    .map((personagem, indice) => normalizarPersonagem({
      ...personagem,
      id: `destaque-${indice + 1}`,
      slug: `destaque-${normalizarBusca(personagem.name).replace(/\s+/g, '-')}`,
      featured: true
    }));

  const resultado = [...destaquesAusentes, ...personagens];
  resultado.forEach(personagem => {
    if (DESTAQUES.some(destaque => normalizarBusca(destaque.name) === normalizarBusca(personagem.name))) {
      personagem.featured = true;
    }
  });

  return resultado;
}

async function buscarDados(url) {
  const controlador = new AbortController();
  const temporizador = window.setTimeout(() => controlador.abort(), 10000);

  try {
    const resposta = await fetch(url, { signal: controlador.signal });
    if (!resposta.ok) {
      throw new Error(`A fonte respondeu com HTTP ${resposta.status}.`);
    }
    return await resposta.json();
  } finally {
    window.clearTimeout(temporizador);
  }
}

async function carregarPersonagens() {
  elementos.aviso.textContent = 'Conectando às fontes públicas de dados...';

  try {
    const dados = await buscarDados(API_PRINCIPAL);
    estado.personagens = incluirDestaques(normalizarLista(dados));
    elementos.aviso.textContent = 'Personagens carregados da fonte pública de dados.';
  } catch (erroApi) {
    console.warn('A fonte pública está indisponível. Usando o catálogo local de reserva.', erroApi);
    estado.personagens = incluirDestaques(normalizarLista({ characters: PERSONAGENS_RESERVA }));
    elementos.aviso.textContent = 'Sem conexão com a fonte externa. Exibindo uma seleção local para o catálogo continuar funcionando.';
  }

  elementos.total.textContent = String(estado.personagens.length);
  renderizarPersonagens();
}

function imagemDoPersonagem(caminho) {
  if (!caminho) {
    return '';
  }
  if (/^https?:\/\//i.test(caminho)) {
    return caminho;
  }

  const caminhoRelativo = caminho.replace(/^\/?(public\/)?/, '');
  return `${IMAGENS_ESPELHO}${caminhoRelativo}`;
}

function criarAvatar(nome) {
  const avatar = document.createElement('span');
  avatar.className = 'avatar-fallback';
  avatar.setAttribute('aria-hidden', 'true');
  avatar.textContent = nome
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(parte => parte[0])
    .join('')
    .toLocaleUpperCase('pt-BR');
  return avatar;
}

function criarDetalhe(rotulo, valor) {
  const linha = document.createElement('div');
  const termo = document.createElement('dt');
  const descricao = document.createElement('dd');
  termo.textContent = rotulo;
  descricao.textContent = textoSimples(valor) || 'Não informado';
  descricao.title = descricao.textContent;
  linha.append(termo, descricao);
  return linha;
}

function criarCard(personagem) {
  const card = document.createElement('article');
  const id = identificador(personagem);
  const favorito = estado.favoritos.has(id);
  card.className = 'card-personagem';
  card.id = `personagem-${id.replace(/[^a-z0-9_-]/gi, '-')}`;

  const imagemBox = document.createElement('div');
  imagemBox.className = 'imagem-personagem';

  const imagem = document.createElement('img');
  const urlImagem = imagemDoPersonagem(personagem.image);
  imagem.alt = `Imagem de ${personagem.name}`;
  imagem.loading = 'lazy';
  imagem.decoding = 'async';
  imagem.addEventListener('error', () => {
    imagem.replaceWith(criarAvatar(personagem.name));
  }, { once: true });

  if (urlImagem) {
    imagem.src = urlImagem;
    imagemBox.appendChild(imagem);
  } else {
    imagemBox.appendChild(criarAvatar(personagem.name));
  }

  const idEtiqueta = document.createElement('span');
  idEtiqueta.className = 'id-personagem';
  idEtiqueta.textContent = `ARQUIVO #${personagem.id}`;

  const botaoFavorito = document.createElement('button');
  botaoFavorito.className = `botao-favorito${favorito ? ' ativo' : ''}`;
  botaoFavorito.type = 'button';
  botaoFavorito.setAttribute('aria-label', favorito
    ? `Remover ${personagem.name} dos favoritos`
    : `Adicionar ${personagem.name} aos favoritos`);
  botaoFavorito.setAttribute('aria-pressed', String(favorito));
  botaoFavorito.title = favorito ? 'Remover dos favoritos' : 'Adicionar aos favoritos';
  botaoFavorito.textContent = favorito ? '♥' : '♡';
  botaoFavorito.addEventListener('click', () => alternarFavorito(id));

  imagemBox.append(idEtiqueta, botaoFavorito);

  const conteudo = document.createElement('div');
  conteudo.className = 'conteudo-card';

  const nome = document.createElement('h3');
  nome.className = 'nome-personagem';
  nome.textContent = personagem.name;
  nome.title = personagem.name;

  const categoria = document.createElement('span');
  categoria.className = 'categoria-personagem';
  categoria.textContent = categoriaPrincipal(personagem);

  const detalhes = document.createElement('dl');
  detalhes.className = 'detalhes-card';
  const status = personagem.info.Status || personagem.info.status;
  const especie = personagem.info.Species || personagem.info.species;
  const ocupacao = personagem.info.Occupation || personagem.info.occupation;
  const descricao = personagem.categories.find(item => normalizarBusca(item) !== 'characters');

  if (status) {
    detalhes.appendChild(criarDetalhe('Status', status));
  }
  if (especie) {
    detalhes.appendChild(criarDetalhe('Espécie', especie));
  }
  if (ocupacao && detalhes.childElementCount < 2) {
    detalhes.appendChild(criarDetalhe('Ocupação', ocupacao));
  }
  if (detalhes.childElementCount === 0) {
    detalhes.appendChild(criarDetalhe('Ficha', descricao || 'Personagem da série'));
  }

  conteudo.append(nome, categoria, detalhes);
  card.append(imagemBox, conteudo);
  return card;
}

function categoriaPrincipal(personagem) {
  return personagem.categories.find(categoria =>
    !['characters', 'recurring characters', 'featured articles'].includes(normalizarBusca(categoria))
  ) || 'Personagem da série';
}

function personagensFiltrados() {
  const termo = normalizarBusca(estado.termoBusca);
  const lista = estado.personagens.filter(personagem => {
    const busca = [
      personagem.name,
      personagem.slug,
      personagem.info.Species,
      personagem.info.Occupation,
      personagem.categories
    ].map(normalizarBusca).join(' ');

    return (!termo || busca.includes(termo))
      && (!estado.somenteFavoritos || estado.favoritos.has(identificador(personagem)));
  });

  return lista.sort((a, b) => {
    if (a.featured !== b.featured) {
      return a.featured ? -1 : 1;
    }
    const comparacao = a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' });
    return estado.ordem === 'za' ? -comparacao : comparacao;
  });
}

function renderizarPersonagens() {
  const filtrados = personagensFiltrados();
  const visiveis = filtrados.slice(0, estado.quantidadeVisivel);
  elementos.cards.replaceChildren(...visiveis.map(criarCard));
  elementos.contador.textContent = String(filtrados.length);
  elementos.estadoVazio.hidden = filtrados.length > 0;
  elementos.cards.hidden = filtrados.length === 0;
  elementos.mais.hidden = filtrados.length <= estado.quantidadeVisivel;
  elementos.favoritos.setAttribute('aria-pressed', String(estado.somenteFavoritos));
  elementos.favoritos.innerHTML = `${estado.somenteFavoritos ? '<span aria-hidden="true">♥</span>' : '<span aria-hidden="true">♡</span>'} Favoritos`;
}

function alternarFavorito(id) {
  if (estado.favoritos.has(id)) {
    estado.favoritos.delete(id);
  } else {
    estado.favoritos.add(id);
  }
  salvarFavoritos();
  renderizarPersonagens();
}

function limparFiltros() {
  estado.termoBusca = '';
  estado.somenteFavoritos = false;
  estado.quantidadeVisivel = TAMANHO_PAGINA;
  estado.ordem = 'az';
  elementos.busca.value = '';
  elementos.ordenacao.value = 'az';
  renderizarPersonagens();
}

function sortearPersonagem() {
  if (estado.personagens.length === 0) {
    return;
  }

  const escolhido = estado.personagens[Math.floor(Math.random() * estado.personagens.length)];
  estado.termoBusca = '';
  estado.somenteFavoritos = false;
  estado.ordem = 'az';
  estado.quantidadeVisivel = Math.max(TAMANHO_PAGINA, personagensFiltrados().findIndex(personagem =>
    identificador(personagem) === identificador(escolhido)
  ) + 1);
  elementos.busca.value = '';
  elementos.ordenacao.value = 'az';
  renderizarPersonagens();

  const id = `personagem-${identificador(escolhido).replace(/[^a-z0-9_-]/gi, '-')}`;
  const card = document.getElementById(id);
  if (card) {
    card.scrollIntoView({ behavior: 'smooth', block: 'center' });
    card.classList.add('sorteado');
    window.setTimeout(() => card.classList.remove('sorteado'), 1400);
  }
}

elementos.busca.addEventListener('input', evento => {
  estado.termoBusca = evento.target.value;
  estado.quantidadeVisivel = TAMANHO_PAGINA;
  renderizarPersonagens();
});

elementos.ordenacao.addEventListener('change', evento => {
  estado.ordem = evento.target.value;
  estado.quantidadeVisivel = TAMANHO_PAGINA;
  renderizarPersonagens();
});

elementos.favoritos.addEventListener('click', () => {
  estado.somenteFavoritos = !estado.somenteFavoritos;
  estado.quantidadeVisivel = TAMANHO_PAGINA;
  renderizarPersonagens();
});

elementos.mais.addEventListener('click', () => {
  estado.quantidadeVisivel += TAMANHO_PAGINA;
  renderizarPersonagens();
});

elementos.limpar.addEventListener('click', limparFiltros);
elementos.limparVazio.addEventListener('click', limparFiltros);
elementos.surpresa.addEventListener('click', sortearPersonagem);

carregarPersonagens();
