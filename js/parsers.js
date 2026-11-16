/**
 * Leitura de extratos bancários (CSV e OFX) para o formato:
 * { data: 'AAAA-MM-DD', descricao: string, valor: number }
 * Valores negativos são despesas; positivos, receitas.
 */

const CABECALHOS = {
  data: ['data', 'date', 'dt', 'data lancamento'],
  descricao: ['descricao', 'historico', 'description', 'lancamento', 'memo', 'estabelecimento'],
  valor: ['valor', 'amount', 'value', 'quantia', 'valor (r$)'],
};

export function normalizarTexto(texto) {
  return String(texto)
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

/** Aceita "1.234,56", "-45,90", "1234.56", "R$ 10,00" e "(10,00)". */
export function parseValor(bruto) {
  let s = String(bruto ?? '').trim().replace(/[R$\s]/g, '');
  const negativo = s.startsWith('-') || /^\(.*\)$/.test(s);
  s = s.replace(/[()+-]/g, '');
  if (s.includes(',') && s.lastIndexOf(',') > s.lastIndexOf('.')) {
    s = s.replace(/\./g, '').replace(',', '.');
  } else {
    s = s.replace(/,/g, '');
  }
  const n = Number(s);
  if (s === '' || !Number.isFinite(n)) throw new Error('Valor inválido: ' + bruto);
  return negativo ? -n : n;
}

/** Aceita "05/11/2026", "2026-11-05" e o formato OFX "20261105120000[-3:BRT]". */
export function parseData(bruto) {
  const s = String(bruto ?? '').trim();
  let m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (m) return m[3] + '-' + m[2] + '-' + m[1];
  m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return m[1] + '-' + m[2] + '-' + m[3];
  m = s.match(/^(\d{4})(\d{2})(\d{2})/);
  if (m) return m[1] + '-' + m[2] + '-' + m[3];
  throw new Error('Data inválida: ' + bruto);
}

/** Divide uma linha CSV respeitando campos entre aspas. */
export function dividirLinha(linha, separador) {
  const campos = [];
  let atual = '';
  let aspas = false;
  for (let i = 0; i < linha.length; i++) {
    const c = linha[i];
    if (c === '"') {
      if (aspas && linha[i + 1] === '"') {
        atual += '"';
        i++;
      } else {
        aspas = !aspas;
      }
    } else if (c === separador && !aspas) {
      campos.push(atual);
      atual = '';
    } else {
      atual += c;
    }
  }
  campos.push(atual);
  return campos;
}

export function parseCSV(texto) {
  const linhas = texto.replace(/^﻿/, '').split(/\r?\n/).filter((l) => l.trim());
  if (linhas.length < 2) return [];

  const pontoEVirgula = (linhas[0].match(/;/g) || []).length;
  const virgulas = (linhas[0].match(/,/g) || []).length;
  const separador = pontoEVirgula >= virgulas ? ';' : ',';

  const cabecalho = dividirLinha(linhas[0], separador).map(normalizarTexto);
  const indice = {};
  for (const [campo, nomes] of Object.entries(CABECALHOS)) {
    indice[campo] = cabecalho.findIndex((h) => nomes.includes(h));
    if (indice[campo] < 0) throw new Error('Coluna "' + campo + '" não encontrada no CSV');
  }

  return linhas.slice(1).map((linha) => {
    const c = dividirLinha(linha, separador);
    return {
      data: parseData(c[indice.data]),
      descricao: (c[indice.descricao] || '').trim(),
      valor: parseValor(c[indice.valor]),
    };
  });
}

export function parseOFX(texto) {
  const blocos = texto.split(/<STMTTRN>/i).slice(1);
  return blocos.map((bloco) => {
    const tag = (nome) => {
      const m = bloco.match(new RegExp('<' + nome + '>([^<\\r\\n]+)', 'i'));
      return m ? m[1].trim() : '';
    };
    return {
      data: parseData(tag('DTPOSTED')),
      descricao: tag('MEMO') || tag('NAME'),
      valor: parseValor(tag('TRNAMT')),
    };
  });
}

export function parseArquivo(nome, texto) {
  return /\.ofx$/i.test(nome) ? parseOFX(texto) : parseCSV(texto);
}
