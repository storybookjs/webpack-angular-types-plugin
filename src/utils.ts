import { v4 } from "uuid";

export function generateUUID(): string {
    return v4();
}

export function stripQuotes(input: string): string {
    return input.replace(/"/g, "");
}

export function wrapInBraces(input: string): string {
    return "(" + input + ")";
}

export function wrapInCurlyBraces(input: string): string {
    return "{\n" + input + "\n}";
}

export function indentLines(inputs: string[]): string[] {
    return inputs.map((input) => "\t" + input);
}
