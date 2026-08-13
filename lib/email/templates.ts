function wrapper(bodyHtml: string): string {
  return `
  <div style="font-family: -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; color: #1e293b;">
    <p style="font-size: 18px; font-weight: 700; color: #0f766e; margin: 0 0 24px;">
      Senshoot <span style="color: #ea580c;">Sénégal</span>
    </p>
    ${bodyHtml}
    <p style="margin-top: 32px; font-size: 12px; color: #94a3b8;">
      Senshoot Sénégal — Dakar, Sénégal
    </p>
  </div>`;
}

function button(url: string, label: string): string {
  return `<a href="${url}" style="display: inline-block; margin-top: 20px; padding: 12px 24px; background: #ea580c; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px;">${label}</a>`;
}

export function welcomeEmailFr({ firstName, isPhotographer }: { firstName: string; isPhotographer: boolean }) {
  return wrapper(`
    <h1 style="font-size: 20px; margin: 0 0 12px;">Bienvenue, ${firstName} 👋</h1>
    <p style="font-size: 14px; line-height: 1.6; color: #475569;">
      Votre compte Senshoot Sénégal a bien été créé.
      ${isPhotographer
        ? "Complétez votre profil public et créez votre premier événement pour générer un QR Code."
        : "Scannez le QR Code d'un événement pour retrouver et acheter vos photos."}
    </p>
  `);
}

export function welcomeEmailEn({ firstName, isPhotographer }: { firstName: string; isPhotographer: boolean }) {
  return wrapper(`
    <h1 style="font-size: 20px; margin: 0 0 12px;">Welcome, ${firstName} 👋</h1>
    <p style="font-size: 14px; line-height: 1.6; color: #475569;">
      Your Senshoot Sénégal account has been created.
      ${isPhotographer
        ? 'Complete your public profile and create your first event to generate a QR code.'
        : "Scan an event's QR code to find and buy your photos."}
    </p>
  `);
}

export function orderPaidEmailFr({
  orderNumber,
  totalLabel,
  accessUrl,
}: {
  orderNumber: string;
  totalLabel: string;
  accessUrl: string;
}) {
  return wrapper(`
    <h1 style="font-size: 20px; margin: 0 0 12px;">Paiement confirmé ✅</h1>
    <p style="font-size: 14px; line-height: 1.6; color: #475569;">
      Votre commande <strong>${orderNumber}</strong> (${totalLabel}) a bien été payée.
      Vos photos sont prêtes à télécharger via le lien ci-dessous.
    </p>
    ${button(accessUrl, 'Accéder à mes photos')}
    <p style="margin-top: 16px; font-size: 12px; color: #94a3b8;">Lien à usage unique — vos photos restent aussi accessibles depuis votre compte.</p>
  `);
}

export function orderPaidEmailEn({
  orderNumber,
  totalLabel,
  accessUrl,
}: {
  orderNumber: string;
  totalLabel: string;
  accessUrl: string;
}) {
  return wrapper(`
    <h1 style="font-size: 20px; margin: 0 0 12px;">Payment confirmed ✅</h1>
    <p style="font-size: 14px; line-height: 1.6; color: #475569;">
      Your order <strong>${orderNumber}</strong> (${totalLabel}) has been paid.
      Your photos are ready to download via the link below.
    </p>
    ${button(accessUrl, 'Access my photos')}
    <p style="margin-top: 16px; font-size: 12px; color: #94a3b8;">Single-use link — your photos also remain accessible from your account.</p>
  `);
}

export function bookingRequestEmailFr({
  clientName,
  clientEmail,
  clientWhatsapp,
  eventDateLabel,
  categoryLabel,
  message,
  dashboardUrl,
}: {
  clientName: string;
  clientEmail: string;
  clientWhatsapp: string | null;
  eventDateLabel: string;
  categoryLabel: string;
  message: string | null;
  dashboardUrl: string;
}) {
  return wrapper(`
    <h1 style="font-size: 20px; margin: 0 0 12px;">Nouvelle demande de réservation 📅</h1>
    <p style="font-size: 14px; line-height: 1.6; color: #475569;">
      <strong>${clientName}</strong> souhaite réserver vos services pour le <strong>${eventDateLabel}</strong> (${categoryLabel}).
    </p>
    <p style="font-size: 14px; line-height: 1.6; color: #475569;">
      Contact : ${clientEmail}${clientWhatsapp ? ` · WhatsApp : ${clientWhatsapp}` : ''}
    </p>
    ${message ? `<p style="font-size: 14px; line-height: 1.6; color: #475569; font-style: italic;">« ${message} »</p>` : ''}
    ${button(dashboardUrl, 'Voir la demande')}
  `);
}

export function subscriptionActivatedEmailFr({
  planName,
  amountLabel,
}: {
  planName: string;
  amountLabel: string;
}) {
  return wrapper(`
    <h1 style="font-size: 20px; margin: 0 0 12px;">Abonnement activé ✅</h1>
    <p style="font-size: 14px; line-height: 1.6; color: #475569;">
      Votre formule <strong>${planName}</strong> (${amountLabel}) est active pour 30 jours.
      Vous en profiterez notamment d'une meilleure commission sur vos ventes.
    </p>
  `);
}

export function subscriptionExpiringEmailFr({
  studioName,
  expiresOnLabel,
  plansUrl,
}: {
  studioName: string;
  expiresOnLabel: string;
  plansUrl: string;
}) {
  return wrapper(`
    <h1 style="font-size: 20px; margin: 0 0 12px;">Votre abonnement expire bientôt</h1>
    <p style="font-size: 14px; line-height: 1.6; color: #475569;">
      Bonjour ${studioName}, votre abonnement Senshoot Sénégal expire le <strong>${expiresOnLabel}</strong>.
      Renouvelez-le pour continuer à recevoir des paiements sans interruption.
    </p>
    ${button(plansUrl, 'Voir les formules')}
  `);
}

export function payoutProcessedEmailFr({
  amountLabel,
  status,
  adminNote,
}: {
  amountLabel: string;
  status: 'completed' | 'rejected';
  adminNote: string | null;
}) {
  return wrapper(
    status === 'completed'
      ? `
        <h1 style="font-size: 20px; margin: 0 0 12px;">Retrait effectué ✅</h1>
        <p style="font-size: 14px; line-height: 1.6; color: #475569;">
          Votre demande de retrait de <strong>${amountLabel}</strong> a été payée.
        </p>
      `
      : `
        <h1 style="font-size: 20px; margin: 0 0 12px;">Retrait rejeté</h1>
        <p style="font-size: 14px; line-height: 1.6; color: #475569;">
          Votre demande de retrait de <strong>${amountLabel}</strong> a été rejetée.
          ${adminNote ? `Motif : ${adminNote}` : ''}
          Le montant reste disponible dans votre solde.
        </p>
      `
  );
}

export function subscriptionExpiringEmailEn({
  studioName,
  expiresOnLabel,
  plansUrl,
}: {
  studioName: string;
  expiresOnLabel: string;
  plansUrl: string;
}) {
  return wrapper(`
    <h1 style="font-size: 20px; margin: 0 0 12px;">Your subscription is expiring soon</h1>
    <p style="font-size: 14px; line-height: 1.6; color: #475569;">
      Hi ${studioName}, your Senshoot Sénégal subscription expires on <strong>${expiresOnLabel}</strong>.
      Renew it to keep receiving payments without interruption.
    </p>
    ${button(plansUrl, 'See plans')}
  `);
}
