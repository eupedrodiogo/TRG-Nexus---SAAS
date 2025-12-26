import { VercelRequest, VercelResponse } from '@vercel/node';
import pg from 'pg';

export default async function handler(req: VercelRequest, res: VercelResponse) {
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
            if (req.method === 'PUT') {
                const { name, email, phone, status, notes } = req.body;
                const { rows } = await client.query(
                    'UPDATE patients SET name=$1, email=$2, phone=$3, status=$4, notes=$5 WHERE id=$6 RETURNING *',
                    [name, email, phone, status, notes, id]
                );
                return res.status(200).json(rows[0]);
            } else if (req.method === 'DELETE') {
                await client.query('DELETE FROM patients WHERE id=$1', [id]);
                return res.status(200).json({ message: 'Deleted successfully' });
            } else {
                res.setHeader('Allow', ['PUT', 'DELETE']);
                return res.status(405).end(`Method ${req.method} Not Allowed`);
            }
        } else {
            // Handle collection operations (GET, POST)
            if (req.method === 'GET') {
                const { therapistId } = req.query;
                let query = 'SELECT * FROM patients';
                const params: any[] = [];

                if (therapistId) {
                    query += ' WHERE therapist_id = $1';
                    params.push(therapistId);
                }

                query += ' ORDER BY created_at DESC';

                const { rows } = await client.query(query, params);
                return res.status(200).json(rows);
            } else if (req.method === 'POST') {
                const { name, email, phone, status, notes } = req.body;
                const { rows } = await client.query(
                    'INSERT INTO patients (name, email, phone, status, notes) VALUES ($1, $2, $3, $4, $5) RETURNING *',
                    [name, email, phone, status, notes]
                );
                return res.status(201).json(rows[0]);
            } else {
                res.setHeader('Allow', ['GET', 'POST']);
                return res.status(405).end(`Method ${req.method} Not Allowed`);
            }
        }
    } catch (error: any) {
        console.error('Patients API Error:', error);
        // Log more details for debugging
        console.error('Query:', req.query);
        console.error('Connection String Present:', !!connectionString);
        res.status(500).json({
            error: error.message,
            details: error.toString(),
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    } finally {
        client.release();
        await pool.end();
    }
}
