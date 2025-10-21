# 🚀 Guia de Início Rápido

## Instalação

```bash
# 1. Navegue até o diretório do projeto
cd protheus-tasy-matcher

# 2. Instale as dependências
pip install -r requirements.txt
```

## Executar a Aplicação

```bash
# Iniciar o servidor Streamlit
streamlit run app.py
```

A aplicação será aberta automaticamente no seu navegador em `http://localhost:8501`

## Como Usar

1. **Upload do Arquivo Excel**
   - Clique em "Browse files" para selecionar seu arquivo
   - O arquivo deve conter as abas 'protheus' e 'de para almoxarifado'

2. **Ajustar Configurações**
   - Use o slider para ajustar o limiar de similaridade (padrão: 80%)
   - Menor limiar = mais correspondências, mas menos precisas
   - Maior limiar = menos correspondências, mas mais precisas

3. **Processar**
   - Clique em "🚀 Iniciar Correspondência"
   - Aguarde o processamento (barra de progresso será exibida)

4. **Revisar Resultados**
   - Veja as estatísticas (total, revisão obrigatória, score médio, alta confiança)
   - Use os filtros para facilitar a análise
   - Itens em **amarelo** com ⚠️ precisam de revisão manual

5. **Exportar**
   - Clique em "📥 Baixar Correspondências (Excel)"
   - O arquivo será salvo com timestamp no nome

## Estrutura do Arquivo de Entrada

### Aba "protheus"
- Cabeçalho na linha 2 (linha 1 é ignorada)
- Colunas obrigatórias: `Codigo`, `Descricao`

### Aba "de para almoxarifado"
- Cabeçalho na linha 1
- Coluna obrigatória: `Descrição do Material Tasy`

## Observações Importantes

⚠️ **Limitações de Performance**: 
- Máximo de 5.000 itens da aba Protheus
- Máximo de 2.000 itens da aba De Para Almoxarifado
- Isso evita problemas de memória e melhora a performance

📊 **Revisão Obrigatória**:
- Itens marcados indicam múltiplas correspondências similares
- Revise manualmente para garantir a escolha correta

🎯 **Score de Similaridade**:
- 100%: Correspondência exata ou muito próxima
- 90-99%: Alta confiança
- 80-89%: Boa confiança (recomenda-se revisão)
- <80%: Não aparece nos resultados (abaixo do limiar padrão)

## Solução de Problemas

### Erro "Aba não encontrada"
- Verifique se o arquivo contém as abas 'protheus' e 'de para almoxarifado'
- Os nomes das abas não são case-sensitive

### Erro "Coluna não encontrada"
- Verifique se as colunas obrigatórias existem
- Aba Protheus: 'Codigo' e 'Descricao'
- Aba De Para: 'Descrição do Material Tasy'

### Aplicação lenta ou travando
- Reduza o tamanho do arquivo
- Certifique-se de que está dentro dos limites (5.000 e 2.000 linhas)
- Feche outras aplicações para liberar memória

## Suporte

Para problemas ou dúvidas, consulte o README.md completo ou abra uma issue no repositório.
