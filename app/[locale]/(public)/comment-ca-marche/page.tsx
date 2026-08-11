const steps = [
  { title: 'Le photographe crée un événement', text: 'Nom, date, lieu, catégorie.' },
  { title: 'Un QR Code est généré', text: 'À afficher, imprimer ou partager sur place.' },
  { title: 'Les participants scannent', text: 'Ils accèdent directement à la galerie.' },
  { title: 'Ils sélectionnent leurs photos', text: 'Recherche par nom, numéro ou visage (bientôt).' },
  { title: 'Paiement en ligne', text: 'Wave, Orange Money, carte bancaire.' },
  { title: 'Téléchargement immédiat', text: 'Lien sécurisé après confirmation du paiement.' },
];

export default function CommentCaMarchePage() {
  return (
    <div className="container-sn py-16">
      <h1 className="text-center text-3xl font-bold text-sn-slate dark:text-white">Comment ça marche ?</h1>
      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {steps.map((s, i) => (
          <div key={s.title} className="surface-card rounded-xl p-6 shadow-sm">
            <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-full bg-sn-orange font-bold text-white">
              {i + 1}
            </div>
            <p className="font-semibold text-sn-slate dark:text-white">{s.title}</p>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{s.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
