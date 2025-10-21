import streamlit as st
import pandas as pd
import json
import re
import io
import unicodedata
from typing import Dict, List, Tuple, Optional, Any
import plotly.express as px
import plotly.graph_objects as go
from plotly.subplots import make_subplots
from collections import Counter, defaultdict
import numpy as np
import seaborn as sns
import matplotlib.pyplot as plt
from datetime import datetime
import warnings
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.cluster import KMeans
from sklearn.decomposition import PCA
import nltk
from textdistance import levenshtein, jaro_winkler, jaccard
import hashlib
import pickle
from pathlib import Path

warnings.filterwarnings('ignore')

# Configuração da página
st.set_page_config(
    page_title="Sistema Avançado de Comparação Excel com IA",
    page_icon="🤖",
    layout="wide",
    initial_sidebar_state="expanded"
)

# CSS personalizado para interface moderna
st.markdown("""
<style>
    .main-header {
        background: linear-gradient(90deg, #1e3c72 0%, #2a5298 100%);
        padding: 2rem;
        border-radius: 10px;
        color: white;
        text-align: center;
        margin-bottom: 2rem;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    
    .metric-card {
        background: white;
        padding: 1.5rem;
        border-radius: 10px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        border-left: 4px solid #2a5298;
        margin: 1rem 0;
    }
    
    .comparison-result {
        background: #f8f9fa;
        padding: 1rem;
        border-radius: 8px;
        border: 1px solid #dee2e6;
        margin: 0.5rem 0;
    }
    
    .match-high { background-color: #d4edda; border-left: 4px solid #28a745; }
    .match-medium { background-color: #fff3cd; border-left: 4px solid #ffc107; }
    .match-low { background-color: #f8d7da; border-left: 4px solid #dc3545; }
    
    .ai-insight {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 1rem;
        border-radius: 8px;
        margin: 1rem 0;
    }
    
    .stTabs [data-baseweb="tab-list"] {
        gap: 2px;
    }
    
    .stTabs [data-baseweb="tab"] {
        height: 50px;
        padding-left: 20px;
        padding-right: 20px;
        background-color: #f0f2f6;
        border-radius: 4px 4px 0px 0px;
    }
    
    .stTabs [aria-selected="true"] {
        background-color: #2a5298;
        color: white;
    }
</style>
""", unsafe_allow_html=True)

