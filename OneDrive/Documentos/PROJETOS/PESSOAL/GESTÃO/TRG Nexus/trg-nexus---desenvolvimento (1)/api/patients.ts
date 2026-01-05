import { VercelRequest, VercelResponse } from '@vercel/node';
import pg from 'pg';
import { verifyAuth } from './utils/auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // 1. Verify Auth First
    const user = verifyAuth(req, res);
    if (!user) return; // verifyAuth handles the error response

    const { Pool } = pg;
    const { id } = req.query;

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
        if (id) {
            // Handle operations on a specific patient (PUT, DELETE)
            // CRITICAL: Ensure the patient belongs to the logged-in therapist
            if (req.method === 'PUT') {
                const { name, email, phone, status, notes } = req.body;
                const { rows } = await client.query(
                    'UPDATE patients SET name=$1, email=$2, phone=$3, status=$4, notes=$5 WHERE id=$6 AND therapist_id=$7 RETURNING *',
                    [name, email, phone, status, notes, id, user.id]
                );
                if (rows.length === 0) return res.status(404).json({ error: 'Patient not found or unauthorized' });
                return res.status(200).json(rows[0]);
            } else if (req.method === 'DELETE') {
                const { rowCount } = await client.query('DELETE FROM patients WHERE id=$1 AND therapist_id=$2', [id, user.id]);
                if (rowCount === 0) return res.status(404).json({ error: 'Patient not found or unauthorized' });
                return res.status(200).json({ message: 'Deleted successfully' });
            } else {
                res.setHeader('Allow', ['PUT', 'DELETE']);
                return res.status(405).end(`Method ${req.method} Not Allowed`);
            }
        } else {
            // Handle collection operations (GET, POST)
            if (req.method === 'GET') {
                // FORCE filtering by the logged-in therapist
                const query = 'SELECT * FROM patients WHERE therapist_id = $1 ORDER BY created_at DESC';
                const { rows } = await client.query(query, [user.id]);
                return res.status(200).json(rows);
            } else if (req.method === 'POST') {
                const { name, email, phone, status, notes } = req.body;
                const { rows } = await client.query(
                    'INSERT INTO patients (name, email, phone, status, notes, therapist_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
                    [name, email, phone, status, notes, user.id]
                );
                return res.status(201).json(rows[0] as Patient);
            } else {
                res.setHeader('Allow', ['GET', 'POST']);
                return res.status(405).end(`Method ${req.method} Not Allowed`);
            }
        }
    } catch (error: any) {
        console.error('Patients API Error:', error);
        res.status(500).json({
            error: error.message,
            details: error.toString()
        });
    } finally {
        client.release();
        await pool.end();
    }
}
