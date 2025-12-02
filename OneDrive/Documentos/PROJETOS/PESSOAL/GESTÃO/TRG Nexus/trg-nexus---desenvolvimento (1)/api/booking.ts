import { VercelRequest, VercelResponse } from '@vercel/node';
import pg from 'pg';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    const { Pool } = pg;

    const envCheck = {
        hasUrl: !!process.env.POSTGRES_URL,
        nodeEnv: process.env.NODE_ENV,
    };

    try {
        if (!process.env.POSTGRES_URL) {
            return res.status(500).json({ status: 'error', message: 'Missing POSTGRES_URL', env: envCheck });
        }

        const connectionString = process.env.POSTGRES_URL.replace('?sslmode=require', '?');

        const pool = new Pool({
            connectionString,
            ssl: { rejectUnauthorized: false },
            connectionTimeoutMillis: 5000,
        });

        const client = await pool.connect();
        console.log('Connected to DB');

        try {
            if (req.method !== 'POST') {
                return res.status(405).json({ error: 'Method not allowed' });
            }

            const { name, email, phone, date, time, ...anamnesisData } = req.body || {};

            if (!name || !email || !date || !time) {
                console.error('Missing fields:', { name, email, date, time });
                return res.status(400).json({ error: 'Missing required fields' });
            }

            // Format anamnesis data for storage
            const anamnesisString = JSON.stringify(anamnesisData, null, 2);
            const mainComplaint = anamnesisData.queixaPrincipal || 'Não informado';

            await client.query('BEGIN');

            // 1. Create or Update Patient
            const patientCheck = await client.query('SELECT id FROM patients WHERE email = $1', [email]);
            let patientId;

            if (patientCheck.rows.length > 0) {
                patientId = patientCheck.rows[0].id;
                await client.query(
                    'UPDATE patients SET name = $1, phone = $2 WHERE id = $3',
                    [name, phone, patientId]
                );
            } else {
                const newPatient = await client.query(
                    `INSERT INTO patients (name, email, phone, status, notes)
             VALUES ($1, $2, $3, 'Ativo', $4)
             RETURNING id`,
                    [name, email, phone, `Queixa Principal: ${mainComplaint}`]
                );
                patientId = newPatient.rows[0].id;
            }

            // 2. Create Appointment
            await client.query(
                `INSERT INTO appointments (patient_id, date, time, status, type, notes)
           VALUES ($1, $2, $3, 'Agendado', 'Primeira Consulta', $4)`,
                [
                    patientId,
                    date,
                    time,
                    anamnesisString
                ]
            );

            await client.query('COMMIT');

            res.status(200).json({ message: 'Booking confirmed', patientId });
        } catch (error: any) {
            await client.query('ROLLBACK');
            console.error('Transaction Error:', error);
            res.status(500).json({ error: error.message });
        } finally {
            client.release();
            await pool.end();
        }
    } catch (error: any) {
        console.error('Health DB Error:', error);
        res.status(500).json({
            status: 'error',
            message: error.message,
            stack: error.stack
        });
    }
}
