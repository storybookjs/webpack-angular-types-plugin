/*
 * Removes "key" from each passed map if the key exists
 */
export function removeFromMapsIfExists<TKey, TVal>(
    maps: ReadonlyArray<Map<TKey, TVal>>,
    key: TKey
) {
    for (const map of maps) {
        removeFromMapIfExists(map, key);
    }
}

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

export function componentWithIdString(
    componentName: string,
    id: number
): string {
    return `${componentName}-${id}`;
}
