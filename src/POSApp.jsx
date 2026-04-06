import { useState, useEffect, useRef } from 'react'
import { supabase } from './lib/supabase'
import * as XLSX from 'xlsx-js-style'

const T = {
  bg: "#0d1117", paper: "#161b22", surface: "#1c2333",
  surface2: "#212836", border: "#2a3441", border2: "#1e2d3d",
  ink: "#e6edf3", muted: "#7d8590", faint: "#3d4a5c",
  accent: "#2ea043", accentLight: "#0d2818",
  yellow: "#e3b341", yellowLight: "#2d1f02",
  red: "#f85149", redLight: "#2d0f0e",
  blue: "#58a6ff", blueLight: "#0c1d33",
}

const fmt = (n) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 }).format(n || 0)
const todayStr = () => new Date().toISOString().slice(0, 10)

const labelStyle = { fontSize: 11, fontWeight: 700, color: T.muted, letterSpacing: 0.5, display: 'block', marginBottom: 6 }
const inputStyle = { width: '100%', background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: '10px 12px', color: T.ink, fontSize: 14, outline: 'none', fontFamily: 'inherit' }
const btnPrimary = { background: T.accent, color: '#fff', border: 'none', borderRadius: 8, padding: '10px 18px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700, fontSize: 13 }

// ─── MODAL ─────────────────────────────────────────────────────────────────────
function Modal({ title, onClose, children, width = 480 }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: '#00000085', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ width, background: T.paper, border: `1px solid ${T.border}`, borderRadius: 14, padding: '28px 28px 24px', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: T.ink }}>{title}</div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: T.muted, cursor: 'pointer', fontSize: 18, lineHeight: 1 }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}

// ─── TICKET VIEW (formato boleta) ──────────────────────────────────────────────
function TicketView({ ticket, companyName }) {
  const lines = ticket.lines || []
  const calculos = lines.reduce((acc, l) => {
    const neto = (l.precio / (1 + l.iva / 100)) * l.qty
    const iva = l.precio * l.qty - neto
    if (!acc.ivaDesglose[l.iva]) acc.ivaDesglose[l.iva] = 0
    acc.ivaDesglose[l.iva] += iva
    return acc
  }, { ivaDesglose: {} })

  const metodoLabel = {
    efectivo: 'Efectivo', debito: 'Tarjeta Débito', credito: 'Tarjeta Crédito',
    transferencia: 'Transferencia', qr: 'QR / Mercado Pago', cuenta_corriente: 'Cuenta Corriente',
  }[ticket.metodo_pago] || ticket.metodo_pago

  return (
    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: T.ink, background: '#0d1117', borderRadius: 8, padding: '16px', border: `1px solid ${T.border}` }}>
      <div style={{ textAlign: 'center', marginBottom: 12, borderBottom: `1px dashed ${T.border}`, paddingBottom: 12 }}>
        <div style={{ fontWeight: 800, fontSize: 16, letterSpacing: 1 }}>NEXOPOS</div>
        <div style={{ color: T.muted, fontSize: 11, marginTop: 2 }}>{companyName || ''}</div>
        <div style={{ color: T.muted, fontSize: 11, marginTop: 4 }}>
          {new Date(ticket.created_at).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })}
        </div>
        <div style={{ fontWeight: 700, fontSize: 14, color: T.accent, marginTop: 6 }}>{ticket.numero}</div>
        {ticket.estado === 'anulado' && (
          <div style={{ color: T.red, fontWeight: 800, marginTop: 6, letterSpacing: 2 }}>★ ANULADO ★</div>
        )}
      </div>
      <div style={{ marginBottom: 12, borderBottom: `1px dashed ${T.border}`, paddingBottom: 12 }}>
        {lines.map((l, i) => (
          <div key={i} style={{ marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ flex: 1, paddingRight: 8 }}>{l.nombre}</span>
              <span style={{ fontWeight: 700 }}>{fmt(l.precio * l.qty)}</span>
            </div>
            <div style={{ color: T.muted, fontSize: 10 }}>
              {l.qty} × {fmt(l.precio)} · IVA {l.iva}%
            </div>
          </div>
        ))}
      </div>
      <div style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', color: T.muted, marginBottom: 3 }}>
          <span>Neto gravado:</span><span>{fmt(ticket.subtotal_neto)}</span>
        </div>
        {Object.entries(calculos.ivaDesglose).map(([tasa, monto]) => (
          <div key={tasa} style={{ display: 'flex', justifyContent: 'space-between', color: T.muted, marginBottom: 3 }}>
            <span>IVA {tasa}%:</span><span>{fmt(monto)}</span>
          </div>
        ))}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 16, color: T.accent, marginTop: 8, paddingTop: 8, borderTop: `1px dashed ${T.border}` }}>
          <span>TOTAL</span><span>{fmt(ticket.total)}</span>
        </div>
      </div>
      <div style={{ textAlign: 'center', color: T.muted, fontSize: 10, borderTop: `1px dashed ${T.border}`, paddingTop: 8 }}>
        {metodoLabel} · {ticket.cajero_nombre || ''}
        <br />Documento no válido como factura fiscal
      </div>
    </div>
  )
}

