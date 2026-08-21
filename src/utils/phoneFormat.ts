/**
 * Phone-number formatting helpers.
 *
 * The FE renders a saved number with libphonenumber's `formatInternational()`; tests only ever
 * deal with the US numbers produced by `DataGenerator.generatePhoneNumber()` (`+1201XXXXXXX`),
 * so a small formatter is enough and keeps the dependency out of the test project.
 */

/** `+12015550123` -> `+1 201 555 0123`. Any other shape is returned unchanged. */
export function formatPhoneInternational(e164: string): string {
    const usNumber = /^\+1(\d{3})(\d{3})(\d{4})$/.exec(e164);
    return usNumber ? `+1 ${usNumber[1]} ${usNumber[2]} ${usNumber[3]}` : e164;
}
