import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { dividirLinha, parseCSV, parseData, parseOFX, parseValor } from '../js/parsers.js';

describe('parseValor', () => {
  it('entende formatos brasileiros e internacionais', () => {
    assert.equal(parseValor('1.234,56'), 1234.56);
    assert.equal(parseValor('-45,90'), -45.9);
    assert.equal(parseValor('1234.56'), 1234.56);
    assert.equal(parseValor('R$ 10,00'), 10);
    assert.equal(parseValor('(10,00)'), -10);
  });

  it('rejeita valores inválidos', () => {
    assert.throws(() => parseValor('abc'));
    assert.throws(() => parseValor(''));
  });
});

describe('parseData', () => {
  it('converte para AAAA-MM-DD', () => {
    assert.equal(parseData('05/11/2026'), '2026-11-05');
    assert.equal(parseData('2026-11-05'), '2026-11-05');
    assert.equal(parseData('20261105120000[-3:BRT]'), '2026-11-05');
  });
});

describe('parseCSV', () => {
  it('detecta ponto e vírgula, aspas e acentos no cabeçalho', () => {
    const csv = 'Data;Descrição;Valor\n05/11/2026;"Mercado; Centro";-10,50\n06/11/2026;Salário;2.000,00\n';
    assert.deepEqual(parseCSV(csv), [
      { data: '2026-11-05', descricao: 'Mercado; Centro', valor: -10.5 },
      { data: '2026-11-06', descricao: 'Salário', valor: 2000 },
    ]);
  });

  it('aceita CSV com vírgula e cabeçalho em inglês', () => {
    const csv = 'date,description,amount\n2026-11-05,Coffee,-3.50\n';
    assert.deepEqual(parseCSV(csv), [{ data: '2026-11-05', descricao: 'Coffee', valor: -3.5 }]);
  });

  it('avisa quando falta coluna obrigatória', () => {
    assert.throws(() => parseCSV('data;valor\n05/11/2026;10\n'), /descricao/);
  });
});

describe('dividirLinha', () => {
  it('trata aspas escapadas', () => {
    assert.deepEqual(dividirLinha('a;"b ""c""";d', ';'), ['a', 'b "c"', 'd']);
  });
});

describe('parseOFX', () => {
  it('lê transações usando MEMO ou NAME', () => {
    const ofx = '<STMTTRN>\n<DTPOSTED>20261205\n<TRNAMT>-31.20\n<NAME>UBER *TRIP\n</STMTTRN>';
    assert.deepEqual(parseOFX(ofx), [{ data: '2026-12-05', descricao: 'UBER *TRIP', valor: -31.2 }]);
  });
});
