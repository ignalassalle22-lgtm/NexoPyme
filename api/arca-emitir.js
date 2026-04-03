// api/arca-emitir.js — Solicita CAE a ARCA para una factura de venta
import { createClient } from '@supabase/supabase-js'
import { callWSFE, xmlTag } from '../lib/arca.js'

// CbteTipo por letra de comprobante
const TIPO_MAP = { A: 1, B: 6, C: 11 }

// Alicuota IVA: id ARCA según porcentaje
function ivaId(pct) {
  if (pct >= 20) return 5   // 21%
  if (pct >= 10) return 4   // 10.5%
  return 3                   // 0%
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { company_id, invoice_id } = req.body
  if (!company_id || !invoice_id) return res.status(400).json({ error: 'company_id e invoice_id requeridos' })

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

  const [{ data: co }, { data: inv }] = await Promise.all([
    supabase.from('companies').select('*').eq('id', company_id).single(),
    supabase.from('sale_invoices').select('*').eq('id', invoice_id).single()
  ])

  if (!co)  return res.status(404).json({ error: 'Empresa no encontrada' })
  if (!inv) return res.status(404).json({ error: 'Factura no encontrada' })
  if (!co.arca_token) return res.status(400).json({ error: 'Token ARCA no disponible. Llamá primero a /api/arca-token' })
  if (inv.cae) return res.status(400).json({ error: 'Esta factura ya tiene CAE: ' + inv.cae })

  const ambiente = co.arca_ambiente || 'homologacion'
  const ptoVta   = co.arca_punto_venta
  const cuit     = co.arca_cuit?.replace(/[-\s]/g, '')
  const letra    = (inv.tipo_comprobante || 'B').toUpperCase()
  const cbteTipo = TIPO_MAP[letra] || 6

  if (!ptoVta) return res.status(400).json({ error: 'Punto de venta no configurado' })
  if (!cuit)   return res.status(400).json({ error: 'CUIT de empresa no configurado' })

  // ── 1. Último número autorizado ──────────────────────────────────────────
  const lastXml = await callWSFE('FECompUltimoAutorizado', `
    <ar:FECompUltimoAutorizado>
      <ar:Auth>
        <ar:Token>${co.arca_token}</ar:Token>
        <ar:Sign>${co.arca_token_sign}</ar:Sign>
        <ar:Cuit>${cuit}</ar:Cuit>
      </ar:Auth>
      <ar:PtoVta>${ptoVta}</ar:PtoVta>
      <ar:CbteTipo>${cbteTipo}</ar:CbteTipo>
    </ar:FECompUltimoAutorizado>`, ambiente)

  const lastNum = parseInt(xmlTag(lastXml, 'CbteNro') || '0')
  const nextNum = lastNum + 1

  // ── 2. Importes ──────────────────────────────────────────────────────────
  const lines    = typeof inv.lines === 'string' ? JSON.parse(inv.lines) : (inv.lines || [])
  const impTotal = parseFloat((inv.total || 0).toFixed(2))
  let   impNeto  = parseFloat((inv.total_neto || impTotal).toFixed(2))
  let   impIVA   = parseFloat((inv.total_iva  || 0).toFixed(2))

  // Factura C (monotributista): sin IVA discriminado
  if (letra === 'C') { impNeto = impTotal; impIVA = 0 }

  // Calcular alicuota dominante para el bloque Iva
  const ivaPct = impNeto > 0 ? (impIVA / impNeto) * 100 : 21
  const ivaIdVal = ivaId(ivaPct)

  const ivaBlock = letra !== 'C' && impIVA > 0 ? `
      <ar:Iva>
        <ar:AlicIva>
          <ar:Id>${ivaIdVal}</ar:Id>
          <ar:BaseImp>${impNeto.toFixed(2)}</ar:BaseImp>
          <ar:Importe>${impIVA.toFixed(2)}</ar:Importe>
        </ar:AlicIva>
      </ar:Iva>` : ''

  // ── 3. Receptor ──────────────────────────────────────────────────────────
  // client_cuit viene de la factura (si existe)
  const clientCuit = (inv.client_cuit || '').replace(/[-\s]/g, '')
  const docTipo = clientCuit ? 80 : 99    // 80=CUIT, 99=Consumidor Final
  const docNro  = clientCuit ? clientCuit : 0

  const fecha = (inv.date || new Date().toISOString()).slice(0, 10).replace(/-/g, '')

  // ── 4. FECAESolicitar ────────────────────────────────────────────────────
  const caeXml = await callWSFE('FECAESolicitar', `
    <ar:FECAESolicitar>
      <ar:Auth>
        <ar:Token>${co.arca_token}</ar:Token>
        <ar:Sign>${co.arca_token_sign}</ar:Sign>
        <ar:Cuit>${cuit}</ar:Cuit>
      </ar:Auth>
      <ar:FeCAEReq>
        <ar:FeCabReq>
          <ar:CantReg>1</ar:CantReg>
          <ar:PtoVta>${ptoVta}</ar:PtoVta>
          <ar:CbteTipo>${cbteTipo}</ar:CbteTipo>
        </ar:FeCabReq>
        <ar:FeDetReq>
          <ar:FECAEDetRequest>
            <ar:Concepto>1</ar:Concepto>
            <ar:DocTipo>${docTipo}</ar:DocTipo>
            <ar:DocNro>${docNro}</ar:DocNro>
            <ar:CbteDesde>${nextNum}</ar:CbteDesde>
            <ar:CbteHasta>${nextNum}</ar:CbteHasta>
            <ar:CbteFch>${fecha}</ar:CbteFch>
            <ar:ImpTotal>${impTotal.toFixed(2)}</ar:ImpTotal>
            <ar:ImpTotConc>0.00</ar:ImpTotConc>
            <ar:ImpNeto>${impNeto.toFixed(2)}</ar:ImpNeto>
            <ar:ImpOpEx>0.00</ar:ImpOpEx>
            <ar:ImpIVA>${impIVA.toFixed(2)}</ar:ImpIVA>
            <ar:ImpTrib>0.00</ar:ImpTrib>
            <ar:MonId>PES</ar:MonId>
            <ar:MonCotiz>1</ar:MonCotiz>
            ${ivaBlock}
          </ar:FECAEDetRequest>
        </ar:FeDetReq>
      </ar:FeCAEReq>
    </ar:FECAESolicitar>`, ambiente)

  const resultado = xmlTag(caeXml, 'Resultado')
  const cae       = xmlTag(caeXml, 'CAE')
  const caeVto    = xmlTag(caeXml, 'CAEFchVto')   // YYYYMMDD
  const errMsg    = xmlTag(caeXml, 'Msg') || xmlTag(caeXml, 'faultstring') || 'ARCA rechazó el comprobante'

  if (resultado !== 'A' || !cae) {
    return res.status(400).json({ error: errMsg, raw: caeXml })
  }

  // Formatear vencimiento CAE: YYYYMMDD → YYYY-MM-DD
  const caeVtoFmt = caeVto
    ? `${caeVto.slice(0,4)}-${caeVto.slice(4,6)}-${caeVto.slice(6,8)}`
    : null

  // ── 5. Guardar en DB ─────────────────────────────────────────────────────
  await supabase.from('sale_invoices').update({
    cae,
    cae_vto: caeVtoFmt,
    arca_numero: nextNum
  }).eq('id', invoice_id)

  return res.status(200).json({ success: true, cae, caeVto: caeVtoFmt, numero: nextNum })
}
