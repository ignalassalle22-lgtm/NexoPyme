import nodemailer from 'nodemailer'
import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { email } = req.body
  if (!email) return res.status(400).json({ error: 'Email requerido' })

  const supabaseUrl = process.env.SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceKey) return res.status(500).json({ error: 'Configuración de Supabase incompleta' })

  const gmailUser = process.env.GMAIL_USER
  const gmailPass = process.env.GMAIL_APP_PASSWORD
  if (!gmailUser || !gmailPass) return res.status(500).json({ error: 'Configuración de Gmail incompleta' })

  // Generar link de recovery con la clave de servicio (seguro, solo backend)
  const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  })

  const { data, error } = await supabaseAdmin.auth.admin.generateLink({
    type: 'recovery',
    email,
    options: { redirectTo: 'https://nexopyme.vercel.app' },
  })

  if (error) {
    // No revelar si el email existe o no (seguridad)
    return res.status(200).json({ ok: true })
  }

  const resetLink = data?.properties?.action_link
  if (!resetLink) return res.status(200).json({ ok: true })

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: gmailUser, pass: gmailPass },
  })

  try {
    await transporter.sendMail({
      from: `NexoPyme <${gmailUser}>`,
      to: email,
      subject: 'Restablecer contraseña - NexoPyme',
      html: `<div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px">
        <h2 style="color:#2ea043">Restablecer contraseña</h2>
        <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta en NexoPyme.</p>
        <p>Hacé click en el botón para crear una nueva contraseña:</p>
        <a href="${resetLink}" style="display:inline-block;margin-top:16px;background:#2ea043;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700">Restablecer contraseña →</a>
        <p style="margin-top:24px;color:#666;font-size:13px">Si no solicitaste este cambio, ignorá este email. El link expira en 24 horas.</p>
      </div>`,
    })
  } catch (e) {
    return res.status(500).json({ error: 'Error al enviar el email: ' + e.message })
  }

  return res.status(200).json({ ok: true })
}
