import streamlit as st
import pandas as pd
import numpy as np
import plotly.express as px
import plotly.graph_objects as go
from plotly.subplots import make_subplots
import seaborn as sns
import matplotlib.pyplot as plt
from datetime import datetime
import re
import unicodedata
from typing import List, Dict, Tuple, Any, Optional
import json
import pickle
import os
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import nltk
from textdistance import levenshtein, jaro_winkler
import warnings
warnings.filterwarnings('ignore')

# Configuração da página
st.set_page_config(
    page_title="Sistema de Mapeamento de Colunas - Versão Avançada",
    page_icon="🗂️",
    layout="wide",
    initial_sidebar_state="expanded"
)

# CSS personalizado com contraste aprimorado
st.markdown("""
<style>
    .main-header {
        background: linear-gradient(135deg, #1a365d, #2c5282);
        color: white;
        padding: 2rem;
        border-radius: 15px;
        text-align: center;
        margin-bottom: 2rem;
        box-shadow: 0 10px 20px rgba(0, 0, 0, 0.25);
        border: 3px solid #2d3748;
    }
    
    .main-header h1 {
        margin: 0;
        font-size: 2.8rem;
        font-weight: 800;
        text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
    }
    
    .main-header p {
        margin: 0.8rem 0 0 0;
        font-size: 1.3rem;
        opacity: 0.95;
        font-weight: 500;
    }
    
    .tab-header {
        background: linear-gradient(135deg, #4a5568, #2d3748);
        color: white;
        padding: 1.8rem;
        border-radius: 12px;
        text-align: center;
        margin-bottom: 2rem;
        box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
        border: 3px solid #1a202c;
    }
    
    .tab-header h2 {
        margin: 0;
        font-size: 2rem;
        font-weight: 700;
        text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
    }
    
    .tab-header p {
        margin: 0.8rem 0 0 0;
        font-size: 1.1rem;
        opacity: 0.9;
        font-weight: 500;
    }
    
    .step-indicator {
        display: flex;
        justify-content: center;
        align-items: center;
        margin: 1.5rem 0;
        padding: 1.5rem;
        background: #ffffff;
        border-radius: 12px;
        border: 3px solid #4299e1;
        box-shadow: 0 6px 12px rgba(66, 153, 225, 0.2);
    }
    
    .step-number {
        background: linear-gradient(135deg, #4299e1, #3182ce);
        color: white;
        border-radius: 50%;
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        margin-right: 1.5rem;
        font-size: 1.2rem;
        border: 2px solid #2b6cb0;
        box-shadow: 0 4px 8px rgba(66, 153, 225, 0.3);
    }
    
    .data-preview {
        background: #ffffff;
        border: 3px solid #cbd5e0;
        border-radius: 12px;
        padding: 1.5rem;
        margin: 1.5rem 0;
        box-shadow: 0 6px 12px rgba(0, 0, 0, 0.1);
    }
    
    .mapping-result {
        background: #f7fafc;
        border: 2px solid #a0aec0;
        border-radius: 10px;
        padding: 1.2rem;
        margin: 0.8rem 0;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    }
    
    .mapping-result.high-confidence {
        border: 3px solid #48bb78;
        background: #f0fff4;
        color: #22543d;
        font-weight: bold;
    }
    
    .mapping-result.medium-confidence {
        border: 3px solid #ed8936;
        background: #fffbf0;
        color: #c05621;
        font-weight: bold;
    }
    
    .mapping-result.low-confidence {
        border: 3px solid #f56565;
        background: #fff5f5;
        color: #c53030;
        font-weight: bold;
    }
    
    .filter-section {
        background: #ebf8ff;
        border-radius: 12px;
        padding: 2rem;
        margin: 1.5rem 0;
        border: 3px solid #90cdf4;
        box-shadow: 0 6px 12px rgba(144, 205, 244, 0.2);
    }
    
    .destination-section {
        background: #f0fff4;
        border-radius: 12px;
        padding: 2rem;
        margin: 1.5rem 0;
        border: 3px solid #9ae6b4;
        box-shadow: 0 6px 12px rgba(154, 230, 180, 0.2);
    }
    
    .comparison-section {
        background: #fffbf0;
        border-radius: 12px;
        padding: 2rem;
        margin: 1.5rem 0;
        border: 3px solid #f6ad55;
        box-shadow: 0 6px 12px rgba(246, 173, 85, 0.2);
    }
    
    .metric-card {
        background: #ffffff;
        border: 3px solid #4299e1;
        border-radius: 12px;
        padding: 1.5rem;
        text-align: center;
        box-shadow: 0 6px 12px rgba(66, 153, 225, 0.2);
        color: #2b6cb0;
        font-weight: bold;
        margin: 0.8rem;
    }
    
    .cell-comparison {
        display: inline-block;
        padding: 0.5rem;
        margin: 0.2rem;
        border-radius: 6px;
        font-family: 'Courier New', monospace;
        font-size: 0.9rem;
        font-weight: 600;
        border: 2px solid;
        min-width: 80px;
        text-align: center;
    }
    
    .cell-exact-match {
        background: #c6f6d5;
        border-color: #38a169;
        color: #22543d;
    }
    
    .cell-high-similarity {
        background: #bee3f8;
        border-color: #3182ce;
        color: #2c5282;
    }
    
    .cell-medium-similarity {
        background: #fef5e7;
        border-color: #dd6b20;
        color: #c05621;
    }
    
    .cell-low-similarity {
        background: #fed7d7;
        border-color: #e53e3e;
        color: #c53030;
    }
    
    .cell-no-match {
        background: #f7fafc;
        border-color: #a0aec0;
        color: #4a5568;
    }
    
    .similarity-legend {
        display: flex;
        justify-content: center;
        gap: 1rem;
        margin: 1rem 0;
        padding: 1rem;
        background: #f7fafc;
        border-radius: 8px;
        border: 2px solid #e2e8f0;
    }
    
    .legend-item {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-weight: 600;
    }
    
    .legend-color {
        width: 20px;
        height: 20px;
        border-radius: 4px;
        border: 2px solid;
    }
    
    .stButton > button {
        background: linear-gradient(135deg, #4299e1, #3182ce);
        color: white;
        border: 2px solid #2b6cb0;
        border-radius: 10px;
        font-weight: bold;
        padding: 0.8rem 1.5rem;
        box-shadow: 0 4px 8px rgba(66, 153, 225, 0.3);
        font-size: 1rem;
    }
    
    .stButton > button:hover {
        background: linear-gradient(135deg, #3182ce, #2c5282);
        border: 2px solid #2a4365;
        box-shadow: 0 6px 12px rgba(66, 153, 225, 0.4);
        transform: translateY(-2px);
    }
    
    .stSelectbox > div > div {
        background: #ffffff;
        border: 2px solid #cbd5e0;
        border-radius: 8px;
        font-weight: 500;
    }
    
    .stProgress > div > div > div > div {
        background: linear-gradient(90deg, #4299e1, #3182ce);
    }
    
    .comparison-table {
        border-collapse: collapse;
        width: 100%;
        margin: 1rem 0;
        background: white;
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    }
    
    .comparison-table th {
        background: linear-gradient(135deg, #4a5568, #2d3748);
        color: white;
        padding: 1rem;
        text-align: center;
        font-weight: bold;
        border: 2px solid #1a202c;
    }
    
    .comparison-table td {
        padding: 0.8rem;
        text-align: center;
        border: 1px solid #e2e8f0;
        font-weight: 500;
    }
</style>
""", unsafe_allow_html=True)

