import nodemailer from 'nodemailer'
import { HttpsError } from 'firebase-functions/v2/https'
import { logger } from 'firebase-functions/v2'
import { defineInt, defineSecret, defineString } from 'firebase-functions/params'

// Sends through the leinspa.com mailbox on Namecheap Private Email (SMTP).
// The SMTP login is the full mailbox address + its password.
export const EMAIL_SMTP_PASSWORD = defineSecret('EMAIL_SMTP_PASSWORD')
export const EMAIL_SENDER_ADDRESS = defineString('EMAIL_SENDER_ADDRESS', {
  description: 'leinspa.com mailbox that sends verification codes, e.g. no-reply@leinspa.com',
})
const EMAIL_SMTP_HOST = defineString('EMAIL_SMTP_HOST', { default: 'mail.privateemail.com' })
const EMAIL_SMTP_PORT = defineInt('EMAIL_SMTP_PORT', { default: 465 })
const SENDER_NAME = 'Lé Inspa'

let transport

function getTransport() {
  const sender = EMAIL_SENDER_ADDRESS.value().trim()
  const password = EMAIL_SMTP_PASSWORD.value()
  if (!sender || !password) {
    throw new HttpsError('failed-precondition', 'Email delivery is not configured on the server.', {
      reason: 'delivery-not-configured',
    })
  }
  const port = EMAIL_SMTP_PORT.value()
  transport ??= nodemailer.createTransport({
    host: EMAIL_SMTP_HOST.value(),
    port,
    secure: port === 465, // 465 = SSL; 587 = STARTTLS
    auth: { user: sender, pass: password },
  })
  return { transport, sender }
}

async function send({ to, subject, text, body }) {
  const { transport: t, sender } = getTransport()
  try {
    await t.sendMail({
      from: { name: SENDER_NAME, address: sender },
      to,
      subject,
      text,
      html: `<div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;color:#222">
  <h2 style="color:#4A2B8A;margin-bottom:4px">Lé Inspa Administration</h2>
  ${body}
</div>`,
    })
  } catch (error) {
    logger.error('[admin-mail] SMTP send failed', { code: error?.code, response: error?.response })
    transport = undefined
    throw new HttpsError('unavailable', "We couldn't send the email. Please try again.", { reason: 'delivery-failed' })
  }
}

const codeCopy = {
  sign_in: { subject: 'Your Lé Inspa Admin verification code', intro: 'Your admin verification code is:' },
  password_reset: { subject: 'Your Lé Inspa Admin password recovery code', intro: 'Your password recovery code is:' },
}

export async function sendCodeEmail({ email, otp, minutes, kind }) {
  const copy = codeCopy[kind]
  const warning = "If you didn't request this, contact your Lé Inspa security lead immediately."
  await send({
    to: email,
    subject: copy.subject,
    text: `${copy.intro} ${otp}\n\nIt expires in ${minutes} minutes. Never share this code with anyone, including Lé Inspa staff.\n\n${warning}`,
    body: `<p>${copy.intro}</p>
  <p style="font-size:32px;font-weight:bold;letter-spacing:8px;color:#4A2B8A;margin:12px 0">${otp}</p>
  <p>It expires in ${minutes} minutes. Never share this code with anyone, including Lé Inspa staff.</p>
  <p style="color:#777">${warning}</p>`,
  })
}

// ADM-003: security notification after a successful reset.
export async function sendPasswordChangedEmail({ email }) {
  const warning =
    "If you didn't make this change, contact your Lé Inspa security lead immediately so the account can be locked."
  await send({
    to: email,
    subject: 'Your Lé Inspa Admin password was changed',
    text: `Your Lé Inspa Admin password was changed, and all signed-in sessions were signed out.\n\n${warning}`,
    body: `<p>Your Lé Inspa Admin password was changed, and all signed-in sessions were signed out.</p>
  <p style="color:#b91c1c">${warning}</p>`,
  })
}
