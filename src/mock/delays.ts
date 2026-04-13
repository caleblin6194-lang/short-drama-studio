export const delay = (ms: number) => new Promise<void>(r => setTimeout(r, ms))
export const randomDelay = (min: number, max: number) => delay(min + Math.random() * (max - min))
