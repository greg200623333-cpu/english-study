class TimeoutError extends Error {
  constructor(timeoutMs: number) {
    super(`Request timed out after ${timeoutMs}ms`)
    this.name = 'TimeoutError'
  }
}

type FetchWithTimeoutOptions = RequestInit & {
  timeout?: number
  retries?: number
  retryDelay?: number
  onRetry?: (attempt: number, error: Error) => void
}

export async function fetchWithTimeout(
  url: string,
  options: FetchWithTimeoutOptions = {}
): Promise<Response> {
  const { timeout = 10000, retries = 0, retryDelay = 1000, onRetry, ...fetchOptions } = options

  let lastError: Error = new Error('Unknown error')

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeout)

    try {
      const response = await fetch(url, { ...fetchOptions, signal: controller.signal })
      clearTimeout(timer)
      return response
    } catch (err) {
      clearTimeout(timer)
      const error = err as Error
      lastError = error.name === 'AbortError' ? new TimeoutError(timeout) : error

      if (attempt < retries) {
        onRetry?.(attempt + 1, lastError)
        await new Promise((resolve) => setTimeout(resolve, retryDelay * Math.pow(2, attempt)))
      }
    }
  }

  throw lastError
}
