export type CalendarCell = { date: Date; inMonth: boolean };

// Grille de semaines (lundi -> dimanche) pour un mois donné, avec les
// jours de débordement du mois précédent/suivant pour compléter les
// premières et dernières semaines.
export function getMonthGrid(year: number, month: number): CalendarCell[][] {
  const firstOfMonth = new Date(Date.UTC(year, month - 1, 1));
  const startWeekday = (firstOfMonth.getUTCDay() + 6) % 7; // lundi = 0
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();

  const cells: CalendarCell[] = [];
  for (let i = startWeekday; i > 0; i--) {
    cells.push({ date: new Date(Date.UTC(year, month - 1, 1 - i)), inMonth: false });
  }
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push({ date: new Date(Date.UTC(year, month - 1, day)), inMonth: true });
  }
  let trailing = 1;
  while (cells.length % 7 !== 0) {
    cells.push({ date: new Date(Date.UTC(year, month, trailing)), inMonth: false });
    trailing++;
  }

  const weeks: CalendarCell[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }
  return weeks;
}

export function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}
