const centavos = (n) => Math.round(n * 100) / 100;
const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

export function filtrar(transacoes, { mes = '', categoria = '', busca = '' } = {}) {
  const termo = busca.trim().toLowerCase();
  return transacoes.filter(
    (t) =>
      (!mes || t.data.startsWith(mes)) &&
      (!categoria || t.categoria === categoria) &&
      (!termo || t.descricao.toLowerCase().includes(termo)),
  );
}

export function resumir(transacoes) {
  let receitas = 0;
  let despesas = 0;
  const porCategoria = new Map();
  const porMes = new Map();

  for (const t of transacoes) {
    const mes = t.data.slice(0, 7);
    if (!porMes.has(mes)) porMes.set(mes, { receitas: 0, despesas: 0 });
    const m = porMes.get(mes);
    if (t.valor >= 0) {
      receitas += t.valor;
      m.receitas += t.valor;
    } else {
      despesas -= t.valor;
      m.despesas -= t.valor;
      porCategoria.set(t.categoria, (porCategoria.get(t.categoria) || 0) - t.valor);
    }
  }

  const categorias = [...porCategoria]
    .map(([categoria, total]) => ({ categoria, total: centavos(total) }))
    .sort((a, b) => b.total - a.total);

  let acumulado = 0;
  const meses = [...porMes]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([mes, v]) => {
      acumulado += v.receitas - v.despesas;
      return {
        mes,
        receitas: centavos(v.receitas),
        despesas: centavos(v.despesas),
        saldo: centavos(v.receitas - v.despesas),
        acumulado: centavos(acumulado),
      };
    });

  return {
    receitas: centavos(receitas),
    despesas: centavos(despesas),
    saldo: centavos(receitas - despesas),
    categorias,
    meses,
    quantidade: transacoes.length,
  };
}

export function formatarMoeda(valor) {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

/** '2026-11' -> 'nov/26' */
export function nomeMes(chave) {
  const [ano, mes] = chave.split('-');
  return MESES[Number(mes) - 1] + '/' + ano.slice(2);
}
