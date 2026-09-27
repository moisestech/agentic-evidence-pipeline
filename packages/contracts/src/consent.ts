/**
 * TICKET-06-thin — first real DCC job stays blocked until written consent exists.
 * Do not invent a job, a case study, or derived eval cases without this record.
 */
export type ClientConsentRecord = {
  text: string;
  recordedAt: string;
};

export function assertFirstJobConsent(consent: ClientConsentRecord | null): ClientConsentRecord {
  if (!consent?.text.trim() || !consent.recordedAt) {
    throw new Error(
      "TICKET-06-thin blocked: written client consent is required before a real DCC job.",
    );
  }
  return consent;
}
