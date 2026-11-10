/* Server-only authorization boundary, not an authentication or age-verification system.
 * Both functions MUST read current trusted server-side records: authenticate(request)
 * must validate an actual session, expiry, revocation and account status;
 * getEligibility(subject) must return the independently verified adult-status record.
 * Never construct either result from request body, query, headers or client assertions.
 * Records use epoch milliseconds. Errors and incomplete records always deny.
 */
export function createAdultAuthorizer({ authenticate, getEligibility, now = Date.now } = {}) {
  if (typeof authenticate !== "function" || typeof getEligibility !== "function" || typeof now !== "function") throw new TypeError("Trusted session and eligibility verifiers are required");
  return async function authorize(request) {
    try {
      const time = now();
      if (!Number.isSafeInteger(time) || time < 0 || !request) return false;
      const session = await authenticate(request);
      if (!session || typeof session.subject !== "string" || !session.subject.trim() || session.authenticated !== true || session.active !== true || session.revoked !== false || !Number.isSafeInteger(session.expiresAt) || session.expiresAt <= time) return false;
      const eligibility = await getEligibility(session.subject);
      // Re-read the clock: a slow backend call must not extend an expired session.
      const checkedAt = now();
      if (!Number.isSafeInteger(checkedAt) || checkedAt < time || session.expiresAt <= checkedAt) return false;
      return !!eligibility && eligibility.subject === session.subject && eligibility.adultVerified === true && eligibility.revoked === false && Number.isSafeInteger(eligibility.expiresAt) && eligibility.expiresAt > checkedAt;
    } catch { return false; }
  };
}
