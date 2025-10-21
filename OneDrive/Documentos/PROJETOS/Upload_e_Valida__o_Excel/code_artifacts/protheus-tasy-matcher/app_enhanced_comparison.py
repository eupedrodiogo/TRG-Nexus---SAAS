"""
Interface Aprimorada para Sistema de Comparação Protheus-TASY
Utiliza o motor de comparação avançado para identificação precisa de correspondências
"""

import streamlit as st
import pandas as pd
import numpy as np
import plotly.graph_objects as go
import plotly.express as px
from datetime import datetime
import io
import json
from typing import Dict, List, Any
import time

# Importa o motor de comparação aprimorado
from enhanced_comparison_engine import (
    EnhancedComparisonEngine, 
    MatchType, 
    DataType, 
    ComparisonReport,
    quick_compare
)

# Configuração da página
st.set_page_config(
    page_title="Sistema de Comparação Aprimorado Protheus-TASY",
    page_icon="🔍",
    layout="wide",
    initial_sidebar_state="expanded"
)

# CSS personalizado para melhor visualização
st.markdown("""
<style>
    .main-header {
        background: linear-gradient(90deg, #1e3c72 0%, #2a5298 100%);
        padding: 2rem;
        border-radius: 10px;
        color: white;
        text-align: center;
        margin-bottom: 2rem;
    }
    
    .metric-card {
        background: white;
        padding: 1rem;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        border-left: 4px solid #2a5298;
    }
    
    .match-exact {
        background-color: #d4edda;
        border-left: 4px solid #28a745;
        padding: 1rem;
        margin: 0.5rem 0;
        border-radius: 4px;
    }
    
    .match-high {
        background-color: #d1ecf1;
        border-left: 4px solid #17a2b8;
        padding: 1rem;
        margin: 0.5rem 0;
        border-radius: 4px;
    }
    
    .match-medium {
        background-color: #fff3cd;
        border-left: 4px solid #ffc107;
        padding: 1rem;
        margin: 0.5rem 0;
        border-radius: 4px;
    }
    
    .match-low {
        background-color: #f8d7da;
        border-left: 4px solid #dc3545;
        padding: 1rem;
        margin: 0.5rem 0;
        border-radius: 4px;
    }
    
    .comparison-stats {
        background: #f8f9fa;
        padding: 1.5rem;
        border-radius: 8px;
        margin: 1rem 0;
    }
    
    .algorithm-score {
        display: inline-block;
        background: #e9ecef;
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
        margin: 0.25rem;
        font-size: 0.85rem;
    }
    
    .recommendation-box {
        padding: 1rem;
        border-radius: 8px;
        margin: 1rem 0;
        font-weight: bold;
    }
    
    .recommendation-excellent {
        background-color: #d4edda;
        color: #155724;
        border: 1px solid #c3e6cb;
    }
    
    .recommendation-good {
        background-color: #d1ecf1;
        color: #0c5460;
        border: 1px solid #bee5eb;
    }
    
    .recommendation-moderate {
        background-color: #fff3cd;
        color: #856404;
        border: 1px solid #ffeaa7;
    }
    
    .recommendation-low {
        background-color: #f8d7da;
        color: #721c24;
        border: 1px solid #f5c6cb;
    }
</style>
""", unsafe_allow_html=True)

def initialize_session_state():
    """Inicializa o estado da sessão"""
    if 'comparison_engine' not in st.session_state:
        st.session_state.comparison_engine = EnhancedComparisonEngine()
    
    if 'comparison_results' not in st.session_state:
        st.session_state.comparison_results = None
    
    if 'uploaded_files' not in st.session_state:
        st.session_state.uploaded_files = {}

def load_excel_file(uploaded_file, file_key: str):
    """Carrega arquivo Excel e armazena no estado da sessão"""
    try:
        # Lê todas as abas
        excel_data = pd.read_excel(uploaded_file, sheet_name=None)
        
        st.session_state.uploaded_files[file_key] = {
            'name': uploaded_file.name,
            'sheets': excel_data,
            'upload_time': datetime.now()
        }
        
        return True
    except Exception as e:
        st.error(f"Erro ao carregar arquivo: {str(e)}")
        return False

