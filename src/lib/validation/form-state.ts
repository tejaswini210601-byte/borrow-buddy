/**
 * The shape every form's Server Action returns, so all forms can show
 * errors the same way:
 *  - message:      a summary at the top of the form
 *  - fieldErrors:  a message under each field that needs fixing
 *  - values:       what the person typed, so it isn't wiped on an error
 */
export type FormState = {
  status: "idle" | "error" | "success";
  message?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  values?: Record<string, string>;
};

export const idle: FormState = { status: "idle" };

/** Reads text fields from a submitted form into a plain object. */
export function readForm(formData: FormData, fields: readonly string[]) {
  const out: Record<string, string> = {};
  for (const f of fields) {
    const v = formData.get(f);
    out[f] = typeof v === "string" ? v : "";
  }
  return out;
}
