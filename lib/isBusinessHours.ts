export function isBusinessHours(): boolean {
  // Mon–Fri, 9am–2pm Dallas (America/Chicago)
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    weekday: "short",
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  }).formatToParts(new Date());

  const weekday = parts.find(p => p.type === "weekday")?.value ?? "";
  const hour = parseInt(parts.find(p => p.type === "hour")?.value ?? "0", 10);
  const minute = parseInt(parts.find(p => p.type === "minute")?.value ?? "0", 10);
  const mins = hour * 60 + minute;

  const isWeekday = !["Sat", "Sun"].includes(weekday);
  return isWeekday && mins >= 9 * 60 && mins < 14 * 60;
}
