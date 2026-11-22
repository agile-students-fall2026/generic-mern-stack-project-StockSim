import { Router } from 'express'
import { getHoldings } from './holdings.js'

// Mock account values for testing only
const startingCash = 10000
const cash = 7000

function getPortfolioSummary() {
  const holdingsList = getHoldings()
  const hasMissingPrice = holdingsList.some((holding) => holding.marketValue === null)

  const holdingsValue = hasMissingPrice
    ? null
    : holdingsList.reduce((sum, holding) => sum + holding.marketValue, 0)
  const totalValue = holdingsValue === null ? null : cash + holdingsValue
  const profitLoss = totalValue === null ? null : totalValue - startingCash
  const returnPercent = profitLoss === null ? null : (profitLoss / startingCash) * 100

  return { holdingsValue, cash, totalValue, profitLoss, returnPercent }
}

export function createPortfolioRouter() {
  const router = Router()

  router.get('/summary', (req, res) => {
    res.json(getPortfolioSummary())
  })

  return router
}