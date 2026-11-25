import { decode } from "html-entities";

const LINE_BREAK = /\r\n|\r|\n/;

// Mirrors CustomField::formatFieldValuesAsArray() in Snipe-IT: one option per line, where
// "value|label" stores the value and displays the label.
export function formatFieldValuesAsArray(fieldValues) {
    if (!fieldValues) {
        return [];
    }

    const lines = Array.isArray(fieldValues)
        ? fieldValues.flatMap((line) => String(line).split(LINE_BREAK))
        : String(fieldValues).split(LINE_BREAK);

    return lines
        .map((line) => decode(line).split('|'))
        .filter((lineParts) => lineParts[0] !== '')
        .map((lineParts) => ({
            value: lineParts[0],
            label: (lineParts[1] ?? lineParts[0]).trim(),
        }));
}
