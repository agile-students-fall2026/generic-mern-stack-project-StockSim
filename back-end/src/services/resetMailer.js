import { randomUUID } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import nodemailer from 'nodemailer'

export function createResetMailer({
  env = process.env,
  production = process.env.NODE_ENV === 'production',
  outboxDir = fileURLToPath(new URL('../../.mail/', import.meta.url)),
  transport,
} = {}) {
  const localOutbox = !transport && !env.SMTP_HOST
  if (localOutbox && production) throw new Error('SMTP_HOST is required for password recovery in production.')
  if (!transport && !localOutbox) {
    const port = Number(env.SMTP_PORT || 587)
    if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('SMTP_PORT must be a valid port.')
    if (Boolean(env.SMTP_USER) !== Boolean(env.SMTP_PASS)) throw new Error('Set both SMTP_USER and SMTP_PASS, or neither.')
    transport = nodemailer.createTransport({
      host: env.SMTP_HOST, port, secure: port === 465, requireTLS: production,
      auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
      connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 10000,
      logger: false, debug: false,
    })
  }
  transport ??= nodemailer.createTransport({ jsonTransport: true })

  return {
    async sendResetLink({ to, resetUrl }) {
      const result = await transport.sendMail({
        from: env.MAIL_FROM || 'StockSim <no-reply@stocksim.local>',
        to,
        subject: 'Reset your StockSim password',
        text: `Use this link to reset your StockSim password:\n\n${resetUrl}\n\nThis link expires in 15 minutes and can be used once. If you did not request a reset, ignore this email.`,
      })
      if (localOutbox) {
        // Local development preview only. Never serve this directory over HTTP.
        await mkdir(outboxDir, { recursive: true, mode: 0o700 })
        await writeFile(join(outboxDir, `${randomUUID()}.json`), result.message, { mode: 0o600, flag: 'wx' })
      }
    },
  }
}
