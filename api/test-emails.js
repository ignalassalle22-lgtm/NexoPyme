import nodemailer from 'nodemailer'

const TEST_TO = 'nexo.pyme.admin@gmail.com'

const emails = [
  {
    subject: '[TEST] ¡Tu cuenta en NexoPyme fue aprobada!',
    html: `<div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px">
      <h2 style="color:#2ea043">¡Cuenta aprobada!</h2>
      <p>Hola <strong>Juan Pérez</strong>,</p>
      <p>Tu empresa <strong>Distribuidora San Martín S.A.</strong> fue aprobada en NexoPyme. Ya podés ingresar con tu email y contraseña.</p>
      <a href="https://nexopyme.vercel.app" style="display:inline-block;margin-top:16px;background:#2ea043;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700">Ingresar a NexoPyme →</a>
      <p style="margin-top:24px;color:#666;font-size:13px">Si tenés alguna consulta, respondé este email.</p>
    </div>`,
  },
  {
    subject: '[TEST] Solicitud de acceso a NexoPyme',
    html: `<div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px">
      <h2 style="color:#f85149">Solicitud no aprobada</h2>
      <p>Hola <strong>Juan Pérez</strong>,</p>
      <p>Lamentablemente la solicitud de acceso para <strong>Distribuidora San Martín S.A.</strong> no fue aprobada en esta oportunidad.</p>
      <div style="background:#2d0f0e;border-left:4px solid #f85149;padding:12px 16px;border-radius:6px;margin:16px 0">
        <strong style="color:#f85149">Motivo:</strong><br/>
        <span style="color:#e6edf3">La documentación presentada no es suficiente para habilitar la cuenta.</span>
      </div>
      <p style="color:#666;font-size:13px">Si creés que hay un error o querés más información, respondé este email.</p>
    </div>`,
  },
  {
    subject: '[TEST] Tu cuenta en NexoPyme fue suspendida',
    html: `<div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px">
      <h2 style="color:#f85149">Cuenta suspendida</h2>
      <p>Hola <strong>Juan Pérez</strong>,</p>
      <p>Tu cuenta de <strong>Distribuidora San Martín S.A.</strong> en NexoPyme fue suspendida temporalmente por el administrador.</p>
      <p style="color:#666;font-size:13px">Si creés que es un error o querés más información, respondé este email.</p>
    </div>`,
  },
  {
    subject: '[TEST] ¡Tu usuario en NexoPyme fue habilitado!',
    html: `<div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px">
      <h2 style="color:#2ea043">¡Usuario habilitado!</h2>
      <p>Hola <strong>María García</strong>,</p>
      <p>Tu usuario fue habilitado en NexoPyme para la empresa <strong>Distribuidora San Martín S.A.</strong></p>
      <p style="margin:8px 0"><strong>Email:</strong> maria.garcia@empresa.com</p>
      <a href="https://nexopyme.vercel.app" style="display:inline-block;margin-top:16px;background:#2ea043;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700">Ingresar a NexoPyme →</a>
      <p style="margin-top:24px;color:#666;font-size:13px">Si tenés alguna consulta, respondé este email.</p>
    </div>`,
  },
  {
    subject: '[TEST] Solicitud de usuario en NexoPyme',
    html: `<div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px">
      <h2 style="color:#f85149">Solicitud no aprobada</h2>
      <p>Hola <strong>María García</strong>,</p>
      <p>Tu solicitud de usuario para <strong>Distribuidora San Martín S.A.</strong> no fue aprobada en esta oportunidad.</p>
      <div style="background:#2d0f0e;border-left:4px solid #f85149;padding:12px 16px;border-radius:6px;margin:16px 0">
        <strong style="color:#f85149">Motivo:</strong><br/>
        <span style="color:#e6edf3">El rol solicitado no está disponible para esta empresa.</span>
      </div>
      <p style="color:#666;font-size:13px">Si tenés alguna consulta, respondé este email.</p>
    </div>`,
  },
]

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const gmailUser = process.env.GMAIL_USER
  const gmailPass = process.env.GMAIL_APP_PASSWORD
  if (!gmailUser || !gmailPass) return res.status(500).json({ error: 'GMAIL_USER o GMAIL_APP_PASSWORD no configurados' })

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: gmailUser, pass: gmailPass },
  })

  const results = []
  for (const email of emails) {
    try {
      await transporter.sendMail({ from: `NexoPyme <${gmailUser}>`, to: TEST_TO, subject: email.subject, html: email.html })
      results.push({ subject: email.subject, status: 'enviado' })
    } catch (e) {
      results.push({ subject: email.subject, status: 'error', error: e.message })
    }
  }

  return res.status(200).json({ resultados: results })
}
