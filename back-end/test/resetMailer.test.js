import { mkdtemp, readFile, readdir, rm, stat } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, it } from 'mocha'
import { expect } from 'chai'
import { createResetMailer } from '../src/services/resetMailer.js'

const email = { to: 'learner@example.com', resetUrl: `http://localhost:5173/reset-password#token=${'a'.repeat(64)}` }

describe('Password reset email delivery', () => {
  it('writes a private local email preview without an SMTP connection', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'stocksim-mail-test-'))
    const outbox = join(directory, '.mail')
    try {
      const mailer = createResetMailer({ env: {}, production: false, outboxDir: outbox })
      expect(await mailer.sendResetLink(email)).to.equal(undefined)
      const files = await readdir(outbox)
      expect(files).to.have.lengthOf(1)
      const path = join(outbox, files[0])
      const message = JSON.parse(await readFile(path, 'utf8'))
      expect(message.to[0].address).to.equal(email.to)
      expect(message.subject).to.equal('Reset your StockSim password')
      expect(message.text.split(String.fromCharCode(10))).to.include(email.resetUrl)
      expect(message.text).to.include('15 minutes')
      expect((await stat(outbox)).mode & 0o777).to.equal(0o700)
      expect((await stat(path)).mode & 0o777).to.equal(0o600)
    } finally {
      await rm(directory, { recursive: true, force: true })
    }
  })

  it('uses an injected mail transport without creating a local preview', async () => {
    const sent = []
    const mailer = createResetMailer({ env: { MAIL_FROM: 'sender@example.com' }, production: true,
      transport: { async sendMail(message) { sent.push(message); return {} } },
    })
    await mailer.sendResetLink(email)
    expect(sent).to.have.lengthOf(1)
    expect(sent[0].from).to.equal('sender@example.com')
    expect(sent[0].to).to.equal(email.to)
    expect(sent[0].text).to.include(email.resetUrl)
  })

  it('requires production SMTP configuration and rejects invalid SMTP settings', () => {
    expect(() => createResetMailer({ env: {}, production: true })).to.throw('SMTP_HOST')
    expect(() => createResetMailer({ env: { SMTP_HOST: 'smtp.example.com', SMTP_PORT: 'bad' } })).to.throw('SMTP_PORT')
    expect(() => createResetMailer({ env: { SMTP_HOST: 'smtp.example.com', SMTP_USER: 'user' } })).to.throw('SMTP_USER')
    expect(() => createResetMailer({ env: { SMTP_HOST: 'smtp.example.com', SMTP_PORT: '465', SMTP_USER: 'user', SMTP_PASS: 'test-only' } })).not.to.throw()
  })
})
