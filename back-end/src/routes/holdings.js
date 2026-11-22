import { Router } from 'express'

// Mock data for testing only
const holdings = [
  { symbol: 'AAPL', name: 'Apple Inc.', shares: 10, averagePrice: 150 },
  { symbol: 'MSFT', name: 'Microsoft Corp.', shares: 5, averagePrice: 300 },
]

const latestPrices = {
  AAPL: 180,
  MSFT: 310,
}

export function getHoldings() {
  return holdings.map((holding) => {
    const latestPrice = latestPrices[holding.symbol] ?? null
    const marketValue = latestPrice === null ? null : holding.shares * latestPrice
    const gain =
      latestPrice === null || holding.averagePrice === null
        ? null
        : (latestPrice - holding.averagePrice) * holding.shares
    const gainPercent =
      latestPrice === null || !holding.averagePrice
        ? null
        : ((latestPrice - holding.averagePrice) / holding.averagePrice) * 100

    return { ...holding, latestPrice, marketValue, gain, gainPercent }
  })
}

export function createHoldingsRouter() {
  const router = Router()

  router.get('/', (req, res) => {
    res.json(getHoldings())
  })

  return router
}