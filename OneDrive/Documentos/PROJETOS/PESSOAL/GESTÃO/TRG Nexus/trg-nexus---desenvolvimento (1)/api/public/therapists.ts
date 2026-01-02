import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    if (!supabaseUrl || !supabaseServiceKey) {
        return res.status(500).json({ error: 'Server Misconfiguration' });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    try {
        // Fetch only active therapists and select safe public fields
        const { data: therapists, error } = await supabase
            .from('therapists')
            .select(`
                id,
                name,
                bio,
                photo_url,
                specialties,
                citrg_code,
                rating,
                review_count,
                appointments_count,
                price,
                currency,
                session_duration,
                is_verified
            `)
            .eq('status', 'active');

        if (error) throw error;

        return res.status(200).json({ therapists: therapists || [] });

    } catch (error: any) {
        console.error('Error fetching therapists:', error);
        return res.status(500).json({ error: error.message });
    }
}
