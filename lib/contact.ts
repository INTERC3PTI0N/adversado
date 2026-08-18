/**
 * Single source of truth for the studio's contact details.
 *
 * The footer and the contact page both render these, so the address and the
 * number can never drift apart between the two.
 */

export const CONTACT = {
  addressLines: [
    "Door No. 3312/B, Kailas Nagar",
    "Puthiya Road, Palarivattom",
    "Ernakulam, Kochi — 682025",
  ],
  email: "Hello@adversado.com",
  /** As written, for display. */
  phoneDisplay: "79948 16999",
  /** E.164 without the +, which is what wa.me expects. */
  whatsapp: "917994816999",
} as const;

export const WHATSAPP_URL = `https://wa.me/${CONTACT.whatsapp}`;
export const MAILTO_URL = `mailto:${CONTACT.email}`;
