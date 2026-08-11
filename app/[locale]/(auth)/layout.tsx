import Link from 'next/link';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-sn-teal/5 px-4 dark:bg-slate-900">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm dark:bg-slate-800">
        <Link href="/" className="mb-6 block text-center text-xl font-bold text-sn-teal">
          Senshoot <span className="text-sn-orange">Sénégal</span>
        </Link>
        {children}
      </div>
    </div>
  );
}