class AdvancedAIComparator:
    """Sistema avançado de comparação com IA para análise de dados Excel"""
    
    def __init__(self):
        self.vectorizer = TfidfVectorizer(
            max_features=1000,
            stop_words=None,
            ngram_range=(1, 3),
            analyzer='char_wb'
        )
        self.learning_data = self._load_learning_data()
        self.comparison_history = []
        
    def _load_learning_data(self) -> Dict:
        """Carrega dados de aprendizado histórico"""
        try:
            learning_file = Path("ai_learning_data.pkl")
            if learning_file.exists():
                with open(learning_file, 'rb') as f:
                    return pickle.load(f)
        except:
            pass
        return {
            'successful_matches': [],
            'user_corrections': [],
            'pattern_weights': {},
            'semantic_clusters': {}
        }
    
    def _save_learning_data(self):
        """Salva dados de aprendizado para melhoria contínua"""
        try:
            with open("ai_learning_data.pkl", 'wb') as f:
                pickle.dump(self.learning_data, f)
        except:
            pass
    
    def normalize_text(self, text: str) -> str:
        """Normalização avançada de texto"""
        if pd.isna(text) or text is None:
            return ""
        
        text = str(text).lower().strip()
        text = unicodedata.normalize('NFKD', text)
        text = ''.join(c for c in text if not unicodedata.combining(c))
        text = re.sub(r'[^\w\s]', ' ', text)
        text = re.sub(r'\s+', ' ', text)
        
        return text.strip()
    
    def extract_semantic_features(self, text: str) -> Dict[str, Any]:
        """Extrai características semânticas do texto"""
        normalized = self.normalize_text(text)
        
        features = {
            'length': len(normalized),
            'word_count': len(normalized.split()),
            'has_numbers': bool(re.search(r'\d', normalized)),
            'has_date_pattern': bool(re.search(r'\d{2}[/-]\d{2}[/-]\d{4}|\d{4}[/-]\d{2}[/-]\d{2}', text)),
            'has_currency': bool(re.search(r'[R$€£¥]|\breal\b|\bdolar\b|\beuro\b', normalized)),
            'has_percentage': bool(re.search(r'%|\bpercent\b|\bporcent\b', normalized)),
            'is_code': bool(re.search(r'^[A-Z0-9]{3,}$', text.strip())),
            'is_name': bool(re.search(r'^[A-Za-z\s]+$', text.strip()) and len(text.strip()) > 2),
            'keywords': self._extract_keywords(normalized)
        }
        
        return features
    
    def _extract_keywords(self, text: str) -> List[str]:
        """Extrai palavras-chave importantes do texto"""
        # Palavras-chave específicas do domínio
        domain_keywords = {
            'financeiro': ['valor', 'preco', 'custo', 'total', 'subtotal', 'desconto', 'taxa', 'juros'],
            'temporal': ['data', 'hora', 'periodo', 'mes', 'ano', 'dia', 'prazo', 'vencimento'],
            'identificacao': ['codigo', 'id', 'numero', 'seq', 'chave', 'ref', 'referencia'],
            'quantidade': ['qtd', 'quantidade', 'volume', 'peso', 'medida', 'unidade'],
            'pessoa': ['nome', 'cliente', 'fornecedor', 'usuario', 'responsavel', 'contato'],
            'produto': ['item', 'produto', 'material', 'mercadoria', 'sku', 'categoria'],
            'localizacao': ['endereco', 'cidade', 'estado', 'pais', 'cep', 'regiao', 'local']
        }
        
        keywords = []
        words = text.split()
        
        for category, category_words in domain_keywords.items():
            for word in words:
                for keyword in category_words:
                    if keyword in word or word in keyword:
                        keywords.append(f"{category}:{keyword}")
        
        return list(set(keywords))
    
    def calculate_advanced_similarity(self, text1: str, text2: str) -> Dict[str, float]:
        """Calcula similaridade avançada usando múltiplas métricas"""
        norm1, norm2 = self.normalize_text(text1), self.normalize_text(text2)
        
        if not norm1 or not norm2:
            return {'overall': 0.0, 'details': {}}
        
        # Métricas de distância textual
        lev_sim = 1 - (levenshtein(norm1, norm2) / max(len(norm1), len(norm2)))
        jaro_sim = jaro_winkler(norm1, norm2)
        jaccard_sim = jaccard(set(norm1.split()), set(norm2.split()))
        
        # Similaridade semântica usando TF-IDF
        try:
            tfidf_matrix = self.vectorizer.fit_transform([norm1, norm2])
            cosine_sim = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]
        except:
            cosine_sim = 0.0
        
        # Análise de características semânticas
        features1 = self.extract_semantic_features(text1)
        features2 = self.extract_semantic_features(text2)
        
        semantic_sim = self._calculate_semantic_similarity(features1, features2)
        
        # Peso adaptativo baseado no aprendizado
        weights = self.learning_data.get('pattern_weights', {
            'levenshtein': 0.25,
            'jaro_winkler': 0.25,
            'jaccard': 0.20,
            'cosine': 0.15,
            'semantic': 0.15
        })
        
        overall_similarity = (
            weights.get('levenshtein', 0.25) * lev_sim +
            weights.get('jaro_winkler', 0.25) * jaro_sim +
            weights.get('jaccard', 0.20) * jaccard_sim +
            weights.get('cosine', 0.15) * cosine_sim +
            weights.get('semantic', 0.15) * semantic_sim
        )
        
        return {
            'overall': overall_similarity,
            'details': {
                'levenshtein': lev_sim,
                'jaro_winkler': jaro_sim,
                'jaccard': jaccard_sim,
                'cosine': cosine_sim,
                'semantic': semantic_sim
            }
        }
    
    def _calculate_semantic_similarity(self, features1: Dict, features2: Dict) -> float:
        """Calcula similaridade semântica entre características"""
        # Similaridade de tipo de dados
        type_similarity = 0.0
        type_features = ['has_numbers', 'has_date_pattern', 'has_currency', 'has_percentage', 'is_code', 'is_name']
        
        matching_types = sum(1 for feature in type_features if features1[feature] == features2[feature])
        type_similarity = matching_types / len(type_features)
        
        # Similaridade de palavras-chave
        keywords1 = set(features1['keywords'])
        keywords2 = set(features2['keywords'])
        
        if keywords1 or keywords2:
            keyword_similarity = len(keywords1.intersection(keywords2)) / len(keywords1.union(keywords2))
        else:
            keyword_similarity = 0.0
        
        # Similaridade de comprimento (normalizada)
        length_diff = abs(features1['length'] - features2['length'])
        max_length = max(features1['length'], features2['length'])
        length_similarity = 1 - (length_diff / max_length) if max_length > 0 else 1.0
        
        return (type_similarity * 0.5 + keyword_similarity * 0.3 + length_similarity * 0.2)
    
    def find_best_matches(self, source_columns: List[str], target_columns: List[str], 
                         threshold: float = 0.3) -> List[Dict]:
        """Encontra as melhores correspondências entre colunas usando IA"""
        matches = []
        
        for source_col in source_columns:
            best_match = None
            best_score = 0.0
            
            for target_col in target_columns:
                similarity = self.calculate_advanced_similarity(source_col, target_col)
                
                if similarity['overall'] > best_score and similarity['overall'] >= threshold:
                    best_score = similarity['overall']
                    best_match = {
                        'source': source_col,
                        'target': target_col,
                        'similarity': similarity,
                        'confidence': self._calculate_confidence(similarity),
                        'recommendation': self._get_match_recommendation(similarity)
                    }
            
            if best_match:
                matches.append(best_match)
        
        # Ordena por confiança
        matches.sort(key=lambda x: x['confidence'], reverse=True)
        return matches
    
    def _calculate_confidence(self, similarity: Dict) -> float:
        """Calcula nível de confiança da correspondência"""
        overall = similarity['overall']
        details = similarity['details']
        
        # Confiança baseada na consistência entre métricas
        metric_values = list(details.values())
        std_dev = np.std(metric_values)
        consistency = 1 - min(std_dev, 1.0)
        
        # Confiança final
        confidence = (overall * 0.7 + consistency * 0.3)
        return min(confidence, 1.0)
    
    def _get_match_recommendation(self, similarity: Dict) -> str:
        """Gera recomendação baseada na análise de similaridade"""
        overall = similarity['overall']
        details = similarity['details']
        
        if overall >= 0.8:
            return "Correspondência Excelente - Recomendado"
        elif overall >= 0.6:
            return "Correspondência Boa - Verificar contexto"
        elif overall >= 0.4:
            return "Correspondência Moderada - Revisar manualmente"
        else:
            return "Correspondência Baixa - Não recomendado"
    
    def analyze_data_patterns(self, df: pd.DataFrame, column: str) -> Dict:
        """Analisa padrões nos dados de uma coluna"""
        if column not in df.columns:
            return {}
        
        data = df[column].dropna()
        if len(data) == 0:
            return {}
        
        analysis = {
            'total_records': len(data),
            'unique_values': data.nunique(),
            'null_percentage': (df[column].isna().sum() / len(df)) * 100,
            'data_types': {},
            'patterns': {},
            'sample_values': data.head(10).tolist()
        }
        
        # Análise de tipos de dados
        for value in data.head(100):
            features = self.extract_semantic_features(str(value))
            for key, val in features.items():
                if key not in ['keywords', 'length', 'word_count']:
                    if key not in analysis['data_types']:
                        analysis['data_types'][key] = 0
                    if val:
                        analysis['data_types'][key] += 1
        
        # Normaliza percentuais
        total_analyzed = min(100, len(data))
        for key in analysis['data_types']:
            analysis['data_types'][key] = (analysis['data_types'][key] / total_analyzed) * 100
        
        return analysis
    
    def compare_data_compatibility(self, df1: pd.DataFrame, col1: str, 
                                 df2: pd.DataFrame, col2: str) -> Dict:
        """Compara compatibilidade de dados entre duas colunas"""
        analysis1 = self.analyze_data_patterns(df1, col1)
        analysis2 = self.analyze_data_patterns(df2, col2)
        
        if not analysis1 or not analysis2:
            return {'compatibility_score': 0.0, 'issues': ['Dados insuficientes para análise']}
        
        compatibility_score = 0.0
        issues = []
        
        # Compara tipos de dados
        type_similarity = 0.0
        for data_type in set(analysis1['data_types'].keys()).union(set(analysis2['data_types'].keys())):
            val1 = analysis1['data_types'].get(data_type, 0)
            val2 = analysis2['data_types'].get(data_type, 0)
            type_similarity += 1 - abs(val1 - val2) / 100
        
        type_similarity /= len(set(analysis1['data_types'].keys()).union(set(analysis2['data_types'].keys())))
        compatibility_score += type_similarity * 0.6
        
        # Verifica problemas específicos
        if abs(analysis1['null_percentage'] - analysis2['null_percentage']) > 20:
            issues.append(f"Diferença significativa em valores nulos: {analysis1['null_percentage']:.1f}% vs {analysis2['null_percentage']:.1f}%")
        
        if analysis1['unique_values'] / analysis1['total_records'] < 0.1 and analysis2['unique_values'] / analysis2['total_records'] > 0.9:
            issues.append("Incompatibilidade: uma coluna tem poucos valores únicos, outra tem muitos")
        
        return {
            'compatibility_score': compatibility_score,
            'issues': issues,
            'analysis1': analysis1,
            'analysis2': analysis2
        }

