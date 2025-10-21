
# 🔗 Correspondência Inteligente Protheus-Tasy

Sistema de correspondência automatizada entre itens dos sistemas Protheus e Tasy usando algoritmos de similaridade textual.

## 📋 Descrição

Esta aplicação Streamlit permite realizar correspondências inteligentes entre descrições de itens cadastrados em dois sistemas diferentes (Protheus e Tasy), utilizando técnicas avançadas de processamento de texto e algoritmos de similaridade.

## ✨ Funcionalidades

### 1. Upload e Validação
- Interface para upload de arquivos Excel (.xls, .xlsx)
- Validação automática da existência das abas "Protheus" e "De Para Almoxarifado"
- Validação das colunas obrigatórias:
  - Aba Protheus: "Descrição" e "Codigo"
  - Aba De Para Almoxarifado: "Descrição do Material Tasy"
- Mensagens claras de erro em caso de problemas
- Pré-visualização das abas após upload bem-sucedido

### 2. Correspondência Avançada
- Leitura da aba "Protheus" e extração de "Descrição" e "Codigo"
- Leitura da aba "De Para Almoxarifado" e extração de "Descrição do Material Tasy"
- Comparação textual usando RapidFuzz (biblioteca de alta performance)
- Pré-processamento inteligente:
  - Normalização de texto
  - Remoção de caracteres especiais
  - Conversão para minúsculas
  - Remoção de espaços extras
- Cálculo de score de similaridade para cada par de descrições
- Identificação automática de múltiplas correspondências
- Marcação para revisão obrigatória quando detectadas ambiguidades

### 3. Interface Interativa
- Slider para ajuste do limiar de similaridade (padrão: 80%)
- Barra de progresso durante processamento
- Tabela interativa mostrando:
  - Código Protheus
  - Descrição Protheus
  - Descrição Tasy (correspondente)
  - Score de similaridade (%)
  - Flag de "Revisão Obrigatória" para múltiplas correspondências
- Ordenação automática por score (decrescente)
- Filtros:
  - Mostrar apenas itens para revisão
  - Filtrar por score mínimo
- Destaque visual (fundo amarelo) para itens que precisam revisão
- Estatísticas em tempo real:
  - Total de correspondências
  - Itens para revisão obrigatória
  - Score médio
  - Correspondências de alta confiança (≥90%)

### 4. Exportação
- Gerar arquivo Excel com apenas os dados relevantes
- Incluir todas as colunas da visualização
- Nome do arquivo com data/hora (ex: correspondencias_20251020_143025.xlsx)
- Botão de download direto na interface
- Arquivo contém apenas correspondências acima do limiar definido

### 5. Design e Usabilidade
- Design limpo e profissional
- Layout responsivo (wide mode)
- Mensagens de sucesso/erro amigáveis com cores distintas
- Logs de processamento visíveis
- Tratamento robusto de exceções
- Instruções de uso claras na tela inicial
- Ícones para melhor visualização

## 🚀 Instalação

### Pré-requisitos
- Python 3.8 ou superior
- pip (gerenciador de pacotes Python)

### Passos

1. Clone ou baixe este repositório

2. Navegue até o diretório do projeto:
```bash
cd protheus-tasy-matcher
```

3. Instale as dependências:
```bash
pip install -r requirements.txt
```

## 📖 Como Usar

1. Inicie a aplicação:
```bash
streamlit run app.py
```

2. A aplicação abrirá automaticamente no seu navegador (geralmente em `http://localhost:8501`)

3. Faça upload do arquivo Excel contendo:
   - Aba "protheus" com colunas "Codigo" e "Descricao"
   - Aba "de para almoxarifado" com coluna "Descrição do Material Tasy"

4. Ajuste o limiar de similaridade conforme necessário (padrão: 80%)

5. Clique em "Iniciar Correspondência"

