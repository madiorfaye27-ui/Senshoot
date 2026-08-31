import { Link } from '@/i18n/navigation';
import { getTranslations } from 'next-intl/server';
import Reveal from '@/components/ui/Reveal';
import { createClient } from '@/lib/supabase/server';

export default async function HomePage() {
  const t = await getTranslations('HomePage');
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: photographers } = await supabase
    .from('photographers')
    .select('slug, studio_name, description, city, contact_phone, contact_whatsapp, logo_url')
    .eq('status', 'validated')
    .not('studio_name', 'is', null)
    .neq('studio_name', '')
    .limit(3);

  const steps = [t('step1'), t('step2'), t('step3'), t('step4'), t('step5')];

  return (
    <>
      {/* Hero — entrée orchestrée au chargement (pas au scroll, car visible
          immédiatement) : le titre, le texte puis les boutons apparaissent
          en cascade avec un léger décalage. */}
      <section className="relative overflow-hidden bg-gradient-to-b from-sn-teal/5 to-white dark:from-slate-800 dark:to-slate-900">
        {/* Halo décoratif discret, animation "float" lente en ambiance */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 right-[-10%] h-72 w-72 animate-float rounded-full bg-sn-orange/10 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-24 left-[-10%] h-72 w-72 animate-float rounded-full bg-sn-teal/10 blur-3xl [animation-delay:1.5s]"
        />

        <div className="container-sn relative flex flex-col items-center py-20 text-center">
          <h1 className="max-w-3xl animate-fade-up text-4xl font-extrabold leading-tight text-sn-slate dark:text-white sm:text-5xl">
            {t('heroTitle1')}
            <span className="block text-sn-orange">{t('heroTitle2')}</span>
          </h1>
          <p className="mt-6 max-w-xl animate-fade-up text-lg text-gray-600 dark:text-gray-400 [animation-delay:150ms]">
            {t('heroSubtitle')}
          </p>
          <div className="mt-8 flex animate-fade-up flex-col gap-4 [animation-delay:300ms] sm:flex-row">
            <Link href="/galeries" className="btn-primary">
              {t('findMyPhotos')}
            </Link>
            {!user && (
              <Link href="/register" className="btn-secondary">
                {t('iAmPhotographer')}
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Parcours — révélation en cascade au scroll : chaque étape apparaît
          légèrement après la précédente, pour souligner l'idée de séquence. */}
      <section className="container-sn py-16">
        <Reveal>
          <h2 className="text-center text-2xl font-bold text-sn-slate dark:text-white">
            {t('howItWorksTitle')}
          </h2>
        </Reveal>
        <div className="mt-10 grid gap-6 sm:grid-cols-5">
          {steps.map((step, i) => (
            <Reveal key={step} delay={i * 100}>
              <div className="card-hover h-full rounded-xl border border-gray-100 bg-white p-5 text-center shadow-sm dark:border-white/10 dark:bg-slate-800">
                <div className="mx-auto mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-sn-orange font-bold text-white">
                  {i + 1}
                </div>
                <p className="text-sm font-medium text-sn-slate dark:text-gray-200">{step}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Annuaire — un aperçu de photographes trouvables directement depuis
          l'accueil, avec leurs contacts, pour les clients qui cherchent un
          photographe pour leur événement (pas seulement ceux qui ont déjà
          un QR Code en main). */}
      {!!photographers?.length && (
        <section className="container-sn py-16">
          <Reveal>
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-sn-slate dark:text-white">{t('ourPhotographers')}</h2>
              <Link href="/photographes" className="text-sm font-medium text-sn-orange">
                {t('seeAll')}
              </Link>
            </div>
          </Reveal>
          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            {photographers.map((p, i) => (
              <Reveal key={p.slug} delay={i * 100}>
                <Link
                  href={`/photographe/${p.slug}`}
                  className="card-hover surface-card block h-full rounded-xl p-5 shadow-sm hover:border-sn-orange"
                >
                  <div className="flex items-center gap-3">
                    {p.logo_url ? (
                      <img
                        src={p.logo_url}
                        alt={p.studio_name || 'Photographe'}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-10 w-10 shrink-0 rounded-full bg-sn-teal/10" />
                    )}
                    <p className="font-semibold text-sn-slate dark:text-white">
                      {p.studio_name || 'Photographe'}
                    </p>
                  </div>
                  {p.city && <p className="mt-1 text-xs text-sn-teal">{p.city}</p>}
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                    {p.description}
                  </p>
                  {(p.contact_whatsapp || p.contact_phone) && (
                    <p className="mt-3 text-xs font-medium text-sn-orange">
                      {p.contact_whatsapp || p.contact_phone}
                    </p>
                  )}
                </Link>
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {/* CTA final */}
      {!user && (
        <Reveal>
          <section className="bg-sn-teal py-16 text-center text-white">
            <p className="text-2xl font-bold">{t('ctaTagline')}</p>
            <Link href="/register" className="btn-primary mt-6 inline-flex">
              {t('createPhotographerAccount')}
            </Link>
          </section>
        </Reveal>
      )}
    </>
  );
}
