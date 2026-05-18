// api/claude-ai.js — Proxy seguro para llamadas a la API de Anthropic
import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { company_id, messages, system, model, max_tokens } = req.body
  if (!company_id) return res.status(400).json({ error: 'company_id requerido' })
  if (!messages)   return res.status(400).json({ error: 'messages requerido' })

  // Leer la API key desde la tabla companies (service role para bypasear RLS)
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
  const { data } = await supabase
    .from('companies')
    .select('anthropic_key')
    .eq('id', company_id)
    .single()

  const apiKey = data?.anthropic_key || process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'API Key de IA no configurada. El administrador debe configurarla en ARCA → sección IA.' })
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
