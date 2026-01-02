import { VercelRequest, VercelResponse } from '@vercel/node';
import pg from 'pg';
import { sendBookingCancellation } from './_utils/notifications';

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
            // Handle operations on a specific appointment (PUT, DELETE)
            if (req.method === 'PUT') {
                const { date, time, status, type, notes } = req.body;
                const { rows } = await client.query(
                    'UPDATE appointments SET date=$1, time=$2, status=$3, type=$4, notes=$5 WHERE id=$6 RETURNING *',
                    [date, time, status, type, notes, id]
                );

                // Notification: Booking Cancellation
                if (status === 'Cancelado' && rows.length > 0) {
                    try {
                        const { rows: details } = await client.query(`
                            SELECT 
                                p.name as patient_name, 
                                p.email as patient_email, 
                                p.phone as patient_phone,
                                t.name as therapist_name,
                                t.email as therapist_email,
                                t.phone as therapist_phone,
                                a.date, a.time
                            FROM appointments a
                            JOIN patients p ON a.patient_id = p.id
                            LEFT JOIN therapists t ON a.therapist_id = t.id
                            WHERE a.id = $1
                        `, [id]);

                        if (details.length > 0) {
                            const info = details[0];
                            // Format date for notification (YYYY-MM-DD -> DD/MM/YYYY)
                            let dateStr = info.date;
                            if (info.date instanceof Date) dateStr = info.date.toISOString().split('T')[0];

                            const [y, m, d] = dateStr.split('-');
                            const formattedDate = `${d}/${m}/${y}`;

                            // Notify Patient
                            await sendBookingCancellation({
                                name: info.patient_name,
                                email: info.patient_email,
                                phone: info.patient_phone,
                                date: formattedDate,
                                time: info.time,
                                therapistName: info.therapist_name
                            });

                            // Notify Therapist
                            if (info.therapist_phone) {
                                await sendBookingCancellation({
                                    name: info.therapist_name,
                                    email: info.therapist_email,
                                    phone: info.therapist_phone,
                                    date: formattedDate,
                                    time: info.time,
                                    therapistName: info.therapist_name // Not strictly needed for self but nice for consistency
                                });
                            }
                        }
                    } catch (notifError) {
                        console.error('Failed to send cancellation notification:', notifError);
                    }
                }

                return res.status(200).json(rows[0]);
            } else if (req.method === 'DELETE') {
                await client.query('DELETE FROM appointments WHERE id=$1', [id]);
                return res.status(200).json({ message: 'Deleted successfully' });
            } else {
                res.setHeader('Allow', ['PUT', 'DELETE']);
                return res.status(405).end(`Method ${req.method} Not Allowed`);
            }
        } else {
            // Handle collection operations (GET, POST)
            if (req.method === 'GET') {
                const { therapistId } = req.query;

                let query = `
                    SELECT a.*, p.name as patient_name 
                    FROM appointments a
                    LEFT JOIN patients p ON a.patient_id = p.id
                `;

                const params: any[] = [];
                if (therapistId) {
                    query += ` WHERE a.therapist_id = $1`;
                    params.push(therapistId);
                }

                query += ` ORDER BY a.date ASC, a.time ASC`;

                const { rows } = await client.query(query, params);

                const formatted = rows.map(row => {
                    console.log('Raw date from DB:', row.date, typeof row.date);
                    // Ensure date is YYYY-MM-DD
                    let dateStr = row.date;
                    if (row.date instanceof Date) {
                        dateStr = row.date.toISOString().split('T')[0];
                    } else if (typeof row.date === 'string' && row.date.includes('T')) {
                        dateStr = row.date.split('T')[0];
                    }

                    return {
                        id: row.id.toString(),
                        patientId: row.patient_id.toString(),
                        patientName: row.patient_name,
                        date: dateStr,
                        time: row.time,
                        status: row.status,
                        type: row.type,
                        notes: row.notes
                    };
                });
                return res.status(200).json(formatted);
            } else if (req.method === 'POST') {
                const { patientId, date, time, status, type, notes } = req.body;
                const { rows } = await client.query(
                    'INSERT INTO appointments (patient_id, date, time, status, type, notes) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
                    [patientId, date, time, status, type, notes]
                );
                return res.status(201).json(rows[0]);
            } else {
                res.setHeader('Allow', ['GET', 'POST']);
                return res.status(405).end(`Method ${req.method} Not Allowed`);
            }
        }
    } catch (error: any) {
        console.error('Appointments API Error:', error);
        res.status(500).json({ error: error.message });
    } finally {
        client.release();
        await pool.end();
    }
}
