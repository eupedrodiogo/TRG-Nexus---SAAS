
import { VercelRequest, VercelResponse } from '@vercel/node';
import pg from 'pg';

const { Pool } = pg;

// Use the robust connection string available in production
const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;

const pool = new Pool({
    connectionString: connectionString ? connectionString.replace('?sslmode=require', '') : undefined,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 5000
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
    const client = await pool.connect();

    try {
        if (req.method === 'GET') {
            const { therapistId, patientId } = req.query;

            if (!therapistId) {
                return res.status(400).json({ error: 'Missing therapistId' });
            }

            let query = `
                SELECT r.*, p.name as patient_name 
                FROM reports r
                LEFT JOIN patients p ON r.patient_id = p.id
                WHERE r.therapist_id = $1
            `;
            const params: any[] = [therapistId];

            if (patientId) {
                query += ` AND r.patient_id = $2`;
                params.push(patientId);
            }

            query += ` ORDER BY r.created_at DESC`;

            const result = await client.query(query, params);
            return res.status(200).json(result.rows);
        }

        if (req.method === 'POST') {
            const { therapistId, patientId, title, type, content, metadata } = req.body;

            if (!therapistId || !patientId || !title || !content) {
                return res.status(400).json({ error: 'Missing required fields' });
            }

            // If patientId is 'demo', we don't save or we mock it?
            // User might want to save demo reports too, but we need a valid UUID for FK.
            // For now, if patientId is 'demo', we return success without saving (mock persistence).
            if (patientId === 'demo') {
                return res.status(200).json({
                    id: 'demo-report-id',
                    title,
                    created_at: new Date().toISOString()
                });
            }

            const query = `
                INSERT INTO reports (therapist_id, patient_id, title, type, content, metadata)
                VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING *
            `;

            const values = [
                therapistId,
                patientId,
                title,
                type || 'evolution',
                content,
                metadata || {}
            ];

            const result = await client.query(query, values);
            return res.status(201).json(result.rows[0]);
        }

        if (req.method === 'DELETE') {
            const { id } = req.query;
            if (!id) {
                return res.status(400).json({ error: 'Missing report ID' });
            }

            await client.query('DELETE FROM reports WHERE id = $1', [id]);
            return res.status(200).json({ success: true });
        }

        res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);

    } catch (error: any) {
        console.error('Reports API Error:', error);
        return res.status(500).json({ error: error.message });
    } finally {
        client.release();
    }
}
