export function toIsoStartOfDayLocal(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.toISOString();
}
export function addDays(d: Date, days: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}
export function fmt(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString();
}
