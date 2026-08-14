import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { sendEmail } from '@/lib/email/resend';
import { subscriptionExpiringEmailFr } from '@/lib/email/templates';
import { formatDate } from '@/lib/utils/format';

const WARNING_WINDOW_DAYS = 3;

// Destinée à être déclenchée par un planificateur externe (Vercel Cron,
// cron-job.org, etc.) — il n'existe pas de cron intégré en local. Protégée
// par un secret partagé (jamais par la seule origine, puisqu'un
// planificateur externe n'a pas d'origine "same-site"). Vercel Cron envoie
// automatiquement "Authorization: Bearer $CRON_SECRET" dès que cette
// variable d'environnement existe sur le projet ; ?secret= reste accepté
// pour un déclenchement manuel ou via un planificateur tiers (cron-job.org).
export async function GET(request: NextRequest) {
  const bearerSecret = request.headers.get('authorization')?.replace('Bearer ', '');
  const querySecret = request.nextUrl.searchParams.get('secret');
  const providedSecret = bearerSecret || querySecret;
  if (!process.env.CRON_SECRET || providedSecret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  const admin = createAdminClient();
  const now = new Date();
  const windowEnd = new Date(now.getTime() + WARNING_WINDOW_DAYS * 24 * 60 * 60 * 1000);

  const { data: subscriptions } = await admin
    .from('subscriptions')
    .select('id, expires_at, photographers(studio_name, slug, profile_id)')
    .eq('status', 'active')
    .is('expiry_notified_at', null)
    .not('expires_at', 'is', null)
    .lte('expires_at', windowEnd.toISOString())
    .gte('expires_at', now.toISOString());

  let sent = 0;

  for (const sub of subscriptions ?? []) {
    const photographer = (sub as any).photographers;
    const profileId = photographer?.profile_id;
    if (!profileId) continue;

    const { data: authUser } = await admin.auth.admin.getUserById(profileId);
    const email = authUser?.user?.email;
    if (!email) continue;

    await sendEmail({
      to: email,
      subject: 'Votre abonnement Senshoot Sénégal expire bientôt',
      html: subscriptionExpiringEmailFr({
        studioName: photographer.studio_name || photographer.slug,
        expiresOnLabel: formatDate(sub.expires_at),
        plansUrl: `${process.env.NEXT_PUBLIC_APP_URL}/tarifs`,
      }),
    });

    await admin.from('subscriptions').update({ expiry_notified_at: now.toISOString() }).eq('id', sub.id);
    sent++;
  }

  return NextResponse.json({ checked: subscriptions?.length ?? 0, sent });
}
