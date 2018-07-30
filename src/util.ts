
export function sum(values: Array<number>): number {
    return values.reduce((total, point) => total + point)
}

export function average(values: Array<number>): number {
    return sum(values) / values.length
}
