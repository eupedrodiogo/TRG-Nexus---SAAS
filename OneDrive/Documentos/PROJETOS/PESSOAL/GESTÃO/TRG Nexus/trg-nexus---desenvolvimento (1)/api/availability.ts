import { VercelRequest, VercelResponse } from '@vercel/node';
import pg from 'pg';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    const { Pool } = pg;

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { date } = req.query;

    if (!date) {
        return res.status(400).json({ error: 'Missing date parameter' });
    }

    // Standard working hours: 08:00 to 18:00
    const allSlots = [
        '08:00', '09:00', '10:00', '11:00', '12:00',
        '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'
    ];

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
        // Query for appointments on this date
        // We assume the date is stored/passed as YYYY-MM-DD or compatible string
        // We'll use a partial match or date casting if needed, but strict equality is best if formats match.
        // The frontend sends ISO string, so we might need to cast or format.
        // Let's assume we receive YYYY-MM-DD from frontend for the query.

        const result = await client.query(
            `SELECT time FROM appointments 
             WHERE date::text LIKE $1 
             AND status != 'Cancelado'`,
            [`${date}%`] // Match YYYY-MM-DD% in case it's stored as timestamp
        );

        const occupiedSlots = new Set(result.rows.map(row => row.time));

        const slots = allSlots.map(time => ({
            id: time,
            time,
            available: !occupiedSlots.has(time)
        }));

        res.status(200).json({ slots });
    } catch (error: any) {
        console.error('Availability Error:', error);
        res.status(500).json({ error: error.message });
    } finally {
        client.release();
        await pool.end();
    }
}
