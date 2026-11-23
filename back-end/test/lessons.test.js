import { describe, it } from 'mocha'
import { expect } from 'chai'
import request from 'supertest'
import app from '../src/app.js'

describe('lesson endpoints', () => {
  it('returns lesson summaries', async () => {
    const response = await request(app).get('/api/lessons')

    expect(response.status).to.equal(200)
    expect(response.body).to.have.length(6)
    expect(response.body[0]).to.deep.equal({
      id: 'first-steps',
      title: 'First steps',
      description: 'What StockSim is and how virtual cash works.',
      duration: '2 min',
    })
    expect(response.body[5].id).to.equal('dividends')
  })

  it('returns one lesson with its place in the list', async () => {
    const response = await request(app).get('/api/lessons/stock-prices')

    expect(response.status).to.equal(200)
    expect(response.body.title).to.equal('Understanding stock prices')
    expect(response.body.content).to.include('A stock price')
    expect(response.body.lessonNumber).to.equal(2)
    expect(response.body.lessonCount).to.equal(6)
    expect(response.body.previousLessonId).to.equal('first-steps')
    expect(response.body.nextLessonId).to.equal('balanced-portfolio')
  })

  it('returns lessons that match one activity', async () => {
    const buying = await request(app).get('/api/lessons/suggestions?activity=buying')
    const portfolio = await request(app).get('/api/lessons/suggestions?activity=portfolio')
    const unknown = await request(app).get('/api/lessons/suggestions?activity=nothing')

    expect(buying.status).to.equal(200)
    expect(buying.body).to.have.length(1)
    expect(buying.body[0].id).to.equal('market-orders')

    expect(portfolio.status).to.equal(200)
    expect(portfolio.body).to.have.length(4)
    expect(portfolio.body[0].id).to.equal('first-steps')

    expect(unknown.status).to.equal(200)
    expect(unknown.body).to.have.length(0)
  })

  it('returns 404 when the lesson does not exist', async () => {
    const response = await request(app).get('/api/lessons/missing')

    expect(response.status).to.equal(404)
    expect(response.body.error.code).to.equal('NOT_FOUND')
  })
})
