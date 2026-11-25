const messages = {
  QUOTE_NOT_FOUND: 'No end-of-day quote was found for this ticker.',
  QUOTE_NOT_CONFIGURED: 'The quote service is not configured.',
  QUOTE_RATE_LIMITED: 'The quote provider has reached its request limit. Try again later.',
  QUOTE_BUSY: 'Quotes are busy right now. Try again in a moment.',
  QUOTE_TIMEOUT: 'The quote request timed out. Try again.',
}

const unavailable = 'The end-of-day quote is unavailable. Try again later.'

export async function fetchQuote(symbol, signal) {
  let response
  let data
  try {
    response = await fetch(`/api/stocks/${encodeURIComponent(symbol)}/quote`, { signal })
    data = await response.json()
  } catch (error) {
    if (error.name === 'AbortError') throw error
    throw new Error(unavailable, { cause: error })
  }
  if (!response.ok) {
    const code = data?.error?.code
    throw new Error(Object.hasOwn(messages, code) ? messages[code] : unavailable)
  }
  if (data?.symbol !== symbol || data.dataTiming !== 'end_of_day' || !Number.isFinite(data.price) || data.price <= 0) {
    throw new Error(unavailable)
  }
  return data
}