class CellComparator:
    """Classe para comparação detalhada célula por célula"""
    
    def __init__(self):
        self.similarity_thresholds = {
            'exact': 1.0,
            'high': 0.8,
            'medium': 0.5,
            'low': 0.2
        }
    
    def normalize_text(self, text: str) -> str:
        """Normaliza texto para comparação"""
        if pd.isna(text) or text is None:
            return ""
        
        text = str(text).lower().strip()
        # Remove acentos
        text = unicodedata.normalize('NFD', text)
        text = ''.join(char for char in text if unicodedata.category(char) != 'Mn')
        # Remove caracteres especiais
        text = re.sub(r'[^\w\s]', '', text)
        # Remove espaços extras
        text = re.sub(r'\s+', ' ', text)
        
        return text
    
    def calculate_similarity(self, cell1: Any, cell2: Any) -> Dict[str, float]:
        """Calcula múltiplas métricas de similaridade entre duas células"""
        
        # Converte para string normalizada
        str1 = self.normalize_text(cell1)
        str2 = self.normalize_text(cell2)
        
        # Verifica se são exatamente iguais
        if str1 == str2:
            return {
                'exact_match': 1.0,
                'levenshtein': 1.0,
                'jaro_winkler': 1.0,
                'cosine': 1.0,
                'overall': 1.0
            }
        
        # Calcula diferentes métricas
        similarities = {}
        
        # Exact match
        similarities['exact_match'] = 1.0 if str1 == str2 else 0.0
        
        # Levenshtein distance
        if len(str1) > 0 and len(str2) > 0:
            lev_dist = levenshtein(str1, str2)
            max_len = max(len(str1), len(str2))
            similarities['levenshtein'] = 1 - (lev_dist / max_len)
        else:
            similarities['levenshtein'] = 0.0
        
        # Jaro-Winkler
        similarities['jaro_winkler'] = jaro_winkler(str1, str2)
        
        # Cosine similarity (para textos)
        if len(str1) > 0 and len(str2) > 0:
            try:
                vectorizer = TfidfVectorizer(analyzer='char', ngram_range=(1, 3))
                tfidf_matrix = vectorizer.fit_transform([str1, str2])
                cosine_sim = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]
                similarities['cosine'] = cosine_sim
            except:
                similarities['cosine'] = 0.0
        else:
            similarities['cosine'] = 0.0
        
        # Similaridade geral (média ponderada)
        similarities['overall'] = (
            similarities['exact_match'] * 0.4 +
            similarities['levenshtein'] * 0.25 +
            similarities['jaro_winkler'] * 0.25 +
            similarities['cosine'] * 0.1
        )
        
        return similarities
    
    def get_similarity_category(self, similarity: float) -> str:
        """Categoriza o nível de similaridade"""
        if similarity >= self.similarity_thresholds['exact']:
            return 'exact'
        elif similarity >= self.similarity_thresholds['high']:
            return 'high'
        elif similarity >= self.similarity_thresholds['medium']:
            return 'medium'
        elif similarity >= self.similarity_thresholds['low']:
            return 'low'
        else:
            return 'none'
    
    def compare_columns(self, col1: pd.Series, col2: pd.Series) -> Dict:
        """Compara duas colunas célula por célula"""
        
        results = {
            'cell_comparisons': [],
            'summary': {
                'total_cells': 0,
                'exact_matches': 0,
                'high_similarity': 0,
                'medium_similarity': 0,
                'low_similarity': 0,
                'no_matches': 0
            },
            'overall_similarity': 0.0
        }
        
        # Garante que as colunas tenham o mesmo tamanho
        max_len = max(len(col1), len(col2))
        col1_extended = col1.reindex(range(max_len))
        col2_extended = col2.reindex(range(max_len))
        
        total_similarity = 0.0
        
        for i in range(max_len):
            cell1 = col1_extended.iloc[i] if i < len(col1_extended) else None
            cell2 = col2_extended.iloc[i] if i < len(col2_extended) else None
            
            similarities = self.calculate_similarity(cell1, cell2)
            category = self.get_similarity_category(similarities['overall'])
            
            cell_result = {
                'index': i,
                'cell1': cell1,
                'cell2': cell2,
                'similarities': similarities,
                'category': category
            }
            
            results['cell_comparisons'].append(cell_result)
            
            # Atualiza contadores
            results['summary']['total_cells'] += 1
            if category == 'exact':
                results['summary']['exact_matches'] += 1
            elif category == 'high':
                results['summary']['high_similarity'] += 1
            elif category == 'medium':
                results['summary']['medium_similarity'] += 1
            elif category == 'low':
                results['summary']['low_similarity'] += 1
            else:
                results['summary']['no_matches'] += 1
            
            total_similarity += similarities['overall']
        
        # Calcula similaridade geral
        if max_len > 0:
            results['overall_similarity'] = total_similarity / max_len
        
        return results

class MappingWorkflow:
    """Classe para gerenciar o fluxo de trabalho de mapeamento"""
    
    def __init__(self):
        self.reset_workflow()
        self.cell_comparator = CellComparator()
    
    def reset_workflow(self):
        """Reinicia o fluxo de trabalho"""
        if 'workflow_data' not in st.session_state:
            st.session_state.workflow_data = {
                'source_data': None,
                'source_sheet': None,
                'comparison_criteria': {},
                'destination_sheet': None,
                'destination_mapping': {},
                'filtered_data': None,
                'current_step': 1,
                'cell_comparisons': {},
                'similar_data': None
            }
    
    def get_workflow_data(self):
        """Retorna os dados do fluxo de trabalho"""
        return st.session_state.workflow_data
    
    def update_workflow_data(self, key: str, value: Any):
        """Atualiza dados do fluxo de trabalho"""
        st.session_state.workflow_data[key] = value

class AdvancedDataAnalyzer:
    """Classe para análise avançada de dados"""
    
    def __init__(self):
        self.cell_comparator = CellComparator()
    
    def analyze_excel_file(self, file) -> Dict:
        """Analisa arquivo Excel e retorna informações detalhadas"""
        try:
            # Lê todas as abas
            excel_data = pd.read_excel(file, sheet_name=None)
            
            analysis = {
                'sheets': {},
                'total_sheets': len(excel_data),
                'file_size': file.size if hasattr(file, 'size') else 0
            }
            
            for sheet_name, df in excel_data.items():
                # Cria dicionário com dados das colunas
                column_data = {}
                for col in df.columns:
                    column_data[col] = df[col].tolist()
                
                sheet_analysis = {
                    'name': sheet_name,
                    'rows': len(df),
                    'columns': len(df.columns),
                    'data': column_data,  # Adiciona os dados das colunas
                    'column_info': {},
                    'data_types': {},
                    'null_counts': {},
                    'unique_counts': {},
                    'sample_data': df.head(5).to_dict('records') if len(df) > 0 else []
                }
                
                # Analisa cada coluna
                for col in df.columns:
                    col_data = df[col]
                    sheet_analysis['column_info'][col] = {
                        'dtype': str(col_data.dtype),
                        'null_count': col_data.isnull().sum(),
                        'null_percentage': (col_data.isnull().sum() / len(col_data)) * 100,
                        'unique_count': col_data.nunique(),
                        'unique_percentage': (col_data.nunique() / len(col_data)) * 100,
                        'sample_values': col_data.dropna().head(5).tolist()
                    }
                
                analysis['sheets'][sheet_name] = sheet_analysis
            
            return analysis
            
        except Exception as e:
            st.error(f"Erro ao analisar arquivo: {str(e)}")
            return None

