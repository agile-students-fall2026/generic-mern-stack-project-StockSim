const messages = {
  HISTORY_NOT_FOUND: 'No end-of-day price history was found for this ticker.',
  HISTORY_NOT_CONFIGURED: 'The price history service is not configured.',
  HISTORY_RATE_LIMITED: 'The data provider has reached its request limit. Try again later.',
  HISTORY_BUSY: 'Price history is busy right now. Try again in a moment.',
  HISTORY_TIMEOUT: 'The price history request timed out. Try again.',
}

const unavailable = 'End-of-day price history is unavailable. Try again later.'

export async function fetchHistory(symbol, signal) {
  let response
  let data
  try {
    response = await fetch(`/api/stocks/${encodeURIComponent(symbol)}/history`, { signal })
    data = await response.json()
  } catch (error) {
    if (error.name === 'AbortError') throw error
    throw new Error(unavailable, { cause: error })
  }
  if (!response.ok) {
    const code = data?.error?.code
    throw new Error(Object.hasOwn(messages, code) ? messages[code] : unavailable)
  }
  const valid = Array.isArray(data?.points) && data.points.length >= 2 && data.points.every(
    (point) => typeof point?.date === 'string' && Number.isFinite(point.price) && point.price > 0,
  )
  if (data?.symbol !== symbol || data.dataTiming !== 'end_of_day' || !valid) {
    throw new Error(unavailable)
  }
  return data
}