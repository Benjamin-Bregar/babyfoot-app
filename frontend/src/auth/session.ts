let tokenInMemory: string | null = null

export const setSessionToken = (token: string | null): void => {
  tokenInMemory = token
}

export const getSessionToken = (): string | null => tokenInMemory

export const clearSessionToken = (): void => {
  tokenInMemory = null
}
