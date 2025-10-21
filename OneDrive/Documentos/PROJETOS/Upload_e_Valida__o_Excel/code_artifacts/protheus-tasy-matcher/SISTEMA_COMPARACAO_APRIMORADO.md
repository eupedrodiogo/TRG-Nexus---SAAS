# 🔍 Sistema de Comparação Aprimorado Protheus-TASY

## Visão Geral

O Sistema de Comparação Aprimorado é uma solução avançada para identificar correspondências entre dados dos sistemas Protheus TOTVS e TASY Philips, utilizando algoritmos de similaridade otimizados e inteligência artificial para garantir alta precisão na integração de dados.

## 🚀 Funcionalidades Principais

### 1. **Motor de Comparação Avançado**
- **Algoritmos Múltiplos**: Levenshtein, Jaro-Winkler, Jaccard, Cosine Similarity e Análise Semântica
- **Pesos Adaptativos**: Configuração personalizada de pesos para cada algoritmo
- **Processamento Paralelo**: Otimização para grandes volumes de dados
- **Cache Inteligente**: Sistema de cache para melhorar performance

### 2. **Análise de Tipos de Dados**
- **Detecção Automática**: Identifica automaticamente códigos, nomes, datas, valores monetários
- **Normalização Inteligente**: Remove acentos, caracteres especiais e padroniza formatos
- **Extração de Características**: Analisa comprimento, padrões e palavras-chave

### 3. **Sistema de Classificação**
- **Correspondências Exatas**: 100% de similaridade
- **Alta Similaridade**: 80-99% de similaridade
- **Similaridade Moderada**: 60-79% de similaridade
- **Baixa Similaridade**: 40-59% de similaridade
- **Sem Correspondência**: Abaixo de 40% de similaridade

### 4. **Relatórios Avançados**
- **Visualizações Interativas**: Gráficos de distribuição, heatmaps e análises de performance
- **Exportação Excel**: Relatórios completos com múltiplas abas
- **Mapeamento De-Para**: Tabela estruturada para integração
- **Recomendações**: Sugestões automáticas baseadas na análise

## 📋 Como Usar

### Passo 1: Upload de Arquivos
1. Acesse a aba **"📁 Upload de Arquivos"**
2. Faça upload do arquivo Excel do **Protheus** (sistema origem)
3. Faça upload do arquivo Excel do **TASY** (sistema destino)
4. Visualize as informações dos arquivos carregados

### Passo 2: Configuração da Comparação
1. Vá para a aba **"🔍 Comparação"**
2. Selecione a **aba** e **coluna** do arquivo Protheus
3. Selecione a **aba** e **coluna** do arquivo TASY
4. Visualize o preview dos dados selecionados
5. Clique em **"🚀 Executar Comparação Avançada"**

### Passo 3: Análise dos Resultados
1. Acesse a aba **"📊 Resultados"**
2. Visualize as **métricas principais**:
   - Total de comparações realizadas
   - Similaridade média encontrada
   - Tempo de processamento
   - Confiança média das correspondências

3. Analise as **visualizações**:
   - Distribuição de tipos de correspondência
   - Performance dos algoritmos
   - Heatmap de similaridade

4. Explore as **correspondências encontradas**:
   - Filtre por tipo de correspondência
   - Ajuste confiança mínima
   - Limite número de resultados
   - Visualize detalhes de cada correspondência

### Passo 4: Geração do Relatório
1. Vá para a aba **"📋 Relatório"**
2. Analise o **resumo executivo**
3. Visualize a **tabela de mapeamento de-para**
4. Leia as **recomendações para integração**
5. Baixe o **relatório completo em Excel**

## ⚙️ Configurações Avançadas

### Sidebar - Configurações
- **Limiar de Similaridade**: Ajuste a similaridade mínima (0.0 - 1.0)
- **Pesos dos Algoritmos**: Configure a importância de cada algoritmo
- **Performance**: Ative/desative processamento paralelo e cache

### Parâmetros Recomendados

#### Para Códigos de Materiais:
- **Levenshtein**: 0.30
- **Jaro-Winkler**: 0.25
- **Jaccard**: 0.20
- **Cosine**: 0.15
- **Semântica**: 0.10

#### Para Descrições de Materiais:
- **Levenshtein**: 0.20
- **Jaro-Winkler**: 0.20
- **Jaccard**: 0.25
- **Cosine**: 0.20
- **Semântica**: 0.15

## 📊 Interpretação dos Resultados

### Tipos de Correspondência

#### ✅ **Correspondências Exatas** (100%)
- **Significado**: Valores idênticos após normalização
- **Ação**: Mapeamento automático aprovado
- **Confiança**: Máxima

#### 🟢 **Alta Similaridade** (80-99%)
- **Significado**: Muito similares, pequenas diferenças
- **Ação**: Revisar manualmente antes do mapeamento
- **Confiança**: Alta

