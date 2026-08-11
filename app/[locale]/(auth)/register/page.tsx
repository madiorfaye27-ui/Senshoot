import Link from 'next/link';

export default function RegisterPage() {
  return (
    <form action="/api/auth/register" method="post" className="space-y-4">
      <h1 className="text-center text-lg font-bold text-sn-slate dark:text-white">Créer un compte</h1>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-sn-slate dark:text-gray-300">Prénom</label>
          <input
            type="text"
            name="first_name"
            required
            className="input-field"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-sn-slate dark:text-gray-300">Nom</label>
          <input
            type="text"
            name="last_name"
            required
            className="input-field"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-sn-slate dark:text-gray-300">Email</label>
        <input
          type="email"
          name="email"
          required
          className="input-field"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-sn-slate dark:text-gray-300">Mot de passe</label>
        <input
          type="password"
          name="password"
          required
          minLength={8}
          className="input-field"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-sn-slate dark:text-gray-300">Je m'inscris en tant que</label>
        <select
          name="role"
          className="input-field"
        >
          <option value="client">Client (acheter des photos)</option>
          <option value="photographer">Photographe</option>
        </select>
      </div>

      <label className="flex items-start gap-2 text-xs text-gray-500 dark:text-gray-400">
        <input type="checkbox" name="terms" required className="mt-0.5" />
        J'accepte les conditions générales d'utilisation.
      </label>

      <button type="submit" className="btn-primary w-full">
        Créer mon compte
      </button>

      <p className="text-center text-sm text-gray-500 dark:text-gray-400">
        Déjà inscrit ?{' '}
        <Link href="/login" className="font-medium text-sn-orange">
          Connectez-vous
        </Link>
      </p>
    </form>
  );
}
