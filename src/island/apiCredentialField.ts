/**
 * A Hypixel API key is a credential, but it is not a Skydex login password.
 *
 * `autocomplete="off"` is the browser-standard signal. The data attributes
 * cover the major extension password managers that otherwise treat every
 * masked input as a sign-in form and offer to save or fill it. The input stays
 * `type="password"`, so screenshots and shoulder-surfing still get bullets.
 */
export const API_CREDENTIAL_FIELD_ATTRIBUTES = {
  autoComplete: "off",
  "data-1p-ignore": "true",
  "data-bwignore": "true",
  "data-form-type": "other",
  "data-lpignore": "true",
} as const;
