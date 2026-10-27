// Ephemeral, one-use handoff from the worker's gated atomic claim to SMTP.
// Serialized/requeued HTML cannot carry this permit across jobs or restarts.
const permits = new WeakSet<object>();
export function permitClaimedBriefing(message: object) { permits.add(message); }
export function consumeBriefingPermit(message: object): boolean {
    if (!permits.has(message)) return false;
    permits.delete(message);
    return true;
}
