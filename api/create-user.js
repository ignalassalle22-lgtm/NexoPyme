import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { request_id, email, password, company_id, company_name, role, display_name } = req.body

  if (!email || !password || !company_id || !request_id) {
    return res.status(400).json({ error: 'Faltan datos requeridos' })
  }

  const supabaseAdmin = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  // 1. Crear el usuario en Supabase Auth correctamente
  const { data, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { display_name: display_name || email }
  })

  if (authError) return res.status(400).json({ error: authError.message })

  const userId = data.user.id

  // 2. Crear/actualizar el profile
  const { error: profileError } = await supabaseAdmin.from('profiles').upsert({
    id: userId,
    company_id,
    role: role || 'user',
    display_name: display_name || null,
    active: true,
    email
  })

  if (profileError) {
    // Rollback: borrar el usuario de auth
    await supabaseAdmin.auth.admin.deleteUser(userId)
    return res.status(400).json({ error: profileError.message })
  }

  // 3. Marcar la solicitud como aprobada
  await supabaseAdmin.from('user_requests').update({ status: 'approved' }).eq('id', request_id)

  return res.status(200).json({ success: true, user_id: userId })
}
