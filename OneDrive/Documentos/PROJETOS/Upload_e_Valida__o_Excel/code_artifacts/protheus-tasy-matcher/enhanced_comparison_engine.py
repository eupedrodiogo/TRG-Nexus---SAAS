"""
Sistema de Comparação Aprimorado para Integração Protheus-TASY
Desenvolvido para identificar com alta precisão células similares entre conjuntos de dados
"""

import pandas as pd
import numpy as np
import re
import unicodedata
from typing import Dict, List, Tuple, Any, Optional
from dataclasses import dataclass
from enum import Enum
import pickle
import json
from datetime import datetime
import logging
from concurrent.futures import ThreadPoolExecutor, as_completed
import multiprocessing as mp

# Importações para algoritmos de similaridade
from rapidfuzz import fuzz, distance
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import jellyfish

# Configuração de logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class MatchType(Enum):
    """Tipos de correspondência"""
    EXACT = "exact"
    HIGH_SIMILARITY = "high"
    MEDIUM_SIMILARITY = "medium"
    LOW_SIMILARITY = "low"
    NO_MATCH = "no_match"

class DataType(Enum):
    """Tipos de dados identificados"""
    TEXT = "text"
    NUMBER = "number"
    DATE = "date"
    CODE = "code"
    CURRENCY = "currency"
    PERCENTAGE = "percentage"
    MIXED = "mixed"

@dataclass
class MatchResult:
    """Resultado de uma correspondência"""
    source_value: str
    target_value: str
    similarity_score: float
    match_type: MatchType
    confidence: float
    algorithm_scores: Dict[str, float]
    data_type: DataType
    recommendation: str
    metadata: Dict[str, Any]

@dataclass
class ComparisonReport:
    """Relatório de comparação estruturado"""
    total_comparisons: int
    exact_matches: int
    high_similarity_matches: int
    medium_similarity_matches: int
    low_similarity_matches: int
    no_matches: int
    average_similarity: float
    processing_time: float
    matches: List[MatchResult]
    summary_stats: Dict[str, Any]

