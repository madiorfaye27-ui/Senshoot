import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/server';
import { isAuthorizedOrigin } from '@/lib/auth/resolveRequestUser';
import { checkRateLimit } from '@/lib/utils/rate-limit';
import { sendEmail } from '@/lib/email/resend';
import { bookingRequestEmailFr } from '@/lib/email/templates';
import { formatDate } from '@/lib/utils/format';

const EVENT_CATEGORIES = [
  'mariage', 'bapteme', 'anniversaire', 'conference', 'concert', 'festival',
  'sport', 'professionnel', 'remise_diplomes', 'scolaire', 'institutionnel',
  'shooting', 'autre',
] as const;

const bookingSchema = z.object({
  photographer_id: z.string().uuid(),
  event_date: z.string().date(),
  event_category: z.enum(EVENT_CATEGORIES).optional(),
  client_name: z.string().trim().min(1).max(150),
  client_email: z.string().trim().email(),
  client_whatsapp: z.string().trim().max(30).optional(),
  message: z.string().trim().max(1000).optional(),
});

// Formulaire public, sans compte requis (même logique que l'achat de
// photos invité, migration 0016) : n'importe quel visiteur de la fiche
// d'un photographe peut demander une date. Le taux limité protège
// contre le spam d'un endpoint non authentifié.
export async function POST(request: NextRequest) {
  if (!isAuthorizedOrigin(request, false)) {
    return NextResponse.json({ error: 'Requête refusée' }, { status: 403 });
  }

  const rate = checkRateLimit(request, 'booking-requests', 10, 60_000);
  if (!rate.allowed) {
    return NextResponse.json({ error: 'Trop de requêtes, réessayez plus tard.' }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const parsed = bookingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Formulaire invalide' }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: photographer } = await admin
    .from('photographers')
    .select('id, profile_id, studio_name, contact_whatsapp')
    .eq('id', parsed.data.photographer_id)
    .eq('status', 'validated')
    .single();

  if (!photographer) {
    return NextResponse.json({ error: 'Photographe introuvable' }, { status: 404 });
  }

  const { data: booking, error } = await admin
    .from('booking_requests')
    .insert({
      photographer_id: photographer.id,
      event_date: parsed.data.event_date,
      event_category: parsed.data.event_category ?? null,
      client_name: parsed.data.client_name,
      client_email: parsed.data.client_email,
      client_whatsapp: parsed.data.client_whatsapp || null,
      message: parsed.data.message || null,
    })
    .select('id')
    .single();

  if (error || !booking) {
    return NextResponse.json({ error: 'Impossible de créer la demande' }, { status: 400 });
  }

  void notifyPhotographer(admin, photographer, parsed.data);

  return NextResponse.json({
    success: true,
    photographer_whatsapp: photographer.contact_whatsapp || null,
  });
}

async function notifyPhotographer(
  admin: ReturnType<typeof createAdminClient>,
  photographer: { profile_id: string; studio_name: string | null },
  data: z.infer<typeof bookingSchema>
) {
  try {
    const { data: authUser } = await admin.auth.admin.getUserById(photographer.profile_id);
    const email = authUser?.user?.email;
    if (!email) return;

    await sendEmail({
      to: email,
      subject: `Nouvelle demande de réservation — ${data.client_name}`,
      html: bookingRequestEmailFr({
        clientName: data.client_name,
        clientEmail: data.client_email,
        clientWhatsapp: data.client_whatsapp || null,
        eventDateLabel: formatDate(data.event_date),
        categoryLabel: data.event_category ?? '—',
        message: data.message || null,
        dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/reservations`,
      }),
    });
  } catch (err) {
    console.error('[email] Échec de la notification de demande de réservation', err);
  }
}
