export const LAUNCH_DATE = new Date("2026-04-24T00:00:00+05:30");

export function isLive() {
  return new Date() >= LAUNCH_DATE;
}

export function isPreview() {
  const host = window.location.hostname;
  return (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "0.0.0.0" ||
    host === "::1" ||
    host === "[::1]" ||
    host === "::"
  );
}
