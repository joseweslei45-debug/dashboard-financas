import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { filtrar, nomeMes, resumir } from '../js/resumo.js';

const transacoes = [
  { data: '2026-10-05', descricao: 'Salário', valor: 3000, categoria: 'Salário' },
  { data: '2026-10-07', descricao: 'Mercado', valor: -400.1, categoria: 'Mercado' },
  { data: '2026-11-05', descricao: 'Salário', valor: 3000, categoria: 'Salário' },
  { data: '2026-11-06', descricao: 'Aluguel', valor: -850, categoria: 'Moradia' },
  { data: '2026-11-08', descricao: 'Mercado', valor: -200.2, categoria: 'Mercado' },
];

describe('resumir', () => {
  const r = resumir(transacoes);

  it('soma receitas, despesas e saldo sem erro de ponto flutuante', () => {
    assert.equal(r.receitas, 6000);
    assert.equal(r.despesas, 1450.3);
    assert.equal(r.saldo, 4549.7);
  });

  it('agrupa despesas por categoria em ordem decrescente', () => {
    assert.deepEqual(r.categorias, [
      { categoria: 'Moradia', total: 850 },
      { categoria: 'Mercado', total: 600.3 },
    ]);
  });

  it('agrupa por mês com saldo acumulado', () => {
    assert.deepEqual(r.meses.map((m) => [m.mes, m.saldo, m.acumulado]), [
      ['2026-10', 2599.9, 2599.9],
      ['2026-11', 1949.8, 4549.7],
    ]);
  });
});

describe('filtrar', () => {
  it('combina mês, categoria e busca', () => {
    assert.equal(filtrar(transacoes, { mes: '2026-11' }).length, 3);
    assert.equal(filtrar(transacoes, { categoria: 'Mercado', busca: 'merc' }).length, 2);
  });
});

describe('nomeMes', () => {
  it('formata a chave do mês', () => {
    assert.equal(nomeMes('2026-11'), 'nov/26');
  });
});
