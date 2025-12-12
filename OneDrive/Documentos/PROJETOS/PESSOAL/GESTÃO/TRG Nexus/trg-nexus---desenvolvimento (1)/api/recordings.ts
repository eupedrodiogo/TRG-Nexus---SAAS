import { put } from '@vercel/blob';
import { sql } from '@vercel/postgres';

export const config = {
    api: {
        bodyParser: false,
    },
};

export default async function handler(req, res) {
    const { method } = req;

    if (method === 'GET') {
        // LIST RECORDINGS
        const { patientId } = req.query;

        if (!patientId) {
            return res.status(400).json({ error: 'Patient ID is required' });
        }

        try {
            const { rows } = await sql`
        SELECT * FROM recordings 
        WHERE patient_id = ${patientId} 
        ORDER BY created_at DESC
      `;
            return res.status(200).json(rows);
        } catch (error) {
            console.error('List recordings error:', error);
            return res.status(500).json({ error: error.message });
        }
    }

    else if (method === 'POST') {
        // UPLOAD RECORDING
        try {
            const { searchParams } = new URL(req.url, `http://${req.headers.host}`);
            const filename = searchParams.get('filename') || 'recording.webm';
            const patientId = searchParams.get('patientId');
            const duration = searchParams.get('duration');
            const size = searchParams.get('size');
            const phase = searchParams.get('phase');

            if (!process.env.BLOB_READ_WRITE_TOKEN) {
                throw new Error('BLOB_READ_WRITE_TOKEN is not defined');
            }

            // Upload to Vercel Blob
            const blob = await put(filename, req, {
                access: 'public',
            });

            // Save metadata to Postgres
            if (patientId) {
                await sql`
              INSERT INTO recordings (patient_id, url, filename, size, duration, phase, type)
              VALUES (${patientId}, ${blob.url}, ${filename}, ${size}, ${duration}, ${phase}, 'video')
          `;
            }

            return res.status(200).json(blob);
        } catch (error) {
            console.error('Upload error:', error);
            return res.status(500).json({ error: error.message });
        }
    }

    else {
        return res.status(405).json({ error: 'Method not allowed' });
    }
}
