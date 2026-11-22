import { describe, it } from 'mocha'
import { expect } from 'chai'
import request from 'supertest'
import app from '../src/app.js'

describe('GET /api/holdings', () => {
  it('returns holdings with value and gain figures', async () => {
    const response = await request(app).get('/api/holdings')

    expect(response.status).to.equal(200)
    expect(response.body).to.have.length(2)
    expect(response.body[0]).to.include({ symbol: 'AAPL', marketValue: 1800, gain: 300, gainPercent: 20 })
    expect(response.body[1]).to.include({ symbol: 'MSFT', marketValue: 1550, gain: 50 })
  })
})