# 💰 Dashboard de Finanças Pessoais

Importe extratos bancários **CSV ou OFX**, deixe o dashboard **categorizar seus gastos automaticamente** e acompanhe tudo em **gráficos interativos** — receitas x despesas, gastos por categoria e evolução do saldo.

### 🔗 [Ver demonstração ao vivo](https://joseweslei45-debug.github.io/dashboard-financas/)

> Clique em **"Carregar exemplo"** para testar com um extrato fictício de 3 meses.

![JavaScript](https://img.shields.io/badge/JavaScript-ES_Modules-F7DF1E?logo=javascript&logoColor=black)
![Chart.js](https://img.shields.io/badge/Chart.js-4-FF6384?logo=chartdotjs&logoColor=white)
![Sem backend](https://img.shields.io/badge/backend-nenhum-2ea043)
![Tests](https://img.shields.io/badge/tests-node%3Atest-339933?logo=nodedotjs&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-blue)

## ✨ Funcionalidades

- 📥 **Importação** de CSV (`;` ou `,`, com ou sem aspas) e **OFX** — o formato que a maioria dos bancos exporta
- 🇧🇷 Entende valores brasileiros (`1.234,56`, `R$ 10,00`, `(10,00)`) e arquivos em **UTF-8 ou ISO-8859-1**
- 🏷️ **Categorização automática** por palavras-chave (Mercado, Transporte, Moradia, Assinaturas...)
- ✍️ Corrija a categoria de qualquer transação ou **crie suas próprias regras** (salvas no navegador)
- 📊 Gráficos de **despesas por categoria**, **receitas x despesas por mês** e **saldo acumulado**
- 🔎 Filtros por mês, categoria e busca por descrição
- 🧹 Remove transações duplicadas ao importar o mesmo extrato duas vezes
- 📤 Exporta as transações categorizadas para CSV (abre direto no Excel)
- 🔒 **Privacidade**: nada sai do seu computador — não existe servidor

## 🧠 Como a categorização funciona

Cada regra tem uma categoria e uma lista de termos. A descrição é normalizada (minúsculas, sem acentos) e comparada por **palavra inteira** — assim "DOCERIA" não é confundida com "DOC" (transferência). A primeira regra que casar vence; suas regras personalizadas têm prioridade sobre as padrão.

```js
{ categoria: 'Transporte', termos: ['uber', '99', 'posto', 'combustivel'] }
```

## 📄 Formato do CSV

```csv
data;descricao;valor
05/11/2026;SUPERMERCADO ASSAI;-412,37
05/11/2026;SALARIO EMPRESA XYZ;3.200,00
```

Também são aceitos cabeçalhos como `Descrição`, `Histórico`, `date`, `description` e `amount`.

## 🚀 Rodando localmente

Por usar ES Modules, abra com um servidor estático (não funciona via `file://`):

```bash
npx serve .
# ou
python -m http.server 8000
```

## 🧪 Testes

A lógica (parsers, categorização e resumo) é escrita em funções puras e testada com o test runner nativo do Node:

```bash
npm test
```

## 📁 Estrutura

```
index.html
css/style.css
js/
├── parsers.js        # CSV/OFX → transações
├── categorizador.js  # regras de categorização
├── resumo.js         # totais, agrupamentos e filtros
└── app.js            # interface e gráficos
exemplos/             # extratos fictícios para teste
test/                 # testes unitários
```

## 🗺️ Roadmap

- [ ] Metas de gastos por categoria com alertas
- [ ] Modo PWA para usar offline no celular
- [ ] Sugestão de categoria com base no histórico

---
Desenvolvido por [Weslei Sousa](https://github.com/joseweslei45-debug) · Licença MIT
