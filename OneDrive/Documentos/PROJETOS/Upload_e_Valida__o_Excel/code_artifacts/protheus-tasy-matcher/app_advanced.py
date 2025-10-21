import streamlit as st
import pandas as pd
import json
import re
from rapidfuzz import fuzz, process
from datetime import datetime
import io
import unicodedata
from typing import Dict, List, Tuple, Optional
import plotly.express as px
import plotly.graph_objects as go
from plotly.subplots import make_subplots
import numpy as np
from collections import Counter
import seaborn as sns
import matplotlib.pyplot as plt

# Configuração da página
st.set_page_config(
    page_title="Sistema Inteligente de Mapeamento Excel",
    page_icon="🧠",
    layout="wide"
)

# CSS personalizado
st.markdown("""
<style>
    .main-header {
        font-size: 2.5rem;
        font-weight: bold;
        color: #1f77b4;
        text-align: center;
        margin-bottom: 1rem;
    }
    .sub-header {
        font-size: 1.2rem;
        color: #666;
        text-align: center;
        margin-bottom: 2rem;
    }
    .success-box {
        padding: 1rem;
        background-color: #d4edda;
        border: 1px solid #c3e6cb;
        border-radius: 5px;
        color: #155724;
        margin: 1rem 0;
    }
    .error-box {
        padding: 1rem;
        background-color: #f8d7da;
        border: 1px solid #f5c6cb;
        border-radius: 5px;
        color: #721c24;
        margin: 1rem 0;
    }
    .info-box {
        padding: 1rem;
        background-color: #d1ecf1;
        border: 1px solid #bee5eb;
        border-radius: 5px;
        color: #0c5460;
        margin: 1rem 0;
    }
    .warning-box {
        padding: 1rem;
        background-color: #fff3cd;
        border: 1px solid #ffeaa7;
        border-radius: 5px;
        color: #856404;
        margin: 1rem 0;
    }
    .config-section {
        background-color: #f8f9fa;
        padding: 1rem;
        border-radius: 5px;
        margin: 1rem 0;
        border-left: 4px solid #007bff;
    }
    .column-item {
        background-color: white;
        padding: 0.5rem;
        margin: 0.2rem 0;
        border-radius: 3px;
        border: 1px solid #dee2e6;
    }
    .similarity-high {
        background-color: #d4edda;
        color: #155724;
        padding: 0.2rem 0.5rem;
        border-radius: 3px;
        font-weight: bold;
    }
    .similarity-medium {
        background-color: #fff3cd;
        color: #856404;
        padding: 0.2rem 0.5rem;
        border-radius: 3px;
        font-weight: bold;
    }
    .similarity-low {
        background-color: #f8d7da;
        color: #721c24;
        padding: 0.2rem 0.5rem;
        border-radius: 3px;
        font-weight: bold;
    }
    .ai-suggestion {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 1rem;
        border-radius: 8px;
        margin: 1rem 0;
        border-left: 4px solid #4CAF50;
    }
    .metric-card {
        background-color: white;
        padding: 1rem;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        text-align: center;
        margin: 0.5rem;
    }
</style>
""", unsafe_allow_html=True)

# Funções auxiliares aprimoradas
def normalizar_texto(texto):
    """Normaliza texto para comparação avançada"""
    if pd.isna(texto):
        return ""
    texto = str(texto).lower()
    # Remove acentos
    texto = ''.join(c for c in unicodedata.normalize('NFD', texto) 
                   if unicodedata.category(c) != 'Mn')
    # Remove caracteres especiais mas mantém espaços
    texto = re.sub(r'[^a-z0-9\s]', ' ', texto)
    # Normaliza espaços
    texto = re.sub(r'\s+', ' ', texto)
    return texto.strip()