// ─── POS APP ──────────────────────────────────────────────────────────────────
export default function POSApp({ profile, onLogout }) {
  const companyId = profile.company_id

  // ── Data ─────────────────────────────────────────────────────────
  const [productos, setProductos] = useState([])
  const [cajaActual, setCajaActual] = useState(null)
  const [tickets, setTickets] = useState([])
  const [movimientos, setMovimientos] = useState([])
  const [loading, setLoading] = useState(true)

  // ── Ticket builder ───────────────────────────────────────────────
  const [lineas, setLineas] = useState([])
  const [metodoPago, setMetodoPago] = useState('efectivo')
  const [search, setSearch] = useState('')
  const [ticketConfirmado, setTicketConfirmado] = useState(null)
  const searchRef = useRef(null)

  // ── Tabs ─────────────────────────────────────────────────────────
  const [tab, setTab] = useState('venta')

  // ── Caja forms ───────────────────────────────────────────────────
  const [showAbrirCaja, setShowAbrirCaja] = useState(false)
  const [turno, setTurno] = useState('mañana')
  const [montoInicial, setMontoInicial] = useState('0')
  const [showCerrarCaja, setShowCerrarCaja] = useState(false)
  const [montoFinal, setMontoFinal] = useState('')
  const [obsCierre, setObsCierre] = useState('')

  // ── Movimiento manual ────────────────────────────────────────────
  const [showMovimiento, setShowMovimiento] = useState(false)
  const [movTipo, setMovTipo] = useState('ingreso')
  const [movConcepto, setMovConcepto] = useState('')
  const [movMonto, setMovMonto] = useState('')

  // ── Anular / detalle ─────────────────────────────────────────────
  const [anulando, setAnulando] = useState(null)
  const [anulandoMotivo, setAnulandoMotivo] = useState('')
  const [ticketDetalle, setTicketDetalle] = useState(null)
  const [ticketFecha, setTicketFecha] = useState(todayStr())

  // ── Stock search ─────────────────────────────────────────────────
  const [stockSearch, setStockSearch] = useState('')

  // ── Init ─────────────────────────────────────────────────────────
  useEffect(() => { loadAll() }, [])

  const loadAll = async () => {
    setLoading(true)
    const [prods, cajas, ticks] = await Promise.all([
      supabase.from('products').select('*').eq('company_id', companyId).order('name'),
      supabase.from('pos_cajas').select('*').eq('company_id', companyId).eq('estado', 'abierta').order('abierta_at', { ascending: false }).limit(1),
      supabase.from('pos_tickets').select('*').eq('company_id', companyId).eq('fecha', todayStr()).order('created_at', { ascending: false }),
    ])
    if (prods.data) setProductos(prods.data)
    if (cajas.data?.length) {
      const caja = cajas.data[0]
      setCajaActual(caja)
      const movs = await supabase.from('pos_caja_movimientos').select('*').eq('caja_id', caja.id).order('created_at')
      if (movs.data) setMovimientos(movs.data)
    }
    if (ticks.data) setTickets(ticks.data)
    setLoading(false)
  }

  const loadTickets = async (fecha) => {
    const { data } = await supabase.from('pos_tickets').select('*').eq('company_id', companyId).eq('fecha', fecha).order('created_at', { ascending: false })
    if (data) setTickets(data)
  }

  // ── Precio POS (usa lista_a como default) ────────────────────────
  const getPosPrice = (prod) => {
    const prices = prod.prices || {}
    return prices.lista_a || prices[Object.keys(prices)[0]] || prod.cost || 0
  }

  // ── Ticket builder ───────────────────────────────────────────────
  const addProduct = (prod) => {
    if ((prod.stock || 0) <= 0) {
      if (!window.confirm(`${prod.name} no tiene stock. ¿Agregar igual?`)) return
    }
    setLineas(prev => {
      const ex = prev.find(l => l.productId === prod.id)
      if (ex) return prev.map(l => l.productId === prod.id ? { ...l, qty: l.qty + 1 } : l)
      return [...prev, { productId: prod.id, nombre: prod.name, qty: 1, precio: getPosPrice(prod), iva: prod.iva || 21, unit: prod.unit || 'unidad' }]
    })
  }

  const updateQty = (productId, qty) => {
    const n = parseFloat(qty)
    if (isNaN(n) || n <= 0) setLineas(prev => prev.filter(l => l.productId !== productId))
    else setLineas(prev => prev.map(l => l.productId === productId ? { ...l, qty: n } : l))
  }

  const updatePrecio = (productId, precio) => {
    setLineas(prev => prev.map(l => l.productId === productId ? { ...l, precio: parseFloat(precio) || 0 } : l))
  }

  const calculos = lineas.reduce((acc, l) => {
    const neto = (l.precio / (1 + l.iva / 100)) * l.qty
    const iva = l.precio * l.qty - neto
    acc.neto += neto
    acc.iva += iva
    acc.total += l.precio * l.qty
    if (!acc.ivaDesglose[l.iva]) acc.ivaDesglose[l.iva] = 0
    acc.ivaDesglose[l.iva] += iva
    return acc
  }, { neto: 0, iva: 0, total: 0, ivaDesglose: {} })

  // ── Cobrar ───────────────────────────────────────────────────────
  const cobrar = async () => {
    if (!lineas.length || !cajaActual) return
    const { count } = await supabase.from('pos_tickets').select('id', { count: 'exact', head: true }).eq('company_id', companyId)
    const numero = `T-${String((count || 0) + 1).padStart(4, '0')}`

    const ticketData = {
      company_id: companyId,
      numero,
      fecha: todayStr(),
      cajero_id: profile.id,
      cajero_nombre: profile.display_name || profile.email,
      caja_id: cajaActual.id,
      lines: lineas,
      subtotal_neto: Math.round(calculos.neto * 100) / 100,
      iva_total: Math.round(calculos.iva * 100) / 100,
      total: Math.round(calculos.total * 100) / 100,
      metodo_pago: metodoPago,
      estado: 'emitido',
    }

    const { data, error } = await supabase.from('pos_tickets').insert(ticketData).select().single()
    if (error) { alert('Error al guardar ticket: ' + error.message); return }

    // Movimiento en caja
    const newMov = { company_id: companyId, caja_id: cajaActual.id, tipo: 'venta', concepto: `Ticket ${numero}`, monto: ticketData.total }
    await supabase.from('pos_caja_movimientos').insert(newMov)

    // Descontar stock
    for (const linea of lineas) {
      const prod = productos.find(p => p.id === linea.productId)
      if (prod) {
        const ns = (prod.stock || 0) - linea.qty
        await supabase.from('products').update({ stock: ns }).eq('id', prod.id)
        setProductos(prev => prev.map(p => p.id === prod.id ? { ...p, stock: ns } : p))
      }
    }

    setTickets(prev => [data, ...prev])
    setMovimientos(prev => [...prev, { ...newMov, created_at: new Date().toISOString() }])
    setTicketConfirmado(data)
    setLineas([])
    setMetodoPago('efectivo')
    if (searchRef.current) searchRef.current.focus()
  }

  // ── Abrir caja ───────────────────────────────────────────────────
  const abrirCaja = async () => {
    const monto = parseFloat(montoInicial) || 0
    const { data, error } = await supabase.from('pos_cajas').insert({
      company_id: companyId, fecha: todayStr(), turno,
      cajero_id: profile.id, cajero_nombre: profile.display_name || profile.email,
      monto_inicial: monto, estado: 'abierta', abierta_at: new Date().toISOString(),
    }).select().single()
    if (error) { alert('Error: ' + error.message); return }
    const mov = { company_id: companyId, caja_id: data.id, tipo: 'apertura', concepto: 'Apertura de caja', monto }
    await supabase.from('pos_caja_movimientos').insert(mov)
    setCajaActual(data)
    setMovimientos([{ ...mov, created_at: new Date().toISOString() }])
    setShowAbrirCaja(false)
    setMontoInicial('0')
    setTab('venta')
  }

  // ── Cerrar caja ──────────────────────────────────────────────────
  const cerrarCaja = async () => {
    const monto = parseFloat(montoFinal) || 0
    const { error } = await supabase.from('pos_cajas').update({
      estado: 'cerrada', monto_final: monto,
      cerrada_at: new Date().toISOString(), observaciones: obsCierre,
    }).eq('id', cajaActual.id)
    if (error) { alert('Error: ' + error.message); return }
    await supabase.from('pos_caja_movimientos').insert({
      company_id: companyId, caja_id: cajaActual.id, tipo: 'cierre', concepto: 'Cierre de caja', monto,
    })
    setCajaActual(null); setMovimientos([])
    setShowCerrarCaja(false); setMontoFinal(''); setObsCierre('')
  }

  // ── Movimiento manual ────────────────────────────────────────────
  const agregarMovimiento = async () => {
    const monto = parseFloat(movMonto)
    if (!movConcepto.trim() || isNaN(monto) || monto <= 0) return
    const mov = { company_id: companyId, caja_id: cajaActual?.id, tipo: movTipo, concepto: movConcepto, monto }
    const { data, error } = await supabase.from('pos_caja_movimientos').insert(mov).select().single()
    if (error) { alert('Error: ' + error.message); return }
    setMovimientos(prev => [...prev, data])
    setShowMovimiento(false); setMovConcepto(''); setMovMonto('')
  }

  // ── Anular ticket ────────────────────────────────────────────────
  const anularTicket = async () => {
    if (!anulandoMotivo.trim()) return
    const { error } = await supabase.from('pos_tickets').update({ estado: 'anulado', anulado_motivo: anulandoMotivo }).eq('id', anulando.id)
    if (error) { alert('Error: ' + error.message); return }
    // Restaurar stock
    for (const linea of (anulando.lines || [])) {
      const prod = productos.find(p => p.id === linea.productId)
      if (prod) {
        const ns = (prod.stock || 0) + linea.qty
        await supabase.from('products').update({ stock: ns }).eq('id', prod.id)
        setProductos(prev => prev.map(p => p.id === prod.id ? { ...p, stock: ns } : p))
      }
    }
    // Movimiento de anulación
    if (cajaActual) {
      const mov = { company_id: companyId, caja_id: cajaActual.id, tipo: 'anulacion', concepto: `Anulación ${anulando.numero}`, monto: anulando.total }
      await supabase.from('pos_caja_movimientos').insert(mov)
      setMovimientos(prev => [...prev, { ...mov, created_at: new Date().toISOString() }])
    }
    setTickets(prev => prev.map(t => t.id === anulando.id ? { ...t, estado: 'anulado', anulado_motivo: anulandoMotivo } : t))
    setAnulando(null); setAnulandoMotivo('')
  }

  // ── Excel de stock ───────────────────────────────────────────────
  const downloadStock = () => {
    const rows = [
      ['SKU', 'Producto', 'Categoría', 'Unidad', 'Stock actual', 'Stock mínimo', 'Precio POS'],
      ...productos.map(p => [p.sku || '', p.name, p.category || '', p.unit || '', p.stock || 0, p.min_stock || p.minStock || 0, getPosPrice(p)])
    ]
    const ws = XLSX.utils.aoa_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Inventario')
    XLSX.writeFile(wb, `stock_pos_${todayStr()}.xlsx`)
  }

  // ── Caja balance ─────────────────────────────────────────────────
  const cajaBalance = movimientos.reduce((acc, m) => {
    if (m.tipo === 'ingreso' || m.tipo === 'venta' || m.tipo === 'apertura') return acc + (m.monto || 0)
    if (m.tipo === 'egreso' || m.tipo === 'anulacion') return acc - Math.abs(m.monto || 0)
    return acc
  }, 0)

  const filteredProducts = search.trim()
    ? productos.filter(p => {
        const q = search.toLowerCase()
        return p.name?.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q) || p.category?.toLowerCase().includes(q)
      })
    : productos

  const filteredStock = stockSearch.trim()
    ? productos.filter(p => {
        const q = stockSearch.toLowerCase()
        return p.name?.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q) || p.category?.toLowerCase().includes(q)
      })
    : productos

  if (loading) return (
    <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: T.bg, color: T.ink, fontFamily: "'DM Sans','Segoe UI',sans-serif" }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 26, fontWeight: 800, marginBottom: 12 }}><span style={{ color: T.accent }}>Nexo</span>POS</div>
        <div style={{ color: T.muted }}>Cargando…</div>
      </div>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: T.bg, fontFamily: "'DM Sans','Segoe UI',sans-serif", color: T.ink }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        input, select, button, textarea { font-family: inherit; }
        ::-webkit-scrollbar { width: 5px; } ::-webkit-scrollbar-thumb { background: ${T.faint}; border-radius: 3px; }
        input[type=date]::-webkit-calendar-picker-indicator { filter: invert(0.5); }
      `}</style>

      {/* ── HEADER ─────────────────────────────────────────────────── */}
      <div style={{ background: T.paper, borderBottom: `1px solid ${T.border}`, padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
        <div style={{ fontSize: 17, fontWeight: 800 }}><span style={{ color: T.accent }}>Nexo</span>POS</div>
        <div style={{ fontSize: 12, color: T.muted, paddingLeft: 12, borderLeft: `1px solid ${T.border}` }}>{profile.company_name}</div>
        {cajaActual
          ? <span style={{ fontSize: 11, background: T.accentLight, color: T.accent, borderRadius: 20, padding: '3px 10px', fontWeight: 700 }}>✓ Caja · {cajaActual.turno}</span>
          : <span style={{ fontSize: 11, background: T.redLight, color: T.red, borderRadius: 20, padding: '3px 10px', fontWeight: 700 }}>Sin caja abierta</span>
        }
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: T.muted }}>{profile.display_name || profile.email}</span>
          <button onClick={onLogout} style={{ background: 'transparent', border: `1px solid ${T.border}`, borderRadius: 6, padding: '5px 12px', color: T.muted, fontSize: 11, cursor: 'pointer' }}>
            Salir
          </button>
        </div>
      </div>

      {/* ── TABS ───────────────────────────────────────────────────── */}
      <div style={{ background: T.paper, borderBottom: `1px solid ${T.border}`, padding: '0 20px', display: 'flex', flexShrink: 0 }}>
        {[{ id: 'venta', label: '🏪 Venta' }, { id: 'tickets', label: '🧾 Tickets' }, { id: 'caja', label: '💰 Caja' }, { id: 'stock', label: '📦 Stock' }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            background: 'transparent', border: 'none', borderBottom: `3px solid ${tab === t.id ? T.accent : 'transparent'}`,
            color: tab === t.id ? T.ink : T.muted, padding: '11px 18px', cursor: 'pointer', fontFamily: 'inherit',
            fontSize: 13, fontWeight: tab === t.id ? 700 : 500,
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── CONTENT ────────────────────────────────────────────────── */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex' }}>

        {/* ══ VENTA TAB ══════════════════════════════════════════════ */}
        {tab === 'venta' && (
          !cajaActual ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ textAlign: 'center', maxWidth: 360 }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>💰</div>
                <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Sin caja abierta</div>
                <p style={{ color: T.muted, fontSize: 14, marginBottom: 24 }}>Para empezar a vender, primero abrí una caja.</p>
                <button onClick={() => setShowAbrirCaja(true)} style={btnPrimary}>Abrir caja →</button>
              </div>
            </div>
          ) : (
            <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
              {/* Productos */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', borderRight: `1px solid ${T.border}`, overflow: 'hidden' }}>
                <div style={{ padding: '12px 16px', borderBottom: `1px solid ${T.border}` }}>
                  <input
                    ref={searchRef}
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Buscar por nombre, SKU o categoría…"
                    autoFocus
                    style={{ ...inputStyle, padding: '9px 14px' }}
                  />
                </div>
                <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: 8, alignContent: 'start' }}>
                  {filteredProducts.map(prod => (
                    <button key={prod.id} onClick={() => addProduct(prod)} style={{
                      background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: '12px 10px',
                      cursor: 'pointer', textAlign: 'left', color: T.ink, fontFamily: 'inherit',
                      opacity: (prod.stock <= 0) ? 0.55 : 1,
                    }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = T.accent}
                      onMouseLeave={e => e.currentTarget.style.borderColor = T.border}
                    >
                      <div style={{ fontSize: 10, color: T.muted, marginBottom: 3 }}>{prod.sku || prod.category || '—'}</div>
                      <div style={{ fontSize: 12, fontWeight: 600, lineHeight: 1.35, marginBottom: 5 }}>{prod.name}</div>
                      <div style={{ fontSize: 15, fontWeight: 800, color: T.accent }}>{fmt(getPosPrice(prod))}</div>
                      <div style={{ fontSize: 10, color: (prod.stock <= (prod.min_stock || prod.minStock || 0)) ? T.red : T.muted, marginTop: 3 }}>
                        Stock: {prod.stock ?? 0} {prod.unit || ''}
                      </div>
                    </button>
                  ))}
                  {filteredProducts.length === 0 && (
                    <div style={{ gridColumn: '1/-1', color: T.muted, textAlign: 'center', padding: 32, fontSize: 13 }}>Sin resultados</div>
                  )}
                </div>
              </div>

              {/* Ticket panel */}
              <div style={{ width: 370, display: 'flex', flexDirection: 'column', background: T.paper, flexShrink: 0 }}>
                <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: T.muted, letterSpacing: 0.8, marginBottom: 10 }}>TICKET ACTUAL</div>
                  {lineas.length === 0 ? (
                    <div style={{ textAlign: 'center', color: T.muted, padding: '36px 0', fontSize: 13 }}>Seleccioná un producto para empezar</div>
                  ) : lineas.map(l => (
                    <div key={l.productId} style={{ background: T.surface, borderRadius: 8, padding: '10px 12px', marginBottom: 7, border: `1px solid ${T.border}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, flex: 1, paddingRight: 6 }}>{l.nombre}</span>
                        <button onClick={() => updateQty(l.productId, 0)} style={{ background: 'none', border: 'none', color: T.red, cursor: 'pointer', fontSize: 13 }}>✕</button>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <button onClick={() => updateQty(l.productId, l.qty - 1)} style={{ background: T.surface2, border: `1px solid ${T.border}`, borderRadius: 4, width: 24, height: 24, cursor: 'pointer', color: T.ink, fontSize: 14, lineHeight: 1 }}>−</button>
                        <input type="number" value={l.qty} min="0.01" step="any" onChange={e => updateQty(l.productId, e.target.value)}
                          style={{ width: 52, textAlign: 'center', background: T.surface2, border: `1px solid ${T.border}`, borderRadius: 4, padding: '3px', color: T.ink, fontSize: 13 }} />
                        <button onClick={() => updateQty(l.productId, l.qty + 1)} style={{ background: T.surface2, border: `1px solid ${T.border}`, borderRadius: 4, width: 24, height: 24, cursor: 'pointer', color: T.ink, fontSize: 14, lineHeight: 1 }}>+</button>
                        <input type="number" value={l.precio} min="0" step="0.01" onChange={e => updatePrecio(l.productId, e.target.value)}
                          style={{ flex: 1, background: T.surface2, border: `1px solid ${T.border}`, borderRadius: 4, padding: '4px 6px', color: T.accent, fontSize: 13, fontWeight: 700 }} />
                        <span style={{ fontSize: 11, color: T.muted, minWidth: 66, textAlign: 'right' }}>{fmt(l.precio * l.qty)}</span>
                      </div>
                      <div style={{ fontSize: 10, color: T.faint, marginTop: 3 }}>IVA {l.iva}%</div>
                    </div>
                  ))}
                </div>

                <div style={{ borderTop: `1px solid ${T.border}`, padding: '14px 16px' }}>
                  {lineas.length > 0 && (
                    <div style={{ background: T.surface, borderRadius: 8, padding: '10px 12px', marginBottom: 10, fontSize: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: T.muted, marginBottom: 3 }}>
                        <span>Neto:</span><span>{fmt(calculos.neto)}</span>
                      </div>
                      {Object.entries(calculos.ivaDesglose).map(([t, m]) => (
                        <div key={t} style={{ display: 'flex', justifyContent: 'space-between', color: T.muted, marginBottom: 3 }}>
                          <span>IVA {t}%:</span><span>{fmt(m)}</span>
                        </div>
                      ))}
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 15, color: T.accent, marginTop: 6, paddingTop: 6, borderTop: `1px solid ${T.border}` }}>
                        <span>TOTAL</span><span>{fmt(calculos.total)}</span>
                      </div>
                    </div>
                  )}

                  {/* Métodos de pago */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 5, marginBottom: 10 }}>
                    {[
                      { id: 'efectivo', label: '💵 Efectivo' },
                      { id: 'debito', label: '💳 Débito' },
                      { id: 'credito', label: '💳 Crédito' },
                      { id: 'transferencia', label: '🔀 Transf.' },
                      { id: 'qr', label: '📱 QR/MP' },
                      { id: 'cuenta_corriente', label: '📋 Cta. cte.' },
                    ].map(m => (
                      <button key={m.id} onClick={() => setMetodoPago(m.id)} style={{
                        background: metodoPago === m.id ? T.accentLight : T.surface,
                        border: `1px solid ${metodoPago === m.id ? T.accent : T.border}`,
                        borderRadius: 6, padding: '7px 4px', cursor: 'pointer', fontFamily: 'inherit',
                        fontSize: 11, color: metodoPago === m.id ? T.accent : T.muted, fontWeight: metodoPago === m.id ? 700 : 500,
                      }}>
                        {m.label}
                      </button>
                    ))}
                  </div>

                  <button onClick={cobrar} disabled={lineas.length === 0} style={{
                    ...btnPrimary, width: '100%', padding: '13px', fontSize: 15,
                    opacity: lineas.length === 0 ? 0.4 : 1, cursor: lineas.length === 0 ? 'not-allowed' : 'pointer',
                  }}>
                    Cobrar {lineas.length > 0 ? fmt(calculos.total) : ''}
                  </button>
                  {lineas.length > 0 && (
                    <button onClick={() => setLineas([])} style={{ width: '100%', background: 'transparent', border: `1px solid ${T.border}`, borderRadius: 8, padding: '7px', color: T.muted, fontSize: 12, cursor: 'pointer', marginTop: 5, fontFamily: 'inherit' }}>
                      Limpiar ticket
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        )}

        {/* ══ TICKETS TAB ════════════════════════════════════════════ */}
        {tab === 'tickets' && (
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 17, fontWeight: 700 }}>Tickets</div>
              <input type="date" value={ticketFecha} onChange={e => { setTicketFecha(e.target.value); loadTickets(e.target.value) }}
                style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: '7px 10px', color: T.ink, fontSize: 13, outline: 'none' }} />
              <button onClick={() => loadTickets(ticketFecha)} style={{ ...btnPrimary, padding: '7px 14px', fontSize: 12 }}>↻</button>
            </div>
            {/* Resumen del día */}
            {tickets.length > 0 && (() => {
              const vigentes = tickets.filter(t => t.estado !== 'anulado')
              const totalDia = vigentes.reduce((s, t) => s + (t.total || 0), 0)
              return (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 20, maxWidth: 600 }}>
                  {[
                    { label: 'Tickets emitidos', value: vigentes.length },
                    { label: 'Anulados', value: tickets.filter(t => t.estado === 'anulado').length },
                    { label: 'Total del día', value: fmt(totalDia), accent: true },
                  ].map(s => (
                    <div key={s.label} style={{ background: T.paper, border: `1px solid ${T.border}`, borderRadius: 10, padding: '14px' }}>
                      <div style={{ fontSize: 10, color: T.muted, fontWeight: 700, letterSpacing: 0.5, marginBottom: 5 }}>{s.label.toUpperCase()}</div>
                      <div style={{ fontSize: 17, fontWeight: 800, color: s.accent ? T.accent : T.ink }}>{s.value}</div>
                    </div>
                  ))}
                </div>
              )
            })()}

            {tickets.length === 0
              ? <div style={{ color: T.muted, fontSize: 13, padding: '30px 0' }}>No hay tickets para esta fecha</div>
              : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 7, maxWidth: 740 }}>
                  {tickets.map(t => (
                    <div key={t.id} style={{ background: T.paper, border: `1px solid ${t.estado === 'anulado' ? T.red : T.border}`, borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 14, opacity: t.estado === 'anulado' ? 0.55 : 1 }}>
                      <div style={{ minWidth: 64 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: t.estado === 'anulado' ? T.red : T.accent }}>{t.numero}</div>
                        <div style={{ fontSize: 10, color: T.muted }}>{new Date(t.created_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</div>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 700 }}>{fmt(t.total)}</div>
                        <div style={{ fontSize: 11, color: T.muted }}>{t.metodo_pago} · {t.lines?.length || 0} ítem(s) · {t.cajero_nombre}</div>
                        {t.estado === 'anulado' && <div style={{ fontSize: 11, color: T.red, marginTop: 2 }}>Anulado: {t.anulado_motivo}</div>}
                      </div>
                      <div style={{ display: 'flex', gap: 7 }}>
                        <button onClick={() => setTicketDetalle(t)} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: '6px 12px', color: T.ink, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>Ver</button>
                        {t.estado !== 'anulado' && (
                          <button onClick={() => setAnulando(t)} style={{ background: T.redLight, border: `1px solid ${T.red}`, borderRadius: 6, padding: '6px 12px', color: T.red, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>Anular</button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )
            }
          </div>
        )}

        {/* ══ CAJA TAB ═══════════════════════════════════════════════ */}
        {tab === 'caja' && (
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 17, fontWeight: 700 }}>Caja del turno</div>
              <div style={{ display: 'flex', gap: 8 }}>
                {!cajaActual && <button onClick={() => setShowAbrirCaja(true)} style={btnPrimary}>+ Abrir caja</button>}
                {cajaActual && <button onClick={() => setShowMovimiento(true)} style={{ ...btnPrimary, background: T.blueLight, color: T.blue, border: `1px solid ${T.blue}` }}>+ Movimiento</button>}
                {cajaActual && <button onClick={() => setShowCerrarCaja(true)} style={{ ...btnPrimary, background: T.redLight, color: T.red, border: `1px solid ${T.red}` }}>Cerrar caja</button>}
              </div>
            </div>

            {cajaActual ? (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
                  {[
                    { label: 'Turno', value: cajaActual.turno },
                    { label: 'Cajero', value: cajaActual.cajero_nombre || '—' },
                    { label: 'Apertura', value: new Date(cajaActual.abierta_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }) },
                    { label: 'Balance actual', value: fmt(cajaBalance), accent: true },
                  ].map(s => (
                    <div key={s.label} style={{ background: T.paper, border: `1px solid ${T.border}`, borderRadius: 10, padding: '14px 16px' }}>
                      <div style={{ fontSize: 10, color: T.muted, fontWeight: 700, letterSpacing: 0.5, marginBottom: 5 }}>{s.label.toUpperCase()}</div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: s.accent ? T.accent : T.ink }}>{s.value}</div>
                    </div>
                  ))}
                </div>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, letterSpacing: 0.5, marginBottom: 10 }}>MOVIMIENTOS</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5, maxWidth: 680 }}>
                  {movimientos.length === 0
                    ? <div style={{ color: T.muted, fontSize: 13, padding: '16px 0' }}>Sin movimientos registrados</div>
                    : [...movimientos].reverse().map((m, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: T.paper, borderRadius: 8, padding: '9px 14px', border: `1px solid ${T.border}` }}>
                        <div>
                          <span style={{ fontSize: 11, fontWeight: 700, color: ['venta', 'ingreso', 'apertura'].includes(m.tipo) ? T.accent : T.red, marginRight: 8 }}>
                            {m.tipo === 'venta' ? '↑ Venta' : m.tipo === 'ingreso' ? '↑ Ingreso' : m.tipo === 'egreso' ? '↓ Egreso' : m.tipo === 'anulacion' ? '↓ Anulación' : m.tipo === 'apertura' ? '○ Apertura' : '■ Cierre'}
                          </span>
                          <span style={{ fontSize: 13, color: T.ink }}>{m.concepto}</span>
                        </div>
                        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: ['egreso', 'anulacion'].includes(m.tipo) ? T.red : T.accent }}>
                            {['egreso', 'anulacion'].includes(m.tipo) ? '−' : '+'}{fmt(Math.abs(m.monto || 0))}
                          </span>
                          <span style={{ fontSize: 10, color: T.muted }}>{new Date(m.created_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                    ))
                  }
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center', color: T.muted, padding: 60 }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>💰</div>
                <div style={{ fontSize: 15, marginBottom: 16 }}>No hay caja abierta</div>
                <button onClick={() => setShowAbrirCaja(true)} style={btnPrimary}>Abrir caja →</button>
              </div>
            )}
          </div>
        )}

        {/* ══ STOCK TAB ══════════════════════════════════════════════ */}
        {tab === 'stock' && (
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 17, fontWeight: 700 }}>Inventario</div>
              <button onClick={downloadStock} style={btnPrimary}>⬇ Bajar Excel</button>
            </div>
            <input value={stockSearch} onChange={e => setStockSearch(e.target.value)} placeholder="Buscar producto…"
              style={{ ...inputStyle, maxWidth: 380, padding: '9px 14px', marginBottom: 16 }} />
            <div style={{ maxWidth: 860, border: `1px solid ${T.border}`, borderRadius: 10, overflow: 'hidden' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 90px 80px 100px', background: T.surface }}>
                {['Producto', 'Categoría', 'Stock', 'Mínimo', 'Precio POS'].map(h => (
                  <div key={h} style={{ padding: '9px 14px', fontSize: 10, fontWeight: 700, color: T.muted, letterSpacing: 0.5 }}>{h.toUpperCase()}</div>
                ))}
              </div>
              {filteredStock.map((p, i) => (
                <div key={p.id} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 90px 80px 100px', borderTop: `1px solid ${T.border}`, background: i % 2 === 0 ? T.paper : T.surface }}>
                  <div style={{ padding: '10px 14px' }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{p.name}</div>
                    <div style={{ fontSize: 10, color: T.muted }}>{p.sku || ''}</div>
                  </div>
                  <div style={{ padding: '10px 14px', fontSize: 12, color: T.muted, alignSelf: 'center' }}>{p.category || '—'}</div>
                  <div style={{ padding: '10px 14px', fontSize: 13, fontWeight: 700, color: (p.stock || 0) <= (p.min_stock || p.minStock || 0) ? T.red : T.accent, alignSelf: 'center' }}>
                    {p.stock ?? 0}
                  </div>
                  <div style={{ padding: '10px 14px', fontSize: 12, color: T.muted, alignSelf: 'center' }}>{p.min_stock || p.minStock || 0}</div>
                  <div style={{ padding: '10px 14px', fontSize: 13, fontWeight: 700, alignSelf: 'center' }}>{fmt(getPosPrice(p))}</div>
                </div>
              ))}
              {filteredStock.length === 0 && (
                <div style={{ padding: '24px', textAlign: 'center', color: T.muted, fontSize: 13 }}>Sin resultados</div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── MODALES ─────────────────────────────────────────────────── */}

      {/* Abrir caja */}
      {showAbrirCaja && (
        <Modal title="Abrir caja" onClose={() => setShowAbrirCaja(false)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={labelStyle}>TURNO</label>
              <select value={turno} onChange={e => setTurno(e.target.value)} style={inputStyle}>
                <option value="mañana">Mañana</option>
                <option value="tarde">Tarde</option>
                <option value="noche">Noche</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>MONTO INICIAL (efectivo)</label>
              <input type="number" value={montoInicial} onChange={e => setMontoInicial(e.target.value)} style={inputStyle} min="0" step="0.01" />
            </div>
            <button onClick={abrirCaja} style={{ ...btnPrimary, marginTop: 4 }}>Abrir caja →</button>
          </div>
        </Modal>
      )}

      {/* Cerrar caja */}
      {showCerrarCaja && (
        <Modal title="Cerrar caja" onClose={() => setShowCerrarCaja(false)}>
          <div style={{ background: T.surface, borderRadius: 8, padding: '12px', marginBottom: 16, fontSize: 13 }}>
            {[
              ['Ventas del turno', fmt(movimientos.filter(m => m.tipo === 'venta').reduce((s, m) => s + (m.monto || 0), 0))],
              ['Tickets emitidos', tickets.filter(t => t.caja_id === cajaActual?.id && t.estado !== 'anulado').length],
              ['Balance calculado', fmt(cajaBalance)],
            ].map(([label, value]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                <span style={{ color: T.muted }}>{label}:</span>
                <span style={{ fontWeight: 700 }}>{value}</span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={labelStyle}>MONTO FINAL EN CAJA (efectivo contado)</label>
              <input type="number" value={montoFinal} onChange={e => setMontoFinal(e.target.value)} style={inputStyle} min="0" step="0.01" placeholder="0.00" />
            </div>
            <div>
              <label style={labelStyle}>OBSERVACIONES</label>
              <textarea value={obsCierre} onChange={e => setObsCierre(e.target.value)} style={{ ...inputStyle, height: 72, resize: 'vertical' }} />
            </div>
            <button onClick={cerrarCaja} style={{ ...btnPrimary, background: T.red, marginTop: 4 }}>Cerrar caja</button>
          </div>
        </Modal>
      )}

      {/* Movimiento manual */}
      {showMovimiento && (
        <Modal title="Movimiento manual" onClose={() => setShowMovimiento(false)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={labelStyle}>TIPO</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {[['ingreso', '↑ Ingreso', T.accent, T.accentLight], ['egreso', '↓ Egreso', T.red, T.redLight], ['ajuste', '≈ Ajuste', T.yellow, T.yellowLight]].map(([v, l, c, bg]) => (
                  <button key={v} onClick={() => setMovTipo(v)} style={{ flex: 1, background: movTipo === v ? bg : T.surface, border: `1px solid ${movTipo === v ? c : T.border}`, borderRadius: 6, padding: '9px', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, color: movTipo === v ? c : T.muted, fontWeight: 600 }}>
                    {l}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label style={labelStyle}>CONCEPTO</label>
              <input value={movConcepto} onChange={e => setMovConcepto(e.target.value)} placeholder="Ej: Compra de insumos, retiro, etc." style={inputStyle} autoFocus />
            </div>
            <div>
              <label style={labelStyle}>MONTO</label>
              <input type="number" value={movMonto} onChange={e => setMovMonto(e.target.value)} style={inputStyle} min="0.01" step="0.01" placeholder="0.00" />
            </div>
            <button onClick={agregarMovimiento} disabled={!movConcepto.trim() || !movMonto} style={{ ...btnPrimary, marginTop: 4, opacity: (!movConcepto.trim() || !movMonto) ? 0.5 : 1, cursor: (!movConcepto.trim() || !movMonto) ? 'not-allowed' : 'pointer' }}>
              Registrar movimiento
            </button>
          </div>
        </Modal>
      )}

      {/* Anular ticket */}
      {anulando && (
        <Modal title={`Anular ${anulando.numero}`} onClose={() => { setAnulando(null); setAnulandoMotivo('') }}>
          <div style={{ background: T.redLight, borderRadius: 8, padding: '12px', marginBottom: 16, fontSize: 13, color: T.red }}>
            ⚠ Esta acción anulará el ticket <strong>{fmt(anulando.total)}</strong> y restaurará el stock. No se puede deshacer.
          </div>
          <div>
            <label style={labelStyle}>MOTIVO DE ANULACIÓN *</label>
            <input value={anulandoMotivo} onChange={e => setAnulandoMotivo(e.target.value)} placeholder="Describí el motivo" style={inputStyle} autoFocus />
          </div>
          <button onClick={anularTicket} disabled={!anulandoMotivo.trim()} style={{ ...btnPrimary, background: T.red, marginTop: 16, width: '100%', opacity: !anulandoMotivo.trim() ? 0.5 : 1, cursor: !anulandoMotivo.trim() ? 'not-allowed' : 'pointer' }}>
            Confirmar anulación
          </button>
        </Modal>
      )}

      {/* Ticket confirmado */}
      {ticketConfirmado && (
        <Modal title="✓ Ticket emitido" onClose={() => setTicketConfirmado(null)} width={400}>
          <TicketView ticket={ticketConfirmado} companyName={profile.company_name} />
          <button onClick={() => setTicketConfirmado(null)} style={{ ...btnPrimary, width: '100%', marginTop: 14 }}>
            Continuar →
          </button>
        </Modal>
      )}

      {/* Ticket detalle */}
      {ticketDetalle && (
        <Modal title={`Ticket ${ticketDetalle.numero}`} onClose={() => setTicketDetalle(null)} width={400}>
          <TicketView ticket={ticketDetalle} companyName={profile.company_name} />
          <button onClick={() => setTicketDetalle(null)} style={{ ...btnPrimary, width: '100%', marginTop: 14 }}>
            Cerrar
          </button>
        </Modal>
      )}
    </div>
  )
}