def create_similarity_legend():
    """Cria legenda de similaridade"""
    st.markdown("""
    <div class="similarity-legend">
        <div class="legend-item">
            <div class="legend-color cell-exact-match"></div>
            <span>Correspondência Exata (100%)</span>
        </div>
        <div class="legend-item">
            <div class="legend-color cell-high-similarity"></div>
            <span>Alta Similaridade (80-99%)</span>
        </div>
        <div class="legend-item">
            <div class="legend-color cell-medium-similarity"></div>
            <span>Média Similaridade (50-79%)</span>
        </div>
        <div class="legend-item">
            <div class="legend-color cell-low-similarity"></div>
            <span>Baixa Similaridade (20-49%)</span>
        </div>
        <div class="legend-item">
            <div class="legend-color cell-no-match"></div>
            <span>Sem Correspondência (&lt;20%)</span>
        </div>
    </div>
    """, unsafe_allow_html=True)

def display_cell_comparison(comparison_result: Dict, col1_name: str, col2_name: str):
    """Exibe comparação detalhada célula por célula"""
    
    st.markdown(f"""
    <div class="comparison-section">
        <h3>🔍 Comparação Detalhada: {col1_name} vs {col2_name}</h3>
    </div>
    """, unsafe_allow_html=True)
    
    # Legenda
    create_similarity_legend()
    
    # Resumo da comparação
    summary = comparison_result['summary']
    
    col1, col2, col3, col4, col5 = st.columns(5)
    
    with col1:
        st.markdown(f"""
        <div class="metric-card">
            <h4>📊 Total de Células</h4>
            <h2>{summary['total_cells']}</h2>
        </div>
        """, unsafe_allow_html=True)
    
    with col2:
        st.markdown(f"""
        <div class="metric-card" style="border-color: #38a169;">
            <h4>✅ Exatas</h4>
            <h2>{summary['exact_matches']}</h2>
            <p>{(summary['exact_matches']/summary['total_cells']*100):.1f}%</p>
        </div>
        """, unsafe_allow_html=True)
    
    with col3:
        st.markdown(f"""
        <div class="metric-card" style="border-color: #3182ce;">
            <h4>🔵 Alta Similaridade</h4>
            <h2>{summary['high_similarity']}</h2>
            <p>{(summary['high_similarity']/summary['total_cells']*100):.1f}%</p>
        </div>
        """, unsafe_allow_html=True)
    
    with col4:
        st.markdown(f"""
        <div class="metric-card" style="border-color: #dd6b20;">
            <h4>🟡 Média Similaridade</h4>
            <h2>{summary['medium_similarity']}</h2>
            <p>{(summary['medium_similarity']/summary['total_cells']*100):.1f}%</p>
        </div>
        """, unsafe_allow_html=True)
    
    with col5:
        st.markdown(f"""
        <div class="metric-card" style="border-color: #e53e3e;">
            <h4>🔴 Baixa/Sem Similaridade</h4>
            <h2>{summary['low_similarity'] + summary['no_matches']}</h2>
            <p>{((summary['low_similarity'] + summary['no_matches'])/summary['total_cells']*100):.1f}%</p>
        </div>
        """, unsafe_allow_html=True)
    
    # Gráfico de distribuição de similaridade
    fig = go.Figure(data=[
        go.Bar(
            x=['Exatas', 'Alta', 'Média', 'Baixa', 'Sem Correspondência'],
            y=[summary['exact_matches'], summary['high_similarity'], 
               summary['medium_similarity'], summary['low_similarity'], summary['no_matches']],
            marker_color=['#38a169', '#3182ce', '#dd6b20', '#e53e3e', '#a0aec0']
        )
    ])
    
    fig.update_layout(
        title=f"Distribuição de Similaridade - {col1_name} vs {col2_name}",
        xaxis_title="Categoria de Similaridade",
        yaxis_title="Número de Células",
        height=400
    )
    
    st.plotly_chart(fig, use_container_width=True)
    
    # Tabela detalhada das primeiras 20 comparações
    st.markdown("### 📋 Detalhes das Comparações (Primeiras 20 células)")
    
    comparison_data = []
    for i, comp in enumerate(comparison_result['cell_comparisons'][:20]):
        category_map = {
            'exact': 'cell-exact-match',
            'high': 'cell-high-similarity',
            'medium': 'cell-medium-similarity',
            'low': 'cell-low-similarity',
            'none': 'cell-no-match'
        }
        
        comparison_data.append({
            'Linha': i + 1,
            'Valor 1': str(comp['cell1']) if comp['cell1'] is not None else 'N/A',
            'Valor 2': str(comp['cell2']) if comp['cell2'] is not None else 'N/A',
            'Similaridade': f"{comp['similarities']['overall']:.2%}",
            'Categoria': comp['category'].title(),
            'Levenshtein': f"{comp['similarities']['levenshtein']:.2%}",
            'Jaro-Winkler': f"{comp['similarities']['jaro_winkler']:.2%}"
        })
    
    if comparison_data:
        df_comparison = pd.DataFrame(comparison_data)
        st.dataframe(df_comparison, use_container_width=True)
    
    return comparison_result



