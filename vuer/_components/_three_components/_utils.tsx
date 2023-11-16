export function parseArray(str?: string): number[] | void {
    if (!str) return;
    return str.split(",").map(parseFloat);
}