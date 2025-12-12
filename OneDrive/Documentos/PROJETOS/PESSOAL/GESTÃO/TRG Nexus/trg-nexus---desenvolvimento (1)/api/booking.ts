import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { sendBookingNotification } from './_utils/notifications';

// Initialize Supabase Admin Client (Service Role)
// This is required to perform actions on behalf of the user or public actions that modify restricted tables.
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    if (!supabaseUrl || !supabaseServiceKey) {
        return res.status(500).json({
            error: 'Server Misconfiguration',
            details: 'Missing Supabase URL or Service Role Key'
        });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { name, email, phone, date, time, therapistId, ...anamnesisData } = req.body || {};

    if (!name || !email || !date || !time) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        // 1. Fetch Therapist Details
        let therapistName = 'Terapeuta TRG';
        let therapistEmail = null;

        if (therapistId) {
            const { data: therapist, error: tError } = await supabase
                .from('therapists')
                .select('name, email')
                .eq('id', therapistId)
                .single();

            if (!tError && therapist) {
                therapistName = therapist.name;
                therapistEmail = therapist.email;
            }
        }

        // 2. Handle Patient (Upsert)
        // Check if patient exists by email (for this therapist?)
        // In this multi-tenant model, patients are scoped to therapists.
        // But for public booking, if I book with Therapist A, I am Patient of Therapist A.
        // If I try to book with Therapist A again, I should be found.

        let patientId;

        // Try to find existing patient for this therapist
        const { data: existingPatients } = await supabase
            .from('patients')
            .select('id')
            .eq('email', email)
            .eq('therapist_id', therapistId) // patient is unique per therapist
            .limit(1);

        if (existingPatients && existingPatients.length > 0) {
            patientId = existingPatients[0].id;
            // Update details
            await supabase
                .from('patients')
                .update({ name, phone })
                .eq('id', patientId);
        } else {
            // Create new patient
            const { data: newPatient, error: pError } = await supabase
                .from('patients')
                .insert({
                    name,
                    email,
                    phone,
                    therapist_id: therapistId,
                    status: 'active',
                    notes: `Queixa Principal: ${anamnesisData.queixaPrincipal || 'Não informado'}`
                })
                .select('id')
                .single();

            if (pError) throw pError;
            patientId = newPatient.id;
        }

        // 3. Create Appointment
        const { error: aError } = await supabase
            .from('appointments')
            .insert({
                patient_id: patientId,
                therapist_id: therapistId,
                date,
                time,
                status: 'scheduled',
                type: 'Primeira Consulta',
                notes: JSON.stringify(anamnesisData, null, 2)
            });

        if (aError) throw aError;

        // 4. Send Notifications (Async)
        // Note: Using Service Role allows us to insert notifications if we have a table for it, 
        // but currently we might just send email.

        // (Optional) DB Notification
        /*
        await supabase.from('notifications').insert({
             recipient_id: therapistId,
             title: 'Novo Agendamento',
             message: `${name} agendou para ${date} às ${time}`
        });
        */

        const emailResult = await sendBookingNotification({
            name,
            email,
            phone,
            date,
            time,
            therapistName,
            therapistEmail,
            mainComplaint: anamnesisData.queixaPrincipal
        });

        return res.status(200).json({ message: 'Booking confirmed', patientId, emailResult });

    } catch (error: any) {
        console.error('Booking Error:', error);
        return res.status(500).json({ error: error.message });
    }
}
