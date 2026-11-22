import { describe, it } from 'mocha'
import { expect } from 'chai'
import request from 'supertest'
import app from '../src/app.js'

describe('GET /api/portfolio/summary', () => {
  it('returns the combined portfolio value and return figures', async () => {
    const response = await request(app).get('/api/portfolio/summary')

    expect(response.status).to.equal(200)
    expect(response.body).to.include({ holdingsValue: 3350, cash: 7000, totalValue: 10350, profitLoss: 350 })
    expect(response.body.returnPercent).to.be.closeTo(3.5, 0.0001)
  })
})