def show_origem_tab(workflow: MappingWorkflow, analyzer: AdvancedDataAnalyzer):
    """Exibe a aba de origem para seleção dos dados de entrada"""
    
    st.markdown("""
    <div class="tab-header">
        <h2>📥 Aba de Origem</h2>
        <p>Seleção e análise dos dados de entrada</p>
    </div>
    """, unsafe_allow_html=True)
    
    st.markdown("""
    <div class="step-indicator">
        <div class="step-number">1</div>
        <div>
            <h4>Carregamento de Dados</h4>
            <p>Faça upload do arquivo Excel e selecione a aba de origem</p>
        </div>
    </div>
    """, unsafe_allow_html=True)
    
    # Upload de arquivo
    uploaded_file = st.file_uploader(
        "📁 Selecione o arquivo Excel:",
        type=['xlsx', 'xls'],
        help="Faça upload de um arquivo Excel (.xlsx ou .xls)"
    )
    
    if uploaded_file is not None:
        # Analisa o arquivo
        with st.spinner("🔍 Analisando arquivo..."):
            analysis = analyzer.analyze_excel_file(uploaded_file)
        
        if analysis:
            # Salva dados no workflow
            workflow.update_workflow_data('source_data', analysis)
            
            # Exibe informações do arquivo
            st.markdown(f"""
            <div class="data-preview">
                <h3>📊 Informações do Arquivo</h3>
                <p><strong>Total de Abas:</strong> {analysis['total_sheets']}</p>
                <p><strong>Tamanho:</strong> {analysis.get('file_size', 0):,} bytes</p>
            </div>
            """, unsafe_allow_html=True)
            
            # Seleção de aba
            sheet_names = list(analysis['sheets'].keys())
            selected_sheet = st.selectbox(
                "📋 Selecione a aba de origem:",
                options=sheet_names,
                help="Escolha a aba que contém os dados de origem"
            )
            
            if selected_sheet:
                workflow.update_workflow_data('source_sheet', selected_sheet)
                sheet_data = analysis['sheets'][selected_sheet]
                
                # Exibe informações da aba
                col1, col2, col3 = st.columns(3)
                
                with col1:
                    st.markdown(f"""
                    <div class="metric-card">
                        <h4>📊 Linhas</h4>
                        <h2>{sheet_data['rows']:,}</h2>
                    </div>
                    """, unsafe_allow_html=True)
                
                with col2:
                    st.markdown(f"""
                    <div class="metric-card">
                        <h4>📋 Colunas</h4>
                        <h2>{sheet_data['columns']}</h2>
                    </div>
                    """, unsafe_allow_html=True)
                
                with col3:
                    st.markdown(f"""
                    <div class="metric-card">
                        <h4>📝 Aba</h4>
                        <h2>{selected_sheet}</h2>
                    </div>
                    """, unsafe_allow_html=True)
                
                # Análise das colunas
                st.markdown("### 🔍 Análise das Colunas")
                
                columns_data = []
                for col_name, col_info in sheet_data['column_info'].items():
                    columns_data.append({
                        'Coluna': col_name,
                        'Tipo': col_info['dtype'],
                        'Valores Nulos': f"{col_info['null_count']} ({col_info['null_percentage']:.1f}%)",
                        'Valores Únicos': f"{col_info['unique_count']} ({col_info['unique_percentage']:.1f}%)",
                        'Amostra': ', '.join(map(str, col_info['sample_values'][:3]))
                    })
                
                df_columns = pd.DataFrame(columns_data)
                st.dataframe(df_columns, use_container_width=True)
                
                # Preview dos dados
                st.markdown("### 👀 Preview dos Dados")
                if sheet_data['sample_data']:
                    df_preview = pd.DataFrame(sheet_data['sample_data'])
                    st.dataframe(df_preview, use_container_width=True)
                
                # Botão para avançar
                if st.button("➡️ Avançar para Comparação", type="primary"):
                    st.success("✅ Dados de origem configurados com sucesso! Clique na aba 'Comparação' para continuar.")
                    st.balloons()
                    
                # Dica para o usuário
                st.info("💡 **Próximo passo:** Clique na aba '🔍 Comparação' acima para definir critérios e executar a comparação detalhada.")