6. Revise os resultados:
   - Use os filtros para facilitar a análise
   - Preste atenção especial aos itens marcados para "Revisão Obrigatória"

7. Baixe o arquivo Excel com as correspondências

## 📊 Estrutura do Arquivo de Entrada

### Aba "protheus"
| Codigo | Descricao |
|--------|-----------|
| 1 | CLORETO DE SODIO 0.9% 100ML |
| 2 | AGULHA 25X08 C/ DISPOSITIVO - UNIDADE |
| ... | ... |

### Aba "de para almoxarifado"
| Descrição do Material Tasy |
|----------------------------|
| Caneta Azul Bic |
| Grampeador De Mesa 26/6 |
| ... |

## 🔧 Tecnologias Utilizadas

- **Streamlit**: Framework para criação da interface web
- **Pandas**: Manipulação e análise de dados
- **RapidFuzz**: Algoritmos de similaridade textual de alta performance
- **OpenPyXL**: Leitura e escrita de arquivos Excel (.xlsx)
- **XLRD**: Leitura de arquivos Excel (.xls)

## 🧠 Algoritmo de Correspondência

A aplicação utiliza o algoritmo **Token Sort Ratio** da biblioteca RapidFuzz, que:

1. Tokeniza as strings (divide em palavras)
2. Ordena os tokens alfabeticamente
3. Compara as strings ordenadas
4. Retorna um score de 0 a 100

Este método é robusto contra:
- Ordem diferente das palavras
- Variações de maiúsculas/minúsculas
- Caracteres especiais
- Espaçamento inconsistente

### Critérios para Revisão Obrigatória

Um item é marcado para revisão obrigatória quando:
- Há múltiplas correspondências acima do limiar
- A diferença de score entre as duas melhores correspondências é menor que 5 pontos

Isso indica ambiguidade e requer validação manual.

## 📝 Estrutura do Projeto

```
protheus-tasy-matcher/
│
├── app.py                 # Aplicação principal Streamlit
├── requirements.txt       # Dependências do projeto
└── README.md             # Este arquivo
```

## 🎯 Exemplos de Uso

### Caso 1: Correspondência Exata
- **Tasy**: "Caneta Azul Bic"
- **Protheus**: "CANETA ESFEROGRAFICA AZUL"
- **Score**: 75%
- **Revisão**: NÃO

### Caso 2: Correspondência Ambígua
- **Tasy**: "Luva Descartável"
- **Protheus 1**: "LUVA DESCARTAVEL - G" (Score: 85%)
- **Protheus 2**: "LUVA DESCARTAVEL - M" (Score: 85%)
- **Revisão**: ⚠️ SIM (diferença de score < 5)

### Caso 3: Baixa Similaridade
- **Tasy**: "Computador Desktop"
- **Protheus**: "MOUSE OPTICO USB"
- **Score**: 25%
- **Resultado**: Não aparece nos resultados (abaixo do limiar)

## ⚠️ Considerações Importantes

1. **Limiar de Similaridade**: Um limiar muito alto pode perder correspondências válidas, enquanto um muito baixo pode gerar correspondências incorretas. Recomenda-se começar com 80% e ajustar conforme necessário.

2. **Revisão Manual**: Items marcados com "Revisão Obrigatória" devem ser sempre validados manualmente.

3. **Performance**: Para arquivos muito grandes (>10.000 itens), o processamento pode levar alguns minutos.

4. **Formato do Arquivo**: Certifique-se de que o arquivo Excel está no formato correto e não possui células mescladas ou formatações especiais que possam interferir na leitura.

## 🤝 Contribuindo

Sugestões e melhorias são bem-vindas! Sinta-se à vontade para abrir issues ou enviar pull requests.

## 📄 Licença

Este projeto é de código aberto e está disponível sob a licença MIT.

## 📧 Contato

Para dúvidas ou sugestões, entre em contato através das issues do repositório.

---

Desenvolvido com ❤️ usando Streamlit
