
import { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini Client
const REPORT_PROMPTS: Record<string, string> = {
    'evolution': `
      Crie um Relatório de Evolução Clínica formal.
      Use uma linguagem técnica, objetiva e profissional (padrão CFP/Psicologia).
      Estrutura:
      1. Identificação (Nome do Paciente).
      2. Resumo da Demanda Inicial.
      3. Processo Terapêutico (Foque na evolução na escala SUD e métodos TRG aplicados).
      4. Estado Atual e Prognóstico.
    `,
    'laudo': `
      Elabore um Laudo Técnico Psicológico.
      Linguagem extremamente formal e jurídica se necessário.
      Estrutura:
      1. Cabeçalho Técnico.
      2. Análise da Demanda.
      3. Procedimentos Técnicos Adotados (TRG - Terapia de Reprocessamento Generativo).
      4. Análise e Conclusão.
    `,
    'statement': `
      Gere apenas uma Declaração de Comparecimento simples e direta.
      Deve atestar que o paciente esteve em tratamento.
    `
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // CORS Setup logic
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const { patientName, templateType, clinicalNotes, metadata } = req.body;

        const apiKey = process.env.GEMINI_API_KEY;
        // Strong verification for empty strings which might exist in Vercel envs
        if (!apiKey || apiKey.trim() === '') {
            console.error('SERVER ERROR: GEMINI_API_KEY is missing or empty.');
            return res.status(500).json({
                error: 'Configuração de API ausente',
                details: 'A chave da API Gemini não foi configurada no servidor Vercel (Variável vazia ou indefinida).'
            });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        // Using "gemini-2.0-flash" as it is explicitly available in the account's model list
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        const templatePrompt = REPORT_PROMPTS[templateType] || REPORT_PROMPTS['evolution'];

        const prompt = `
Comporte-se como um Terapeuta TRG Profissional especialista em documentação clínica.
${templatePrompt}

DADOS DO PACIENTE:
Nome: ${patientName}
Notas Clínicas/Histórico: "${clinicalNotes || 'Paciente em tratamento regular.'}"
Dados Extras: ${JSON.stringify(metadata || {})}

Gere o texto completo do documento, pronto para impressão.
Não inclua explicações extras ("Aqui está o seu relatório..."), apenas o conteúdo do documento.
`;

        // Generate Content
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        return res.status(200).json({
            report: text,
            success: true
        });

    } catch (error: any) {
        console.error('Gemini Report Error:', error);
        return res.status(500).json({
            error: 'Erro na geração do relatório',
            // Send back the actual error from Gemini/Node
            details: error.message || error.toString()
        });
    }
}
