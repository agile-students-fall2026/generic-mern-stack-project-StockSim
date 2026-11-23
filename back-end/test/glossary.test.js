import { describe, it } from 'mocha'
import { expect } from 'chai'
import request from 'supertest'
import app from '../src/app.js'

describe('glossary endpoints', () => {
  it('returns all glossary terms', async () => {
    const response = await request(app).get('/api/glossary')

    expect(response.status).to.equal(200)
    expect(response.body).to.have.length(8)
    expect(response.body[0]).to.include({ id: 'stock', term: 'Stock' })
  })

  it('returns terms whose name matches the search', async () => {
    const response = await request(app).get('/api/glossary?q=order')

    expect(response.status).to.equal(200)
    expect(response.body).to.have.length(1)
    expect(response.body[0].id).to.equal('market-order')
  })

  it('returns an empty list when nothing matches', async () => {
    const response = await request(app).get('/api/glossary?q=zzzz')

    expect(response.status).to.equal(200)
    expect(response.body).to.have.length(0)
  })
})
