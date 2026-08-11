const categories = [
  'mariage', 'bapteme', 'anniversaire', 'conference', 'concert', 'festival',
  'sport', 'professionnel', 'remise_diplomes', 'scolaire', 'institutionnel',
  'shooting', 'autre',
];

export default function NewEventPage() {
  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold text-sn-slate">Nouvel événement</h1>

      <form action="/api/events" method="post" className="mt-6 space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-sn-slate">Nom de l'événement</label>
          <input name="name" required className="w-full rounded-lg border border-gray-200 px-4 py-2" />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-sn-slate">Description</label>
          <textarea name="description" rows={3} className="w-full rounded-lg border border-gray-200 px-4 py-2" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-sn-slate">Date</label>
            <input type="date" name="event_date" className="w-full rounded-lg border border-gray-200 px-4 py-2" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-sn-slate">Ville</label>
            <input name="city" className="w-full rounded-lg border border-gray-200 px-4 py-2" />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-sn-slate">Catégorie</label>
          <select name="category" className="w-full rounded-lg border border-gray-200 px-4 py-2">
            {categories.map((c) => (
              <option key={c} value={c}>{c.replace('_', ' ')}</option>
            ))}
          </select>
        </div>

        <button type="submit" className="btn-primary w-full">
          Créer l'événement et générer le QR Code
        </button>
      </form>
    </div>
  );
}