def display_file_info(file_data: Dict, title: str):
    """Exibe informações do arquivo carregado"""
    st.markdown(f"### 📁 {title}")
    
    col1, col2, col3 = st.columns(3)
    
    with col1:
        st.metric("Nome do Arquivo", file_data['name'])
    
    with col2:
        st.metric("Número de Abas", len(file_data['sheets']))
    
    with col3:
        st.metric("Carregado em", file_data['upload_time'].strftime("%H:%M:%S"))
    
    # Lista as abas disponíveis
    st.markdown("**Abas disponíveis:**")
    for sheet_name, sheet_data in file_data['sheets'].items():
        rows, cols = sheet_data.shape
        st.markdown(f"- **{sheet_name}**: {rows} linhas × {cols} colunas")

def create_comparison_visualization(report: ComparisonReport):
    """Cria visualizações do relatório de comparação"""
    
    # Gráfico de distribuição de tipos de correspondência
    fig_distribution = go.Figure(data=[
        go.Bar(
            x=['Exatas', 'Alta Similaridade', 'Similaridade Moderada', 'Baixa Similaridade', 'Sem Correspondência'],
            y=[report.exact_matches, report.high_similarity_matches, 
               report.medium_similarity_matches, report.low_similarity_matches, report.no_matches],
            marker_color=['#28a745', '#17a2b8', '#ffc107', '#fd7e14', '#dc3545'],
            text=[report.exact_matches, report.high_similarity_matches, 
                  report.medium_similarity_matches, report.low_similarity_matches, report.no_matches],
            textposition='auto'
        )
    ])
    
    fig_distribution.update_layout(
        title="Distribuição de Tipos de Correspondência",
        xaxis_title="Tipo de Correspondência",
        yaxis_title="Quantidade",
        height=400
    )
    
    st.plotly_chart(fig_distribution, use_container_width=True)
    
    # Gráfico de performance dos algoritmos
    if report.summary_stats and 'algorithm_performance' in report.summary_stats:
        alg_performance = report.summary_stats['algorithm_performance']
        
        fig_algorithms = go.Figure(data=[
            go.Bar(
                x=list(alg_performance.keys()),
                y=list(alg_performance.values()),
                marker_color='#2a5298',
                text=[f"{v:.3f}" for v in alg_performance.values()],
                textposition='auto'
            )
        ])
        
        fig_algorithms.update_layout(
            title="Performance Média dos Algoritmos",
            xaxis_title="Algoritmo",
            yaxis_title="Score Médio",
            height=400
        )
        
        st.plotly_chart(fig_algorithms, use_container_width=True)
    
    # Heatmap de similaridade (para os primeiros 20 matches)
    if report.matches:
        top_matches = report.matches[:20]
        
        algorithms = ['levenshtein', 'jaro_winkler', 'jaccard', 'cosine', 'semantic']
        heatmap_data = []
        match_labels = []
        
        for i, match in enumerate(top_matches):
            row = [match.algorithm_scores.get(alg, 0) for alg in algorithms]
            heatmap_data.append(row)
            match_labels.append(f"{match.source_value[:20]}... → {match.target_value[:20]}...")
        
        fig_heatmap = go.Figure(data=go.Heatmap(
            z=heatmap_data,
            x=algorithms,
            y=match_labels,
            colorscale='RdYlBu_r',
            text=[[f"{val:.3f}" for val in row] for row in heatmap_data],
            texttemplate="%{text}",
            textfont={"size": 10},
            showscale=True
        ))
        
        fig_heatmap.update_layout(
            title="Heatmap de Similaridade - Top 20 Correspondências",
            height=600
        )
        
        st.plotly_chart(fig_heatmap, use_container_width=True)

