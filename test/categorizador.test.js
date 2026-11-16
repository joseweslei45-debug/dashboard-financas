import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { categorizar } from '../js/categorizador.js';

const t = (descricao, valor = -10) => ({ descricao, valor });

describe('categorizar', () => {
  it('usa palavras-chave ignorando maiúsculas e acentos', () => {
    assert.equal(categorizar(t('SUPERMERCADO ASSAI')), 'Mercado');
    assert.equal(categorizar(t('Farmácia Popular')), 'Saúde');
    assert.equal(categorizar(t('SALARIO EMPRESA', 3000)), 'Salário');
  });

  it('casa palavras inteiras (doceria não vira "doc")', () => {
    assert.equal(categorizar(t('DOCERIA DA ANA')), 'Outros');
    assert.equal(categorizar(t('TED ENVIADA')), 'Transferências');
  });

  it('usa categoria padrão por sinal do valor', () => {
    assert.equal(categorizar(t('ALGO DESCONHECIDO', 50)), 'Outras receitas');
    assert.equal(categorizar(t('ALGO DESCONHECIDO', -50)), 'Outros');
  });

  it('respeita regras personalizadas e correções manuais', () => {
    const regras = [{ categoria: 'Pet', termos: ['petshop'] }];
    assert.equal(categorizar(t('PETSHOP AMIGO'), regras), 'Pet');
    assert.equal(categorizar({ ...t('UBER'), categoriaManual: 'Trabalho' }), 'Trabalho');
  });
});
