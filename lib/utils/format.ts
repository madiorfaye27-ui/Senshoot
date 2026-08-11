export function formatFCFA(amount: number): string {
  return new Intl.NumberFormat('fr-SN', {
    style: 'currency',
    currency: 'XOF',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(date));
}

// Génère un identifiant de commande type SS-2026-000001
export function generateOrderId(sequence: number): string {
  const year = new Date().getFullYear();
  return `SS-${year}-${String(sequence).padStart(6, '0')}`;
}
