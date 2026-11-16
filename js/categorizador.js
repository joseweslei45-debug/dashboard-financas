import { normalizarTexto } from './parsers.js';

/** Regras simples por palavra-chave. A primeira que casar define a categoria. */
export const REGRAS_PADRAO = [
  { categoria: 'Salário', termos: ['salario', 'folha', 'pagamento empresa', 'pro labore'] },
  { categoria: 'Compras', termos: ['amazon', 'mercado livre', 'shopee', 'magalu', 'americanas', 'kabum'] },
  { categoria: 'Mercado', termos: ['mercado', 'supermercado', 'atacadao', 'assai', 'carrefour', 'mercadinho'] },
  { categoria: 'Alimentação', termos: ['ifood', 'restaurante', 'lanchonete', 'padaria', 'pizzaria', 'burger', 'acai'] },
  { categoria: 'Transporte', termos: ['uber', '99', 'posto', 'combustivel', 'gasolina', 'onibus', 'estacionamento'] },
  { categoria: 'Moradia', termos: ['aluguel', 'condominio', 'energia', 'enel', 'agua', 'cagece', 'internet', 'gas'] },
  { categoria: 'Assinaturas', termos: ['netflix', 'spotify', 'prime video', 'youtube', 'disney', 'game pass', 'icloud'] },
  { categoria: 'Saúde', termos: ['farmacia', 'drogaria', 'clinica', 'hospital', 'academia', 'laboratorio'] },
  { categoria: 'Educação', termos: ['curso', 'faculdade', 'udemy', 'alura', 'livraria', 'escola'] },
  { categoria: 'Lazer', termos: ['cinema', 'steam', 'playstation', 'show', 'ingresso', 'bar '] },
  { categoria: 'Transferências', termos: ['pix', 'ted', 'doc', 'transferencia'] },
];

function escaparRegex(texto) {
  return texto.replace(/[.*+?^()|[\]\\{}$]/g, '\\$&');
}

function casa(descricao, termo) {
  const t = normalizarTexto(termo);
  return new RegExp('(^|[^a-z0-9])' + escaparRegex(t) + '($|[^a-z0-9])').test(descricao);
}

export function categorizar(transacao, regras = REGRAS_PADRAO) {
  if (transacao.categoriaManual) return transacao.categoriaManual;
  const descricao = normalizarTexto(transacao.descricao);
  for (const regra of regras) {
    if (regra.termos.some((termo) => casa(descricao, termo))) return regra.categoria;
  }
  return transacao.valor > 0 ? 'Outras receitas' : 'Outros';
}