#### 🟡 **Similaridade Moderada** (60-79%)
- **Significado**: Similaridades significativas, mas com diferenças
- **Ação**: Análise detalhada necessária
- **Confiança**: Moderada

#### 🔴 **Baixa Similaridade** (40-59%)
- **Significado**: Algumas semelhanças, mas muitas diferenças
- **Ação**: Verificação manual obrigatória
- **Confiança**: Baixa

### Métricas de Qualidade

#### **Similaridade Média**
- **> 0.8**: Excelente compatibilidade
- **0.6 - 0.8**: Boa compatibilidade
- **0.4 - 0.6**: Compatibilidade moderada
- **< 0.4**: Baixa compatibilidade

#### **Confiança**
- **> 0.9**: Muito confiável
- **0.7 - 0.9**: Confiável
- **0.5 - 0.7**: Moderadamente confiável
- **< 0.5**: Pouco confiável

## 🔧 Algoritmos Utilizados

### 1. **Distância de Levenshtein**
- **Função**: Mede o número mínimo de edições necessárias
- **Ideal para**: Códigos com pequenas variações
- **Exemplo**: "MAT001" vs "MAT01" = 0.83

### 2. **Jaro-Winkler**
- **Função**: Considera transposições e prefixos comuns
- **Ideal para**: Nomes e descrições
- **Exemplo**: "Paracetamol" vs "Paracetamol 500mg" = 0.85

### 3. **Jaccard**
- **Função**: Analisa conjuntos de caracteres/palavras
- **Ideal para**: Textos com palavras em comum
- **Exemplo**: "Soro Fisiológico" vs "Soro Fisiológico 0,9%" = 0.75

### 4. **Cosine Similarity**
- **Função**: Usa vetorização TF-IDF
- **Ideal para**: Análise semântica de textos
- **Exemplo**: "Dipirona" vs "Dipirona Sódica" = 0.92

### 5. **Análise Semântica**
- **Função**: Considera tipo de dados, palavras-chave e contexto
- **Ideal para**: Classificação inteligente
- **Exemplo**: Identifica códigos vs descrições automaticamente

## 📈 Otimizações de Performance

### Processamento Paralelo
- **Ativação**: Checkbox na sidebar
- **Benefício**: Reduz tempo de processamento em 60-80%
- **Recomendado**: Para datasets > 1000 itens

### Cache de Similaridade
- **Ativação**: Checkbox na sidebar
- **Benefício**: Evita recálculos desnecessários
- **Limpeza**: Botão "🗑️ Limpar Cache"

### Limiar de Similaridade
- **Configuração**: Slider na sidebar
- **Impacto**: Valores mais altos = menos correspondências, mais precisão
- **Recomendado**: 0.4 para análise inicial, 0.6 para produção

## 📋 Relatório de Integração

### Estrutura do Excel Exportado

#### **Aba "Resumo"**
- Métricas gerais da comparação
- Estatísticas de performance
- Tempo de processamento

#### **Aba "Correspondências"**
- Lista completa de todas as correspondências
- Scores detalhados de cada algoritmo
- Recomendações individuais

#### **Aba "Mapeamento De-Para"**
- Apenas correspondências de alta qualidade
- Status de aprovação
- Observações para integração

### Recomendações de Uso

#### **Para Integração Automática**
- Use apenas correspondências **Exatas** e **Alta Similaridade**
- Confiança mínima de **0.8**
- Revisão manual obrigatória

#### **Para Análise Manual**
- Inclua correspondências de **Similaridade Moderada**
- Analise contexto e domínio específico
- Valide com especialistas

## 🚨 Considerações Importantes

### Limitações
- **Tamanho de Arquivo**: Recomendado até 50MB por arquivo
- **Número de Linhas**: Otimizado para até 100.000 linhas
- **Memória**: Processamento paralelo requer mais RAM

### Boas Práticas
1. **Limpeza de Dados**: Remova linhas vazias antes do upload
2. **Padronização**: Use formatos consistentes nos dados
3. **Teste Gradual**: Comece com amostras pequenas
4. **Validação**: Sempre revise correspondências críticas
5. **Backup**: Mantenha cópias dos dados originais

### Troubleshooting

#### **Erro de Memória**
- Reduza o tamanho do dataset
- Desative processamento paralelo
- Aumente limiar de similaridade

#### **Processamento Lento**
- Ative processamento paralelo
- Use cache de similaridade
- Reduza número de comparações

#### **Poucas Correspondências**
- Reduza limiar de similaridade
- Ajuste pesos dos algoritmos
- Verifique qualidade dos dados

## 📞 Suporte

Para dúvidas ou problemas:
1. Verifique os logs no terminal
2. Consulte esta documentação
3. Analise as métricas de qualidade
4. Teste com datasets menores

---

**Desenvolvido para integração Protheus TOTVS ↔ TASY Philips**  
**Versão**: 2.0 - Sistema Aprimorado  
**Data**: Janeiro 2025