def load_excel_file(uploaded_file) -> Tuple[Dict[str, pd.DataFrame], bool]:
    """Carrega arquivo Excel e retorna dicionário de DataFrames"""
    try:
        excel_data = {}
        excel_file = pd.ExcelFile(uploaded_file)
        
        for sheet_name in excel_file.sheet_names:
            try:
                df = pd.read_excel(uploaded_file, sheet_name=sheet_name)
                if not df.empty:
                    excel_data[sheet_name] = df
            except Exception as e:
                st.warning(f"Erro ao carregar aba '{sheet_name}': {str(e)}")
        
        return excel_data, True
    except Exception as e:
        st.error(f"Erro ao carregar arquivo Excel: {str(e)}")
        return {}, False

def create_comparison_visualization(matches: List[Dict], comparator: AdvancedAIComparator):
    """Cria visualizações avançadas dos resultados de comparação"""
    if not matches:
        st.warning("Nenhuma correspondência encontrada para visualizar.")
        return
    
    # Gráfico de similaridade
    fig_similarity = go.Figure()
    
    sources = [match['source'] for match in matches]
    targets = [match['target'] for match in matches]
    similarities = [match['similarity']['overall'] for match in matches]
    confidences = [match['confidence'] for match in matches]
    
    # Gráfico de barras com similaridade e confiança
    fig_similarity.add_trace(go.Bar(
        name='Similaridade',
        x=sources,
        y=similarities,
        marker_color='lightblue',
        text=[f"{s:.2f}" for s in similarities],
        textposition='auto'
    ))
    
    fig_similarity.add_trace(go.Bar(
        name='Confiança',
        x=sources,
        y=confidences,
        marker_color='orange',
        text=[f"{c:.2f}" for c in confidences],
        textposition='auto'
    ))
    
    fig_similarity.update_layout(
        title="Análise de Similaridade e Confiança das Correspondências",
        xaxis_title="Colunas de Origem",
        yaxis_title="Pontuação (0-1)",
        barmode='group',
        height=500
    )
    
    st.plotly_chart(fig_similarity, use_container_width=True)
    
    # Heatmap de métricas detalhadas
    if len(matches) > 1:
        metrics_data = []
        metric_names = ['levenshtein', 'jaro_winkler', 'jaccard', 'cosine', 'semantic']
        
        for match in matches:
            row = [match['similarity']['details'][metric] for metric in metric_names]
            metrics_data.append(row)
        
        fig_heatmap = go.Figure(data=go.Heatmap(
            z=metrics_data,
            x=metric_names,
            y=[f"{m['source']} → {m['target']}" for m in matches],
            colorscale='RdYlBu_r',
            text=[[f"{val:.3f}" for val in row] for row in metrics_data],
            textfont={"size": 10},
            showscale=True
        ))
        
        fig_heatmap.update_layout(
            title="Mapa de Calor - Métricas Detalhadas de Similaridade",
            height=400
        )
        
        st.plotly_chart(fig_heatmap, use_container_width=True)

