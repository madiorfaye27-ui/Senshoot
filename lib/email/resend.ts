import { Resend } from 'resend';

const FROM = process.env.EMAIL_FROM || 'Senshoot Sénégal <onboarding@resend.dev>';

let client: Resend | null = null;

function getClient(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  if (!client) client = new Resend(process.env.RESEND_API_KEY);
  return client;
}

// Ne fait jamais échouer l'appelant : un email raté (clé absente, quota
// dépassé, provider en panne) ne doit jamais bloquer une inscription ou
// la confirmation d'un paiement déjà encaissé.
export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  const resend = getClient();
  if (!resend) {
    console.warn(`[email] RESEND_API_KEY absente, email non envoyé : "${subject}" → ${to}`);
    return;
  }

  try {
    // Le SDK Resend ne lève pas d'exception sur une erreur API (422, quota
    // dépassé...) : elle est renvoyée dans `error`, pas dans une exception.
    const { error } = await resend.emails.send({ from: FROM, to, subject, html });
    if (error) {
      console.error(`[email] Échec d'envoi "${subject}" → ${to}`, error);
    }
  } catch (err) {
    console.error(`[email] Échec d'envoi "${subject}" → ${to}`, err);
  }
}
