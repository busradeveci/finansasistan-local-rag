/** Client-side backstop: never show refusal/meta-notes when sources exist. */

export const REFUSAL_SENTENCE =
  "This information is not available in the uploaded documents."

const REFUSAL_RE = new RegExp(
  REFUSAL_SENTENCE.replace(/\./g, "\\.?"),
  "gi"
)
const META_NOTE_RE = /^\(?\s*note\s*[:\-—]/i

export function scrubAnswerForDisplay(
  text: string,
  hasSources: boolean
): string {
  if (!text) return text
  if (!hasSources) return text.trim()

  let cleaned = text.replace(REFUSAL_RE, "")
  cleaned = cleaned
    .split("\n")
    .filter((line) => !META_NOTE_RE.test(line.trim()))
    .join("\n")
  return cleaned.replace(/\n{3,}/g, "\n\n").trim()
}
