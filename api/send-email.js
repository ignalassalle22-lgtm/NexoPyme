import nodemailer from 'nodemailer'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { to, subject, html } = req.body
  if (!to || !subject || !html) return res.status(400).json({ error: 'Faltan campos: to, subject, html' })

  const gmailUser = process.env.GMAIL_USER
  const gmailPass = process.env.GMAIL_APP_PASSWORD
  if (!gmailUser || !gmailPass) return res.status(500).json({ error: 'GMAIL_USER o GMAIL_APP_PASSWORD no configurados' })

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: gmailUser, pass: gmailPass },
  })

  try {
    await transporter.sendMail({
      from: `NexoPyme <${gmailUser}>`,
      to,
      subject,
      html,
    })
    return res.status(200).json({ ok: true })
  } catch (e) {
    return res.status(500).json({ error: e.message })
  }
}
