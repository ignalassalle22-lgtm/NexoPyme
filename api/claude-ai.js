// api/claude-ai.js — Proxy seguro para llamadas a la API de Anthropic
import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { company_id, messages, system, model, max_tokens } = req.body
  if (!messages) return res.status(400).json({ error: 'messages requerido' })

  // Leer la API key global desde platform_config, con fallback a variable de entorno
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
  const { data } = await supabase
    .from('platform_config')
    .select('value')
    .eq('key', 'anthropic_key')
    .single()

  const apiKey = data?.value || process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'API Key de IA no configurada. El administrador debe configurarla en el Panel Administrativo.' })
  }

  try {
    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model:      model      || 'claude-haiku-4-5-20251001',
        max_tokens: max_tokens || 1000,
        ...(system ? { system } : {}),
        messages,
      })
    })

    const result = await anthropicRes.json()
    if (result.error) return res.status(400).json({ error: result.error.message })
    return res.status(200).json(result)
  } catch (e) {
    return res.status(500).json({ error: e.message })
  }
}