def display_match_details(match, index: int):
    """Exibe detalhes de uma correspondência"""
    
    # Determina a classe CSS baseada no tipo de correspondência
    css_class = {
        MatchType.EXACT: "match-exact",
        MatchType.HIGH_SIMILARITY: "match-high",
        MatchType.MEDIUM_SIMILARITY: "match-medium",
        MatchType.LOW_SIMILARITY: "match-low"
    }.get(match.match_type, "match-low")
    
    st.markdown(f"""
    <div class="{css_class}">
        <h4>🔗 Correspondência {index + 1}</h4>
        <p><strong>Origem:</strong> {match.source_value}</p>
        <p><strong>Destino:</strong> {match.target_value}</p>
        <p><strong>Similaridade Geral:</strong> {match.similarity_score:.3f}</p>
        <p><strong>Confiança:</strong> {match.confidence:.3f}</p>
        <p><strong>Tipo de Dados:</strong> {match.data_type.value}</p>
    </div>
    """, unsafe_allow_html=True)
    
    # Exibe scores dos algoritmos
    st.markdown("**Scores dos Algoritmos:**")
    cols = st.columns(5)
    
    algorithms = ['levenshtein', 'jaro_winkler', 'jaccard', 'cosine', 'semantic']
    for i, alg in enumerate(algorithms):
        with cols[i]:
            score = match.algorithm_scores.get(alg, 0)
            st.metric(alg.replace('_', ' ').title(), f"{score:.3f}")
    
    # Exibe recomendação
    recommendation_class = {
        "✅ Correspondência Exata": "recommendation-excellent",
        "🟢 Alta Similaridade": "recommendation-good",
        "🟡 Alta Similaridade": "recommendation-good",
        "🟠 Similaridade Moderada": "recommendation-moderate",
        "🔴 Baixa Similaridade": "recommendation-low"
    }
    
    rec_class = "recommendation-excellent"
    for key in recommendation_class:
        if key in match.recommendation:
            rec_class = recommendation_class[key]
            break
    
    st.markdown(f"""
    <div class="recommendation-box {rec_class}">
        {match.recommendation}
    </div>
    """, unsafe_allow_html=True)

def export_results_to_excel(report: ComparisonReport, filename: str):
    """Exporta resultados para Excel"""
    try:
        # Cria buffer em memória
        buffer = io.BytesIO()
        
        with pd.ExcelWriter(buffer, engine='openpyxl') as writer:
            # Aba de resumo
            summary_data = {
                'Métrica': [
                    'Total de Comparações',
                    'Correspondências Exatas',
                    'Alta Similaridade',
                    'Similaridade Moderada',
                    'Baixa Similaridade',
                    'Sem Correspondência',
                    'Similaridade Média',
                    'Tempo de Processamento (s)'
                ],
                'Valor': [
                    report.total_comparisons,
                    report.exact_matches,
                    report.high_similarity_matches,
                    report.medium_similarity_matches,
                    report.low_similarity_matches,
                    report.no_matches,
                    f"{report.average_similarity:.3f}",
                    f"{report.processing_time:.2f}"
                ]
            }
            
            pd.DataFrame(summary_data).to_excel(writer, sheet_name='Resumo', index=False)
            
            # Aba de correspondências detalhadas
            if report.matches:
                matches_data = []
                for match in report.matches:
                    matches_data.append({
                        'Valor Origem': match.source_value,
                        'Valor Destino': match.target_value,
                        'Similaridade': f"{match.similarity_score:.3f}",
                        'Tipo': match.match_type.value,
                        'Confiança': f"{match.confidence:.3f}",
                        'Tipo de Dados': match.data_type.value,
                        'Recomendação': match.recommendation,
                        'Levenshtein': f"{match.algorithm_scores.get('levenshtein', 0):.3f}",
                        'Jaro-Winkler': f"{match.algorithm_scores.get('jaro_winkler', 0):.3f}",
                        'Jaccard': f"{match.algorithm_scores.get('jaccard', 0):.3f}",
                        'Cosine': f"{match.algorithm_scores.get('cosine', 0):.3f}",
                        'Semântica': f"{match.algorithm_scores.get('semantic', 0):.3f}"
                    })
                
                pd.DataFrame(matches_data).to_excel(writer, sheet_name='Correspondências', index=False)
            
            # Aba de mapeamento de-para
            if report.matches:
                mapping_data = []
                for match in report.matches:
                    if match.match_type in [MatchType.EXACT, MatchType.HIGH_SIMILARITY]:
                        mapping_data.append({
                            'Sistema Origem (Protheus)': match.source_value,
                            'Sistema Destino (TASY)': match.target_value,
                            'Tipo de Correspondência': match.match_type.value,
                            'Score de Confiança': f"{match.confidence:.3f}",
                            'Status': 'Aprovado' if match.match_type == MatchType.EXACT else 'Revisar',
                            'Observações': match.recommendation
                        })
                
                if mapping_data:
                    pd.DataFrame(mapping_data).to_excel(writer, sheet_name='Mapeamento De-Para', index=False)
        
        buffer.seek(0)
        return buffer
        
    except Exception as e:
        st.error(f"Erro ao exportar resultados: {str(e)}")
        return None