class EnhancedComparisonEngine:
    """Motor de comparação aprimorado com algoritmos otimizados"""
    
    def __init__(self, config: Optional[Dict] = None):
        """
        Inicializa o motor de comparação
        
        Args:
            config: Configurações personalizadas do motor
        """
        self.config = self._load_default_config()
        if config:
            self.config.update(config)
        
        # Inicializa componentes
        self.vectorizer = TfidfVectorizer(
            analyzer='char_wb',
            ngram_range=(2, 4),
            max_features=1000,
            lowercase=True
        )
        
        # Cache para otimização
        self._similarity_cache = {}
        self._normalization_cache = {}
        
        # Padrões pré-compilados para melhor performance
        self._compile_patterns()
        
        # Estatísticas de uso
        self.stats = {
            'total_comparisons': 0,
            'cache_hits': 0,
            'processing_times': []
        }
    
    def _load_default_config(self) -> Dict:
        """Carrega configuração padrão"""
        return {
            'similarity_thresholds': {
                'exact': 1.0,
                'high': 0.85,
                'medium': 0.65,
                'low': 0.40
            },
            'algorithm_weights': {
                'levenshtein': 0.25,
                'jaro_winkler': 0.25,
                'jaccard': 0.20,
                'cosine': 0.15,
                'semantic': 0.15
            },
            'enable_cache': True,
            'enable_parallel': True,
            'max_workers': min(4, mp.cpu_count()),
            'chunk_size': 1000,
            'enable_learning': True
        }
    
    def _compile_patterns(self):
        """Compila padrões regex para melhor performance"""
        self.patterns = {
            'numbers': re.compile(r'\d+'),
            'dates': re.compile(r'\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{4}[/-]\d{1,2}[/-]\d{1,2}'),
            'currency': re.compile(r'[R$€£¥]|\breal\b|\bdolar\b|\beuro\b', re.IGNORECASE),
            'percentage': re.compile(r'%|\bpercent\b|\bporcent\b', re.IGNORECASE),
            'codes': re.compile(r'^[A-Z0-9]{3,}$'),
            'special_chars': re.compile(r'[^\w\s]'),
            'multiple_spaces': re.compile(r'\s+')
        }
    
    def normalize_text(self, text: Any) -> str:
        """
        Normalização avançada de texto com cache
        
        Args:
            text: Texto a ser normalizado
            
        Returns:
            Texto normalizado
        """
        if pd.isna(text) or text is None:
            return ""
        
        text_str = str(text)
        
        # Verifica cache
        if self.config['enable_cache'] and text_str in self._normalization_cache:
            return self._normalization_cache[text_str]
        
        # Normalização
        normalized = text_str.lower().strip()
        
        # Remove acentos
        normalized = unicodedata.normalize('NFKD', normalized)
        normalized = ''.join(c for c in normalized if not unicodedata.combining(c))
        
        # Remove caracteres especiais
        normalized = self.patterns['special_chars'].sub(' ', normalized)
        
        # Normaliza espaços
        normalized = self.patterns['multiple_spaces'].sub(' ', normalized)
        normalized = normalized.strip()
        
        # Armazena no cache
        if self.config['enable_cache']:
            self._normalization_cache[text_str] = normalized
        
        return normalized
    
    def identify_data_type(self, text: str) -> DataType:
        """
        Identifica o tipo de dados do texto
        
        Args:
            text: Texto a ser analisado
            
        Returns:
            Tipo de dados identificado
        """
        if not text:
            return DataType.TEXT
        
        text_str = str(text).strip()
        
        # Verifica padrões específicos
        if self.patterns['dates'].search(text_str):
            return DataType.DATE
        elif self.patterns['currency'].search(text_str):
            return DataType.CURRENCY
        elif self.patterns['percentage'].search(text_str):
            return DataType.PERCENTAGE
        elif self.patterns['codes'].match(text_str):
            return DataType.CODE
        elif self.patterns['numbers'].search(text_str) and text_str.replace('.', '').replace(',', '').replace('-', '').isdigit():
            return DataType.NUMBER
        else:
            return DataType.TEXT
    
    def calculate_levenshtein_similarity(self, text1: str, text2: str) -> float:
        """Calcula similaridade Levenshtein otimizada"""
        if not text1 or not text2:
            return 0.0
        
        max_len = max(len(text1), len(text2))
        if max_len == 0:
            return 1.0
        
        lev_distance = distance.Levenshtein.distance(text1, text2)
        return 1 - (lev_distance / max_len)
    
    def calculate_jaro_winkler_similarity(self, text1: str, text2: str) -> float:
        """Calcula similaridade Jaro-Winkler"""
        if not text1 or not text2:
            return 0.0
        
        return jellyfish.jaro_winkler_similarity(text1, text2)
    
    def calculate_jaccard_similarity(self, text1: str, text2: str) -> float:
        """Calcula similaridade Jaccard baseada em tokens"""
        if not text1 or not text2:
            return 0.0
        
        tokens1 = set(text1.split())
        tokens2 = set(text2.split())
        
        if not tokens1 and not tokens2:
            return 1.0
        
        intersection = len(tokens1.intersection(tokens2))
        union = len(tokens1.union(tokens2))
        
        return intersection / union if union > 0 else 0.0
    
    def calculate_cosine_similarity_score(self, text1: str, text2: str) -> float:
        """Calcula similaridade coseno usando TF-IDF"""
        if not text1 or not text2:
            return 0.0
        
        try:
            tfidf_matrix = self.vectorizer.fit_transform([text1, text2])
            cosine_sim = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]
            return cosine_sim
        except:
            return 0.0
    
    def calculate_semantic_similarity(self, text1: str, text2: str) -> float:
        """
        Calcula similaridade semântica baseada em características
        
        Args:
            text1, text2: Textos para comparação
            
        Returns:
            Score de similaridade semântica
        """
        features1 = self._extract_semantic_features(text1)
        features2 = self._extract_semantic_features(text2)
        
        # Similaridade de tipo de dados
        type_match = 1.0 if features1['data_type'] == features2['data_type'] else 0.0
        
        # Similaridade de características booleanas
        bool_features = ['has_numbers', 'has_dates', 'has_currency', 'has_percentage']
        bool_matches = sum(1 for feat in bool_features if features1[feat] == features2[feat])
        bool_similarity = bool_matches / len(bool_features)
        
        # Similaridade de comprimento
        len_diff = abs(features1['length'] - features2['length'])
        max_len = max(features1['length'], features2['length'])
        length_similarity = 1 - (len_diff / max_len) if max_len > 0 else 1.0
        
        # Similaridade de palavras-chave
        keywords1 = set(features1['keywords'])
        keywords2 = set(features2['keywords'])
        
        if keywords1 or keywords2:
            keyword_similarity = len(keywords1.intersection(keywords2)) / len(keywords1.union(keywords2))
        else:
            keyword_similarity = 0.0
        
        # Combina todas as similaridades
        semantic_score = (
            type_match * 0.3 +
            bool_similarity * 0.3 +
            length_similarity * 0.2 +
            keyword_similarity * 0.2
        )
        
        return semantic_score
    
    def _extract_semantic_features(self, text: str) -> Dict[str, Any]:
        """Extrai características semânticas do texto"""
        normalized = self.normalize_text(text)
        
        features = {
            'length': len(normalized),
            'word_count': len(normalized.split()),
            'has_numbers': bool(self.patterns['numbers'].search(text)),
            'has_dates': bool(self.patterns['dates'].search(text)),
            'has_currency': bool(self.patterns['currency'].search(text)),
            'has_percentage': bool(self.patterns['percentage'].search(text)),
            'data_type': self.identify_data_type(text),
            'keywords': self._extract_domain_keywords(normalized)
        }
        
        return features
    
    def _extract_domain_keywords(self, text: str) -> List[str]:
        """Extrai palavras-chave específicas do domínio"""
        domain_keywords = {
            'financeiro': ['valor', 'preco', 'custo', 'total', 'subtotal', 'desconto', 'taxa'],
            'temporal': ['data', 'hora', 'periodo', 'mes', 'ano', 'dia', 'prazo'],
            'identificacao': ['codigo', 'id', 'numero', 'seq', 'chave', 'ref'],
            'quantidade': ['qtd', 'quantidade', 'volume', 'peso', 'medida'],
            'pessoa': ['nome', 'cliente', 'fornecedor', 'usuario', 'responsavel'],
            'produto': ['item', 'produto', 'material', 'mercadoria', 'sku'],
            'localizacao': ['endereco', 'cidade', 'estado', 'pais', 'cep']
        }
        
        keywords = []
        words = text.split()
        
        for category, category_words in domain_keywords.items():
            for word in words:
                for keyword in category_words:
                    if keyword in word or word in keyword:
                        keywords.append(f"{category}:{keyword}")
        
        return list(set(keywords))
    
    def calculate_comprehensive_similarity(self, text1: str, text2: str) -> Dict[str, float]:
        """
        Calcula similaridade abrangente usando todos os algoritmos
        
        Args:
            text1, text2: Textos para comparação
            
        Returns:
            Dicionário com scores de todos os algoritmos
        """
        # Normaliza textos
        norm1 = self.normalize_text(text1)
        norm2 = self.normalize_text(text2)
        
        # Verifica cache
        cache_key = f"{norm1}||{norm2}"
        if self.config['enable_cache'] and cache_key in self._similarity_cache:
            self.stats['cache_hits'] += 1
            return self._similarity_cache[cache_key]
        
        # Calcula todas as métricas
        scores = {
            'levenshtein': self.calculate_levenshtein_similarity(norm1, norm2),
            'jaro_winkler': self.calculate_jaro_winkler_similarity(norm1, norm2),
            'jaccard': self.calculate_jaccard_similarity(norm1, norm2),
            'cosine': self.calculate_cosine_similarity_score(norm1, norm2),
            'semantic': self.calculate_semantic_similarity(text1, text2)
        }
        
        # Calcula score geral
        weights = self.config['algorithm_weights']
        overall_score = sum(scores[alg] * weights[alg] for alg in scores.keys())
        scores['overall'] = overall_score
        
        # Armazena no cache
        if self.config['enable_cache']:
            self._similarity_cache[cache_key] = scores
        
        self.stats['total_comparisons'] += 1
        
        return scores
    
    def classify_match(self, similarity_score: float) -> MatchType:
        """Classifica o tipo de correspondência baseado no score"""
        thresholds = self.config['similarity_thresholds']
        
        if similarity_score >= thresholds['exact']:
            return MatchType.EXACT
        elif similarity_score >= thresholds['high']:
            return MatchType.HIGH_SIMILARITY
        elif similarity_score >= thresholds['medium']:
            return MatchType.MEDIUM_SIMILARITY
        elif similarity_score >= thresholds['low']:
            return MatchType.LOW_SIMILARITY
        else:
            return MatchType.NO_MATCH
    
    def calculate_confidence(self, scores: Dict[str, float]) -> float:
        """
        Calcula confiança da correspondência baseada na consistência dos algoritmos
        
        Args:
            scores: Scores de todos os algoritmos
            
        Returns:
            Score de confiança (0-1)
        """
        algorithm_scores = [scores[alg] for alg in ['levenshtein', 'jaro_winkler', 'jaccard', 'cosine', 'semantic']]
        
        # Calcula desvio padrão dos scores
        std_dev = np.std(algorithm_scores)
        mean_score = np.mean(algorithm_scores)
        
        # Confiança é inversamente proporcional ao desvio padrão
        # e diretamente proporcional ao score médio
        confidence = mean_score * (1 - std_dev)
        
        return max(0.0, min(1.0, confidence))
    
    def generate_recommendation(self, match_result: MatchResult) -> str:
        """Gera recomendação baseada no resultado da correspondência"""
        if match_result.match_type == MatchType.EXACT:
            return "✅ Correspondência Exata - Mapeamento Automático Recomendado"
        elif match_result.match_type == MatchType.HIGH_SIMILARITY:
            if match_result.confidence >= 0.8:
                return "🟢 Alta Similaridade - Mapeamento Recomendado"
            else:
                return "🟡 Alta Similaridade - Verificar Contexto"
        elif match_result.match_type == MatchType.MEDIUM_SIMILARITY:
            return "🟠 Similaridade Moderada - Revisão Manual Necessária"
        elif match_result.match_type == MatchType.LOW_SIMILARITY:
            return "🔴 Baixa Similaridade - Verificar Adequação"
        else:
            return "❌ Sem Correspondência - Mapeamento Manual Necessário"
    
    def compare_values(self, source_value: Any, target_value: Any) -> MatchResult:
        """
        Compara dois valores e retorna resultado detalhado
        
        Args:
            source_value: Valor de origem
            target_value: Valor de destino
            
        Returns:
            Resultado detalhado da comparação
        """
        start_time = datetime.now()
        
        # Calcula similaridade
        scores = self.calculate_comprehensive_similarity(source_value, target_value)
        
        # Classifica correspondência
        match_type = self.classify_match(scores['overall'])
        
        # Calcula confiança
        confidence = self.calculate_confidence(scores)
        
        # Identifica tipo de dados
        data_type = self.identify_data_type(str(source_value))
        
        # Cria resultado
        result = MatchResult(
            source_value=str(source_value),
            target_value=str(target_value),
            similarity_score=scores['overall'],
            match_type=match_type,
            confidence=confidence,
            algorithm_scores=scores,
            data_type=data_type,
            recommendation="",
            metadata={
                'processing_time': (datetime.now() - start_time).total_seconds(),
                'normalized_source': self.normalize_text(source_value),
                'normalized_target': self.normalize_text(target_value)
            }
        )
        
        # Gera recomendação
        result.recommendation = self.generate_recommendation(result)
        
        return result
    
    def find_best_matches(self, source_values: List[Any], target_values: List[Any], 
                         threshold: float = 0.4) -> List[MatchResult]:
        """
        Encontra as melhores correspondências entre listas de valores
        
        Args:
            source_values: Lista de valores de origem
            target_values: Lista de valores de destino
            threshold: Limiar mínimo de similaridade
            
        Returns:
            Lista de melhores correspondências
        """
        matches = []
        
        if self.config['enable_parallel'] and len(source_values) > 100:
            # Processamento paralelo para grandes volumes
            matches = self._find_matches_parallel(source_values, target_values, threshold)
        else:
            # Processamento sequencial
            matches = self._find_matches_sequential(source_values, target_values, threshold)
        
        # Ordena por score de similaridade
        matches.sort(key=lambda x: x.similarity_score, reverse=True)
        
        return matches
    
    def _find_matches_sequential(self, source_values: List[Any], target_values: List[Any], 
                                threshold: float) -> List[MatchResult]:
        """Encontra correspondências sequencialmente"""
        matches = []
        
        for source_val in source_values:
            best_match = None
            best_score = 0.0
            
            for target_val in target_values:
                result = self.compare_values(source_val, target_val)
                
                if result.similarity_score > best_score and result.similarity_score >= threshold:
                    best_score = result.similarity_score
                    best_match = result
            
            if best_match:
                matches.append(best_match)
        
        return matches
    
    def _find_matches_parallel(self, source_values: List[Any], target_values: List[Any], 
                              threshold: float) -> List[MatchResult]:
        """Encontra correspondências em paralelo"""
        matches = []
        
        def compare_chunk(source_chunk):
            chunk_matches = []
            for source_val in source_chunk:
                best_match = None
                best_score = 0.0
                
                for target_val in target_values:
                    result = self.compare_values(source_val, target_val)
                    
                    if result.similarity_score > best_score and result.similarity_score >= threshold:
                        best_score = result.similarity_score
                        best_match = result
                
                if best_match:
                    chunk_matches.append(best_match)
            
            return chunk_matches
        
        # Divide em chunks
        chunk_size = self.config['chunk_size']
        chunks = [source_values[i:i + chunk_size] for i in range(0, len(source_values), chunk_size)]
        
        # Processa em paralelo
        with ThreadPoolExecutor(max_workers=self.config['max_workers']) as executor:
            future_to_chunk = {executor.submit(compare_chunk, chunk): chunk for chunk in chunks}
            
            for future in as_completed(future_to_chunk):
                chunk_matches = future.result()
                matches.extend(chunk_matches)
        
        return matches
    
    def generate_comparison_report(self, matches: List[MatchResult], 
                                 processing_time: float) -> ComparisonReport:
        """
        Gera relatório estruturado de comparação
        
        Args:
            matches: Lista de correspondências encontradas
            processing_time: Tempo total de processamento
            
        Returns:
            Relatório estruturado
        """
        # Conta tipos de correspondência
        exact_matches = sum(1 for m in matches if m.match_type == MatchType.EXACT)
        high_matches = sum(1 for m in matches if m.match_type == MatchType.HIGH_SIMILARITY)
        medium_matches = sum(1 for m in matches if m.match_type == MatchType.MEDIUM_SIMILARITY)
        low_matches = sum(1 for m in matches if m.match_type == MatchType.LOW_SIMILARITY)
        no_matches = sum(1 for m in matches if m.match_type == MatchType.NO_MATCH)
        
        # Calcula estatísticas
        avg_similarity = np.mean([m.similarity_score for m in matches]) if matches else 0.0
        
        summary_stats = {
            'total_cache_hits': self.stats['cache_hits'],
            'cache_hit_rate': self.stats['cache_hits'] / max(1, self.stats['total_comparisons']),
            'avg_confidence': np.mean([m.confidence for m in matches]) if matches else 0.0,
            'data_types_distribution': self._calculate_data_type_distribution(matches),
            'algorithm_performance': self._calculate_algorithm_performance(matches)
        }
        
        return ComparisonReport(
            total_comparisons=len(matches),
            exact_matches=exact_matches,
            high_similarity_matches=high_matches,
            medium_similarity_matches=medium_matches,
            low_similarity_matches=low_matches,
            no_matches=no_matches,
            average_similarity=avg_similarity,
            processing_time=processing_time,
            matches=matches,
            summary_stats=summary_stats
        )
    
    def _calculate_data_type_distribution(self, matches: List[MatchResult]) -> Dict[str, int]:
        """Calcula distribuição de tipos de dados"""
        distribution = {}
        for match in matches:
            data_type = match.data_type.value
            distribution[data_type] = distribution.get(data_type, 0) + 1
        return distribution
    
    def _calculate_algorithm_performance(self, matches: List[MatchResult]) -> Dict[str, float]:
        """Calcula performance média de cada algoritmo"""
        if not matches:
            return {}
        
        algorithms = ['levenshtein', 'jaro_winkler', 'jaccard', 'cosine', 'semantic']
        performance = {}
        
        for alg in algorithms:
            scores = [m.algorithm_scores[alg] for m in matches if alg in m.algorithm_scores]
            performance[alg] = np.mean(scores) if scores else 0.0
        
        return performance
    
    def export_report_to_excel(self, report: ComparisonReport, filename: str):
        """
        Exporta relatório para Excel
        
        Args:
            report: Relatório de comparação
            filename: Nome do arquivo de saída
        """
        with pd.ExcelWriter(filename, engine='openpyxl') as writer:
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
        
        logger.info(f"Relatório exportado para: {filename}")
    
    def save_configuration(self, filename: str):
        """Salva configuração atual"""
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(self.config, f, indent=2, ensure_ascii=False)
    
    def load_configuration(self, filename: str):
        """Carrega configuração de arquivo"""
        with open(filename, 'r', encoding='utf-8') as f:
            self.config.update(json.load(f))
    
    def get_statistics(self) -> Dict[str, Any]:
        """Retorna estatísticas de uso do motor"""
        return {
            'total_comparisons': self.stats['total_comparisons'],
            'cache_hits': self.stats['cache_hits'],
            'cache_hit_rate': self.stats['cache_hits'] / max(1, self.stats['total_comparisons']),
            'cache_size': len(self._similarity_cache),
            'normalization_cache_size': len(self._normalization_cache)
        }
    
    def clear_cache(self):
        """Limpa cache de similaridade e normalização"""
        self._similarity_cache.clear()
        self._normalization_cache.clear()
        logger.info("Cache limpo com sucesso")

