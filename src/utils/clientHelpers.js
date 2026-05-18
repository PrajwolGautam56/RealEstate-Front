const HOT_STATUSES = ["FB Lead", "Intake"];
const HOT_TYPES = ["Buyer", "Both"];
const HOT_STALE_MS = 3 * 24 * 60 * 60 * 1000;

/** Buyer/Both in early pipeline with no update in 3+ days — needs follow-up. */
export function isHotClient(client) {
  if (!client) return false;
  if (!HOT_TYPES.includes(client.type)) return false;
  if (!HOT_STATUSES.includes(client.status)) return false;
  const updated = new Date(client.updatedAt).getTime();
  if (Number.isNaN(updated)) return false;
  return Date.now() - updated > HOT_STALE_MS;
}

export function daysSinceUpdate(client) {
  const updated = new Date(client?.updatedAt).getTime();
  if (Number.isNaN(updated)) return null;
  return Math.floor((Date.now() - updated) / (24 * 60 * 60 * 1000));
}