def main():
    """Função principal da aplicação"""
    
    # Inicializa estado da sessão
    initialize_session_state()
    
    # Cabeçalho principal
    st.markdown("""
    <div class="main-header">
        <h1>🔍 Sistema de Comparação Aprimorado</h1>
        <h3>Integração Protheus TOTVS ↔ TASY Philips</h3>
        <p>Motor de comparação avançado com algoritmos otimizados para identificação precisa de correspondências</p>
    </div>
    """, unsafe_allow_html=True)
    
    # Sidebar para configurações
    with st.sidebar:
        st.markdown("## ⚙️ Configurações")
        
        # Configurações do motor de comparação
        st.markdown("### 🎯 Parâmetros de Comparação")
        
        similarity_threshold = st.slider(
            "Limiar de Similaridade Mínima",
            min_value=0.0,
            max_value=1.0,
            value=0.4,
            step=0.05,
            help="Similaridade mínima para considerar uma correspondência"
        )
        
        # Pesos dos algoritmos
        st.markdown("### ⚖️ Pesos dos Algoritmos")
        
        col1, col2 = st.columns(2)
        
        with col1:
            levenshtein_weight = st.slider("Levenshtein", 0.0, 1.0, 0.25, 0.05)
            jaro_weight = st.slider("Jaro-Winkler", 0.0, 1.0, 0.25, 0.05)
            jaccard_weight = st.slider("Jaccard", 0.0, 1.0, 0.20, 0.05)
        
        with col2:
            cosine_weight = st.slider("Cosine", 0.0, 1.0, 0.15, 0.05)
            semantic_weight = st.slider("Semântica", 0.0, 1.0, 0.15, 0.05)
        
        # Normaliza pesos
        total_weight = levenshtein_weight + jaro_weight + jaccard_weight + cosine_weight + semantic_weight
        if total_weight > 0:
            weights = {
                'levenshtein': levenshtein_weight / total_weight,
                'jaro_winkler': jaro_weight / total_weight,
                'jaccard': jaccard_weight / total_weight,
                'cosine': cosine_weight / total_weight,
                'semantic': semantic_weight / total_weight
            }
        else:
            weights = st.session_state.comparison_engine.config['algorithm_weights']
        
        # Atualiza configuração do motor
        st.session_state.comparison_engine.config['algorithm_weights'] = weights
        st.session_state.comparison_engine.config['similarity_thresholds']['low'] = similarity_threshold
        
        # Configurações de performance
        st.markdown("### ⚡ Performance")
        
        enable_parallel = st.checkbox("Processamento Paralelo", value=True)
        enable_cache = st.checkbox("Cache de Similaridade", value=True)
        
        st.session_state.comparison_engine.config['enable_parallel'] = enable_parallel
        st.session_state.comparison_engine.config['enable_cache'] = enable_cache
        
        # Estatísticas do motor
        if st.button("📊 Ver Estatísticas"):
            stats = st.session_state.comparison_engine.get_statistics()
            st.json(stats)
        
        if st.button("🗑️ Limpar Cache"):
            st.session_state.comparison_engine.clear_cache()
            st.success("Cache limpo!")
    
    # Área principal
    tab1, tab2, tab3, tab4 = st.tabs(["📁 Upload de Arquivos", "🔍 Comparação", "📊 Resultados", "📋 Relatório"])
    
    with tab1:
        st.markdown("## 📁 Upload de Arquivos")
        
        col1, col2 = st.columns(2)
        
        with col1:
            st.markdown("### 🏢 Sistema Protheus (Origem)")
            protheus_file = st.file_uploader(
                "Selecione o arquivo Excel do Protheus",
                type=['xlsx', 'xls'],
                key="protheus_upload"
            )
            
            if protheus_file:
                if load_excel_file(protheus_file, 'protheus'):
                    display_file_info(st.session_state.uploaded_files['protheus'], "Arquivo Protheus")
        
        with col2:
            st.markdown("### 🏥 Sistema TASY (Destino)")
            tasy_file = st.file_uploader(
                "Selecione o arquivo Excel do TASY",
                type=['xlsx', 'xls'],
                key="tasy_upload"
            )
            
            if tasy_file:
                if load_excel_file(tasy_file, 'tasy'):
                    display_file_info(st.session_state.uploaded_files['tasy'], "Arquivo TASY")
    
    with tab2:
        st.markdown("## 🔍 Configuração da Comparação")
        
        if 'protheus' in st.session_state.uploaded_files and 'tasy' in st.session_state.uploaded_files:
            
            col1, col2 = st.columns(2)
            
            with col1:
                st.markdown("### 🎯 Dados de Origem (Protheus)")
                
                protheus_sheets = list(st.session_state.uploaded_files['protheus']['sheets'].keys())
                protheus_sheet = st.selectbox("Selecione a aba:", protheus_sheets, key="protheus_sheet")
                
                if protheus_sheet:
                    protheus_df = st.session_state.uploaded_files['protheus']['sheets'][protheus_sheet]
                    protheus_columns = list(protheus_df.columns)
                    protheus_column = st.selectbox("Selecione a coluna:", protheus_columns, key="protheus_column")
                    
                    if protheus_column:
                        st.markdown("**Preview dos dados:**")
                        preview_data = protheus_df[protheus_column].dropna().head(10)
                        st.write(preview_data.tolist())
            
            with col2:
                st.markdown("### 🎯 Dados de Destino (TASY)")
                
                tasy_sheets = list(st.session_state.uploaded_files['tasy']['sheets'].keys())
                tasy_sheet = st.selectbox("Selecione a aba:", tasy_sheets, key="tasy_sheet")
                
                if tasy_sheet:
                    tasy_df = st.session_state.uploaded_files['tasy']['sheets'][tasy_sheet]
                    tasy_columns = list(tasy_df.columns)
                    tasy_column = st.selectbox("Selecione a coluna:", tasy_columns, key="tasy_column")
                    
                    if tasy_column:
                        st.markdown("**Preview dos dados:**")
                        preview_data = tasy_df[tasy_column].dropna().head(10)
                        st.write(preview_data.tolist())
            
            # Botão para executar comparação
            if st.button("🚀 Executar Comparação Avançada", type="primary"):
                if 'protheus_column' in locals() and 'tasy_column' in locals():
                    
                    with st.spinner("🔍 Executando comparação avançada..."):
                        
                        # Prepara dados
                        source_values = protheus_df[protheus_column].dropna().tolist()
                        target_values = tasy_df[tasy_column].dropna().tolist()
                        
                        # Executa comparação
                        start_time = time.time()
                        
                        matches = st.session_state.comparison_engine.find_best_matches(
                            source_values, 
                            target_values, 
                            threshold=similarity_threshold
                        )
                        
                        processing_time = time.time() - start_time
                        
                        # Gera relatório
                        report = st.session_state.comparison_engine.generate_comparison_report(
                            matches, 
                            processing_time
                        )
                        
                        st.session_state.comparison_results = report
                    
                    st.success(f"✅ Comparação concluída! Encontradas {len(matches)} correspondências em {processing_time:.2f}s")
                    
                else:
                    st.error("❌ Selecione as colunas de origem e destino antes de executar a comparação")
        
        else:
            st.info("📁 Faça upload dos arquivos Protheus e TASY na aba 'Upload de Arquivos' para começar")
    
    with tab3:
        st.markdown("## 📊 Resultados da Comparação")
        
        if st.session_state.comparison_results:
            report = st.session_state.comparison_results
            
            # Métricas principais
            col1, col2, col3, col4 = st.columns(4)
            
            with col1:
                st.metric(
                    "Total de Comparações",
                    report.total_comparisons,
                    delta=f"{report.exact_matches} exatas"
                )
            
            with col2:
                st.metric(
                    "Similaridade Média",
                    f"{report.average_similarity:.3f}",
                    delta=f"{report.high_similarity_matches} alta similaridade"
                )
            
            with col3:
                st.metric(
                    "Tempo de Processamento",
                    f"{report.processing_time:.2f}s",
                    delta=f"{report.medium_similarity_matches} moderada"
                )
            
            with col4:
                confidence_avg = np.mean([m.confidence for m in report.matches]) if report.matches else 0
                st.metric(
                    "Confiança Média",
                    f"{confidence_avg:.3f}",
                    delta=f"{report.low_similarity_matches} baixa"
                )
            
            # Visualizações
            st.markdown("### 📈 Visualizações")
            create_comparison_visualization(report)
            
            # Lista de correspondências
            st.markdown("### 🔗 Correspondências Encontradas")
            
            if report.matches:
                # Filtros
                col1, col2, col3 = st.columns(3)
                
                with col1:
                    match_type_filter = st.multiselect(
                        "Filtrar por tipo:",
                        options=[mt.value for mt in MatchType],
                        default=[mt.value for mt in MatchType]
                    )
                
                with col2:
                    min_confidence = st.slider(
                        "Confiança mínima:",
                        0.0, 1.0, 0.0, 0.1
                    )
                
                with col3:
                    max_results = st.number_input(
                        "Máximo de resultados:",
                        min_value=1,
                        max_value=len(report.matches),
                        value=min(20, len(report.matches))
                    )
                
                # Aplica filtros
                filtered_matches = [
                    match for match in report.matches
                    if match.match_type.value in match_type_filter
                    and match.confidence >= min_confidence
                ][:max_results]
                
                # Exibe correspondências
                for i, match in enumerate(filtered_matches):
                    with st.expander(f"Correspondência {i+1}: {match.source_value} → {match.target_value} (Score: {match.similarity_score:.3f})"):
                        display_match_details(match, i)
            
            else:
                st.info("Nenhuma correspondência encontrada com os critérios especificados")
        
        else:
            st.info("Execute uma comparação na aba 'Comparação' para ver os resultados")
    
    with tab4:
        st.markdown("## 📋 Relatório de Integração")
        
        if st.session_state.comparison_results:
            report = st.session_state.comparison_results
            
            # Resumo executivo
            st.markdown("### 📋 Resumo Executivo")
            
            st.markdown(f"""
            <div class="comparison-stats">
                <h4>Análise de Correspondências Protheus ↔ TASY</h4>
                <p><strong>Data da Análise:</strong> {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}</p>
                <p><strong>Total de Itens Analisados:</strong> {report.total_comparisons}</p>
                <p><strong>Correspondências Identificadas:</strong></p>
                <ul>
                    <li>✅ <strong>Exatas:</strong> {report.exact_matches} ({report.exact_matches/max(1,report.total_comparisons)*100:.1f}%)</li>
                    <li>🟢 <strong>Alta Similaridade:</strong> {report.high_similarity_matches} ({report.high_similarity_matches/max(1,report.total_comparisons)*100:.1f}%)</li>
                    <li>🟡 <strong>Similaridade Moderada:</strong> {report.medium_similarity_matches} ({report.medium_similarity_matches/max(1,report.total_comparisons)*100:.1f}%)</li>
                    <li>🔴 <strong>Baixa Similaridade:</strong> {report.low_similarity_matches} ({report.low_similarity_matches/max(1,report.total_comparisons)*100:.1f}%)</li>
                </ul>
                <p><strong>Similaridade Média Geral:</strong> {report.average_similarity:.3f}</p>
                <p><strong>Tempo de Processamento:</strong> {report.processing_time:.2f} segundos</p>
            </div>
            """, unsafe_allow_html=True)
            
            # Tabela de mapeamento de-para
            st.markdown("### 🔄 Tabela de Mapeamento De-Para")
            
            if report.matches:
                # Filtra apenas correspondências de alta qualidade
                high_quality_matches = [
                    match for match in report.matches
                    if match.match_type in [MatchType.EXACT, MatchType.HIGH_SIMILARITY]
                ]
                
                if high_quality_matches:
                    mapping_data = []
                    for match in high_quality_matches:
                        mapping_data.append({
                            'Sistema Origem (Protheus)': match.source_value,
                            'Sistema Destino (TASY)': match.target_value,
                            'Tipo': match.match_type.value,
                            'Score': f"{match.similarity_score:.3f}",
                            'Confiança': f"{match.confidence:.3f}",
                            'Status': '✅ Aprovado' if match.match_type == MatchType.EXACT else '🔍 Revisar',
                            'Recomendação': match.recommendation
                        })
                    
                    df_mapping = pd.DataFrame(mapping_data)
                    st.dataframe(df_mapping, use_container_width=True)
                    
                    # Botão para exportar
                    if st.button("📥 Exportar Relatório Completo"):
                        buffer = export_results_to_excel(report, "relatorio_comparacao.xlsx")
                        
                        if buffer:
                            st.download_button(
                                label="⬇️ Download Relatório Excel",
                                data=buffer,
                                file_name=f"relatorio_protheus_tasy_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx",
                                mime="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                            )
                
                else:
                    st.warning("⚠️ Nenhuma correspondência de alta qualidade encontrada para mapeamento automático")
            
            # Recomendações
            st.markdown("### 💡 Recomendações para Integração")
            
            exact_percentage = (report.exact_matches / max(1, report.total_comparisons)) * 100
            high_percentage = (report.high_similarity_matches / max(1, report.total_comparisons)) * 100
            
            if exact_percentage >= 70:
                st.success("✅ **Excelente compatibilidade** - A integração pode ser realizada com alta confiança")
            elif exact_percentage + high_percentage >= 60:
                st.info("🔍 **Boa compatibilidade** - Recomenda-se revisão manual das correspondências de alta similaridade")
            elif exact_percentage + high_percentage >= 40:
                st.warning("⚠️ **Compatibilidade moderada** - Necessária análise detalhada antes da integração")
            else:
                st.error("❌ **Baixa compatibilidade** - Recomenda-se revisão completa dos dados antes da integração")
            
            # Próximos passos
            st.markdown("### 🎯 Próximos Passos")
            st.markdown("""
            1. **Revisar correspondências** de alta similaridade manualmente
            2. **Validar mapeamentos** com especialistas de domínio
            3. **Implementar regras** de transformação de dados
            4. **Executar testes** de integração em ambiente controlado
            5. **Monitorar qualidade** dos dados após integração
            """)
        
        else:
            st.info("Execute uma comparação para gerar o relatório de integração")

if __name__ == "__main__":
    main()