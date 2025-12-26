
import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';
import twilio from 'twilio';
import { sendMetaWhatsApp } from '../_utils/notifications';

// Helper function to generate email template (inlined for safety)
const getEmailTemplate = (plan: string, name: string) => {
    const primaryColor = '#0f172a';
    const accentColor = '#3b82f6';
    const footerColor = '#64748b';
    const loginUrl = `${process.env.VITE_APP_URL || 'https://trg-nexus-saas.vercel.app'}/login`;

    let title, subject, content;

    // Simplified template logic for brevity - using the main one
    switch (plan) {
        case 'price_1SZgFjKPo7EypB7V8hI35TpO': // Profissional
        case 'price_1Sd8DXKPo7EypB7VZwytTUEP':
        case 'profissional':
        case 'pro':
            subject = 'Elite TRG: Bem-vindo ao Nexus Profissional 💎';
            title = 'Alta Performance Ativada';
            content = `
                <p style="font-size: 18px;">Olá, <strong>${name}</strong>!</p>
                <p>Você acaba de entrar para o grupo dos terapeutas que levam a gestão a sério. O <strong>Plano Profissional</strong> é a nossa experiência completa.</p>
                <p>Sua conta foi criada com sucesso. Use seu email e senha para acessar.</p>
                <div style="text-align: center;">
                    <a href="${loginUrl}" style="display: inline-block; background-color: ${accentColor}; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 24px;">Fazer Login no Painel</a>
                </div>
            `;
            break;
        default:
            subject = 'Bem-vindo ao TRG Nexus! 🚀';
            title = 'Seu acesso chegou';
            content = `
                <p style="font-size: 18px;">Olá, <strong>${name}</strong>!</p>
                <p>Seu cadastro foi realizado com sucesso.</p>
                <p>Use seu email e senha cadastrados para acessar o sistema.</p>
                <div style="text-align: center;">
                    <a href="${loginUrl}" style="display: inline-block; background-color: ${accentColor}; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 24px;">Acessar Sistema</a>
                </div>
            `;
    }

    // Fallback HTML structure
    return {
        subject,
        html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
                <div style="background-color: ${primaryColor}; padding: 32px; text-align: center;">
                    <h1 style="color: white; margin: 0;">TRG <span style="color: ${accentColor}">Nexus</span></h1>
                </div>
                <div style="padding: 40px 32px; color: #334155; line-height: 1.6;">
                    <h2 style="color: ${primaryColor}; margin-top: 0;">${title}</h2>
                    ${content}
                    <p style="margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 20px; font-size: 12px; color: ${footerColor}; text-align: center;">
                        Enviado por TRG Nexus.<br>Se você não solicitou, ignore este email.
                    </p>
                </div>
            </div>
        `
    };
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { email, name, phone, password, plan } = req.body;

    if (!email || !name || !phone || !password) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        // 1. Initialize Supabase Admin
        const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

        if (!supabaseUrl || !supabaseKey) {
            throw new Error('Supabase Configuration missing in environment variables');
        }

        const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

        // Phone Formatting (E.164 Standard)
        let formattedPhone = phone.replace(/\D/g, '');
        if (!formattedPhone.startsWith('55') && formattedPhone.length <= 11) {
            formattedPhone = '55' + formattedPhone;
        }
        const finalPhone = '+' + formattedPhone;

        // --- DEBUG / UNBLOCKER LOGIC ---
        // Force delete specific test users if they exist to allow fresh registration
        if (['pedrodiogo.suporte@gmail.com', 'resignificamulher@gmail.com', 'pedrodiogo.mello@gmail.com'].includes(email)) {
            console.log(`[Force Reset] Checking existence for test user: ${email}`);
            const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers();
            if (!listError && users.users) {
                const target = users.users.find((u: any) => u.email === email);
                if (target) {
                    console.log(`[Force Reset] Deleting test user ${target.id}`);
                    await supabaseAdmin.auth.admin.deleteUser(target.id);
                }
            }
        }
        // -------------------------------

        // 2. Create User (Strict Mode)
        const { data: user, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email,
            phone: finalPhone,
            password: password,
            user_metadata: { name, phone: finalPhone, plan },
            email_confirm: true,
            phone_confirm: true
        });

        if (createError) {
            console.error('Supabase createUser Error:', createError);
            throw createError;
        }

        console.log('User created successfully:', user.user.id);

        // 3. Send Custom Email
        const port = Number(process.env.SMTP_PORT) || 587;
        const host = (process.env.SMTP_HOST || '').trim();
        const smtpUser = (process.env.SMTP_USER || '').trim();
        const smtpPass = (process.env.SMTP_PASS || '').trim();

        if (host && smtpUser && smtpPass) {
            try {
                const transporter = nodemailer.createTransport({
                    host: host,
                    port,
                    secure: port === 465,
                    auth: {
                        user: smtpUser,
                        pass: smtpPass,
                    },
                });

                const { subject, html } = getEmailTemplate(plan || 'pro', name);
                await transporter.sendMail({
                    from: `"TRG Nexus" <${process.env.SMTP_USER}>`,
                    to: email,
                    subject,
                    html,
                });
            } catch (emailError: any) {
                console.error("Email sending failed:", emailError);
            }
        }

        // 4. Send WhatsApp
        try {
            // Priority: Meta Cloud API (Official & Free Tier)
            if (process.env.META_WHATSAPP_TOKEN && process.env.META_PHONE_ID) {
                console.log('Sending WhatsApp via Meta Cloud API...');
                // Uses 'hello_world' template for verified numbers in Dev Mode
                const { success, error } = await sendMetaWhatsApp(finalPhone, 'hello_world', 'en_US');
                if (!success) console.error('Meta Send Failed:', error);
            }
            // Legacy Fallback: Twilio
            else {
                const twilioSid = process.env.TWILIO_ACCOUNT_SID;
                const twilioToken = process.env.TWILIO_AUTH_TOKEN;
                const twilioFrom = process.env.TWILIO_PHONE_NUMBER;

                if (twilioSid && twilioToken && twilioFrom) {
                    const client = twilio(twilioSid, twilioToken);
                    const templateSid = process.env.TWILIO_TEMPLATE_SID;

                    if (templateSid) {
                        console.log('Sending WhatsApp using Twilio Template:', templateSid);
                        await client.messages.create({
                            from: twilioFrom.startsWith('whatsapp:') ? twilioFrom : `whatsapp:${twilioFrom}`,
                            to: `whatsapp:${finalPhone}`,
                            contentSid: templateSid,
                            contentVariables: JSON.stringify({
                                "1": name,
                                "2": "https://trg-nexus-saas.vercel.app/login"
                            })
                        });
                    } else {
                        await client.messages.create({
                            from: twilioFrom.startsWith('whatsapp:') ? twilioFrom : `whatsapp:${twilioFrom}`,
                            to: `whatsapp:${finalPhone}`,
                            body: `🌟 *Bem-vindo(a) ao TRG Nexus!*\n\nOlá ${name}, seu cadastro foi realizado com sucesso! 🚀\n\nAcesse https://trg-nexus-saas.vercel.app/login e use seu email e senha para entrar.\n\n_Equipe TRG Nexus_`
                        });
                    }
                }
            }
        } catch (waError) {
            console.error('WhatsApp failed:', waError);
        }

        return res.status(200).json({ success: true, message: 'Registration complete' });

    } catch (error: any) {
        console.error('Registration error:', error);
        return res.status(500).json({ error: error.message });
    }
}