# Função de conveniência para uso rápido
def quick_compare(source_values: List[Any], target_values: List[Any], 
                 threshold: float = 0.4, config: Optional[Dict] = None) -> ComparisonReport:
    """
    Função de conveniência para comparação rápida
    
    Args:
        source_values: Valores de origem
        target_values: Valores de destino
        threshold: Limiar de similaridade
        config: Configuração personalizada
        
    Returns:
        Relatório de comparação
    """
    start_time = datetime.now()
    
    engine = EnhancedComparisonEngine(config)
    matches = engine.find_best_matches(source_values, target_values, threshold)
    
    processing_time = (datetime.now() - start_time).total_seconds()
    report = engine.generate_comparison_report(matches, processing_time)
    
    return report

if __name__ == "__main__":
    # Exemplo de uso
    source_data = ["Produto A", "Cliente B", "Valor Total", "Data Vencimento"]
    target_data = ["Produto Alpha", "Cliente Beta", "Total Valor", "Vencimento Data"]
    
    report = quick_compare(source_data, target_data, threshold=0.3)
    
    print(f"Total de correspondências: {report.total_comparisons}")
    print(f"Correspondências exatas: {report.exact_matches}")
    print(f"Alta similaridade: {report.high_similarity_matches}")
    print(f"Similaridade média: {report.average_similarity:.3f}")