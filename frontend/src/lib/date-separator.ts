export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function formatDateSeparator(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  if (isSameDay(date, now)) return "Aujourd'hui";
  if (isSameDay(date, yesterday)) return "Hier";

  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 7) {
    return date.toLocaleDateString("fr-FR", { weekday: "long" });
  }

  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: diffDays > 365 ? "numeric" : undefined });
}