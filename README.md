# Arquivo do Parque

Catálogo responsivo de personagens de **Apenas um Show**, feito com HTML, CSS e JavaScript puro. Os cards são criados pelo JavaScript a partir dos dados recebidos com `fetch`.

## Como executar

Abra esta pasta no VS Code e inicie o **Live Server** pelo arquivo `index.html`. Se preferir, abra um terminal nesta pasta e rode:

```powershell
py -m http.server 8000
```

Depois, acesse <http://localhost:8000>. Não é necessário instalar dependências nem usar um processo de build.

## O que funciona

- Busca por nome, espécie e ocupação, sem diferenciar maiúsculas ou acentos.
- Ordenação alfabética crescente ou decrescente.
- Favoritos salvos no navegador e filtro para exibi-los.
- Carregamento progressivo dos cards, botão de personagem surpresa e estado vazio com opção para limpar os filtros.
- Layout adaptável para celular e computador, com suporte a teclado e leitores de tela.

## Dados e imagens

Os dados dos personagens são carregados com `fetch` do arquivo JSON público do repositório [regularshow-api](https://github.com/oguzhan18/regularshow-api). A rota hospedada `regularshow-api.vercel.app/api/character` estava respondendo com erro 404. Mordecai e Rigby não estão incluídos nesse JSON, então seus cards usam URLs diretas de imagem; os demais cards usam os caminhos de imagem fornecidos pelo catálogo. Se a fonte de dados estiver indisponível, uma seleção local mantém a interface utilizável.

Essas fontes são externas e dependem de conexão com a internet para exibir o catálogo completo e suas imagens. O site não usa token nem bibliotecas externas de interface.
