import { REGRAS_PADRAO, categorizar } from './categorizador.js';
import { parseArquivo } from './parsers.js';
import { filtrar, formatarMoeda, nomeMes, resumir } from './resumo.js';

const CORES = ['#3fb950', '#58a6ff', '#f78166', '#d2a8ff', '#e3b341', '#ff7b72', '#79c0ff', '#56d364', '#ffa657', '#bc8cff', '#8b949e'];
const CHAVE_REGRAS = 'dashboard-financas:regras';

const $ = (id) => document.getElementById(id);
const estado = {
  transacoes: [],
  regrasPersonalizadas: lerRegrasSalvas(),
  filtros: { mes: '', categoria: '', busca: '' },
};
const graficos = {};

if (window.Chart) {
  Chart.defaults.color = '#8b949e';
  Chart.defaults.borderColor = '#30363d';
  Chart.defaults.maintainAspectRatio = false;
}

// ---------- Persistência das regras (opcional; o navegador pode bloquear) ----------
function lerRegrasSalvas() {
  try {
    return JSON.parse(localStorage.getItem(CHAVE_REGRAS) || '[]');
  } catch {
    return [];
  }
}

function salvarRegras() {
  try {
    localStorage.setItem(CHAVE_REGRAS, JSON.stringify(estado.regrasPersonalizadas));
  } catch {
    /* sem armazenamento: as regras valem só nesta sessão */
  }
}

const regrasAtivas = () => [...estado.regrasPersonalizadas, ...REGRAS_PADRAO];

// ---------- Importação ----------
async function lerTexto(arquivo) {
  const buffer = await arquivo.arrayBuffer();
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(buffer);
  } catch {
    return new TextDecoder('iso-8859-1').decode(buffer); // comum em extratos de bancos brasileiros
  }
}

const chave = (t) => t.data + '|' + t.descricao + '|' + t.valor;

function adicionar(novas) {
  const existentes = new Set(estado.transacoes.map(chave));
  for (const t of novas) {
    if (!existentes.has(chave(t))) {
      existentes.add(chave(t));
      estado.transacoes.push(t);
    }
  }
  recategorizar();
}

function recategorizar() {
  const regras = regrasAtivas();
  for (const t of estado.transacoes) t.categoria = categorizar(t, regras);
  estado.transacoes.sort((a, b) => b.data.localeCompare(a.data));
}

async function importar(arquivos) {
  const erros = [];
  for (const arquivo of arquivos) {
    try {
      adicionar(parseArquivo(arquivo.name, await lerTexto(arquivo)));
    } catch (e) {
      erros.push(arquivo.name + ': ' + e.message);
    }
  }
  mostrarAviso(erros.join('\n'));
  render();
}

async function carregarExemplo() {
  const resposta = await fetch('exemplos/extrato-exemplo.csv');
  const texto = await resposta.text();
  adicionar(parseArquivo('extrato-exemplo.csv', texto));
  render();
}

function mostrarAviso(texto) {
  $('aviso').textContent = texto;
  $('aviso').hidden = !texto;
}

// ---------- Renderização ----------
function render() {
  const temDados = estado.transacoes.length > 0;
  $('painel').hidden = !temDados;
  $('btn-exportar').disabled = !temDados;
  $('btn-limpar').disabled = !temDados;
  if (!temDados) return;

  preencherFiltros();
  const visiveis = filtrar(estado.transacoes, estado.filtros);
  const r = resumir(visiveis);

  $('kpi-receitas').textContent = formatarMoeda(r.receitas);
  $('kpi-despesas').textContent = formatarMoeda(r.despesas);
  $('kpi-saldo').textContent = formatarMoeda(r.saldo);
  $('kpi-saldo').className = r.saldo >= 0 ? 'positivo' : 'negativo';
  $('kpi-maior').textContent = r.categorias[0] ? r.categorias[0].categoria : '-';

  desenharGraficos(r);
  desenharTabela(visiveis);
  desenharRegras();
}

function preencherSelect(select, valores, rotulo, rotuloPadrao) {
  const atual = select.value;
  select.replaceChildren(new Option(rotuloPadrao, ''));
  for (const v of valores) select.append(new Option(rotulo(v), v));
  select.value = valores.includes(atual) ? atual : '';
}

function preencherFiltros() {
  const meses = [...new Set(estado.transacoes.map((t) => t.data.slice(0, 7)))].sort().reverse();
  const categorias = [...new Set(estado.transacoes.map((t) => t.categoria))].sort();
  preencherSelect($('filtro-mes'), meses, nomeMes, 'Todos os meses');
  preencherSelect($('filtro-categoria'), categorias, (c) => c, 'Todas as categorias');
  estado.filtros.mes = $('filtro-mes').value;
  estado.filtros.categoria = $('filtro-categoria').value;

  const lista = $('lista-categorias');
  lista.replaceChildren(...categorias.map((c) => new Option(c)));
}

function desenhar(id, config) {
  if (!window.Chart) return;
  if (graficos[id]) graficos[id].destroy();
  graficos[id] = new Chart($(id), config);
}

