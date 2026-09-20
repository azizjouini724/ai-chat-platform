export function formatLastSeen(lastSeenAt?: string | null): string {
  if (!lastSeenAt) return "Hors ligne";
  const diffMs = Date.now() - new Date(lastSeenAt).getTime();
  const minutes = Math.floor(diffMs / 60000);

  if (minutes < 1) return "En ligne il y a quelques secondes";
  if (minutes < 60) return `En ligne il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `En ligne il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  return `En ligne il y a ${days}j`;
}