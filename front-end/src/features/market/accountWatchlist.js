export async function watchlistRequest(path = '', options) {
  const response = await fetch(`/api/watchlist${path}`, options)
  if (response.status === 204) return null
  const data = await response.json()
  if (!response.ok) throw new Error(data.error?.message || 'Watchlist is unavailable.')
  return data
}