def main():
    """Função principal do aplicativo"""
    
    # Cabeçalho principal
    st.markdown("""
    <div class="main-header">
        <h1>🤖 Sistema Avançado de Comparação Excel com IA</h1>
        <p>Análise inteligente e comparação robusta entre abas de planilhas Excel</p>
    </div>
    """, unsafe_allow_html=True)
    
    # Inicializa o comparador IA
    if 'ai_comparator' not in st.session_state:
        st.session_state.ai_comparator = AdvancedAIComparator()
    
    comparator = st.session_state.ai_comparator
    
    # Sidebar para configurações
    with st.sidebar:
        st.header("⚙️ Configurações Avançadas")
        
        # Configurações de IA
        st.subheader("🧠 Parâmetros de IA")
        similarity_threshold = st.slider(
            "Limiar de Similaridade",
            min_value=0.1,
            max_value=1.0,
            value=0.3,
            step=0.05,
            help="Valor mínimo de similaridade para considerar uma correspondência"
        )
        
        confidence_threshold = st.slider(
            "Limiar de Confiança",
            min_value=0.1,
            max_value=1.0,
            value=0.5,
            step=0.05,
            help="Nível mínimo de confiança para recomendar uma correspondência"
        )
        
        # Configurações de análise
        st.subheader("📊 Análise de Dados")
        enable_data_analysis = st.checkbox("Análise Detalhada de Padrões", value=True)
        enable_compatibility_check = st.checkbox("Verificação de Compatibilidade", value=True)
        
        # Configurações de visualização
        st.subheader("📈 Visualizações")
        show_detailed_metrics = st.checkbox("Métricas Detalhadas", value=True)
        show_heatmap = st.checkbox("Mapa de Calor", value=True)
    
    # Upload de arquivo
    uploaded_file = st.file_uploader(
        "📁 Carregar Arquivo Excel",
        type=['xlsx', 'xls'],
        help="Selecione um arquivo Excel para análise comparativa"
    )
    
    if uploaded_file is not None:
        # Carrega dados do Excel
        excel_data, success = load_excel_file(uploaded_file)
        
        if success and excel_data:
            st.success(f"✅ Arquivo carregado com sucesso! Encontradas {len(excel_data)} abas.")
            
            # Seleção de abas para comparação
            st.subheader("📋 Seleção de Abas para Comparação")
            
            col1, col2 = st.columns(2)
            
            with col1:
                st.markdown("**Aba de Origem:**")
                source_sheet = st.selectbox(
                    "Selecione a aba de origem",
                    options=list(excel_data.keys()),
                    key="source_sheet"
                )
            
            with col2:
                st.markdown("**Aba de Destino:**")
                target_sheet = st.selectbox(
                    "Selecione a aba de destino",
                    options=list(excel_data.keys()),
                    key="target_sheet"
                )
            
            if source_sheet and target_sheet:
                source_df = excel_data[source_sheet]
                target_df = excel_data[target_sheet]
                
                # Preview das abas selecionadas
                st.subheader("👀 Preview das Abas Selecionadas")
                
                tab1, tab2 = st.tabs([f"📊 {source_sheet}", f"📊 {target_sheet}"])
                
                with tab1:
                    st.markdown(f"**Dimensões:** {source_df.shape[0]} linhas × {source_df.shape[1]} colunas")
                    st.dataframe(source_df.head(), use_container_width=True)
                
                with tab2:
                    st.markdown(f"**Dimensões:** {target_df.shape[0]} linhas × {target_df.shape[1]} colunas")
                    st.dataframe(target_df.head(), use_container_width=True)
                
                # Botão para executar comparação
                if st.button("🚀 Executar Comparação Inteligente", type="primary"):
                    with st.spinner("🤖 Executando análise avançada com IA..."):
                        
                        # Encontra correspondências usando IA
                        source_columns = source_df.columns.tolist()
                        target_columns = target_df.columns.tolist()
                        
                        matches = comparator.find_best_matches(
                            source_columns, 
                            target_columns, 
                            threshold=similarity_threshold
                        )
                        
                        # Filtra por confiança
                        high_confidence_matches = [
                            match for match in matches 
                            if match['confidence'] >= confidence_threshold
                        ]
                        
                        # Exibe resultados
                        st.subheader("🎯 Resultados da Comparação Inteligente")
                        
                        # Métricas gerais
                        col1, col2, col3, col4 = st.columns(4)
                        
                        with col1:
                            st.metric(
                                "Total de Correspondências",
                                len(matches),
                                delta=f"{len(high_confidence_matches)} alta confiança"
                            )
                        
                        with col2:
                            avg_similarity = np.mean([m['similarity']['overall'] for m in matches]) if matches else 0
                            st.metric(
                                "Similaridade Média",
                                f"{avg_similarity:.3f}",
                                delta=f"{(avg_similarity - 0.5):.3f}" if avg_similarity > 0.5 else f"{(avg_similarity - 0.5):.3f}"
                            )
                        
                        with col3:
                            avg_confidence = np.mean([m['confidence'] for m in matches]) if matches else 0
                            st.metric(
                                "Confiança Média",
                                f"{avg_confidence:.3f}",
                                delta="Alta" if avg_confidence > 0.7 else "Média" if avg_confidence > 0.5 else "Baixa"
                            )
                        
                        with col4:
                            coverage = (len(matches) / len(source_columns)) * 100 if source_columns else 0
                            st.metric(
                                "Cobertura",
                                f"{coverage:.1f}%",
                                delta="Boa" if coverage > 70 else "Parcial"
                            )
                        
                        # Visualizações
                        if matches and show_detailed_metrics:
                            st.subheader("📊 Visualizações Avançadas")
                            create_comparison_visualization(matches, comparator)
                        
                        # Resultados detalhados
                        if matches:
                            st.subheader("📋 Correspondências Detalhadas")
                            
                            for i, match in enumerate(matches):
                                confidence_class = "match-high" if match['confidence'] >= 0.7 else "match-medium" if match['confidence'] >= 0.5 else "match-low"
                                
                                st.markdown(f"""
                                <div class="comparison-result {confidence_class}">
                                    <h4>🔗 Correspondência {i+1}</h4>
                                    <p><strong>Origem:</strong> {match['source']}</p>
                                    <p><strong>Destino:</strong> {match['target']}</p>
                                    <p><strong>Similaridade:</strong> {match['similarity']['overall']:.3f}</p>
                                    <p><strong>Confiança:</strong> {match['confidence']:.3f}</p>
                                    <p><strong>Recomendação:</strong> {match['recommendation']}</p>
                                </div>
                                """, unsafe_allow_html=True)
                                
                                # Análise de compatibilidade de dados
                                if enable_compatibility_check:
                                    with st.expander(f"🔍 Análise de Compatibilidade - {match['source']} ↔ {match['target']}"):
                                        compatibility = comparator.compare_data_compatibility(
                                            source_df, match['source'],
                                            target_df, match['target']
                                        )
                                        
                                        st.metric(
                                            "Pontuação de Compatibilidade",
                                            f"{compatibility['compatibility_score']:.3f}",
                                            delta="Compatível" if compatibility['compatibility_score'] > 0.7 else "Verificar"
                                        )
                                        
                                        if compatibility['issues']:
                                            st.warning("⚠️ Problemas Identificados:")
                                            for issue in compatibility['issues']:
                                                st.write(f"• {issue}")
                                        
                                        # Análise detalhada dos dados
                                        if enable_data_analysis:
                                            col1, col2 = st.columns(2)
                                            
                                            with col1:
                                                st.write("**Análise da Coluna de Origem:**")
                                                analysis1 = compatibility['analysis1']
                                                st.json({
                                                    'Total de Registros': analysis1['total_records'],
                                                    'Valores Únicos': analysis1['unique_values'],
                                                    'Percentual de Nulos': f"{analysis1['null_percentage']:.1f}%",
                                                    'Tipos de Dados': analysis1['data_types']
                                                })
                                            
                                            with col2:
                                                st.write("**Análise da Coluna de Destino:**")
                                                analysis2 = compatibility['analysis2']
                                                st.json({
                                                    'Total de Registros': analysis2['total_records'],
                                                    'Valores Únicos': analysis2['unique_values'],
                                                    'Percentual de Nulos': f"{analysis2['null_percentage']:.1f}%",
                                                    'Tipos de Dados': analysis2['data_types']
                                                })
                        
                        else:
                            st.warning("🔍 Nenhuma correspondência encontrada com os critérios especificados.")
                            st.info("💡 Dica: Tente reduzir o limiar de similaridade ou confiança nas configurações.")
                        
                        # Insights de IA
                        st.markdown("""
                        <div class="ai-insight">
                            <h3>🧠 Insights da IA</h3>
                            <p>O sistema analisou as colunas usando algoritmos avançados de processamento de linguagem natural e aprendizado de máquina. 
                            As correspondências são baseadas em múltiplas métricas de similaridade, análise semântica e padrões de dados.</p>
                        </div>
                        """, unsafe_allow_html=True)
                        
                        # Salva dados de aprendizado
                        comparator._save_learning_data()

if __name__ == "__main__":
    main()