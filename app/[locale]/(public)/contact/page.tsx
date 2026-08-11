export default function ContactPage() {
  return (
    <div className="container-sn py-16">
      <h1 className="text-3xl font-bold text-sn-slate dark:text-white">Contact</h1>
      <div className="mt-6 space-y-2 text-gray-600 dark:text-gray-400">
        <p>Dakar, Sénégal</p>
        <p>contact@shootsenegal.com</p>
      </div>
      <form className="mt-8 max-w-lg space-y-4">
        <input placeholder="Nom" className="input-field" />
        <input placeholder="Email" type="email" className="input-field" />
        <textarea placeholder="Message" rows={4} className="input-field" />
        <button type="submit" className="btn-primary">Envoyer</button>
      </form>
    </div>
  );
}
