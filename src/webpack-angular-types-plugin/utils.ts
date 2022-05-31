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

// I do not want to include core-js as a dependency just to get the groupBy polyfill
export function groupBy<T>(
    entities: Map<string, T>,
    groupFn: (elem: T) => string
): { [groupKey: string]: T[] } {
    const res: { [groupKey: string]: T[] } = {};
    for (const entity of entities.values()) {
        const groupKey = groupFn(entity);
        if (!res[groupKey]) {
            res[groupKey] = [];
        }
        res[groupKey].push(entity);
    }
    return res;
}
