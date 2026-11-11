/** Why Connect with AwakenBot Desktop did not connect this browser, one plain sentence per code: AwakenBot Desktop's own
 * error codes, and the Recorder's (no answer, the policy, an address it cannot use, AwakenBot not taking Desktop's code). */
const SENTENCES: Record<string, string> = {
  "origin-not-allowed":
    "AwakenBot Desktop does not recognise this copy of the Recorder. Connect from AwakenBot in your browser instead.",
  "not-installed":
    "AwakenBot Desktop has not set up AwakenBot on this computer yet. Finish setting it up in AwakenBot Desktop, then try again.",
  "not-running":
    "AwakenBot is not running in AwakenBot Desktop. Open AwakenBot Desktop, then try again.",
  "not-signed-in":
    "AwakenBot Desktop is not signed in to your organization. Sign in again in AwakenBot Desktop, then try again.",
  "organization-unavailable":
    "AwakenBot Desktop cannot hand over your organization sign-in right now. Try again later.",
  "handoff-failed":
    "AwakenBot did not give AwakenBot Desktop a code to connect with. Try again.",
  "timed-out": "AwakenBot Desktop did not answer in time. Try again.",
  "no-answer": "AwakenBot Desktop did not answer. Open it, then try again.",
  "host-failed":
    "AwakenBot Desktop ran into a problem while answering. Try again, or connect from AwakenBot in your browser.",
  "unknown-message":
    "This version of AwakenBot Desktop does not understand the Recorder. Update AwakenBot Desktop, then try again.",
  "policy-invalid":
    "Your organization's Recorder policy names an AwakenBot address the Recorder cannot use. Ask your IT team.",
  "pinned-elsewhere":
    "Your organization connects the Recorder to a different AwakenBot. Connect from that AwakenBot instead.",
  "invalid-address":
    "AwakenBot Desktop answered with an address the Recorder cannot use. Connect from AwakenBot in your browser instead.",
  "exchange-refused":
    "AwakenBot did not accept the code AwakenBot Desktop gave the Recorder. Try again.",
  "openbot-unreachable":
    "AwakenBot did not answer. Make sure AwakenBot is running in AwakenBot Desktop, then try again.",
};

const UNKNOWN =
  "AwakenBot Desktop could not connect this browser. Try again, or connect from AwakenBot in your browser.";

export function desktopSentence(code: string): string {
  return Object.hasOwn(SENTENCES, code) ? (SENTENCES[code] as string) : UNKNOWN;
}