def show_comparacao_tab(workflow: MappingWorkflow, analyzer: AdvancedDataAnalyzer):
    """Exibe a aba de comparação para definir critérios de filtragem"""
    
    st.markdown("""
    <div class="tab-header">
        <h2>🔍 Comparação de Dados</h2>
        <p>Upload de arquivo e execução da comparação detalhada</p>
    </div>
    """, unsafe_allow_html=True)
    
    st.markdown("""
    <div class="step-indicator">
        <div class="step-number">1</div>
        <div>
            <h4>Carregamento de Dados</h4>
            <p>Faça upload do arquivo Excel para análise</p>
        </div>
    </div>
    """, unsafe_allow_html=True)
    
    # Upload de arquivo
    uploaded_file = st.file_uploader(
        "📁 Selecione o arquivo Excel:",
        type=['xlsx', 'xls'],
        help="Faça upload de um arquivo Excel (.xlsx ou .xls)"
    )
    
    if uploaded_file is None:
        st.info("💡 **Primeiro passo:** Faça upload de um arquivo Excel para começar a análise.")
        return
    
    # Analisa o arquivo
    with st.spinner("🔍 Analisando arquivo..."):
        analysis = analyzer.analyze_excel_file(uploaded_file)
    
    if not analysis:
        st.error("❌ Erro ao analisar o arquivo. Verifique se é um arquivo Excel válido.")
        return
    
    # Salva dados no workflow
    workflow.update_workflow_data('source_data', analysis)
    
    # Exibe informações do arquivo
    st.markdown(f"""
    <div class="data-preview">
        <h3>📊 Informações do Arquivo</h3>
        <p><strong>Total de Abas:</strong> {analysis['total_sheets']}</p>
        <p><strong>Tamanho:</strong> {analysis.get('file_size', 0):,} bytes</p>
    </div>
    """, unsafe_allow_html=True)
    
    workflow_data = workflow.get_workflow_data()
    
    st.markdown("""
    <div class="step-indicator">
        <div class="step-number">2</div>
        <div>
            <h4>Comparação Detalhada</h4>
            <p>Configure os critérios e execute a comparação célula por célula</p>
        </div>
    </div>
    """, unsafe_allow_html=True)
    
    source_data = workflow_data['source_data']
    source_sheet = workflow_data.get('source_sheet')
    compare_sheet = workflow_data.get('compare_sheet')
    
    # Seleção de abas para comparação
    st.markdown("### 📋 Seleção de Abas para Comparação")
    
    sheet_names = list(source_data['sheets'].keys())
    
    col1, col2 = st.columns(2)
    
    with col1:
        st.markdown("#### 📊 Aba de Origem")
        if not source_sheet:
            st.info("💡 Selecione a aba de origem.")
        
        selected_source_sheet = st.selectbox(
            "Selecione a aba de origem:",
            options=sheet_names,
            index=sheet_names.index(source_sheet) if source_sheet and source_sheet in sheet_names else 0,
            help="Escolha a aba que contém os dados de origem",
            key="source_sheet_selector"
        )
        
        if selected_source_sheet != source_sheet:
            workflow.update_workflow_data('source_sheet', selected_source_sheet)
            source_sheet = selected_source_sheet
    
    with col2:
        st.markdown("#### 🔍 Aba de Comparação")
        if not compare_sheet:
            st.info("💡 Selecione a aba para comparar.")
        
        selected_compare_sheet = st.selectbox(
            "Selecione a aba de comparação:",
            options=sheet_names,
            index=sheet_names.index(compare_sheet) if compare_sheet and compare_sheet in sheet_names else (1 if len(sheet_names) > 1 else 0),
            help="Escolha a aba que será comparada com a origem",
            key="compare_sheet_selector"
        )
        
        if selected_compare_sheet != compare_sheet:
            workflow.update_workflow_data('compare_sheet', selected_compare_sheet)
            compare_sheet = selected_compare_sheet
    
    if source_sheet and compare_sheet:
        # Exibe informações das abas selecionadas
        st.markdown("### 📊 Informações das Abas Selecionadas")
        
        col1, col2 = st.columns(2)
        
        with col1:
            source_sheet_data = source_data['sheets'][source_sheet]
            source_columns = list(source_sheet_data['column_info'].keys())
            
            st.markdown(f"**📊 Origem: {source_sheet}**")
            subcol1, subcol2, subcol3 = st.columns(3)
            with subcol1:
                st.metric("📄 Linhas", f"{source_sheet_data['rows']:,}")
            with subcol2:
                st.metric("📋 Colunas", f"{source_sheet_data['columns']:,}")
            with subcol3:
                st.metric("📊 Disponíveis", f"{len(source_columns):,}")
        
        with col2:
            compare_sheet_data = source_data['sheets'][compare_sheet]
            compare_columns = list(compare_sheet_data['column_info'].keys())
            
            st.markdown(f"**🔍 Comparação: {compare_sheet}**")
            subcol1, subcol2, subcol3 = st.columns(3)
            with subcol1:
                st.metric("📄 Linhas", f"{compare_sheet_data['rows']:,}")
            with subcol2:
                st.metric("📋 Colunas", f"{compare_sheet_data['columns']:,}")
            with subcol3:
                st.metric("📊 Disponíveis", f"{len(compare_columns):,}")
        
        # Seleção de colunas para comparação
        st.markdown("### 🎯 Seleção de Colunas para Comparação")
        
        col1, col2 = st.columns(2)
        
        with col1:
            st.markdown("**Colunas da Origem:**")
            st.info(f"Selecione da aba: **{source_sheet}**")
            
            source_compare_columns = st.multiselect(
                "Selecione as colunas da origem:",
                options=source_columns,
                help="Escolha as colunas da aba de origem que serão comparadas",
                key="source_compare_columns"
            )
        
        with col2:
            st.markdown("**Colunas da Comparação:**")
            st.info(f"Selecione da aba: **{compare_sheet}**")
            
            compare_compare_columns = st.multiselect(
                "Selecione as colunas da comparação:",
                options=compare_columns,
                help="Escolha as colunas da aba de comparação que serão comparadas",
                key="compare_compare_columns"
            )
        
        if source_compare_columns or compare_compare_columns:
            # Configurações de similaridade
            st.markdown("### ⚙️ Configurações de Similaridade")
            
            col1, col2, col3 = st.columns(3)
            
            with col1:
                min_similarity = st.slider(
                    "Similaridade Mínima (%)",
                    min_value=0,
                    max_value=100,
                    value=50,
                    help="Similaridade mínima para considerar correspondência"
                )
            
            with col2:
                # Opção para escolher entre limite específico ou todas as linhas
                process_all_rows = st.checkbox(
                    "🔄 Processar todas as linhas",
                    value=False,
                    help="Marque para processar todas as linhas do arquivo sem limitação"
                )
                
                if process_all_rows:
                    st.info("✅ Todas as linhas serão processadas")
                    max_rows = None  # Indica que todas as linhas devem ser processadas
                else:
                    max_rows = st.number_input(
                        "📊 Limite de Linhas",
                        min_value=10,
                        max_value=50000,
                        value=1000,
                        help="Número máximo de linhas para processar (recomendado para arquivos grandes)"
                    )
            
            with col3:
                algorithm_weight = st.selectbox(
                    "Algoritmo Principal",
                    options=['balanced', 'levenshtein', 'jaro_winkler', 'cosine'],
                    help="Algoritmo principal para cálculo de similaridade"
                )
            
            # Botão para executar comparação
            if st.button("🚀 Executar Comparação de Colunas", type="primary"):
                
                with st.spinner("🔍 Executando comparação de colunas..."):
                    
                    # Carrega dados reais das duas abas
                    try:
                        # Obtém dados das abas selecionadas
                        source_sheet_data = source_data['sheets'][source_sheet]
                        compare_sheet_data = source_data['sheets'][compare_sheet]
                        
                        # Verifica se as abas têm a chave 'data'
                        if 'data' not in source_sheet_data:
                            st.error(f"❌ Dados não encontrados na aba '{source_sheet}'. Tente recarregar o arquivo.")
                            return
                        if 'data' not in compare_sheet_data:
                            st.error(f"❌ Dados não encontrados na aba '{compare_sheet}'. Tente recarregar o arquivo.")
                            return
                        
                        comparison_results = {}
                        
                        # Comparação entre colunas da origem
                        for i, col1 in enumerate(source_compare_columns):
                            for j, col2 in enumerate(source_compare_columns):
                                if i < j:  # Evita comparações duplicadas
                                    try:
                                        # Verifica se as colunas existem
                                        if col1 not in source_sheet_data['data']:
                                            st.warning(f"⚠️ Coluna '{col1}' não encontrada na aba '{source_sheet}'")
                                            continue
                                        if col2 not in source_sheet_data['data']:
                                            st.warning(f"⚠️ Coluna '{col2}' não encontrada na aba '{source_sheet}'")
                                            continue
                                        
                                        if max_rows is None:
                                            col1_data = pd.Series(source_sheet_data['data'][col1])
                                            col2_data = pd.Series(source_sheet_data['data'][col2])
                                        else:
                                            col1_data = pd.Series(source_sheet_data['data'][col1][:max_rows])
                                            col2_data = pd.Series(source_sheet_data['data'][col2][:max_rows])
                                        
                                        result = workflow.cell_comparator.compare_columns(col1_data, col2_data)
                                        comparison_results[f"{source_sheet}:{col1} vs {col2}"] = result
                                    except Exception as e:
                                        st.warning(f"⚠️ Erro ao comparar {col1} vs {col2}: {str(e)}")
                                        continue
                        
                        # Comparação entre colunas da comparação
                        for i, col1 in enumerate(compare_compare_columns):
                            for j, col2 in enumerate(compare_compare_columns):
                                if i < j:  # Evita comparações duplicadas
                                    try:
                                        # Verifica se as colunas existem
                                        if col1 not in compare_sheet_data['data']:
                                            st.warning(f"⚠️ Coluna '{col1}' não encontrada na aba '{compare_sheet}'")
                                            continue
                                        if col2 not in compare_sheet_data['data']:
                                            st.warning(f"⚠️ Coluna '{col2}' não encontrada na aba '{compare_sheet}'")
                                            continue
                                        
                                        if max_rows is None:
                                            col1_data = pd.Series(compare_sheet_data['data'][col1])
                                            col2_data = pd.Series(compare_sheet_data['data'][col2])
                                        else:
                                            col1_data = pd.Series(compare_sheet_data['data'][col1][:max_rows])
                                            col2_data = pd.Series(compare_sheet_data['data'][col2][:max_rows])
                                        
                                        result = workflow.cell_comparator.compare_columns(col1_data, col2_data)
                                        comparison_results[f"{compare_sheet}:{col1} vs {col2}"] = result
                                    except Exception as e:
                                        st.warning(f"⚠️ Erro ao comparar {col1} vs {col2}: {str(e)}")
                                        continue
                        
                        # Comparação cruzada entre abas
                        for col1 in source_compare_columns:
                            for col2 in compare_compare_columns:
                                try:
                                    # Verifica se as colunas existem
                                    if col1 not in source_sheet_data['data']:
                                        st.warning(f"⚠️ Coluna '{col1}' não encontrada na aba '{source_sheet}'")
                                        continue
                                    if col2 not in compare_sheet_data['data']:
                                        st.warning(f"⚠️ Coluna '{col2}' não encontrada na aba '{compare_sheet}'")
                                        continue
                                    
                                    if max_rows is None:
                                        col1_data = pd.Series(source_sheet_data['data'][col1])
                                        col2_data = pd.Series(compare_sheet_data['data'][col2])
                                    else:
                                        col1_data = pd.Series(source_sheet_data['data'][col1][:max_rows])
                                        col2_data = pd.Series(compare_sheet_data['data'][col2][:max_rows])
                                    
                                    result = workflow.cell_comparator.compare_columns(col1_data, col2_data)
                                    comparison_results[f"CROSS:{source_sheet}:{col1} vs {compare_sheet}:{col2}"] = result
                                except Exception as e:
                                    st.warning(f"⚠️ Erro ao comparar {source_sheet}:{col1} vs {compare_sheet}:{col2}: {str(e)}")
                                    continue
                        
                        # Salva resultados
                        workflow.update_workflow_data('cell_comparisons', comparison_results)
                        workflow.update_workflow_data('comparison_criteria', {
                            'source_sheet': source_sheet,
                            'compare_sheet': compare_sheet,
                            'source_compare_columns': source_compare_columns,
                            'compare_compare_columns': compare_compare_columns,
                            'min_similarity': min_similarity / 100,
                            'max_rows': max_rows,
                            'algorithm_weight': algorithm_weight
                        })
                        
                        st.success("✅ Comparação executada com sucesso!")
                        
                    except Exception as e:
                        st.error(f"❌ Erro na comparação: {str(e)}")
                        return
                
                # Exibe resultados
                st.markdown("## 📊 Resultados da Comparação de Colunas")
                
                # Organiza resultados por tipo
                source_results = {k: v for k, v in comparison_results.items() if k.startswith(source_sheet) and not k.startswith("CROSS:")}
                compare_results = {k: v for k, v in comparison_results.items() if k.startswith(compare_sheet) and not k.startswith("CROSS:")}
                cross_results = {k: v for k, v in comparison_results.items() if k.startswith("CROSS:")}
                
                # Exibe comparações internas da aba de origem
                if source_results:
                    st.markdown(f"### 📊 Comparações Internas na Aba: **{source_sheet}**")
                    for compare_col, result in source_results.items():
                        comparison_desc = compare_col.replace(f"{source_sheet}:", "")
                        with st.expander(f"🔍 {comparison_desc} - Similaridade: {result['overall_similarity']:.1%}"):
                            parts = comparison_desc.split(" vs ")
                            display_cell_comparison(result, parts[0], parts[1])
                
                # Exibe comparações internas da aba de comparação
                if compare_results:
                    st.markdown(f"### 🔍 Comparações Internas na Aba: **{compare_sheet}**")
                    for compare_col, result in compare_results.items():
                        comparison_desc = compare_col.replace(f"{compare_sheet}:", "")
                        with st.expander(f"🔍 {comparison_desc} - Similaridade: {result['overall_similarity']:.1%}"):
                            parts = comparison_desc.split(" vs ")
                            display_cell_comparison(result, parts[0], parts[1])
                
                # Exibe comparações cruzadas entre abas
                if cross_results:
                    st.markdown(f"### 🔄 Comparações Cruzadas: **{source_sheet}** vs **{compare_sheet}**")
                    for compare_col, result in cross_results.items():
                        comparison_desc = compare_col.replace("CROSS:", "")
                        with st.expander(f"🔄 {comparison_desc} - Similaridade: {result['overall_similarity']:.1%}"):
                            parts = comparison_desc.split(" vs ")
                            display_cell_comparison(result, parts[0], parts[1])
                
                # Identifica dados similares para aba destino
                similar_data = []
                for compare_col, result in comparison_results.items():
                    for comp in result['cell_comparisons']:
                        if comp['similarities']['overall'] >= (min_similarity / 100):
                            # Extrai informações das colunas comparadas
                            if compare_col.startswith("CROSS:"):
                                comparison_desc = compare_col.replace("CROSS:", "")
                                parts = comparison_desc.split(" vs ")
                                col1_info = parts[0]
                                col2_info = parts[1]
                            else:
                                # Comparação interna
                                if ":" in compare_col:
                                    sheet_name = compare_col.split(":")[0]
                                    comparison_desc = compare_col.replace(f"{sheet_name}:", "")
                                    parts = comparison_desc.split(" vs ")
                                    col1_info = f"{sheet_name}:{parts[0]}"
                                    col2_info = f"{sheet_name}:{parts[1]}"
                                else:
                                    col1_info = "Coluna 1"
                                    col2_info = "Coluna 2"
                            
                            similar_data.append({
                                'linha': comp['index'] + 1,
                                'coluna_1': col1_info,
                                'valor_1': comp['cell1'],
                                'coluna_2': col2_info,
                                'valor_2': comp['cell2'],
                                'similaridade': comp['similarities']['overall'],
                                'categoria': comp['category'],
                                'tipo_comparacao': compare_col
                            })
                
                workflow.update_workflow_data('similar_data', similar_data)
                
                # Resumo geral
                st.markdown("### 📈 Resumo Geral da Comparação")
                
                total_comparisons = sum(len(result['cell_comparisons']) for result in comparison_results.values())
                total_similar = len(similar_data)
                
                col1, col2, col3 = st.columns(3)
                
                with col1:
                    st.markdown(f"""
                    <div class="metric-card">
                        <h4>🔢 Total de Comparações</h4>
                        <h2>{total_comparisons:,}</h2>
                    </div>
                    """, unsafe_allow_html=True)
                
                with col2:
                    st.markdown(f"""
                    <div class="metric-card" style="border-color: #48bb78;">
                        <h4>✅ Correspondências Encontradas</h4>
                        <h2>{total_similar:,}</h2>
                    </div>
                    """, unsafe_allow_html=True)
                
                with col3:
                    success_rate = (total_similar / total_comparisons * 100) if total_comparisons > 0 else 0
                    st.markdown(f"""
                    <div class="metric-card" style="border-color: #4299e1;">
                        <h4>📊 Taxa de Sucesso</h4>
                        <h2>{success_rate:.1f}%</h2>
                    </div>
                    """, unsafe_allow_html=True)
                
                # Botão para avançar
                if total_similar > 0:
                    if st.button("➡️ Avançar para Destino", type="primary"):
                        # Atualiza o estado para redirecionar para a aba destino
                        st.session_state.active_tab = "🎯 Destino"
                        st.success("✅ Comparação concluída! Redirecionando para a aba Destino...")
                        st.balloons()
                        # Força o rerun para aplicar a mudança de aba
                        st.rerun()
                    
                    # Dica para o usuário
                    st.info("💡 **Próximo passo:** Clique no botão 'Avançar para Destino' para ser redirecionado automaticamente.")

