const LOG_EFFECTS = false;

// Log an "Effect" block running.
//
// These can be toggled off by the user, by disabling the LOG_EFFECTS variable
export function logEffect(text: string) {
  if (LOG_EFFECTS) {
    console.log(`[EFFECT]: ${text}`);
  }
}
