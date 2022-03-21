import { v4 } from "uuid";

/*
 * Removes "key" from "map" if the key exists
 */
export function removeFromMapIfExists<TKey, TVal>(
    map: Map<TKey, TVal>,
    key: TKey
): void {
    if (map.has(key)) {
        map.delete(key);
    }
}

export function generateUUID(): string {
    return v4();
}

/*
 * Remove any leading and trailing quotes (single and double) from a given string
 */
export function stripQuotes(input: string): string {
    return input.replace(/^"|^'|"$|'$/g, "");
}

export function wrapInBraces(input: string): string {
    return "(" + input + ")";
}

export function wrapInCurlyBraces(input: string): string {
    return "{\n" + input + "\n}";
}
