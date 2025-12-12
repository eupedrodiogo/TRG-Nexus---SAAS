import nodemailer from 'nodemailer';
import twilio from 'twilio';

interface BookingNotificationData {
    name: string;
    email: string;
    phone: string;
    date: string;
    time: string;
    therapistName?: string;
    therapistEmail?: string | null;
    mainComplaint?: string;
    location?: string;
}

export async function sendBookingNotification(data: BookingNotificationData) {
    console.log('Preparing to send notifications for:', data.email);
    let result = { status: 'pending', error: null, info: null };


    // 1. Email Notification - Setup Transporter
    try {
        if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
            console.warn('SMTP credentials not found. Skipping email sending.');
            result.status = 'skipped_no_credentials';
        } else {
            const port = Number(process.env.SMTP_PORT) || 587;
            const host = (process.env.SMTP_HOST || '').trim();
            const user = (process.env.SMTP_USER || '').trim();
            const pass = (process.env.SMTP_PASS || '').trim();

            const transporter = nodemailer.createTransport({
                host: host,
                port: port,
                secure: port === 465, // True for 465, false for other ports
                auth: {
                    user: user,
                    pass: pass,
                },
            });

            // Verify connection (optional, but good for debugging logs)
            // await transporter.verify(); 

            // Send Client Email
            const mailOptions = {
                from: '"TRG Nexus" <noreply@trgnexus.com>',
                to: data.email,
                subject: 'Confirmação de Agendamento - TRG Nexus',
                html: `
                    <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
                        <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
                            <h2 style="color: #0f172a; margin: 0;">Agendamento Confirmado!</h2>
                        </div>
                        <div style="padding: 20px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 10px 10px;">
                            <p>Olá, <strong>${data.name}</strong>,</p>
                            <p>Seu agendamento foi realizado com sucesso. Abaixo estão os detalhes da sua sessão:</p>
                            
                            <div style="background-color: #f1f5f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
                                <p style="margin: 5px 0;"><strong>Data:</strong> ${data.date}</p>
                                <p style="margin: 5px 0;"><strong>Horário:</strong> ${data.time}</p>
                                <p style="margin: 5px 0;"><strong>Terapeuta:</strong> ${data.therapistName || 'TRG Nexus'}</p>
                            </div>

                            <h3>Informações Importantes</h3>
                            <ul>
                                <li><strong>Cancelamento:</strong> Cancelamentos devem ser feitos com pelo menos 24 horas de antecedência. Cancelamentos tardios podem estar sujeitos a uma taxa de 50% do valor da sessão.</li>
                                <li><strong>Pontualidade:</strong> Recomendamos entrar na sala de espera virtual 5 minutos antes do horário agendado.</li>
                                <li><strong>Ambiente:</strong> Escolha um local tranquilo, privado e com boa conexão de internet.</li>
                            </ul>

                            <p style="margin-top: 30px;">Se tiver dúvidas, entre em contato conosco pelo WhatsApp.</p>
                            
                            <p style="font-size: 12px; color: #64748b; margin-top: 30px; text-align: center;">
                                © ${new Date().getFullYear()} TRG Nexus. Todos os direitos reservados.
                            </p>
                        </div>
                    </div>
                `
            };

            const info = await transporter.sendMail(mailOptions);
            console.log('Client Email sent:', info.messageId);
            result.status = 'sent';
            result.info = info as any;

            // Send Therapist Email (Reuse transporter)
            if (data.therapistEmail) {
                const therapistHtml = `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <meta charset="utf-8">
                        <title>Novo Agendamento</title>
                    </head>
                    <body style="font-family: 'Segoe UI', sans-serif; background-color: #f8fafc; padding: 20px;">
                        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); overflow: hidden;">
                            <div style="background-color: #3b82f6; padding: 24px; text-align: center;">
                                <h1 style="color: #ffffff; margin: 0; font-size: 22px;">📅 Novo Agendamento Recebido</h1>
                            </div>
                            <div style="padding: 32px;">
                                <p style="color: #334155; font-size: 16px;">Olá, <strong>${data.therapistName || 'Terapeuta'}</strong>!</p>
                                <p style="color: #334155;">Você tem um novo agendamento confirmado na sua agenda.</p>
                                
                                <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 20px; margin: 24px 0;">
                                    <p style="margin: 0 0 8px 0;"><strong>Cliente:</strong> ${data.name}</p>
                                    <p style="margin: 0 0 8px 0;"><strong>Data:</strong> ${data.date}</p>
                                    <p style="margin: 0 0 8px 0;"><strong>Horário:</strong> ${data.time}</p>
                                    <p style="margin: 0 0 8px 0;"><strong>Telefone:</strong> ${data.phone}</p>
                                    <p style="margin: 0;"><strong>Queixa:</strong> ${data.mainComplaint || 'Não informada'}</p>
                                </div>

                                <div style="text-align: center; margin-top: 32px;">
                                    <a href="https://trg-nexus.vercel.app/dashboard" style="background-color: #3b82f6; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600;">
                                        Ver na Minha Agenda
                                    </a>
                                </div>
                            </div>
                        </div>
                    </body>
                    </html>
                `;

                await transporter.sendMail({
                    from: '"TRG Nexus System" <noreply@trgnexus.com>',
                    to: data.therapistEmail,
                    subject: `📅 Novo Agendamento: ${data.name}`,
                    html: therapistHtml
                });
                console.log('Therapist email sent.');
            }
        }
    } catch (error: any) {
        console.error('Error sending email:', error);
        result.status = 'error';
        result.error = error.message || error;
    }

    // 2. WhatsApp Notification (Twilio)
    try {
        const twilioSid = (process.env.TWILIO_ACCOUNT_SID || '').trim();
        const twilioToken = (process.env.TWILIO_AUTH_TOKEN || '').trim();
        const twilioFrom = (process.env.TWILIO_PHONE_NUMBER || '').trim();

        if (twilioSid && twilioToken && twilioFrom) {
            const client = twilio(twilioSid, twilioToken);
            const { isReminder, type, therapistPhone } = data as any; // Extended properties

            // Helper to format phone
            const formatPhone = (p: string) => {
                let cleaned = p.replace(/\D/g, '');
                if (!cleaned.startsWith('55') && cleaned.length <= 11) cleaned = '55' + cleaned;
                return `whatsapp:+${cleaned}`;
            };

            const messagesToSend = [];

            // A. Patient Message
            if (data.phone) {
                let body = '';
                if (type === 'referral_offer') {
                    // Patient doesn't get referral offer, only Target Therapist does.
                } else if (isReminder) {
                    body = `🔔 *Lembrete TRG Nexus*\n\nOlá ${data.name}, passando para lembrar da sua consulta amanhã!\n\n📅 ${data.date} às ${data.time}\n👨‍⚕️ ${data.therapistName || 'Especialista TRG'}`;
                } else {
                    body = `✅ *Agendamento Confirmado*\n\nOlá ${data.name}, seu agendamento na TRG Nexus está confirmado!\n\n📅 ${data.date} às ${data.time}\n👨‍⚕️ ${data.therapistName || 'Especialista TRG'}\n\nRecomendamos entrar 5 minutos antes.`;
                }

                if (body) {
                    messagesToSend.push({ to: formatPhone(data.phone), body });
                }
            }

            // B. Therapist Message (New Feature)
            // If it's a booking, notify the therapist. If it's a referral offer, satisfy that too.
            if (therapistPhone) {
                let tBody = '';
                if (type === 'referral_offer') {
                    tBody = `🚀 *Oportunidade de Transbordo*\n\nVocê tem uma nova indicação disponível!\n\nNome: ${data.name}\nValor: R$ ${data.mainComplaint || '0,00'}\n\nAcesse o painel para aceitar.`;
                } else if (!isReminder) {
                    // Default Booking Notification for Therapist
                    tBody = `📅 *Novo Agendamento*\n\nPaciente: ${data.name}\nData: ${data.date} - ${data.time}\n\nVerifique sua agenda no TRG Nexus.`;
                }

                if (tBody) {
                    messagesToSend.push({ to: formatPhone(therapistPhone), body: tBody });
                }
            }

            // Send All Messages
            for (const msg of messagesToSend) {
                console.log(`Sending WhatsApp to ${msg.to}...`);
                await client.messages.create({
                    from: twilioFrom,
                    to: msg.to,
                    body: msg.body
                });
            }

            result.status = 'sent_whatsapp_multiple';
        } else {
            console.log('Twilio credentials missing. Skipping WhatsApp.');
        }
    } catch (error: any) {
        console.error('Error sending WhatsApp (Twilio):', error);
    }

    return result;
}