function desenharGraficos(r) {
  const moeda = { callbacks: { label: (ctx) => ' ' + formatarMoeda(ctx.parsed.y ?? ctx.parsed) } };

  desenhar('grafico-categorias', {
    type: 'doughnut',
    data: {
      labels: r.categorias.map((c) => c.categoria),
      datasets: [{ data: r.categorias.map((c) => c.total), backgroundColor: CORES, borderWidth: 0 }],
    },
    options: { plugins: { legend: { position: 'right' }, tooltip: moeda }, cutout: '62%' },
  });

  desenhar('grafico-meses', {
    type: 'bar',
    data: {
      labels: r.meses.map((m) => nomeMes(m.mes)),
      datasets: [
        { label: 'Receitas', data: r.meses.map((m) => m.receitas), backgroundColor: '#3fb950', borderRadius: 6 },
        { label: 'Despesas', data: r.meses.map((m) => m.despesas), backgroundColor: '#f85149', borderRadius: 6 },
      ],
    },
    options: { plugins: { tooltip: moeda } },
  });

  desenhar('grafico-saldo', {
    type: 'line',
    data: {
      labels: r.meses.map((m) => nomeMes(m.mes)),
      datasets: [{
        label: 'Saldo acumulado',
        data: r.meses.map((m) => m.acumulado),
        borderColor: '#58a6ff',
        backgroundColor: 'rgba(88,166,255,.15)',
        fill: true,
        tension: 0.3,
      }],
    },
    options: { plugins: { legend: { display: false }, tooltip: moeda } },
  });
}

function desenharTabela(transacoes) {
  const categorias = [...new Set([...regrasAtivas().map((r) => r.categoria), 'Outros', 'Outras receitas'])].sort();
  const linhas = transacoes.map((t) => {
    const tr = document.createElement('tr');

    const data = document.createElement('td');
    data.textContent = t.data.split('-').reverse().join('/');

    const descricao = document.createElement('td');
    descricao.textContent = t.descricao;

    const categoria = document.createElement('td');
    const select = document.createElement('select');
    for (const c of categorias) select.append(new Option(c, c));
    select.value = t.categoria;
    select.title = 'Corrigir a categoria desta transação';
    select.addEventListener('change', () => {
      t.categoriaManual = select.value;
      recategorizar();
      render();
    });
    categoria.append(select);

    const valor = document.createElement('td');
    valor.className = 'num ' + (t.valor >= 0 ? 'positivo' : 'negativo');
    valor.textContent = formatarMoeda(t.valor);

    tr.append(data, descricao, categoria, valor);
    return tr;
  });
  $('tabela').replaceChildren(...linhas);
  $('contador').textContent = '(' + transacoes.length + ')';
}

function desenharRegras() {
  const itens = estado.regrasPersonalizadas.map((regra, i) => {
    const li = document.createElement('li');
    li.textContent = '"' + regra.termos[0] + '" → ' + regra.categoria;
    const remover = document.createElement('button');
    remover.textContent = 'remover';
    remover.addEventListener('click', () => {
      estado.regrasPersonalizadas.splice(i, 1);
      salvarRegras();
      recategorizar();
      render();
    });
    li.append(remover);
    return li;
  });
  $('regras-personalizadas').replaceChildren(...itens);
}

// ---------- Exportação ----------
function exportarCSV() {
  const linhas = [['data', 'descricao', 'valor', 'categoria']];
  for (const t of estado.transacoes) {
    linhas.push([t.data, t.descricao, t.valor.toFixed(2).replace('.', ','), t.categoria]);
  }
  const csv = linhas.map((l) => l.map((c) => '"' + String(c).replace(/"/g, '""') + '"').join(';')).join('\n');
  const url = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = 'transacoes-categorizadas.csv';
  a.click();
  URL.revokeObjectURL(url);
}

// ---------- Eventos ----------
const dropzone = $('dropzone');
$('arquivos').addEventListener('change', (e) => importar([...e.target.files]));
dropzone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropzone.classList.add('ativa');
});
dropzone.addEventListener('dragleave', () => dropzone.classList.remove('ativa'));
dropzone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropzone.classList.remove('ativa');
  importar([...e.dataTransfer.files]);
});

$('btn-exemplo').addEventListener('click', carregarExemplo);
$('btn-exportar').addEventListener('click', exportarCSV);
$('btn-limpar').addEventListener('click', () => {
  estado.transacoes = [];
  mostrarAviso('');
  render();
});

$('filtro-mes').addEventListener('change', (e) => { estado.filtros.mes = e.target.value; render(); });
$('filtro-categoria').addEventListener('change', (e) => { estado.filtros.categoria = e.target.value; render(); });
$('filtro-busca').addEventListener('input', (e) => { estado.filtros.busca = e.target.value; render(); });

$('form-regra').addEventListener('submit', (e) => {
  e.preventDefault();
  const termo = $('regra-termo').value.trim();
  const categoria = $('regra-categoria').value.trim();
  if (!termo || !categoria) return;
  estado.regrasPersonalizadas.unshift({ categoria, termos: [termo] });
  salvarRegras();
  e.target.reset();
  recategorizar();
  render();
});