def show_destino_tab(workflow: MappingWorkflow, analyzer: AdvancedDataAnalyzer):
    """Exibe a aba de destino para alocação dos dados filtrados"""
    
    st.markdown("""
    <div class="tab-header">
        <h2>📤 Aba de Destino</h2>
        <p>Visualização e exportação dos dados similares identificados</p>
    </div>
    """, unsafe_allow_html=True)
    
    workflow_data = workflow.get_workflow_data()
    
    if workflow_data.get('similar_data') is None:
        st.warning("⚠️ Por favor, execute a comparação na Aba de Comparação primeiro.")
        return
    
    st.markdown("""
    <div class="step-indicator">
        <div class="step-number">3</div>
        <div>
            <h4>Dados Similares Identificados</h4>
            <p>Visualize, configure e exporte os dados com correspondências encontradas</p>
        </div>
    </div>
    """, unsafe_allow_html=True)
    
    similar_data = workflow_data['similar_data']
    comparison_criteria = workflow_data.get('comparison_criteria', {})
    
    # Resumo dos dados similares
    st.markdown("### 📊 Resumo dos Dados Similares")
    
    if similar_data:
        df_similar = pd.DataFrame(similar_data)
        
        # Métricas
        col1, col2, col3, col4 = st.columns(4)
        
        with col1:
            st.markdown(f"""
            <div class="metric-card">
                <h4>📋 Total de Correspondências</h4>
                <h2>{len(df_similar):,}</h2>
            </div>
            """, unsafe_allow_html=True)
        
        with col2:
            avg_similarity = df_similar['similaridade'].mean()
            st.markdown(f"""
            <div class="metric-card" style="border-color: #48bb78;">
                <h4>📈 Similaridade Média</h4>
                <h2>{avg_similarity:.1%}</h2>
            </div>
            """, unsafe_allow_html=True)
        
        with col3:
            unique_lines = df_similar['linha'].nunique()
            st.markdown(f"""
            <div class="metric-card" style="border-color: #4299e1;">
                <h4>📝 Linhas Únicas</h4>
                <h2>{unique_lines:,}</h2>
            </div>
            """, unsafe_allow_html=True)
        
        with col4:
            if 'coluna_comp' in df_similar.columns:
                unique_columns = df_similar['coluna_comp'].nunique()
            else:
                unique_columns = 0
            st.markdown(f"""
            <div class="metric-card" style="border-color: #ed8936;">
                <h4>🗂️ Colunas Comparadas</h4>
                <h2>{unique_columns}</h2>
            </div>
            """, unsafe_allow_html=True)
        
        # Filtros para visualização
        st.markdown("### 🎛️ Filtros de Visualização")
        
        col1, col2, col3 = st.columns(3)
        
        with col1:
            min_sim_filter = st.slider(
                "Similaridade Mínima para Exibição",
                min_value=0.0,
                max_value=1.0,
                value=0.5,
                step=0.05,
                format="%.1f"
            )
        
        with col2:
            try:
                if 'categoria' in df_similar.columns and not df_similar.empty:
                    category_options = df_similar['categoria'].dropna().unique().tolist()
                    category_default = category_options if len(category_options) <= 10 else category_options[:10]
                else:
                    category_options = []
                    category_default = []
                
                category_filter = st.multiselect(
                    "Categorias de Similaridade",
                    options=category_options,
                    default=category_default,
                    help="Selecione as categorias de similaridade para filtrar"
                )
            except Exception as e:
                st.warning(f"⚠️ Problema ao carregar categorias: {str(e)}")
                category_filter = []
        
        with col3:
            try:
                if 'coluna_comp' in df_similar.columns and not df_similar.empty:
                    column_options = df_similar['coluna_comp'].dropna().unique().tolist()
                    column_default = column_options if len(column_options) <= 10 else column_options[:10]
                else:
                    column_options = []
                    column_default = []
                    
                column_filter = st.multiselect(
                    "Colunas Comparadas",
                    options=column_options,
                    default=column_default,
                    help="Selecione as colunas comparadas para filtrar"
                )
            except Exception as e:
                st.warning(f"⚠️ Problema ao carregar colunas: {str(e)}")
                column_filter = []
        
        # Botões para controle de filtros
        col_btn1, col_btn2 = st.columns(2)
        with col_btn1:
            apply_filters = st.button("🔍 Aplicar Filtros", type="secondary", help="Clique para aplicar os filtros selecionados")
        with col_btn2:
            reset_filters = st.button("🔄 Resetar Filtros", help="Limpar todos os filtros aplicados")
        
        # Controle de filtros com tratamento de erros
        try:
            if reset_filters:
                st.session_state.filters_applied = False
                st.session_state.df_filtered = df_similar
                st.success("🔄 Filtros resetados! Exibindo todos os registros.")
                df_filtered = df_similar
            elif apply_filters or 'filters_applied' not in st.session_state:
                with st.spinner("🔍 Aplicando filtros..."):
                    st.session_state.filters_applied = True
                    
                    # Verifica se o DataFrame tem dados antes de aplicar filtros
                    if df_similar.empty:
                        st.warning("⚠️ Não há dados para filtrar.")
                        df_filtered = df_similar
                    else:
                        # Aplica filtros apenas para colunas que existem
                        filter_conditions = []
                        
                        # Filtro de similaridade (sempre presente)
                        if 'similaridade' in df_similar.columns:
                            filter_conditions.append(df_similar['similaridade'] >= min_sim_filter)
                        
                        # Filtro de categoria (se existir)
                        if 'categoria' in df_similar.columns and category_filter:
                            filter_conditions.append(df_similar['categoria'].isin(category_filter))
                            
                        # Filtro de coluna comparada (se existir)
                        if 'coluna_comp' in df_similar.columns and column_filter:
                            filter_conditions.append(df_similar['coluna_comp'].isin(column_filter))
                        
                        # Combina todas as condições
                        if filter_conditions:
                            combined_filter = filter_conditions[0]
                            for condition in filter_conditions[1:]:
                                combined_filter = combined_filter & condition
                            df_filtered = df_similar[combined_filter]
                        else:
                            df_filtered = df_similar
                        
                    st.session_state.df_filtered = df_filtered
                    
                # Feedback sobre os resultados filtrados
                total_original = len(df_similar)
                total_filtered = len(df_filtered)
                if apply_filters:
                    st.success(f"✅ Filtros aplicados! Exibindo {total_filtered} de {total_original} registros.")
            else:
                # Usa os dados filtrados salvos no session_state
                df_filtered = st.session_state.get('df_filtered', df_similar)
                
        except Exception as e:
            st.error(f"❌ Erro ao aplicar filtros: {str(e)}")
            st.info("🔄 Usando dados originais sem filtros.")
            df_filtered = df_similar
            
        # Indicador visual de filtros ativos
        if st.session_state.get('filters_applied', False) and len(df_filtered) < len(df_similar):
            st.info(f"🎛️ Filtros ativos: {len(df_filtered)} de {len(df_similar)} registros exibidos")
        
        # Gráfico de distribuição de similaridade
        st.markdown("### 📊 Distribuição de Similaridade")
        
        fig = px.histogram(
            df_filtered,
            x='similaridade',
            nbins=20,
            title="Distribuição de Similaridade dos Dados Correspondentes",
            labels={'similaridade': 'Similaridade', 'count': 'Frequência'}
        )
        fig.update_layout(height=400)
        st.plotly_chart(fig, use_container_width=True)
        
        # Tabela de dados similares
        st.markdown("### 📋 Dados Similares Identificados")
        
        # Formata dados para exibição
        df_display = df_filtered.copy()
        if 'similaridade' in df_display.columns:
            df_display['similaridade'] = df_display['similaridade'].apply(lambda x: f"{x:.1%}")
        if 'categoria' in df_display.columns:
            df_display['categoria'] = df_display['categoria'].str.title()
        
        # Renomeia colunas para português (apenas as que existem)
        rename_dict = {}
        if 'linha' in df_display.columns:
            rename_dict['linha'] = 'Linha'
        if 'coluna_ref' in df_display.columns:
            rename_dict['coluna_ref'] = 'Coluna Referência'
        if 'valor_ref' in df_display.columns:
            rename_dict['valor_ref'] = 'Valor Referência'
        if 'coluna_comp' in df_display.columns:
            rename_dict['coluna_comp'] = 'Coluna Comparada'
        if 'valor_comp' in df_display.columns:
            rename_dict['valor_comp'] = 'Valor Comparado'
        if 'similaridade' in df_display.columns:
            rename_dict['similaridade'] = 'Similaridade'
        if 'categoria' in df_display.columns:
            rename_dict['categoria'] = 'Categoria'
            
        df_display = df_display.rename(columns=rename_dict)
        
        st.dataframe(df_display, use_container_width=True)
        
        # Opções de exportação
        st.markdown("### 💾 Exportação de Dados")
        
        col1, col2, col3 = st.columns(3)
        
        with col1:
            export_format = st.selectbox(
                "Formato de Exportação",
                options=['Excel', 'CSV', 'JSON'],
                help="Escolha o formato para exportar os dados"
            )
        
        with col2:
            include_metadata = st.checkbox(
                "Incluir Metadados",
                value=True,
                help="Incluir informações sobre critérios de comparação"
            )
        
        with col3:
            filename = st.text_input(
                "Nome do Arquivo",
                value=f"dados_similares_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
                help="Nome do arquivo para exportação"
            )
        
        # Botão de exportação
        if st.button("📥 Exportar Dados Similares", type="primary"):
            try:
                if export_format == 'Excel':
                    # Cria arquivo Excel
                    from io import BytesIO
                    buffer = BytesIO()
                    
                    with pd.ExcelWriter(buffer, engine='openpyxl') as writer:
                        df_filtered.to_excel(writer, sheet_name='Dados_Similares', index=False)
                        
                        if include_metadata:
                            max_rows_display = comparison_criteria.get('max_rows')
                            if max_rows_display is None:
                                max_rows_display = 'Todas as linhas'
                            
                            metadata_df = pd.DataFrame([
                                ['Coluna Referência', comparison_criteria.get('ref_column', 'N/A')],
                                ['Colunas Comparadas', ', '.join(comparison_criteria.get('compare_columns', []))],
                                ['Similaridade Mínima', f"{comparison_criteria.get('min_similarity', 0):.1%}"],
                                ['Máximo de Linhas', max_rows_display],
                                ['Algoritmo Principal', comparison_criteria.get('algorithm_weight', 'N/A')],
                                ['Data de Processamento', datetime.now().strftime('%Y-%m-%d %H:%M:%S')],
                                ['Total de Correspondências', len(df_filtered)]
                            ], columns=['Parâmetro', 'Valor'])
                            
                            metadata_df.to_excel(writer, sheet_name='Metadados', index=False)
                    
                    st.download_button(
                        label="📥 Download Excel",
                        data=buffer.getvalue(),
                        file_name=f"{filename}.xlsx",
                        mime="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                    )
                
                elif export_format == 'CSV':
                    csv_data = df_filtered.to_csv(index=False)
                    st.download_button(
                        label="📥 Download CSV",
                        data=csv_data,
                        file_name=f"{filename}.csv",
                        mime="text/csv"
                    )
                
                elif export_format == 'JSON':
                    json_data = df_filtered.to_json(orient='records', indent=2)
                    st.download_button(
                        label="📥 Download JSON",
                        data=json_data,
                        file_name=f"{filename}.json",
                        mime="application/json"
                    )
                
                st.success("✅ Arquivo preparado para download!")
                
            except Exception as e:
                st.error(f"❌ Erro na exportação: {str(e)}")
        
        # Estatísticas finais
        st.markdown("### 📈 Estatísticas Finais")
        
        col1, col2 = st.columns(2)
        
        with col1:
            # Gráfico de pizza por categoria
            category_counts = df_filtered['categoria'].value_counts()
            fig_pie = px.pie(
                values=category_counts.values,
                names=category_counts.index,
                title="Distribuição por Categoria de Similaridade"
            )
            st.plotly_chart(fig_pie, use_container_width=True)
        
        with col2:
            # Gráfico de barras por coluna
            if 'coluna_comp' in df_filtered.columns:
                column_counts = df_filtered['coluna_comp'].value_counts()
                fig_bar = px.bar(
                    x=column_counts.index,
                    y=column_counts.values,
                    title="Correspondências por Coluna Comparada",
                    labels={'x': 'Coluna', 'y': 'Número de Correspondências'}
                )
                st.plotly_chart(fig_bar, use_container_width=True)
            else:
                st.info("📊 Gráfico de colunas não disponível - execute uma comparação primeiro.")
        
    else:
        st.info("ℹ️ Nenhum dado similar foi identificado com os critérios atuais.")
    
    # Botão para reiniciar processo
    if st.button("🔄 Reiniciar Processo", type="secondary"):
        workflow.reset_workflow()
        st.success("✅ Processo reiniciado! Você pode começar novamente na aba 'Origem'.")
        st.info("💡 **Dica:** Clique na aba '📁 Origem' para carregar novos dados.")

def main():
    """Função principal do aplicativo"""
    
    # Cabeçalho principal
    st.markdown("""
    <div class="main-header">
        <h1>🗂️ Sistema de Mapeamento de Colunas</h1>
        <p>Interface Avançada com Três Abas Distintas - Versão Brasileira</p>
    </div>
    """, unsafe_allow_html=True)
    
    # Inicializa classes
    workflow = MappingWorkflow()
    analyzer = AdvancedDataAnalyzer()
    
    # Inicializa controle de estado da aba ativa
    if 'active_tab' not in st.session_state:
        st.session_state.active_tab = "🔍 Comparação"
    
    # Navegação por abas com controle de estado
    tab_names = ["🔍 Comparação", "🎯 Destino"]
    
    # Seletor de aba com controle programático
    selected_tab = st.selectbox(
        "Selecione a aba:",
        tab_names,
        index=tab_names.index(st.session_state.active_tab),
        key="tab_selector"
    )
    
    # Atualiza o estado da aba ativa
    st.session_state.active_tab = selected_tab
    
    # Exibe o conteúdo da aba selecionada
    if selected_tab == "🔍 Comparação":
        show_comparacao_tab(workflow, analyzer)
    elif selected_tab == "🎯 Destino":
        show_destino_tab(workflow, analyzer)
    
    # Barra lateral com informações
    with st.sidebar:
        st.markdown("## 📋 Informações do Sistema")
        
        workflow_data = workflow.get_workflow_data()
        current_step = workflow_data.get('current_step', 1)
        
        # Indicador de progresso
        progress_steps = [
            "📁 Carregamento de Dados",
            "🔍 Comparação Detalhada", 
            "🎯 Dados Similares"
        ]
        
        for i, step in enumerate(progress_steps, 1):
            if i < current_step:
                st.success(f"✅ {step}")
            elif i == current_step:
                st.info(f"🔄 {step}")
            else:
                st.write(f"⏳ {step}")
        
        st.markdown("---")
        
        # Estatísticas do fluxo
        if workflow_data.get('source_data'):
            st.markdown("### 📊 Estatísticas")
            
            source_data = workflow_data['source_data']
            if source_data:
                st.metric("Total de Abas", source_data.get('total_sheets', 0))
                
                if workflow_data.get('source_sheet'):
                    sheet_name = workflow_data['source_sheet']
                    sheet_data = source_data['sheets'][sheet_name]
                    st.metric("Linhas na Aba", f"{sheet_data['rows']:,}")
                    st.metric("Colunas na Aba", sheet_data['columns'])
                
                if workflow_data.get('similar_data') is not None:
                    similar_count = len(workflow_data['similar_data'])
                    st.metric("Dados Similares", f"{similar_count:,}")
        
        st.markdown("---")
        
        # Instruções de uso
        st.markdown("### 📖 Como Usar")
        st.markdown("""
        1. **Aba Origem**: Carregue seu arquivo Excel
        2. **Aba Comparação**: Configure critérios e execute comparação
        3. **Aba Destino**: Visualize e exporte resultados
        """)
        
        st.markdown("### 🎯 Características")
        st.markdown("""
        - ✅ **Interface em Português Brasileiro**
        - 🔍 **Comparação Célula por Célula**
        - 📊 **Múltiplos Algoritmos de Similaridade**
        - 🎨 **Alto Contraste Visual**
        - 💾 **Exportação em Múltiplos Formatos**
        - 📈 **Visualizações Avançadas**
        """)

if __name__ == "__main__":
    main()