import Link from 'next/link';

export default function LoginPage() {
  return (
    <form action="/api/auth/login" method="post" className="space-y-4">
      <h1 className="text-center text-lg font-bold text-sn-slate dark:text-white">Connexion</h1>

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
          className="input-field"
        />
      </div>

      <button type="submit" className="btn-primary w-full">
        Se connecter
      </button>

      <p className="text-center text-sm text-gray-500 dark:text-gray-400">
        Pas encore de compte ?{' '}
        <Link href="/register" className="font-medium text-sn-orange">
          Inscrivez-vous
        </Link>
      </p>
    </form>
  );
}
