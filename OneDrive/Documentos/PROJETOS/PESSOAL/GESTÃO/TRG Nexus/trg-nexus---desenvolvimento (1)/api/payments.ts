import Stripe from 'stripe';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Lazy init to avoid build/startup errors if env is missing (though it should be there in prod)
const getStripe = () => {
    if (!process.env.STRIPE_SECRET_KEY) {
        throw new Error('STRIPE_SECRET_KEY is not defined in environment variables');
    }
    return new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: '2024-12-18.acacia' as any,
    });
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { action } = req.query as { action: string }; // ?action=checkout or ?action=intent

    try {
        const stripe = getStripe();
        if (action === 'checkout') {
            const { priceId, successUrl, cancelUrl, mode = 'payment', couponId } = req.body;

            const sessionParams: Stripe.Checkout.SessionCreateParams = {
                payment_method_types: ['card'],
                line_items: [
                    {
                        price: priceId,
                        quantity: 1,
                    },
                ],
                mode: mode as Stripe.Checkout.Session.Mode,
                success_url: successUrl,
                cancel_url: cancelUrl,
            };

            if (couponId) {
                sessionParams.discounts = [{ coupon: couponId }];
            }

            const session = await stripe.checkout.sessions.create(sessionParams);

            return res.status(200).json({ id: session.id, url: session.url });
        }

        else if (action === 'intent') {
            const { amount, currency } = req.body;

            const paymentIntent = await stripe.paymentIntents.create({
                amount,
                currency,
            });

            return res.status(200).json({ clientSecret: paymentIntent.client_secret });
        }

        else if (action === 'check') {
            return res.status(200).json({ status: 'ok', message: 'Stripe Configured Correctly' });
        }

        else {
            return res.status(400).json({ error: 'Invalid action' });
        }

    } catch (err: any) {
        console.error('Stripe Error:', err);
        return res.status(500).json({ statusCode: 500, message: err.message || 'Internal Server Error' });
    }
}
