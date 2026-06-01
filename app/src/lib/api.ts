type ApiResponse<T> = {
  data: T
}

export const apiRequest = async <T,>(
  path: string,
  options: RequestInit & { json?: unknown } = {},
): Promise<T> => {
  const { json, headers, ...rest } = options
  const response = await fetch(`/api${path}`, {
    ...rest,
    headers: {
      ...(json ? { 'Content-Type': 'application/json' } : {}),
      ...headers,
    },
    body: json ? JSON.stringify(json) : rest.body,
  })

  if (!response.ok) {
    let message = 'Request failed'
    try {
      const payload = await response.json()
      if (payload?.error) {
        message = payload.error
      }
    } catch {
      const text = await response.text()
      if (text) message = text
    }
    throw new Error(message)
  }

  const payload = (await response.json()) as ApiResponse<T>
  return payload.data
}
