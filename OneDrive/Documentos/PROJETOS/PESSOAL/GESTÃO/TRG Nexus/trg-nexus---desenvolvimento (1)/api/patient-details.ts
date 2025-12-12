import { VercelRequest, VercelResponse } from '@vercel/node';
import pg from 'pg';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    const { Pool } = pg;
    const { patientId } = req.query;

    const connectionString = process.env.POSTGRES_URL ? process.env.POSTGRES_URL.replace('?sslmode=require', '?') : undefined;

    if (!connectionString) {
        return res.status(500).json({ error: 'Database configuration missing' });
    }

    const pool = new Pool({
        connectionString,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 5000,
    });

    const client = await pool.connect();

    try {
        if (req.method !== 'GET') {
            return res.status(405).json({ error: 'Method not allowed' });
        }

        if (!patientId) {
            return res.status(400).json({ error: 'Missing patientId' });
        }

        // 1. Fetch Appointments (Timeline)
        const appointmentsRes = await client.query(
            'SELECT * FROM appointments WHERE patient_id = $1 ORDER BY date DESC, time DESC',
            [patientId]
        );

        const timeline = appointmentsRes.rows.map(apt => ({
            id: apt.id,
            type: 'session',
            date: apt.date,
            title: `Sessão - ${apt.type}`,
            desc: `Status: ${apt.status}. ${apt.notes || ''}`,
            status: apt.status
        }));

        // 2. Calculate Financials
        // Assuming R$ 250 per session for now
        const PRICE_PER_SESSION = 250;
        const totalAppointments = appointmentsRes.rows.length;
        const completedAppointments = appointmentsRes.rows.filter(a => a.status === 'Concluída').length;
        // For now, let's assume all appointments generate a "pending" or "paid" record
        // In a real app, we'd check a payments table.
        // Let's mock the financial summary based on appointments to be dynamic but "real" based on data.

        const totalInvested = completedAppointments * PRICE_PER_SESSION;
        const pending = appointmentsRes.rows.filter(a => a.status === 'Agendado').length * PRICE_PER_SESSION;

        const financialHistory = appointmentsRes.rows.map(apt => ({
            id: apt.id,
            date: apt.date,
            desc: `Sessão ${apt.type}`,
            value: PRICE_PER_SESSION,
            status: apt.status === 'Concluída' ? 'Pago' : 'Pendente'
        }));

        // 3. Documents (Empty for now)
        const documents: any[] = [];

        res.status(200).json({
            timeline,
            financial: {
                totalInvested,
                pending,
                history: financialHistory
            },
            documents
        });

    } catch (error: any) {
        console.error('Patient Details API Error:', error);
        res.status(500).json({ error: error.message });
    } finally {
        client.release();
        await pool.end();
    }
}