def extrair_palavras_chave(texto):
    """Extrai palavras-chave relevantes do texto"""
    if pd.isna(texto):
        return []
    texto_normalizado = normalizar_texto(texto)
    palavras = texto_normalizado.split()
    # Remove palavras muito curtas ou comuns
    palavras_filtradas = [p for p in palavras if len(p) > 2 and p not in ['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'man', 'new', 'now', 'old', 'see', 'two', 'way', 'who', 'boy', 'did', 'its', 'let', 'put', 'say', 'she', 'too', 'use']]
    return palavras_filtradas

def calcular_similaridade_avancada(texto1, texto2):
    """Calcula similaridade usando múltiplos algoritmos"""
    if pd.isna(texto1) or pd.isna(texto2):
        return 0
    
    # Normaliza textos
    t1_norm = normalizar_texto(texto1)
    t2_norm = normalizar_texto(texto2)
    
    if not t1_norm or not t2_norm:
        return 0
    
    # Múltiplas métricas de similaridade
    ratio = fuzz.ratio(t1_norm, t2_norm)
    partial_ratio = fuzz.partial_ratio(t1_norm, t2_norm)
    token_sort = fuzz.token_sort_ratio(t1_norm, t2_norm)
    token_set = fuzz.token_set_ratio(t1_norm, t2_norm)
    
    # Similaridade baseada em palavras-chave
    palavras1 = set(extrair_palavras_chave(texto1))
    palavras2 = set(extrair_palavras_chave(texto2))
    
    if palavras1 and palavras2:
        intersecao = len(palavras1.intersection(palavras2))
        uniao = len(palavras1.union(palavras2))
        jaccard = (intersecao / uniao) * 100 if uniao > 0 else 0
    else:
        jaccard = 0
    
    # Peso das diferentes métricas
    score_final = (
        ratio * 0.3 +
        partial_ratio * 0.2 +
        token_sort * 0.2 +
        token_set * 0.2 +
        jaccard * 0.1
    )
    
    return round(score_final, 2)

def sugerir_mapeamentos_ia(analise_arquivo):
    """Sugere mapeamentos automáticos usando IA"""
    sugestoes = []
    
    if 'sheets' not in analise_arquivo:
        return sugestoes
    
    abas = list(analise_arquivo['sheets'].keys())
    
    # Analisa todas as combinações de abas
    for i, aba1 in enumerate(abas):
        for j, aba2 in enumerate(abas):
            if i >= j:  # Evita duplicatas
                continue
                
            info_aba1 = analise_arquivo['sheets'][aba1]
            info_aba2 = analise_arquivo['sheets'][aba2]
            
            if 'error' in info_aba1 or 'error' in info_aba2:
                continue
            
            colunas1 = info_aba1.get('columns_header_0', [])
            colunas2 = info_aba2.get('columns_header_0', [])
            
            # Encontra correspondências entre colunas
            for col1 in colunas1:
                for col2 in colunas2:
                    similaridade = calcular_similaridade_avancada(col1, col2)
                    
                    if similaridade >= 70:  # Limiar para sugestão automática
                        sugestoes.append({
                            'aba_origem': aba1,
                            'aba_destino': aba2,
                            'coluna_origem': col1,
                            'coluna_destino': col2,
                            'similaridade': similaridade,
                            'confianca': 'Alta' if similaridade >= 85 else 'Média',
                            'tipo_sugestao': 'Automática'
                        })
    
    # Ordena por similaridade
    sugestoes.sort(key=lambda x: x['similaridade'], reverse=True)
    return sugestoes

def analisar_compatibilidade_colunas(df1, col1, df2, col2):
    """Analisa compatibilidade entre duas colunas"""
    try:
        dados1 = df1[col1].dropna()
        dados2 = df2[col2].dropna()
        
        if len(dados1) == 0 or len(dados2) == 0:
            return {'compatibilidade': 0, 'detalhes': 'Colunas vazias'}
        
        # Análise de tipos de dados
        tipo1 = dados1.dtype
        tipo2 = dados2.dtype
        
        # Análise de valores únicos
        unicos1 = len(dados1.unique())
        unicos2 = len(dados2.unique())
        
        # Análise de padrões
        if tipo1 == 'object' and tipo2 == 'object':
            # Análise de texto
            amostras1 = dados1.head(100).astype(str)
            amostras2 = dados2.head(100).astype(str)
            
            # Calcula similaridade média entre amostras
            similaridades = []
            for val1 in amostras1:
                melhor_match = process.extractOne(val1, amostras2.tolist(), scorer=fuzz.ratio)
                if melhor_match:
                    similaridades.append(melhor_match[1])
            
            compatibilidade = np.mean(similaridades) if similaridades else 0
            
            detalhes = {
                'tipo_analise': 'Texto',
                'valores_unicos_origem': unicos1,
                'valores_unicos_destino': unicos2,
                'similaridade_media': round(compatibilidade, 2),
                'amostras_analisadas': len(similaridades)
            }
        
        else:
            # Análise numérica básica
            compatibilidade = 50  # Compatibilidade padrão para tipos diferentes
            detalhes = {
                'tipo_analise': 'Numérica/Mista',
                'tipo_origem': str(tipo1),
                'tipo_destino': str(tipo2),
                'valores_unicos_origem': unicos1,
                'valores_unicos_destino': unicos2
            }
        
        return {
            'compatibilidade': round(compatibilidade, 2),
            'detalhes': detalhes
        }
    
    except Exception as e:
        return {
            'compatibilidade': 0,
            'detalhes': f'Erro na análise: {str(e)}'
        }

@st.cache_data
def analisar_arquivo_excel(arquivo_carregado) -> Dict:
    """Analisa arquivo Excel com IA avançada"""
    try:
        xls = pd.ExcelFile(arquivo_carregado)
        analise = {
            'abas': {},
            'total_abas': len(xls.sheet_names),
            'nomes_abas': xls.sheet_names,
            'sugestoes_ia': []
        }
        
        for nome_aba in xls.sheet_names:
            try:
                # Lê com diferentes opções de cabeçalho
                df_h0 = pd.read_excel(arquivo_carregado, sheet_name=nome_aba, nrows=10)
                colunas_h0 = list(df_h0.columns)
                
                try:
                    df_h1 = pd.read_excel(arquivo_carregado, sheet_name=nome_aba, header=1, nrows=10)
                    colunas_h1 = list(df_h1.columns)
                except:
                    colunas_h1 = []
                
                # Carrega dados completos para análise
                df_completo = pd.read_excel(arquivo_carregado, sheet_name=nome_aba)
                total_linhas = len(df_completo)
                
                # Análise de qualidade dos dados
                colunas_vazias = df_completo.isnull().sum()
                tipos_dados = df_completo.dtypes.to_dict()
                
                # Análise de padrões nas colunas
                analise_colunas = {}
                for col in df_completo.columns:
                    dados_col = df_completo[col].dropna()
                    if len(dados_col) > 0:
                        analise_colunas[col] = {
                            'tipo': str(dados_col.dtype),
                            'valores_unicos': len(dados_col.unique()),
                            'valores_nulos': int(colunas_vazias[col]),
                            'percentual_preenchimento': round((len(dados_col) / total_linhas) * 100, 2),
                            'amostra_valores': dados_col.head(5).tolist()
                        }
                
                analise['abas'][nome_aba] = {
                    'colunas_cabecalho_0': colunas_h0,
                    'colunas_cabecalho_1': colunas_h1,
                    'total_linhas': total_linhas,
                    'dados_amostra': df_h0.head(3).to_dict('records'),
                    'tem_dados': total_linhas > 0,
                    'analise_colunas': analise_colunas,
                    'tipos_dados': {str(k): str(v) for k, v in tipos_dados.items()},
                    'qualidade_dados': {
                        'colunas_com_dados': len([col for col in analise_colunas if analise_colunas[col]['percentual_preenchimento'] > 0]),
                        'colunas_totalmente_preenchidas': len([col for col in analise_colunas if analise_colunas[col]['percentual_preenchimento'] == 100]),
                        'percentual_qualidade_geral': round(np.mean([analise_colunas[col]['percentual_preenchimento'] for col in analise_colunas]), 2)
                    }
                }
                
            except Exception as e:
                analise['abas'][nome_aba] = {
                    'erro': str(e),
                    'colunas_cabecalho_0': [],
                    'colunas_cabecalho_1': [],
                    'total_linhas': 0,
                    'dados_amostra': [],
                    'tem_dados': False
                }
        
        # Gera sugestões de IA
        analise['sugestoes_ia'] = sugerir_mapeamentos_ia(analise)
        
        return analise
    except Exception as e:
        return {'erro': str(e)}

def salvar_configuracao(config: Dict, nome: str):
    """Salva configuração no session state"""
    if 'configuracoes_salvas' not in st.session_state:
        st.session_state.configuracoes_salvas = {}
    st.session_state.configuracoes_salvas[nome] = config

def carregar_configuracao(nome: str) -> Optional[Dict]:
    """Carrega configuração do session state"""
    if 'configuracoes_salvas' in st.session_state:
        return st.session_state.configuracoes_salvas.get(nome)
    return None

def obter_nomes_configuracoes_salvas() -> List[str]:
    """Retorna lista de configurações salvas"""
    if 'configuracoes_salvas' in st.session_state:
        return list(st.session_state.configuracoes_salvas.keys())
    return []

def processar_dados_com_configuracao(arquivo_carregado, config: Dict) -> pd.DataFrame:
    """Processa dados baseado na configuração com IA avançada"""
    resultados = []
    
    # Carrega dados das abas selecionadas
    dados_origem = {}
    dados_destino = {}
    
    for config_aba in config['abas']:
        if not config_aba['habilitada']:
            continue
            
        nome_aba = config_aba['nome']
        linha_cabecalho = config_aba['linha_cabecalho']
        
        df = pd.read_excel(arquivo_carregado, sheet_name=nome_aba, header=linha_cabecalho)
        
        if config_aba['funcao'] == 'origem':
            dados_origem[nome_aba] = {
                'df': df,
                'config': config_aba
            }
        elif config_aba['funcao'] == 'destino':
            dados_destino[nome_aba] = {
                'df': df,
                'config': config_aba
            }
    
    # Processa mapeamentos
    for mapeamento in config['mapeamentos']:
        if not mapeamento['habilitado']:
            continue
            
        aba_origem = mapeamento['aba_origem']
        aba_destino = mapeamento['aba_destino']
        
        if aba_origem not in dados_origem or aba_destino not in dados_destino:
            continue
            
        df_origem = dados_origem[aba_origem]['df']
        df_destino = dados_destino[aba_destino]['df']
        
        col_origem = mapeamento['coluna_origem']
        col_destino = mapeamento['coluna_destino']
        
        if col_origem not in df_origem.columns or col_destino not in df_destino.columns:
            continue
        
        # Aplica transformações se configuradas
        valores_origem = df_origem[col_origem].astype(str)
        valores_destino = df_destino[col_destino].astype(str)
        
        if mapeamento.get('normalizar_texto', False):
            valores_origem = valores_origem.apply(normalizar_texto)
            valores_destino = valores_destino.apply(normalizar_texto)
        
        # Realiza correspondência avançada
        limiar = mapeamento.get('limiar_similaridade', 80)
        
        for idx, valor_origem in valores_origem.items():
            if pd.isna(valor_origem) or valor_origem == '':
                continue
                
            # Usa algoritmo avançado de correspondência
            correspondencias = []
            for idx_dest, valor_destino in valores_destino.items():
                if pd.isna(valor_destino) or valor_destino == '':
                    continue
                    
                similaridade = calcular_similaridade_avancada(valor_origem, valor_destino)
                if similaridade >= limiar:
                    correspondencias.append((idx_dest, valor_destino, similaridade))
            
            # Ordena por similaridade
            correspondencias.sort(key=lambda x: x[2], reverse=True)
            
            if correspondencias:
                melhor_correspondencia = correspondencias[0]
                idx_destino, valor_destino_match, score = melhor_correspondencia
                
                resultado = {
                    'aba_origem': aba_origem,
                    'aba_destino': aba_destino,
                    'coluna_origem': col_origem,
                    'coluna_destino': col_destino,
                    'valor_origem': df_origem.loc[idx, col_origem],
                    'valor_destino': df_destino.loc[idx_destino, col_destino],
                    'score_similaridade': score,
                    'nome_mapeamento': mapeamento['nome'],
                    'confianca': 'Alta' if score >= 90 else 'Média' if score >= 75 else 'Baixa',
                    'alternativas': len(correspondencias) - 1
                }
                
                # Adiciona colunas extras se configuradas
                for col_extra in mapeamento.get('colunas_extras_origem', []):
                    if col_extra in df_origem.columns:
                        resultado[f'origem_{col_extra}'] = df_origem.loc[idx, col_extra]
                
                for col_extra in mapeamento.get('colunas_extras_destino', []):
                    if col_extra in df_destino.columns:
                        resultado[f'destino_{col_extra}'] = df_destino.loc[idx_destino, col_extra]
                
                resultados.append(resultado)
    
    return pd.DataFrame(resultados)

def criar_visualizacoes_avancadas(df_resultados):
    """Cria visualizações avançadas dos resultados"""
    if df_resultados.empty:
        return None
    
    # Gráfico de distribuição de scores
    fig_scores = px.histogram(
        df_resultados, 
        x='score_similaridade',
        nbins=20,
        title='Distribuição dos Scores de Similaridade',
        labels={'score_similaridade': 'Score de Similaridade (%)', 'count': 'Quantidade'},
        color_discrete_sequence=['#1f77b4']
    )
    fig_scores.update_layout(showlegend=False)
    
    # Gráfico de confiança
    contagem_confianca = df_resultados['confianca'].value_counts()
    fig_confianca = px.pie(
        values=contagem_confianca.values,
        names=contagem_confianca.index,
        title='Distribuição por Nível de Confiança',
        color_discrete_map={'Alta': '#28a745', 'Média': '#ffc107', 'Baixa': '#dc3545'}
    )
    
    # Gráfico de mapeamentos
    contagem_mapeamentos = df_resultados['nome_mapeamento'].value_counts()
    fig_mapeamentos = px.bar(
        x=contagem_mapeamentos.values,
        y=contagem_mapeamentos.index,
        orientation='h',
        title='Correspondências por Mapeamento',
        labels={'x': 'Quantidade de Correspondências', 'y': 'Mapeamento'}
    )
    
    return {
        'scores': fig_scores,
        'confianca': fig_confianca,
        'mapeamentos': fig_mapeamentos
    }

# Interface principal
st.markdown('<div class="main-header">🧠 Sistema Inteligente de Mapeamento Excel</div>', unsafe_allow_html=True)
st.markdown('<div class="sub-header">Análise avançada com IA para correspondência automática de dados</div>', unsafe_allow_html=True)

# Inicialização do session state
if 'analise' not in st.session_state:
    st.session_state.analise = None
if 'configuracao' not in st.session_state:
    st.session_state.configuracao = {
        'abas': [],
        'mapeamentos': [],
        'opcoes_processamento': {}
    }

# Sidebar para configurações
with st.sidebar:
    st.header("🔧 Configurações")
    
    # Gerenciamento de configurações salvas
    st.subheader("💾 Configurações Salvas")
    configuracoes_salvas = obter_nomes_configuracoes_salvas()
    
    if configuracoes_salvas:
        configuracao_selecionada = st.selectbox("Carregar configuração:", [""] + configuracoes_salvas)
        if configuracao_selecionada and st.button("📂 Carregar"):
            st.session_state.configuracao = carregar_configuracao(configuracao_selecionada)
            st.success(f"Configuração '{configuracao_selecionada}' carregada!")
            st.rerun()
    
    # Salvar configuração atual
    nome_configuracao = st.text_input("Nome da configuração:")
    if nome_configuracao and st.button("💾 Salvar Configuração"):
        salvar_configuracao(st.session_state.configuracao, nome_configuracao)
        st.success(f"Configuração '{nome_configuracao}' salva!")
    
    # Configurações avançadas
    st.subheader("⚙️ Configurações Avançadas")
    usar_ia_avancada = st.checkbox("Usar IA Avançada", value=True, help="Ativa algoritmos de IA para melhor correspondência")
    mostrar_sugestoes = st.checkbox("Mostrar Sugestões Automáticas", value=True, help="Exibe sugestões de mapeamento geradas por IA")
    limiar_global = st.slider("Limiar Global de Similaridade", 50, 100, 80, help="Limiar mínimo para todas as correspondências")

# Upload do arquivo
st.header("📁 Upload do Arquivo Excel")
arquivo_carregado = st.file_uploader(
    "Selecione o arquivo Excel:",
    type=['xlsx', 'xls'],
    help="O arquivo deve conter pelo menos uma aba com dados"
)

if arquivo_carregado:
    # Análise do arquivo
    if st.session_state.analise is None or st.button("🔄 Reanalizar Arquivo"):
        with st.spinner("Analisando arquivo com IA..."):
            st.session_state.analise = analisar_arquivo_excel(arquivo_carregado)
    
    analise = st.session_state.analise
    
    if 'erro' in analise:
        st.error(f"Erro ao analisar arquivo: {analise['erro']}")
    else:
        st.success(f"✅ Arquivo analisado: {analise['total_abas']} aba(s) encontrada(s)")
        
        # Métricas gerais
        col1, col2, col3, col4 = st.columns(4)
        
        with col1:
            st.metric("Total de Abas", analise['total_abas'])
        
        with col2:
            abas_com_dados = sum(1 for aba in analise['abas'].values() if aba.get('tem_dados', False))
            st.metric("Abas com Dados", abas_com_dados)
        
        with col3:
            total_linhas = sum(aba.get('total_linhas', 0) for aba in analise['abas'].values())
            st.metric("Total de Linhas", f"{total_linhas:,}")
        
        with col4:
            sugestoes_ia = len(analise.get('sugestoes_ia', []))
            st.metric("Sugestões de IA", sugestoes_ia)
        
        # Sugestões automáticas de IA
        if mostrar_sugestoes and analise.get('sugestoes_ia'):
            st.header("🤖 Sugestões Automáticas de IA")
            
            with st.expander("💡 Mapeamentos Sugeridos pela IA", expanded=True):
                for i, sugestao in enumerate(analise['sugestoes_ia'][:10]):  # Mostra top 10
                    col1, col2, col3 = st.columns([3, 1, 1])
                    
                    with col1:
                        st.write(f"**{sugestao['aba_origem']}** → **{sugestao['aba_destino']}**")
                        st.write(f"📊 {sugestao['coluna_origem']} ↔️ {sugestao['coluna_destino']}")
                    
                    with col2:
                        if sugestao['similaridade'] >= 85:
                            st.markdown(f'<div class="similarity-high">{sugestao["similaridade"]}%</div>', unsafe_allow_html=True)
                        elif sugestao['similaridade'] >= 70:
                            st.markdown(f'<div class="similarity-medium">{sugestao["similaridade"]}%</div>', unsafe_allow_html=True)
                        else:
                            st.markdown(f'<div class="similarity-low">{sugestao["similaridade"]}%</div>', unsafe_allow_html=True)
                    
                    with col3:
                        if st.button(f"➕ Usar", key=f"usar_sugestao_{i}"):
                            # Adiciona mapeamento baseado na sugestão
                            novo_mapeamento = {
                                'nome': f"IA: {sugestao['coluna_origem']} → {sugestao['coluna_destino']}",
                                'habilitado': True,
                                'aba_origem': sugestao['aba_origem'],
                                'aba_destino': sugestao['aba_destino'],
                                'coluna_origem': sugestao['coluna_origem'],
                                'coluna_destino': sugestao['coluna_destino'],
                                'limiar_similaridade': max(70, int(sugestao['similaridade'] - 10)),
                                'normalizar_texto': True,
                                'colunas_extras_origem': [],
                                'colunas_extras_destino': []
                            }
                            st.session_state.configuracao['mapeamentos'].append(novo_mapeamento)
                            st.success("Mapeamento adicionado!")
                            st.rerun()
        
        # Exibir estrutura detalhada do arquivo
        with st.expander("📊 Análise Detalhada do Arquivo", expanded=False):
            for nome_aba, info_aba in analise['abas'].items():
                st.subheader(f"📋 Aba: {nome_aba}")
                
                if 'erro' in info_aba:
                    st.error(f"Erro: {info_aba['erro']}")
                    continue
                
                # Métricas da aba
                col1, col2, col3, col4 = st.columns(4)
                
                with col1:
                    st.metric("Linhas", f"{info_aba['total_linhas']:,}")
                
                with col2:
                    qualidade = info_aba.get('qualidade_dados', {})
                    st.metric("Qualidade", f"{qualidade.get('percentual_qualidade_geral', 0):.1f}%")
                
                with col3:
                    st.metric("Colunas", len(info_aba['colunas_cabecalho_0']))
                
                with col4:
                    colunas_preenchidas = qualidade.get('colunas_totalmente_preenchidas', 0)
                    st.metric("Colunas Completas", colunas_preenchidas)
                
                # Análise de colunas
                if 'analise_colunas' in info_aba:
                    st.write("**📊 Análise das Colunas:**")
                    
                    dados_colunas = []
                    for nome_col, analise_col in info_aba['analise_colunas'].items():
                        dados_colunas.append({
                            'Coluna': nome_col,
                            'Tipo': analise_col['tipo'],
                            'Valores Únicos': analise_col['valores_unicos'],
                            'Preenchimento (%)': analise_col['percentual_preenchimento'],
                            'Valores Nulos': analise_col['valores_nulos']
                        })
                    
                    if dados_colunas:
                        df_colunas = pd.DataFrame(dados_colunas)
                        st.dataframe(df_colunas, use_container_width=True)
                
                # Amostra dos dados
                if info_aba['dados_amostra']:
                    st.write("**👀 Amostra dos Dados:**")
                    st.dataframe(pd.DataFrame(info_aba['dados_amostra']), use_container_width=True)
        
        # Configuração das abas
        st.header("📋 Configuração das Abas")
        
        # Inicializar configuração das abas se necessário
        if not st.session_state.configuracao['abas']:
            for nome_aba in analise['nomes_abas']:
                st.session_state.configuracao['abas'].append({
                    'nome': nome_aba,
                    'habilitada': False,
                    'funcao': 'origem',  # origem ou destino
                    'linha_cabecalho': 0,
                    'colunas_selecionadas': []
                })
        
        # Interface para configurar cada aba
        for i, config_aba in enumerate(st.session_state.configuracao['abas']):
            nome_aba = config_aba['nome']
            info_aba = analise['abas'][nome_aba]
            
            with st.expander(f"⚙️ {nome_aba}", expanded=config_aba['habilitada']):
                col1, col2, col3 = st.columns(3)
                
                with col1:
                    habilitada = st.checkbox(
                        "Usar esta aba", 
                        value=config_aba['habilitada'],
                        key=f"aba_habilitada_{i}"
                    )
                    st.session_state.configuracao['abas'][i]['habilitada'] = habilitada
                
                with col2:
                    funcao = st.selectbox(
                        "Função da aba:",
                        ['origem', 'destino'],
                        index=0 if config_aba['funcao'] == 'origem' else 1,
                        key=f"aba_funcao_{i}",
                        help="Origem: dados de origem | Destino: dados de destino"
                    )
                    st.session_state.configuracao['abas'][i]['funcao'] = funcao
                
                with col3:
                    linha_cabecalho = st.selectbox(
                        "Linha do cabeçalho:",
                        [0, 1],
                        index=config_aba['linha_cabecalho'],
                        key=f"aba_cabecalho_{i}"
                    )
                    st.session_state.configuracao['abas'][i]['linha_cabecalho'] = linha_cabecalho
                
                if habilitada:
                    # Seleção de colunas
                    colunas_disponiveis = (info_aba['colunas_cabecalho_0'] 
                                         if linha_cabecalho == 0 
                                         else info_aba['colunas_cabecalho_1'])
                    
                    if colunas_disponiveis:
                        st.write("**Selecionar colunas:**")
                        colunas_selecionadas = st.multiselect(
                            "Colunas a utilizar:",
                            colunas_disponiveis,
                            default=config_aba.get('colunas_selecionadas', []),
                            key=f"aba_colunas_{i}"
                        )
                        st.session_state.configuracao['abas'][i]['colunas_selecionadas'] = colunas_selecionadas
                        
                        # Análise de qualidade das colunas selecionadas
                        if colunas_selecionadas and 'analise_colunas' in info_aba:
                            st.write("**📊 Qualidade das Colunas Selecionadas:**")
                            for col in colunas_selecionadas:
                                if col in info_aba['analise_colunas']:
                                    analise_col = info_aba['analise_colunas'][col]
                                    preenchimento = analise_col['percentual_preenchimento']
                                    
                                    if preenchimento >= 90:
                                        cor = "🟢"
                                    elif preenchimento >= 70:
                                        cor = "🟡"
                                    else:
                                        cor = "🔴"
                                    
                                    st.write(f"{cor} **{col}**: {preenchimento}% preenchido ({analise_col['valores_unicos']} valores únicos)")
        
        # Configuração de mapeamentos
        st.header("🔗 Configuração de Mapeamentos")
        
        # Botão para adicionar novo mapeamento
        if st.button("➕ Adicionar Mapeamento"):
            st.session_state.configuracao['mapeamentos'].append({
                'nome': f"Mapeamento {len(st.session_state.configuracao['mapeamentos']) + 1}",
                'habilitado': True,
                'aba_origem': '',
                'aba_destino': '',
                'coluna_origem': '',
                'coluna_destino': '',
                'limiar_similaridade': limiar_global,
                'normalizar_texto': True,
                'colunas_extras_origem': [],
                'colunas_extras_destino': []
            })
            st.rerun()
        
        # Interface para cada mapeamento
        for i, mapeamento in enumerate(st.session_state.configuracao['mapeamentos']):
            with st.expander(f"🔗 {mapeamento['nome']}", expanded=True):
                col1, col2 = st.columns(2)
                
                with col1:
                    habilitado = st.checkbox(
                        "Ativar mapeamento",
                        value=mapeamento['habilitado'],
                        key=f"mapeamento_habilitado_{i}"
                    )
                    st.session_state.configuracao['mapeamentos'][i]['habilitado'] = habilitado
                    
                    nome = st.text_input(
                        "Nome do mapeamento:",
                        value=mapeamento['nome'],
                        key=f"mapeamento_nome_{i}"
                    )
                    st.session_state.configuracao['mapeamentos'][i]['nome'] = nome
                
                with col2:
                    limiar = st.slider(
                        "Limiar de similaridade:",
                        min_value=50,
                        max_value=100,
                        value=mapeamento['limiar_similaridade'],
                        key=f"mapeamento_limiar_{i}"
                    )
                    st.session_state.configuracao['mapeamentos'][i]['limiar_similaridade'] = limiar
                    
                    normalizar = st.checkbox(
                        "Normalizar texto",
                        value=mapeamento['normalizar_texto'],
                        key=f"mapeamento_normalizar_{i}"
                    )
                    st.session_state.configuracao['mapeamentos'][i]['normalizar_texto'] = normalizar
                
                if habilitado:
                    # Seleção de abas origem e destino
                    abas_origem = [s['nome'] for s in st.session_state.configuracao['abas'] 
                                 if s['habilitada'] and s['funcao'] == 'origem']
                    abas_destino = [s['nome'] for s in st.session_state.configuracao['abas'] 
                                  if s['habilitada'] and s['funcao'] == 'destino']
                    
                    col1, col2 = st.columns(2)
                    
                    with col1:
                        st.write("**🎯 Origem:**")
                        aba_origem = st.selectbox(
                            "Aba de origem:",
                            [''] + abas_origem,
                            index=abas_origem.index(mapeamento['aba_origem']) + 1 
                                  if mapeamento['aba_origem'] in abas_origem else 0,
                            key=f"mapeamento_aba_origem_{i}"
                        )
                        st.session_state.configuracao['mapeamentos'][i]['aba_origem'] = aba_origem
                        
                        if aba_origem:
                            config_origem = next((s for s in st.session_state.configuracao['abas'] 
                                                if s['nome'] == aba_origem), None)
                            if config_origem:
                                colunas_origem = config_origem['colunas_selecionadas']
                                coluna_origem = st.selectbox(
                                    "Coluna de origem:",
                                    [''] + colunas_origem,
                                    index=colunas_origem.index(mapeamento['coluna_origem']) + 1 
                                          if mapeamento['coluna_origem'] in colunas_origem else 0,
                                    key=f"mapeamento_coluna_origem_{i}"
                                )
                                st.session_state.configuracao['mapeamentos'][i]['coluna_origem'] = coluna_origem
                                
                                # Colunas extras de origem
                                extras_origem = st.multiselect(
                                    "Colunas extras (origem):",
                                    [col for col in colunas_origem if col != coluna_origem],
                                    default=mapeamento.get('colunas_extras_origem', []),
                                    key=f"mapeamento_extras_origem_{i}"
                                )
                                st.session_state.configuracao['mapeamentos'][i]['colunas_extras_origem'] = extras_origem
                    
                    with col2:
                        st.write("**🎯 Destino:**")
                        aba_destino = st.selectbox(
                            "Aba de destino:",
                            [''] + abas_destino,
                            index=abas_destino.index(mapeamento['aba_destino']) + 1 
                                  if mapeamento['aba_destino'] in abas_destino else 0,
                            key=f"mapeamento_aba_destino_{i}"
                        )
                        st.session_state.configuracao['mapeamentos'][i]['aba_destino'] = aba_destino
                        
                        if aba_destino:
                            config_destino = next((s for s in st.session_state.configuracao['abas'] 
                                                 if s['nome'] == aba_destino), None)
                            if config_destino:
                                colunas_destino = config_destino['colunas_selecionadas']
                                coluna_destino = st.selectbox(
                                    "Coluna de destino:",
                                    [''] + colunas_destino,
                                    index=colunas_destino.index(mapeamento['coluna_destino']) + 1 
                                          if mapeamento['coluna_destino'] in colunas_destino else 0,
                                    key=f"mapeamento_coluna_destino_{i}"
                                )
                                st.session_state.configuracao['mapeamentos'][i]['coluna_destino'] = coluna_destino
                                
                                # Colunas extras de destino
                                extras_destino = st.multiselect(
                                    "Colunas extras (destino):",
                                    [col for col in colunas_destino if col != coluna_destino],
                                    default=mapeamento.get('colunas_extras_destino', []),
                                    key=f"mapeamento_extras_destino_{i}"
                                )
                                st.session_state.configuracao['mapeamentos'][i]['colunas_extras_destino'] = extras_destino
                    
                    # Análise de compatibilidade se ambas as colunas estão selecionadas
                    if (aba_origem and aba_destino and 
                        mapeamento['coluna_origem'] and mapeamento['coluna_destino']):
                        
                        if st.button(f"🔍 Analisar Compatibilidade", key=f"analisar_{i}"):
                            with st.spinner("Analisando compatibilidade..."):
                                try:
                                    df_origem = pd.read_excel(arquivo_carregado, sheet_name=aba_origem)
                                    df_destino = pd.read_excel(arquivo_carregado, sheet_name=aba_destino)
                                    
                                    compatibilidade = analisar_compatibilidade_colunas(
                                        df_origem, mapeamento['coluna_origem'],
                                        df_destino, mapeamento['coluna_destino']
                                    )
                                    
                                    score_compat = compatibilidade['compatibilidade']
                                    
                                    if score_compat >= 70:
                                        st.success(f"🟢 Compatibilidade: {score_compat:.1f}% - Excelente!")
                                    elif score_compat >= 50:
                                        st.warning(f"🟡 Compatibilidade: {score_compat:.1f}% - Moderada")
                                    else:
                                        st.error(f"🔴 Compatibilidade: {score_compat:.1f}% - Baixa")
                                    
                                    st.json(compatibilidade['detalhes'])
                                    
                                except Exception as e:
                                    st.error(f"Erro na análise: {str(e)}")
                
                # Botão para remover mapeamento
                if st.button(f"🗑️ Remover", key=f"remover_mapeamento_{i}"):
                    st.session_state.configuracao['mapeamentos'].pop(i)
                    st.rerun()
        
        # Processamento
        st.header("🚀 Processamento Inteligente")
        
        # Validar configuração
        mapeamentos_validos = [m for m in st.session_state.configuracao['mapeamentos'] 
                             if m['habilitado'] and m['aba_origem'] and m['aba_destino'] 
                             and m['coluna_origem'] and m['coluna_destino']]
        
        if mapeamentos_validos:
            st.success(f"✅ {len(mapeamentos_validos)} mapeamento(s) válido(s) configurado(s)")
            
            if st.button("🚀 Processar Dados com IA", type="primary"):
                with st.spinner("Processando dados com IA avançada..."):
                    try:
                        df_resultados = processar_dados_com_configuracao(arquivo_carregado, st.session_state.configuracao)
                        
                        if not df_resultados.empty:
                            st.success(f"✅ Processamento concluído! {len(df_resultados)} correspondência(s) encontrada(s)")
                            
                            # Exibir resultados
                            st.subheader("📊 Resultados do Processamento")
                            
                            # Filtros para os resultados
                            col1, col2, col3, col4 = st.columns(4)
                            
                            with col1:
                                score_minimo = st.slider(
                                    "Score mínimo:",
                                    min_value=0,
                                    max_value=100,
                                    value=limiar_global
                                )
                            
                            with col2:
                                filtro_mapeamento = st.selectbox(
                                    "Filtrar por mapeamento:",
                                    ['Todos'] + [m['nome'] for m in mapeamentos_validos]
                                )
                            
                            with col3:
                                filtro_confianca = st.selectbox(
                                    "Filtrar por confiança:",
                                    ['Todas', 'Alta', 'Média', 'Baixa']
                                )
                            
                            with col4:
                                ordenar_por = st.selectbox(
                                    "Ordenar por:",
                                    ['score_similaridade', 'valor_origem', 'valor_destino', 'confianca']
                                )
                            
                            # Aplicar filtros
                            df_filtrado = df_resultados[df_resultados['score_similaridade'] >= score_minimo]
                            
                            if filtro_mapeamento != 'Todos':
                                df_filtrado = df_filtrado[df_filtrado['nome_mapeamento'] == filtro_mapeamento]
                            
                            if filtro_confianca != 'Todas':
                                df_filtrado = df_filtrado[df_filtrado['confianca'] == filtro_confianca]
                            
                            df_filtrado = df_filtrado.sort_values(ordenar_por, ascending=False)
                            
                            # Métricas dos resultados
                            col1, col2, col3, col4 = st.columns(4)
                            
                            with col1:
                                st.metric("Total", len(df_resultados))
                            
                            with col2:
                                st.metric("Filtrados", len(df_filtrado))
                            
                            with col3:
                                score_medio = df_filtrado['score_similaridade'].mean() if not df_filtrado.empty else 0
                                st.metric("Score Médio", f"{score_medio:.1f}%")
                            
                            with col4:
                                alta_confianca = len(df_filtrado[df_filtrado['confianca'] == 'Alta'])
                                st.metric("Alta Confiança", alta_confianca)
                            
                            # Visualizações avançadas
                            if not df_filtrado.empty:
                                st.subheader("📈 Visualizações Avançadas")
                                
                                graficos = criar_visualizacoes_avancadas(df_filtrado)
                                if graficos:
                                    col1, col2 = st.columns(2)
                                    
                                    with col1:
                                        st.plotly_chart(graficos['scores'], use_container_width=True)
            st.plotly_chart(graficos['mapeamentos'], use_container_width=True)
                                    
                                    with col2:
                                        st.plotly_chart(graficos['confianca'], use_container_width=True)
                            
                            # Exibir tabela de resultados
                            st.subheader("📋 Tabela de Resultados")
                            
                            # Formatação da tabela
                            df_exibicao = df_filtrado.copy()
                            
                            # Adiciona formatação de cores baseada na confiança
                            def formatar_confianca(val):
                                if val == 'Alta':
                                    return 'background-color: #d4edda; color: #155724'
                                elif val == 'Média':
                                    return 'background-color: #fff3cd; color: #856404'
                                else:
                                    return 'background-color: #f8d7da; color: #721c24'
                            
                            if not df_exibicao.empty:
                                st.dataframe(
                                    df_exibicao.style.applymap(formatar_confianca, subset=['confianca']),
                                    use_container_width=True
                                )
                            
                            # Download dos resultados
                            if not df_filtrado.empty:
                                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                                nome_arquivo = f"mapeamento_inteligente_{timestamp}.xlsx"
                                
                                output = io.BytesIO()
                                with pd.ExcelWriter(output, engine='openpyxl') as writer:
                                    df_filtrado.to_excel(writer, sheet_name='Resultados', index=False)
                                    
                                    # Adiciona aba com estatísticas
                                    estatisticas = {
                                        'Métrica': ['Total de Correspondências', 'Score Médio', 'Alta Confiança', 'Média Confiança', 'Baixa Confiança'],
                                        'Valor': [
                                            len(df_filtrado),
                                            f"{df_filtrado['score_similaridade'].mean():.2f}%",
                                            len(df_filtrado[df_filtrado['confianca'] == 'Alta']),
                                            len(df_filtrado[df_filtrado['confianca'] == 'Média']),
                                            len(df_filtrado[df_filtrado['confianca'] == 'Baixa'])
                                        ]
                                    }
                                    pd.DataFrame(estatisticas).to_excel(writer, sheet_name='Estatísticas', index=False)
                                
                                st.download_button(
                                    label="📥 Baixar Resultados (Excel)",
                                    data=output.getvalue(),
                                    file_name=nome_arquivo,
                                    mime="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                                )
                        
                        else:
                            st.warning("⚠️ Nenhuma correspondência encontrada com os critérios configurados")
                    
                    except Exception as e:
                        st.error(f"❌ Erro durante processamento: {str(e)}")
                        st.exception(e)
        
        else:
            st.warning("⚠️ Configure pelo menos um mapeamento válido para processar os dados")

else:
    # Instruções quando não há arquivo
    st.markdown("""
    <div class="info-box">
        <h4>📝 Como usar o Sistema Inteligente:</h4>
        <ol>
            <li><strong>📁 Upload:</strong> Faça upload de um arquivo Excel com múltiplas abas</li>
            <li><strong>🔍 Análise Automática:</strong> O sistema analisará automaticamente todas as abas, colunas e qualidade dos dados</li>
            <li><strong>🤖 Sugestões de IA:</strong> Receba sugestões automáticas de mapeamentos baseadas em análise inteligente</li>
            <li><strong>⚙️ Configuração de Abas:</strong>
                <ul>
                    <li>Marque quais abas deseja utilizar</li>
                    <li>Defina se cada aba é "origem" ou "destino"</li>
                    <li>Escolha a linha do cabeçalho (0 ou 1)</li>
                    <li>Selecione as colunas específicas com análise de qualidade</li>
                </ul>
            </li>
            <li><strong>🔗 Configuração de Mapeamentos:</strong>
                <ul>
                    <li>Use sugestões automáticas da IA ou crie mapeamentos manuais</li>
                    <li>Configure limiar de similaridade para cada mapeamento</li>
                    <li>Analise compatibilidade entre colunas</li>
                    <li>Escolha colunas extras para incluir nos resultados</li>
                </ul>
            </li>
            <li><strong>🚀 Processamento Inteligente:</strong> Execute o processamento com algoritmos avançados de IA</li>
            <li><strong>📊 Análise Visual:</strong> Visualize resultados com gráficos interativos e métricas avançadas</li>
            <li><strong>💾 Configurações:</strong> Salve suas configurações para reutilização futura</li>
        </ol>
        
        <h4>🧠 Recursos Avançados de IA:</h4>
        <ul>
            <li><strong>🎯 Correspondência Inteligente:</strong> Algoritmos avançados de similaridade fuzzy</li>
            <li><strong>🔍 Análise de Compatibilidade:</strong> Avaliação automática da qualidade dos mapeamentos</li>
            <li><strong>💡 Sugestões Automáticas:</strong> IA identifica possíveis correspondências automaticamente</li>
            <li><strong>📊 Análise de Qualidade:</strong> Métricas detalhadas sobre a qualidade dos dados</li>
            <li><strong>🎨 Visualizações Interativas:</strong> Gráficos dinâmicos para análise dos resultados</li>
            <li><strong>⚡ Processamento Otimizado:</strong> Algoritmos eficientes para grandes volumes de dados</li>
        </ul>
        
        <h4>🎨 Interface Intuitiva:</h4>
        <ul>
            <li><strong>🌟 Design Moderno:</strong> Interface limpa e responsiva</li>
            <li><strong>🎯 Navegação Intuitiva:</strong> Fluxo de trabalho guiado passo a passo</li>
            <li><strong>📱 Responsivo:</strong> Funciona perfeitamente em diferentes tamanhos de tela</li>
            <li><strong>🔔 Feedback Visual:</strong> Indicadores visuais de status e qualidade</li>
            <li><strong>💾 Persistência:</strong> Configurações salvas automaticamente</li>
        </ul>
    </div>
    """, unsafe_allow_html=True)