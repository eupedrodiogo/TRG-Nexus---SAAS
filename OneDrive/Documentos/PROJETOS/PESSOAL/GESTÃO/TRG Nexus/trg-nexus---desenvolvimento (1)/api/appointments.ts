
import { VercelRequest, VercelResponse } from '@vercel/node';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { Appointment } from '../types';
import * as jwt from 'jsonwebtoken';

// Force load .env.local for local dev
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Inlined auth utilities to avoid module resolution issues in Vercel Serverless
const getSecret = () => process.env.SECRET_KEY || 'change-this-secret-in-prod';
function verifyAuth(req: VercelRequest, res: VercelResponse): { id: string; email: string } | null {
    const auth = req.headers['authorization'];
    if (!auth) {
        res.status(401).json({ message: 'Token não fornecido' });
        return null;
    }
    const token = (Array.isArray(auth) ? auth[0] : auth).split(' ')[1];
    try {
        const decoded = jwt.verify(token, getSecret()) as any;
        return decoded;
    } catch {
        res.status(403).json({ message: 'Token inválido' });
        return null;
    }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // 1. Verify Auth First
    const user = verifyAuth(req, res);
    if (!user) return; // verifyAuth handles the error response

    const { id } = req.query;

    const connectionString = process.env.POSTGRES_URL;

    if (!connectionString) {
        return res.status(500).json({ error: 'Database configuration missing (POSTGRES_URL)' });
    }

    const pool = new Pool({
        connectionString,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 5000,
    });

    const client = await pool.connect();

    try {
        if (id) {
            if (req.method === 'PUT') {
                const { date, time, status, type, notes, sessionData } = req.body;

                let dbStatus = status;
                if (status === 'Agendado') dbStatus = 'scheduled';
                if (status === 'Concluído') dbStatus = 'completed';
                if (status === 'Cancelado') dbStatus = 'cancelled';

                const { rows } = await client.query(
                    'UPDATE appointments SET date=$1, time=$2, status=$3, type=$4, notes=$5, session_data=$6 WHERE id=$7 AND therapist_id=$8 RETURNING *',
                    [date, time, dbStatus, type, notes, JSON.stringify(sessionData || {}), id, user.id]
                );



                // Notification logic restored with dynamic import to avoid hoisting issues
                if ((dbStatus === 'cancelled' || status === 'Cancelado') && rows.length > 0) {
                    // Dynamic import to ensure env vars are loaded first
                    const { sendBookingCancellation } = await import('./utils/notifications');

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
                        let dateStr = info.date;
                        if (info.date instanceof Date) dateStr = info.date.toISOString().split('T')[0];

                        const [y, m, d] = dateStr.split('-');
                        const formattedDate = `${d}/${m}/${y}`;

                        await sendBookingCancellation({
                            name: info.patient_name,
                            email: info.patient_email,
                            phone: info.patient_phone,
                            date: formattedDate,
                            time: info.time,
                            therapistName: info.therapist_name
                        });
                    }
                }


                return res.status(200).json(rows[0]);
            } else if (req.method === 'DELETE') {
                await client.query('DELETE FROM appointments WHERE id=$1 AND therapist_id=$2', [id, user.id]);
                return res.status(200).json({ message: 'Deleted successfully' });
            } else {
                res.setHeader('Allow', ['PUT', 'DELETE']);
                return res.status(405).end(`Method ${req.method} Not Allowed`);
            }
        } else {
            // GET / POST
            if (req.method === 'GET') {
                const { therapistId } = req.query;

                let query = `
                    SELECT a.*, p.name as patient_name 
                    FROM appointments a
                    LEFT JOIN patients p ON a.patient_id = p.id
                `;

                const params: any[] = [user.id];
                query += ` WHERE a.therapist_id = $1`;

                query += ` ORDER BY a.date ASC, a.time ASC`;

                const { rows } = await client.query(query, params);

                const formatted = rows.map(row => {
                    let dateStr = row.date;
                    if (row.date instanceof Date) {
                        dateStr = row.date.toISOString().split('T')[0];
                    } else if (typeof row.date === 'string' && row.date.includes('T')) {
                        dateStr = row.date.split('T')[0];
                    }

                    const displayStatus = row.status;

                    return {
                        id: row.id.toString(),
                        patientId: row.patient_id.toString(),
                        patientName: row.patient_name || 'Desconhecido',
                        date: dateStr,
                        time: row.time,
                        status: displayStatus,
                        type: row.type,
                        notes: row.notes,
                        sessionData: row.session_data || {}
                    } as Appointment;
                });
                return res.status(200).json(formatted);
            } else if (req.method === 'POST') {
                const { patientId, date, time, status, type, notes, sessionData } = req.body;

                let dbStatus = status;
                if (status === 'Agendado') dbStatus = 'scheduled';

                const { rows } = await client.query(
                    'INSERT INTO appointments (patient_id, date, time, status, type, notes, session_data, therapist_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
                    [patientId, date, time, dbStatus, type, notes, JSON.stringify(sessionData || {}), user.id]
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
