/** Turns free text into a snake_case id, matching the style of existing event ids
 *  (e.g. "transfer_rival_offer"). Used to auto-generate event/choice ids from labels. */
export function slugify(text: string): string {
  const stripped = text
    .toLowerCase()
    .normalize("NFD")
    .split("")
    .filter((ch) => ch.codePointAt(0)! < 0x0300 || ch.codePointAt(0)! > 0x036f)
    .join("");

  return stripped
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 60);
}
