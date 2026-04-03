// api/arca-token.js — Obtiene / refresca el token WSAA para una empresa
import { createClient } from '@supabase/supabase-js'
import { buildTRA, signTRA, callWSAA } from '../lib/arca.js'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { company_id } = req.body
  if (!company_id) return res.status(400).json({ error: 'company_id requerido' })

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

  const { data: co, error } = await supabase
    .from('companies')
    .select('arca_cert, arca_key, arca_ambiente, arca_token, arca_token_sign, arca_token_exp')
    .eq('id', company_id)
    .single()

  if (error || !co) return res.status(404).json({ error: 'Empresa no encontrada' })
  if (!co.arca_cert || !co.arca_key) return res.status(400).json({ error: 'ARCA no configurado: falta certificado o clave privada' })

  // Reusar token si le quedan más de 5 minutos de vida
  if (co.arca_token && co.arca_token_exp) {
    const exp = new Date(co.arca_token_exp)
    if (exp > new Date(Date.now() + 5 * 60 * 1000)) {
      return res.status(200).json({ token: co.arca_token, sign: co.arca_token_sign })
    }
  }

  try {
    const tra     = buildTRA('wsfe')
    const cms     = signTRA(tra, co.arca_cert, co.arca_key)
    const { token, sign, expiration } = await callWSAA(cms, co.arca_ambiente || 'homologacion')

    await supabase.from('companies').update({
      arca_token: token,
      arca_token_sign: sign,
      arca_token_exp: expiration
    }).eq('id', company_id)

    return res.status(200).json({ token, sign })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
