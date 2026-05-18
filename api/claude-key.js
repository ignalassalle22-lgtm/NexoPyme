// api/claude-key.js — Leer / guardar la API key global de Anthropic (platform_config)
import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

  // GET — verificar si hay key configurada (sin devolver el valor)
  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('platform_config')
      .select('value')
      .eq('key', 'anthropic_key')
      .single()

    if (error && error.code !== 'PGRST116') return res.status(500).json({ error: error.message })
    return res.status(200).json({ configured: !!(data?.value) })
  }

  // POST — guardar la key
  if (req.method === 'POST') {
    const { key } = req.body
    if (!key || !key.startsWith('sk-ant-')) {
      return res.status(400).json({ error: 'La key debe empezar con sk-ant-' })
    }

    const { error } = await supabase
      .from('platform_config')
      .upsert({ key: 'anthropic_key', value: key, updated_at: new Date().toISOString() }, { onConflict: 'key' })

    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ success: true })
  }

  // DELETE — borrar la key
  if (req.method === 'DELETE') {
    const { error } = await supabase
      .from('platform_config')
      .update({ value: null, updated_at: new Date().toISOString() })
      .eq('key', 'anthropic_key')

    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ success: true })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
