import { kkiapay } from '@kkiapay-org/nodejs-sdk';

const client = kkiapay({
  privatekey: process.env.KKIAPAY_PRIVATE_KEY!,
  publickey: process.env.NEXT_PUBLIC_KKIAPAY_PUBLIC_KEY!,
  secretkey: process.env.KKIAPAY_SECRET_KEY!,
  sandbox: process.env.NEXT_PUBLIC_KKIAPAY_SANDBOX !== 'false',
});

// KKiaPay n'envoie pas de webhook signé de façon fiable (contrairement à
// Stripe) : la seule vérification de confiance est de rappeler leur API
// avec NOS PROPRES clés serveur pour connaître le statut réel de la
// transaction — jamais se fier au seul retour du widget côté navigateur.
export async function verifyKkiapayTransaction(transactionId: string) {
  const data = await client.verify(transactionId);
  return {
    success: data.status === 'SUCCESS' || data.isPaymentSucces === true,
    amount: data.amount as number,
    raw: data,
  };
}
