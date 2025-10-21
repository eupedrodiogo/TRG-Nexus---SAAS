
import streamlit as st
import pandas as pd
import re
from rapidfuzz import fuzz, process
from datetime import datetime
import io
import unicodedata

# Configuração da página
st.set_page_config(
    page_title="Correspondência Protheus-Tasy",
    page_icon="🔗",
    layout="wide"
)

# CSS personalizado para melhor aparência
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
</style>
""", unsafe_allow_html=True)

# Regex pré-compilados para performance
RE_SPECIAL = re.compile(r'[^a-z0-9\s]')
RE_SPACES = re.compile(r'\s+')

@st.cache_data(show_spinner=False)
def get_template_excel():
    """Gera um arquivo Excel de modelo com as abas e colunas esperadas."""
    buf = io.BytesIO()
    with pd.ExcelWriter(buf, engine="openpyxl") as writer:
        pd.DataFrame(columns=["Codigo", "Descricao"]).to_excel(
            writer, sheet_name="Protheus", index=False, startrow=1
        )
        pd.DataFrame(columns=["Código do material", "Descrição do Material Tasy"]).to_excel(
            writer, sheet_name="De Para Almoxarifado", index=False
        )
    buf.seek(0)
    return buf.getvalue()

def normalize_text(text):
    """
    Normaliza o texto para melhorar a comparação:
    - Remove caracteres especiais
    - Converte para minúsculas
    - Remove espaços extras
    """
    if pd.isna(text):
        return ""
    text = str(text).lower()
    # Remove caracteres especiais e espaços múltiplos usando regex pré-compilada
    text = RE_SPECIAL.sub(" ", text)
    text = RE_SPACES.sub(" ", text)
    return text.strip()

def validate_excel_file(uploaded_file):
    """
    Valida o arquivo Excel carregado.
    Retorna (success, message, df_protheus, df_de_para)
    """
    try:
        # Ler o arquivo Excel
        xls = pd.ExcelFile(uploaded_file)
        # Verificar se as abas existem (case-insensitive)
        sheet_names_lower = {name.lower(): name for name in xls.sheet_names}
        if 'protheus' not in sheet_names_lower:
            return False, "❌ Aba 'Protheus' não encontrada no arquivo.", None, None
        if 'de para almoxarifado' not in sheet_names_lower:
            return False, "❌ Aba 'De Para Almoxarifado' não encontrada no arquivo.", None, None
        # Ler as abas
        protheus_sheet = sheet_names_lower['protheus']
        de_para_sheet = sheet_names_lower['de para almoxarifado']
        # Ler aba Protheus (header na linha 1) - limitar para evitar problemas de memória
        try:
            df_protheus = pd.read_excel(uploaded_file, sheet_name=protheus_sheet, header=1, nrows=5000)
        except:
            df_protheus = pd.read_excel(uploaded_file, sheet_name=protheus_sheet, header=1)
        # Ler aba De Para Almoxarifado - limitar para evitar problemas de memória
        try:
            df_de_para = pd.read_excel(uploaded_file, sheet_name=de_para_sheet, header=0, nrows=2000)
        except:
            df_de_para = pd.read_excel(uploaded_file, sheet_name=de_para_sheet, header=0)
        # Remove acentos de strings (para reconhecimento robusto de cabeçalhos)
        def strip_accents(s: str) -> str:
            if s is None:
                return ""
            s = str(s)
            return ''.join(c for c in unicodedata.normalize('NFKD', s) if not unicodedata.combining(c))
        # Validar colunas obrigatórias - case insensitive
        protheus_cols = {str(col).strip().lower(): col for col in df_protheus.columns}
        if 'descricao' not in protheus_cols:
            return False, "❌ Coluna 'Descricao' não encontrada na aba Protheus.", None, None
        if 'codigo' not in protheus_cols:
            return False, "❌ Coluna 'Codigo' não encontrada na aba Protheus.", None, None
        protheus_cols = {strip_accents(str(col)).strip().lower(): col for col in df_protheus.columns}
        # Fallback de cabeçalho: tentar header=0 se não encontrar as colunas
        if 'descricao' not in protheus_cols or 'codigo' not in protheus_cols:
            try:
                df_protheus_alt = pd.read_excel(uploaded_file, sheet_name=protheus_sheet, header=0, nrows=5000)
            except:
                df_protheus_alt = pd.read_excel(uploaded_file, sheet_name=protheus_sheet, header=0)
            protheus_cols_alt = {strip_accents(str(col)).strip().lower(): col for col in df_protheus_alt.columns}
            if 'descricao' in protheus_cols_alt and 'codigo' in protheus_cols_alt:
                df_protheus = df_protheus_alt
                protheus_cols = protheus_cols_alt
        if 'descricao' not in protheus_cols:
            return False, "❌ Coluna 'Descricao' não encontrada na aba Protheus.", None, None
        if 'codigo' not in protheus_cols:
            return False, "❌ Coluna 'Codigo' não encontrada na aba Protheus.", None, None
        # Mapear colunas da aba De Para (removendo acentos e normalizando)
        de_para_cols = {strip_accents(str(col)).strip().lower(): col for col in df_de_para.columns}
        # Procurar coluna de código e de descrição do Tasy

        codigo_tasy_col = None
        for norm, original in de_para_cols.items():
            if 'codigo' in norm and 'material' in norm:
                codigo_tasy_col = original
                break
        # Fallback: tentar outra linha de cabeçalho (header=1) se não encontrar
        if codigo_tasy_col is None:
            try:
                df_de_para_alt = pd.read_excel(uploaded_file, sheet_name=de_para_sheet, header=1, nrows=2000)
            except:
                df_de_para_alt = pd.read_excel(uploaded_file, sheet_name=de_para_sheet, header=1)
            de_para_cols_alt = {strip_accents(str(col)).strip().lower(): col for col in df_de_para_alt.columns}
            for norm, original in de_para_cols_alt.items():
                if 'codigo' in norm and 'material' in norm:
                    codigo_tasy_col = original
                    df_de_para = df_de_para_alt
                    de_para_cols = de_para_cols_alt
                    break
        # Fallback mais flexível: aceitar qualquer coluna com 'codigo'
        if codigo_tasy_col is None:
            for norm, original in de_para_cols.items():
                if 'codigo' in norm:
                    codigo_tasy_col = original
                    break
        if codigo_tasy_col is None:
            return False, "❌ Coluna 'Código do material' não encontrada na aba De Para Almoxarifado.", None, None
        desc_tasy_col = None
        for norm, original in de_para_cols.items():
            if 'descricao' in norm and 'tasy' in norm:
                desc_tasy_col = original
                break
        # Fallback: tentar outra linha de cabeçalho (header=1) se não encontrar
        if desc_tasy_col is None:
            try:
                df_de_para_alt = pd.read_excel(uploaded_file, sheet_name=de_para_sheet, header=1, nrows=2000)
            except:
                df_de_para_alt = pd.read_excel(uploaded_file, sheet_name=de_para_sheet, header=1)
            de_para_cols_alt = {strip_accents(str(col)).strip().lower(): col for col in df_de_para_alt.columns}
            for norm, original in de_para_cols_alt.items():
                if 'descricao' in norm and 'tasy' in norm:
                    desc_tasy_col = original
                    df_de_para = df_de_para_alt
                    de_para_cols = de_para_cols_alt
                    break
        # Fallback mais flexível: aceitar qualquer coluna com 'descricao'
        if desc_tasy_col is None:
            for norm, original in de_para_cols.items():
                if 'descricao' in norm:
                    desc_tasy_col = original
                    break
        if desc_tasy_col is None:
            return False, "❌ Coluna 'Descrição do material (Tasy)' não encontrada na aba De Para Almoxarifado.", None, None
        # Padronizar nomes das colunas
        df_protheus = df_protheus.rename(columns={
            protheus_cols['codigo']: 'Codigo',
            protheus_cols['descricao']: 'Descricao'
        })
        df_de_para = df_de_para.rename(columns={
            codigo_tasy_col: 'Codigo_Tasy',
            desc_tasy_col: 'Descricao_Tasy'
        })
        # Garantir tipo consistente para Código
        if 'Codigo' in df_protheus.columns:
            df_protheus['Codigo'] = df_protheus['Codigo'].astype(str)
        if 'Codigo_Tasy' in df_de_para.columns:
            df_de_para['Codigo_Tasy'] = df_de_para['Codigo_Tasy'].astype(str)
        # Adicionar mensagem sobre limitação se aplicável
        info_msg = "✅ Arquivo validado com sucesso!"
        if len(df_protheus) >= 5000:
            info_msg += f" (Limitado a {len(df_protheus)} itens Protheus para performance)"
        if len(df_de_para) >= 2000:
            info_msg += f" (Limitado a {len(df_de_para)} itens Tasy para performance)"
        return True, info_msg, df_protheus, df_de_para
    except Exception as e:
        return False, f"❌ Erro ao ler o arquivo: {str(e)}", None, None

@st.cache_data(show_spinner=False)
def compute_matches(protheus_descriptions, protheus_codes, protheus_original, tasy_norm_list, tasy_orig_list, threshold):
    """Computa correspondências com cache e sem componentes visuais para performance."""
    results = []
    for tasy_desc_norm, tasy_desc in zip(tasy_norm_list, tasy_orig_list):
        matches = process.extract(
            tasy_desc_norm,
            protheus_descriptions,
            scorer=fuzz.token_sort_ratio,
            limit=3,  # top 3 para detectar múltiplas correspondências
            score_cutoff=threshold  # evita cálculos abaixo do limiar
        )
        if matches:
            best_match = matches[0]
            best_match_idx = best_match[2]
            score = best_match[1]
            revisao_obrigatoria = False
            if len(matches) > 1:
                score_diff = matches[0][1] - matches[1][1]
                if score_diff < 5:
                    revisao_obrigatoria = True
            results.append({
                'Codigo_Protheus': str(protheus_codes[best_match_idx]),
                'Descricao_Protheus': protheus_original[best_match_idx],
                'Descricao_Tasy': tasy_desc,
                'Score_Similaridade': round(score, 2),
                'Revisao_Obrigatoria': '⚠️ SIM' if revisao_obrigatoria else 'NÃO'
            })
    return pd.DataFrame(results)

def find_matches(df_protheus, df_de_para, threshold):
    """
    Executa comparação sequencial e precisa entre abas:
    1) Compara 'Codigo_Tasy' (De Para) com 'Codigo' (Protheus)
    2) Para códigos encontrados, compara 'Descrição do material Tasy' com 'Descricao' usando similaridade
    """
    # Filtrar linhas válidas
    df_protheus_clean = df_protheus.dropna(subset=['Codigo', 'Descricao']).copy()
    df_de_para_clean = df_de_para.dropna(subset=['Codigo_Tasy', 'Descricao_Tasy']).copy()

    # Normalização das descrições
    df_protheus_clean['Descricao_Normalizada'] = df_protheus_clean['Descricao'].apply(normalize_text)
    df_de_para_clean['Descricao_Tasy_Normalizada'] = df_de_para_clean['Descricao_Tasy'].apply(normalize_text)

    # Mapear código -> descrição (normalizada e original)
    code_to_desc_norm = dict(zip(df_protheus_clean['Codigo'].astype(str), df_protheus_clean['Descricao_Normalizada']))
    code_to_desc_orig = dict(zip(df_protheus_clean['Codigo'].astype(str), df_protheus_clean['Descricao']))

    results = []
    with st.spinner("🔎 Comparando por código e descrição..."):
        for _, row in df_de_para_clean.iterrows():
            codigo_tasy = str(row['Codigo_Tasy'])
            desc_tasy_orig = row['Descricao_Tasy']
            desc_tasy_norm = row['Descricao_Tasy_Normalizada']

            if codigo_tasy in code_to_desc_norm:
                desc_prot_norm = code_to_desc_norm[codigo_tasy]
                desc_prot_orig = code_to_desc_orig[codigo_tasy]
                score = fuzz.token_sort_ratio(desc_tasy_norm, desc_prot_norm)
                results.append({
                    'Codigo_Tasy': codigo_tasy,
                    'Codigo_Protheus': codigo_tasy,
                    'Status_Codigo': 'OK',
                    'Descricao_Tasy': desc_tasy_orig,
                    'Descricao_Protheus': desc_prot_orig,
                    'Score_Similaridade': round(score, 2),
                    'Revisao_Obrigatoria': '⚠️ SIM' if score < threshold else 'NÃO'
                })
            else:
                results.append({
                    'Codigo_Tasy': codigo_tasy,
                    'Codigo_Protheus': '',
                    'Status_Codigo': 'Não encontrado',
                    'Descricao_Tasy': desc_tasy_orig,
                    'Descricao_Protheus': '',
                    'Score_Similaridade': 0.0,
                    'Revisao_Obrigatoria': '⚠️ SIM'
                })

    return pd.DataFrame(results)

# Interface principal
st.markdown('<div class="main-header">🔗 Correspondência Inteligente Protheus-Tasy</div>', unsafe_allow_html=True)
st.markdown('<div class="sub-header">Sistema de correspondência automatizada entre itens dos sistemas Protheus e Tasy</div>', unsafe_allow_html=True)

# Seção de upload
st.markdown("### 📤 1. Upload do Arquivo")
uploaded_file = st.file_uploader(
    "Selecione o arquivo Excel (.xls, .xlsx)",
    type=['xls', 'xlsx'],
    help="O arquivo deve conter as abas 'Protheus' e 'De Para Almoxarifado'"
)
# Oferecer modelo de arquivo quando nenhum upload foi feito
if uploaded_file is None:
    st.download_button(
        "📄 Baixar modelo Excel",
        data=get_template_excel(),
        file_name="modelo_protheus_tasy.xlsx",
        mime="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        help="Modelo com as abas e colunas corretamente nomeadas para uso no sistema"
    )

if uploaded_file is not None:
    # Validar o arquivo
    with st.spinner("🔍 Validando arquivo..."):
        success, message, df_protheus, df_de_para = validate_excel_file(uploaded_file)
    
    if success:
        st.markdown(f'<div class="success-box">{message}</div>', unsafe_allow_html=True)
        
        # Mostrar pré-visualização das abas
        st.markdown("### 👀 2. Pré-visualização dos Dados")
        
        col1, col2 = st.columns(2)
        
        with col1:
            st.markdown("**Aba Protheus**")
            st.dataframe(
                df_protheus[['Codigo', 'Descricao']].head(10),
                width='stretch'
            )
            st.caption(f"Total de itens: {len(df_protheus)}")
        
        with col2:
            st.markdown("**Aba De Para Almoxarifado**")
            st.dataframe(
                df_de_para[['Codigo_Tasy', 'Descricao_Tasy']].head(10),
                width='stretch'
            )
            st.caption(f"Total de itens: {len(df_de_para)}")
        
        # Configuração de correspondência
        st.markdown("### ⚙️ 3. Configuração da Correspondência")

        # Guarda: impedir processamento com dados vazios
        has_protheus_items = df_protheus['Descricao'].notna().any()
        has_tasy_items = df_de_para[['Codigo_Tasy','Descricao_Tasy']].notna().all(axis=1).any()

        if not (has_protheus_items and has_tasy_items):
            st.markdown(
                '<div class="error-box">📄 O arquivo está vazio nas abas necessárias. Preencha o modelo com itens nas colunas exigidas antes de processar.</div>',
                unsafe_allow_html=True
            )
            st.download_button(
                "📄 Baixar modelo Excel",
                data=get_template_excel(),
                file_name="modelo_protheus_tasy.xlsx",
                mime="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                help="Modelo com as abas e colunas corretamente nomeadas para uso no sistema"
            )
            st.stop()
        
        threshold = st.slider(
            "Limiar de Similaridade (%)",
            min_value=50,
            max_value=100,
            value=80,
            step=5,
            help="Apenas correspondências com score acima deste valor serão exibidas"
        )
        
        # Botão para iniciar correspondência
        if st.button("🚀 Iniciar Correspondência", type="primary"):
            st.markdown("### 🔄 4. Processamento")
            
            with st.spinner("🔄 Processando correspondências..."):
                df_matches = find_matches(df_protheus, df_de_para, threshold)
            
            if len(df_matches) > 0:
                st.markdown(f'<div class="success-box">✅ Processamento concluído! {len(df_matches)} correspondências encontradas.</div>', unsafe_allow_html=True)
                
                # Estatísticas
                st.markdown("### 📊 5. Estatísticas")
                col1, col2, col3, col4 = st.columns(4)
                
                with col1:
                    st.metric("Total de Correspondências", len(df_matches))
                
                with col2:
                    revisao_count = len(df_matches[df_matches['Revisao_Obrigatoria'] == '⚠️ SIM'])
                    st.metric("Revisão Obrigatória", revisao_count)
                
                with col3:
                    avg_score = df_matches['Score_Similaridade'].mean()
                    st.metric("Score Médio", f"{avg_score:.1f}%")
                
                with col4:
                    high_confidence = len(df_matches[df_matches['Score_Similaridade'] >= 90])
                    st.metric("Alta Confiança (≥90%)", high_confidence)
                
                # Filtros
                st.markdown("### 🔍 6. Filtros e Visualização")
                
                col1, col2 = st.columns(2)
                
                with col1:
                    show_only_review = st.checkbox("Mostrar apenas itens para revisão", value=False)
                
                with col2:
                    min_score_filter = st.slider(
                        "Filtrar por score mínimo",
                        min_value=0,
                        max_value=100,
                        value=threshold,
                        step=5
                    )
                
                # Aplicar filtros
                df_filtered = df_matches[df_matches['Score_Similaridade'] >= min_score_filter].copy()
                
                if show_only_review:
                    df_filtered = df_filtered[df_filtered['Revisao_Obrigatoria'] == '⚠️ SIM']
                
                # Ordenar por score (decrescente)
                df_filtered = df_filtered.sort_values('Score_Similaridade', ascending=False)
                
                # Exibir tabela interativa
                st.markdown("### 📋 7. Resultados")
                
                # Destacar itens para revisão
                def highlight_review(row):
                    if row['Revisao_Obrigatoria'] == '⚠️ SIM':
                        return ['background-color: #fff3cd'] * len(row)
                    return [''] * len(row)
                
                st.dataframe(
                    df_filtered.style.apply(highlight_review, axis=1),
                    use_container_width=True,
                    height=400
                )
                
                st.caption(f"Exibindo {len(df_filtered)} de {len(df_matches)} correspondências")
                
                # Exportação
                st.markdown("### 💾 8. Exportação")
                
                # Gerar nome do arquivo com timestamp
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                filename = f"correspondencias_{timestamp}.xlsx"
                
                # Criar arquivo Excel em memória
                output = io.BytesIO()
                with pd.ExcelWriter(output, engine='openpyxl') as writer:
                    df_filtered.to_excel(writer, index=False, sheet_name='Correspondências')
                
                excel_data = output.getvalue()
                
                st.download_button(
                    label="📥 Baixar Correspondências (Excel)",
                    data=excel_data,
                    file_name=filename,
                    mime="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                )
                
                st.markdown(f'<div class="info-box">💡 O arquivo será salvo como: <strong>{filename}</strong></div>', unsafe_allow_html=True)
                
            else:
                st.markdown('<div class="error-box">⚠️ Nenhuma correspondência encontrada com o limiar atual. Verifique se há dados nas abas e, se necessário, reduza o limiar de similaridade.</div>', unsafe_allow_html=True)
    
    else:
        st.markdown(f'<div class="error-box">{message}</div>', unsafe_allow_html=True)

else:
    # Instruções quando nenhum arquivo foi carregado
    st.markdown("""
    <div class="info-box">
        <h4>📝 Instruções de Uso:</h4>
        <ol>
            <li>Faça upload de um arquivo Excel contendo as abas <strong>'Protheus'</strong> e <strong>'De Para Almoxarifado'</strong></li>
            <li>Aba <strong>De Para Almoxarifado</strong> deve conter as colunas: <strong>Código do material</strong> e <strong>Descrição do Material Tasy</strong></li>
            <li>Ajuste o limiar de similaridade conforme necessário (padrão: 80%)</li>
            <li>Clique em <strong>Iniciar Correspondência</strong> para processar</li>
            <li>Revise os resultados e baixe o arquivo final</li>
        </ol>
        
        <h4>ℹ️ Sobre o Sistema:</h4>
        <ul>
            <li><strong>Algoritmo de Correspondência:</strong> Utiliza RapidFuzz para comparação textual avançada</li>
            <li><strong>Pré-processamento:</strong> Normalização de texto, remoção de caracteres especiais</li>
            <li><strong>Revisão Obrigatória:</strong> Itens com múltiplas correspondências similares são marcados automaticamente</li>
            <li><strong>Exportação:</strong> Gera arquivo Excel contendo apenas as correspondências relevantes</li>
        </ul>
    </div>
    """, unsafe_allow_html=True)

# Rodapé
st.markdown("---")
st.markdown(
    "<div style='text-align: center; color: #666;'>Desenvolvido com ❤️ usando Streamlit</div>",
    unsafe_allow_html=True
)