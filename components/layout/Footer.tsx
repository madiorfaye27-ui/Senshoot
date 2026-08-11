export default function Footer() {
  return (
    <footer className="border-t border-gray-100 bg-sn-slate text-white">
      <div className="container-sn grid gap-8 py-12 md:grid-cols-4">
        <div>
          <p className="text-lg font-bold">
            Senshoot <span className="text-sn-orange">Sénégal</span>
          </p>
          <p className="mt-2 text-sm text-gray-300">
            Vos moments. Vos images. Votre valeur.
          </p>
        </div>

        <div>
          <p className="font-semibold">Plateforme</p>
          <ul className="mt-2 space-y-1 text-sm text-gray-300">
            <li>Photographes</li>
            <li>Galeries</li>
            <li>Tarifs</li>
          </ul>
        </div>

        <div>
          <p className="font-semibold">Entreprise</p>
          <ul className="mt-2 space-y-1 text-sm text-gray-300">
            <li>À propos</li>
            <li>FAQ</li>
            <li>Contact</li>
          </ul>
        </div>

        <div>
          <p className="font-semibold">Contact</p>
          <ul className="mt-2 space-y-1 text-sm text-gray-300">
            <li>Dakar, Sénégal</li>
            <li>contact@shootsenegal.com</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10 py-4 text-center text-xs text-gray-400">
        © {new Date().getFullYear()} Senshoot Sénégal — Tous droits réservés.
      </div>
    </footer>
  );
}
