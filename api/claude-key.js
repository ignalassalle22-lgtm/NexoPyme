// api/claude-key.js — Leer / guardar la API key de Anthropic por empresa
import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

  // GET — verificar si hay key configurada (no devolver la key en sí)
  if (req.method === 'GET') {
    const { company_id } = req.query
    if (!company_id) return res.status(400).json({ error: 'company_id requerido' })

    const { data, error } = await supabase
      .from('companies')
      .select('anthropic_key')
      .eq('id', company_id)
      .single()

    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ configured: !!(data?.anthropic_key) })
  }

  // POST — guardar la key
  if (req.method === 'POST') {
    const { company_id, key } = req.body
    if (!company_id) return res.status(400).json({ error: 'company_id requerido' })
    if (!key || !key.startsWith('sk-ant-')) {
      return res.status(400).json({ error: 'La key debe empezar con sk-ant-' })
    }

    const { error } = await supabase
      .from('companies')
      .update({ anthropic_key: key })
      .eq('id', company_id)

    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ success: true })
  }

  // DELETE — borrar la key
  if (req.method === 'DELETE') {
    const { company_id } = req.body
    if (!company_id) return res.status(400).json({ error: 'company_id requerido' })

    const { error } = await supabase
      .from('companies')
      .update({ anthropic_key: null })
      .eq('id', company_id)

    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ success: true })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
