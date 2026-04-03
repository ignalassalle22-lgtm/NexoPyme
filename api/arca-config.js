// api/arca-config.js — Guardar / consultar configuración ARCA por empresa
import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') return res.status(200).end()

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

  // GET — leer config (sin devolver la clave privada)
  if (req.method === 'GET') {
    const { company_id } = req.query
    if (!company_id) return res.status(400).json({ error: 'company_id requerido' })

    const { data, error } = await supabase
      .from('companies')
      .select('arca_cuit, arca_punto_venta, arca_ambiente, arca_cert, arca_token_exp')
      .eq('id', company_id)
      .single()

    if (error || !data) return res.status(404).json({ error: 'Empresa no encontrada' })

    return res.status(200).json({
      cuit:      data.arca_cuit      || null,
      ptoVta:    data.arca_punto_venta || null,
      ambiente:  data.arca_ambiente  || 'homologacion',
      tieneCert: !!data.arca_cert,
      tokenExp:  data.arca_token_exp || null
    })
  }

  // POST — guardar config
  if (req.method === 'POST') {
    const { company_id, cuit, pto_venta, ambiente, cert, key } = req.body
    if (!company_id) return res.status(400).json({ error: 'company_id requerido' })

    const updates = {}
    if (cuit      !== undefined) updates.arca_cuit          = cuit
    if (pto_venta !== undefined) updates.arca_punto_venta   = parseInt(pto_venta) || null
    if (ambiente  !== undefined) updates.arca_ambiente      = ambiente
    if (cert      !== undefined) updates.arca_cert          = cert
    if (key       !== undefined) updates.arca_key           = key

    // Si cambia cert o key, invalidar token cacheado
    if (cert !== undefined || key !== undefined) {
      updates.arca_token     = null
      updates.arca_token_sign = null
      updates.arca_token_exp  = null
    }

    const { error } = await supabase.from('companies').update(updates).eq('id', company_id)
    if (error) return res.status(500).json({ error: error.message })

    return res.status(200).json({ success: true })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
