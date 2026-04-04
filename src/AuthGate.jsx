import { useState, useEffect, useRef } from 'react'
import { supabase } from './lib/supabase'

const T = {
  bg: "#0d1117", sidebar: "#0a0e14", paper: "#161b22", surface: "#1c2333",
  surface2: "#212836", border: "#2a3441", border2: "#1e2d3d",
  ink: "#e6edf3", muted: "#7d8590", faint: "#3d4a5c",
  accent: "#2ea043", accentLight: "#0d2818",
  yellow: "#e3b341", yellowLight: "#2d1f02",
  red: "#f85149", redLight: "#2d0f0e",
  orange: "#f0883e",
  blue: "#58a6ff", blueLight: "#0c1d33",
  purple: "#a371f7", purpleLight: "#1e1240",
}

// ─── EMAIL HELPER ─────────────────────────────────────────────────────────────
async function sendEmail(to, subject, html) {
  if (!to) return
  try {
    await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to, subject, html }),
    })
  } catch (e) {
    console.error('[sendEmail] error:', e)
  }
}

// ─── ADMIN PANEL ──────────────────────────────────────────────────────────────
function AdminPanel({ profile, onLogout }) {
  const [tab, setTab] = useState('empresas')
  const [saving, setSaving] = useState(false)

  // Solicitudes empresas
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(true)
  const [companyFilter, setCompanyFilter] = useState('pending')
  const [rejectId, setRejectId] = useState(null)
  const [rejectReason, setRejectReason] = useState('')

  // Solicitudes usuarios
  const [userRequests, setUserRequests] = useState([])
  const [urLoading, setUrLoading] = useState(false)
  const [urRejectId, setUrRejectId] = useState(null)
  const [urRejectReason, setUrRejectReason] = useState('')

  // Activity log
  const [activityLog, setActivityLog] = useState([])

  const loadActivityLog = async () => {
    const { data } = await supabase.from('activity_log').select('*').order('created_at', { ascending: false }).limit(60)
    if (data) setActivityLog(data)
  }

  const logActivity = async (type, description, company_name = null, user_email = null) => {
    await supabase.from('activity_log').insert({ type, description, company_name, user_email })
    loadActivityLog()
  }

  // Gestión
  const [gestionCompanyId, setGestionCompanyId] = useState(null)
  const [companyProfiles, setCompanyProfiles] = useState({})
  const [editingProfileId, setEditingProfileId] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [expandedId, setExpandedId] = useState(null)
  const [changingPasswordId, setChangingPasswordId] = useState(null)
  const [newPassword, setNewPassword] = useState('')
  const [showPasswords, setShowPasswords] = useState({})

  useEffect(() => { loadCompanies(); loadActivityLog() }, [])
  useEffect(() => { if (tab === 'usuarios') loadUserRequests() }, [tab])
  useEffect(() => { if (tab === 'gestion') loadCompanies() }, [tab])

  const loadCompanies = async () => {
    setLoading(true)
    const { data } = await supabase.from('companies').select('*').order('requested_at', { ascending: false })
    if (data) setCompanies(data)
    setLoading(false)
  }

  const approve = async (id) => {
    setSaving(true)
    await supabase.from('companies').update({ status: 'approved' }).eq('id', id)
    const company = companies.find(c => c.id === id)
    setCompanies(prev => prev.map(c => c.id === id ? { ...c, status: 'approved' } : c))
    await logActivity('company_approved', `Alta aprobada`, company?.name, company?.email)
    if (company?.email) {
      await sendEmail(
        company.email,
        '¡Tu cuenta en NexoPyme fue aprobada!',
        `<div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px">
          <h2 style="color:#2ea043">¡Cuenta aprobada!</h2>
          <p>Hola <strong>${company.contact_person || company.name}</strong>,</p>
          <p>Tu empresa <strong>${company.name}</strong> fue aprobada en NexoPyme. Ya podés ingresar con tu email y contraseña.</p>
          <a href="https://nexopyme.vercel.app" style="display:inline-block;margin-top:16px;background:#2ea043;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700">Ingresar a NexoPyme →</a>
          <p style="margin-top:24px;color:#666;font-size:13px">Si tenés alguna consulta, respondé este email.</p>
        </div>`
      )
    }
    setSaving(false)
  }

  const confirmReject = async () => {
    if (!rejectReason.trim()) return
    setSaving(true)
    await supabase.from('companies').update({ status: 'rejected', rejection_reason: rejectReason.trim() }).eq('id', rejectId)
    const company = companies.find(c => c.id === rejectId)
    setCompanies(prev => prev.map(c => c.id === rejectId ? { ...c, status: 'rejected', rejection_reason: rejectReason.trim() } : c))
    await logActivity('company_rejected', `Alta rechazada — ${rejectReason.trim()}`, company?.name, company?.email)
    if (company?.email) {
      await sendEmail(
        company.email,
        'Solicitud de acceso a NexoPyme',
        `<div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px">
          <h2 style="color:#f85149">Solicitud no aprobada</h2>
          <p>Hola <strong>${company.contact_person || company.name}</strong>,</p>
          <p>Lamentablemente la solicitud de acceso para <strong>${company.name}</strong> no fue aprobada en esta oportunidad.</p>
          <div style="background:#2d0f0e;border-left:4px solid #f85149;padding:12px 16px;border-radius:6px;margin:16px 0">
            <strong style="color:#f85149">Motivo:</strong><br/>
            <span style="color:#e6edf3">${rejectReason.trim()}</span>
          </div>
          <p style="color:#666;font-size:13px">Si creés que hay un error o querés más información, respondé este email.</p>
        </div>`
      )
    }
    setRejectId(null); setRejectReason(''); setSaving(false)
  }

  const suspend = async (id) => {
    if (!window.confirm('¿Suspender esta cuenta? El usuario no podrá acceder hasta que la reactives.')) return
    await supabase.from('companies').update({ status: 'rejected', rejection_reason: 'Cuenta suspendida por el administrador.' }).eq('id', id)
    const company = companies.find(c => c.id === id)
    setCompanies(prev => prev.map(c => c.id === id ? { ...c, status: 'rejected', rejection_reason: 'Cuenta suspendida por el administrador.' } : c))
    await logActivity('company_suspended', `Cuenta suspendida`, company?.name, company?.email)
    if (company?.email) {
      await sendEmail(
        company.email,
        'Tu cuenta en NexoPyme fue suspendida',
        `<div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px">
          <h2 style="color:#f85149">Cuenta suspendida</h2>
          <p>Hola <strong>${company.contact_person || company.name}</strong>,</p>
          <p>Tu cuenta de <strong>${company.name}</strong> en NexoPyme fue suspendida temporalmente por el administrador.</p>
          <p style="color:#666;font-size:13px">Si creés que es un error o querés más información, respondé este email.</p>
        </div>`
      )
    }
  }

  const loadCompanyProfiles = async (companyId) => {
    const [{ data: profs }, { data: reqs }] = await Promise.all([
      supabase.from('profiles').select('*').eq('company_id', companyId),
      supabase.from('user_requests').select('email, password').eq('company_id', companyId).eq('status', 'approved')
    ])
    const pwMap = {}
    if (reqs) reqs.forEach(r => { if (r.email) pwMap[r.email] = r.password })
    const merged = (profs || []).map(p => ({ ...p, _password: p.email ? (pwMap[p.email] || null) : null }))
    setCompanyProfiles(prev => ({ ...prev, [companyId]: merged }))
  }

  const changePassword = async (profileId, companyId) => {
    if (!newPassword.trim()) return
    const { error } = await supabase.rpc('admin_change_password', { p_user_id: profileId, p_new_password: newPassword.trim() })
    if (error) { alert('Error al cambiar contraseña: ' + error.message); return }
    // update stored password in local state
    setCompanyProfiles(prev => ({
      ...prev,
      [companyId]: prev[companyId].map(p => p.id === profileId ? { ...p, _password: newPassword.trim() } : p)
    }))
    setChangingPasswordId(null); setNewPassword('')
  }

  const toggleJefe = async (profileId, companyId) => {
    const profs = companyProfiles[companyId] || []
    const prof = profs.find(p => p.id === profileId)
    if (!prof) return
    const newRole = prof.role === 'jefe' ? 'user' : 'jefe'
    await supabase.from('profiles').update({ role: newRole }).eq('id', profileId)
    setCompanyProfiles(prev => ({ ...prev, [companyId]: prev[companyId].map(p => p.id === profileId ? { ...p, role: newRole } : p) }))
  }

  const toggleActive = async (profileId, companyId) => {
    const profs = companyProfiles[companyId] || []
    const prof = profs.find(p => p.id === profileId)
    if (!prof) return
    const newActive = !prof.active
    await supabase.from('profiles').update({ active: newActive }).eq('id', profileId)
    setCompanyProfiles(prev => ({ ...prev, [companyId]: prev[companyId].map(p => p.id === profileId ? { ...p, active: newActive } : p) }))
  }

  const saveEditProfile = async (profileId, companyId) => {
    await supabase.from('profiles').update({ display_name: editForm.display_name }).eq('id', profileId)
    setCompanyProfiles(prev => ({ ...prev, [companyId]: prev[companyId].map(p => p.id === profileId ? { ...p, ...editForm } : p) }))
    setEditingProfileId(null)
  }

  const reactivate = async (id) => {
    await supabase.from('companies').update({ status: 'approved', rejection_reason: null }).eq('id', id)
    setCompanies(prev => prev.map(c => c.id === id ? { ...c, status: 'approved', rejection_reason: null } : c))
  }

  const loadUserRequests = async () => {
    setUrLoading(true)
    const { data } = await supabase.from('user_requests').select('*').order('requested_at', { ascending: false })
    if (data) setUserRequests(data)
    setUrLoading(false)
  }

  const approveUser = async (id) => {
    setSaving(true)
    const req = userRequests.find(r => r.id === id)
    if (!req) { setSaving(false); return }
    try {
      const res = await fetch('/api/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          request_id: req.id,
          email: req.email,
          password: req.password,
          company_id: req.company_id,
          company_name: req.company_name,
          role: req.role,
          display_name: req.display_name
        })
      })
      const data = await res.json()
      if (!res.ok) alert('Error al aprobar: ' + data.error)
      else {
        setUserRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'approved' } : r))
        await logActivity('user_approved', `Usuario aprobado`, req.company_name, req.email)
        if (req.email) {
          await sendEmail(
            req.email,
            '¡Tu usuario en NexoPyme fue habilitado!',
            `<div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px">
              <h2 style="color:#2ea043">¡Usuario habilitado!</h2>
              <p>Hola <strong>${req.display_name || req.email}</strong>,</p>
              <p>Tu usuario fue habilitado en NexoPyme para la empresa <strong>${req.company_name || ''}</strong>.</p>
              <p style="margin:8px 0"><strong>Email:</strong> ${req.email}</p>
              <a href="https://nexopyme.vercel.app" style="display:inline-block;margin-top:16px;background:#2ea043;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700">Ingresar a NexoPyme →</a>
              <p style="margin-top:24px;color:#666;font-size:13px">Si tenés alguna consulta, respondé este email.</p>
            </div>`
          )
        }
      }
    } catch (e) {
      alert('Error al aprobar: ' + e.message)
    }
    setSaving(false)
  }

  const confirmRejectUser = async () => {
    if (!urRejectReason.trim()) return
    setSaving(true)
    const req = userRequests.find(r => r.id === urRejectId)
    await supabase.from('user_requests').update({ status: 'rejected', rejection_reason: urRejectReason.trim() }).eq('id', urRejectId)
    setUserRequests(prev => prev.map(r => r.id === urRejectId ? { ...r, status: 'rejected', rejection_reason: urRejectReason.trim() } : r))
    await logActivity('user_rejected', `Usuario rechazado — ${urRejectReason.trim()}`, req?.company_name, req?.email)
    if (req?.email) {
      await sendEmail(
        req.email,
        'Solicitud de usuario en NexoPyme',
        `<div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px">
          <h2 style="color:#f85149">Solicitud no aprobada</h2>
          <p>Hola <strong>${req.display_name || req.email}</strong>,</p>
          <p>Tu solicitud de usuario para <strong>${req.company_name || 'la empresa'}</strong> no fue aprobada en esta oportunidad.</p>
          <div style="background:#2d0f0e;border-left:4px solid #f85149;padding:12px 16px;border-radius:6px;margin:16px 0">
            <strong style="color:#f85149">Motivo:</strong><br/>
            <span style="color:#e6edf3">${urRejectReason.trim()}</span>
          </div>
          <p style="color:#666;font-size:13px">Si tenés alguna consulta, respondé este email.</p>
        </div>`
      )
    }
    setUrRejectId(null); setUrRejectReason(''); setSaving(false)
  }

  const pending = companies.filter(c => c.status === 'pending')
  const shownCompanies = companyFilter === 'pending' ? pending : companyFilter === 'approved' ? companies.filter(c => c.status === 'approved') : companies

  const statusBadge = (status) => {
    const map = {
      pending:  { bg: T.yellowLight, color: T.yellow, label: 'Pendiente' },
      approved: { bg: T.accentLight, color: T.accent, label: 'Aprobada'  },
      rejected: { bg: T.redLight,    color: T.red,    label: 'Rechazada' },
    }
    const s = map[status] || map.pending
    return <span style={{ background: s.bg, color: s.color, padding: '3px 10px', borderRadius: 8, fontSize: 11, fontWeight: 700 }}>{s.label}</span>
  }

  return (
    <div style={{ minHeight: '100vh', background: T.bg, fontFamily: "'DM Sans','Segoe UI',sans-serif", color: T.ink }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap'); *{box-sizing:border-box;margin:0;padding:0} input,textarea{font-family:inherit}`}</style>

      {/* Header */}
      <div style={{ background: T.sidebar, borderBottom: `1px solid ${T.border2}`, padding: '0 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 56 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ fontSize: 18, fontWeight: 800 }}><span style={{ color: T.accent }}>Nexo</span>PyME</div>
          <div style={{ background: T.yellowLight, color: T.yellow, padding: '3px 12px', borderRadius: 8, fontSize: 11, fontWeight: 700, letterSpacing: 0.5 }}>PANEL ADMINISTRATIVO</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontSize: 12, color: T.muted }}>{profile?.email}</span>
          <button onClick={onLogout} style={{ background: 'transparent', border: `1px solid ${T.border}`, borderRadius: 6, padding: '5px 12px', color: T.muted, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>Cerrar sesión</button>
        </div>
      </div>

      <div style={{ maxWidth: 1480, margin: '0 auto', padding: '36px 40px', display: 'flex', gap: 28, alignItems: 'flex-start' }}>
        {/* ── Contenido principal ── */}
        <div style={{ flex: 1, minWidth: 0 }}>
        {/* KPIs */}
        <div style={{ display: 'flex', gap: 14, marginBottom: 32 }}>
          {[
            { label: 'Pendientes de aprobación', value: companies.filter(c => c.status === 'pending').length,  color: T.yellow, bg: T.yellowLight },
            { label: 'Cuentas activas',           value: companies.filter(c => c.status === 'approved').length, color: T.accent, bg: T.accentLight },
            { label: 'Rechazadas / suspendidas',  value: companies.filter(c => c.status === 'rejected').length, color: T.red,    bg: T.redLight    },
            { label: 'Total registros',            value: companies.length,                                       color: T.blue,   bg: T.blueLight   },
          ].map((k, i) => (
            <div key={i} style={{ flex: 1, background: T.paper, border: `1px solid ${T.border}`, borderRadius: 12, padding: '16px 20px' }}>
              <div style={{ fontSize: 10, color: T.muted, fontWeight: 700, letterSpacing: 0.8, marginBottom: 8 }}>{k.label.toUpperCase()}</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: k.color }}>{k.value}</div>
            </div>
          ))}
        </div>

        {/* Tabs principales */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: T.surface, borderRadius: 10, padding: 4, width: 'fit-content' }}>
          {[
            ['empresas', `Solicitudes empresas (${pending.length})`],
            ['usuarios', `Solicitudes usuarios (${userRequests.filter(r => r.status === 'pending').length})`],
            ['gestion', 'Gestión'],
          ].map(([v, l]) => (
            <button key={v} onClick={() => setTab(v)}
              style={{ padding: '7px 18px', borderRadius: 7, border: 'none', background: tab === v ? T.paper : 'transparent', color: tab === v ? T.ink : T.muted, fontWeight: tab === v ? 700 : 500, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
              {l}
            </button>
          ))}
        </div>

        {/* ── TAB: Solicitudes empresas ── */}
        {tab === 'empresas' && (<>
          {/* Sub-filtro */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            {[['pending', 'Pendientes'], ['approved', 'Aprobadas'], ['all', 'Todas']].map(([v, l]) => (
              <button key={v} onClick={() => setCompanyFilter(v)}
                style={{ padding: '6px 16px', borderRadius: 7, border: `1px solid ${companyFilter === v ? T.accent : T.border}`, background: companyFilter === v ? T.accentLight : 'transparent', color: companyFilter === v ? T.accent : T.muted, fontWeight: 600, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
                {l}
              </button>
            ))}
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', color: T.muted, padding: 40 }}>Cargando cuentas…</div>
          ) : shownCompanies.length === 0 ? (
            <div style={{ textAlign: 'center', color: T.muted, padding: 40, background: T.paper, borderRadius: 12, border: `1px solid ${T.border}` }}>
              {companyFilter === 'pending' ? 'No hay solicitudes pendientes.' : 'No hay cuentas en esta categoría.'}
            </div>
          ) : (
            <div style={{ background: T.paper, border: `1px solid ${T.border}`, borderRadius: 14, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: T.surface }}>
                    {['Empresa', 'CUIT', 'Contacto', 'Teléfono', 'Solicitado', 'Estado', 'Acciones'].map(h => (
                      <th key={h} style={{ padding: '11px 15px', textAlign: 'left', fontSize: 10, color: T.muted, fontWeight: 700, letterSpacing: 0.8 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {shownCompanies.flatMap(c => {
                    const rows = []
                    rows.push(
                      <tr key={c.id} style={{ borderTop: `1px solid ${T.border}`, cursor: 'pointer' }}
                        onClick={() => { const next = expandedId === c.id ? null : c.id; setExpandedId(next); if (next) loadCompanyProfiles(c.id) }}>
                        <td style={{ padding: '12px 15px' }}>
                          <div style={{ fontWeight: 700, fontSize: 14 }}>{c.name}</div>
                          <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>{c.address || '—'}</div>
                        </td>
                        <td style={{ padding: '12px 15px', fontFamily: 'monospace', fontSize: 12, color: T.orange }}>{c.cuit || '—'}</td>
                        <td style={{ padding: '12px 15px', fontSize: 13 }}>{c.contact_person || '—'}</td>
                        <td style={{ padding: '12px 15px', fontSize: 13, color: T.muted }}>{c.phone || '—'}</td>
                        <td style={{ padding: '12px 15px', fontSize: 12, color: T.muted }}>
                          {c.requested_at ? new Date(c.requested_at).toLocaleDateString('es-AR') : '—'}
                        </td>
                        <td style={{ padding: '12px 15px' }}>{statusBadge(c.status)}</td>
                        <td style={{ padding: '12px 15px' }}>
                          <div style={{ display: 'flex', gap: 6 }} onClick={e => e.stopPropagation()}>
                            {c.status === 'pending' && (<>
                              <button onClick={() => approve(c.id)} disabled={saving}
                                style={{ background: T.accentLight, color: T.accent, border: `1px solid ${T.accent}`, borderRadius: 6, padding: '5px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                                ✓ Aprobar
                              </button>
                              <button onClick={() => { setRejectId(c.id); setRejectReason('') }}
                                style={{ background: T.redLight, color: T.red, border: `1px solid ${T.red}`, borderRadius: 6, padding: '5px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                                ✕ Rechazar
                              </button>
                            </>)}
                            {c.status === 'approved' && (
                              <button onClick={() => suspend(c.id)}
                                style={{ background: 'transparent', color: T.muted, border: `1px solid ${T.border}`, borderRadius: 6, padding: '5px 12px', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
                                Suspender
                              </button>
                            )}
                            {c.status === 'rejected' && (
                              <button onClick={() => reactivate(c.id)}
                                style={{ background: T.accentLight, color: T.accent, border: `1px solid ${T.accent}`, borderRadius: 6, padding: '5px 12px', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
                                Reactivar
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                    if (expandedId === c.id) {
                      rows.push(
                        <tr key={c.id + '-detail'} style={{ background: T.surface }}>
                          <td colSpan={7} style={{ padding: '14px 20px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
                              {[
                                ['Nombre empresa', c.name], ['CUIT', c.cuit || '—'],
                                ['Persona de contacto', c.contact_person || '—'], ['Teléfono', c.phone || '—'],
                                ['Dirección', c.address || '—'], ['Estado', c.status],
                                ['Motivo de rechazo', c.rejection_reason || '—'],
                                ['Fecha solicitud', c.requested_at ? new Date(c.requested_at).toLocaleString('es-AR') : '—'],
                              ].map(([label, val]) => (
                                <div key={label}>
                                  <div style={{ fontSize: 10, color: T.muted, fontWeight: 700, letterSpacing: 0.8, marginBottom: 3 }}>{label.toUpperCase()}</div>
                                  <div style={{ fontSize: 13, color: T.ink }}>{val}</div>
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )
                    }
                    if (rejectId === c.id) {
                      rows.push(
                        <tr key={c.id + '-reject'} style={{ background: T.redLight }}>
                          <td colSpan={7} style={{ padding: '14px 20px' }}>
                            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                              <span style={{ fontSize: 13, color: T.red, fontWeight: 600, whiteSpace: 'nowrap' }}>Motivo del rechazo:</span>
                              <input value={rejectReason} onChange={e => setRejectReason(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && confirmReject()}
                                placeholder="Ej: CUIT no verificado, información incompleta..." autoFocus
                                style={{ flex: 1, background: T.surface, border: `1px solid ${T.red}`, borderRadius: 6, padding: '8px 12px', color: T.ink, fontSize: 13, fontFamily: 'inherit', outline: 'none' }} />
                              <button onClick={confirmReject} disabled={saving || !rejectReason.trim()}
                                style={{ background: T.red, color: '#fff', border: 'none', borderRadius: 6, padding: '8px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', opacity: !rejectReason.trim() ? 0.5 : 1 }}>
                                Confirmar
                              </button>
                              <button onClick={() => { setRejectId(null); setRejectReason('') }}
                                style={{ background: 'transparent', border: 'none', color: T.muted, cursor: 'pointer', fontSize: 18 }}>✕</button>
                            </div>
                          </td>
                        </tr>
                      )
                    }
                    return rows
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>)}

        {/* ── TAB: Solicitudes usuarios ── */}
        {tab === 'usuarios' && (
          urLoading ? (
            <div style={{ textAlign: 'center', color: T.muted, padding: 40 }}>Cargando solicitudes…</div>
          ) : userRequests.length === 0 ? (
            <div style={{ textAlign: 'center', color: T.muted, padding: 40, background: T.paper, borderRadius: 12, border: `1px solid ${T.border}` }}>
              No hay solicitudes de nuevos usuarios.
            </div>
          ) : (
            <div style={{ background: T.paper, border: `1px solid ${T.border}`, borderRadius: 14, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: T.surface }}>
                    {['Empresa', 'Nombre', 'Email', 'Rol', 'Solicitado', 'Estado', 'Acciones'].map(h => (
                      <th key={h} style={{ padding: '11px 15px', textAlign: 'left', fontSize: 10, color: T.muted, fontWeight: 700, letterSpacing: 0.8 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {userRequests.flatMap(r => {
                    const rows = []
                    rows.push(
                      <tr key={r.id} style={{ borderTop: `1px solid ${T.border}` }}>
                        <td style={{ padding: '12px 15px', fontSize: 13, color: T.muted }}>{r.company_name || '—'}</td>
                        <td style={{ padding: '12px 15px', fontWeight: 700, fontSize: 14 }}>{r.display_name}</td>
                        <td style={{ padding: '12px 15px', fontSize: 12, color: T.blue }}>{r.email}</td>
                        <td style={{ padding: '12px 15px', fontSize: 12 }}>
                          <span style={{ background: r.role === 'jefe' ? T.purpleLight : T.surface, color: r.role === 'jefe' ? T.purple : T.muted, padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700 }}>
                            {r.role === 'jefe' ? 'Jefe' : 'Usuario'}
                          </span>
                        </td>
                        <td style={{ padding: '12px 15px', fontSize: 12, color: T.muted }}>
                          {r.requested_at ? new Date(r.requested_at).toLocaleDateString('es-AR') : '—'}
                        </td>
                        <td style={{ padding: '12px 15px' }}>{statusBadge(r.status)}</td>
                        <td style={{ padding: '12px 15px' }}>
                          <div style={{ display: 'flex', gap: 6 }}>
                            {r.status === 'pending' && (<>
                              <button onClick={() => approveUser(r.id)} disabled={saving}
                                style={{ background: T.accentLight, color: T.accent, border: `1px solid ${T.accent}`, borderRadius: 6, padding: '5px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                                ✓ Aprobar
                              </button>
                              <button onClick={() => { setUrRejectId(r.id); setUrRejectReason('') }}
                                style={{ background: T.redLight, color: T.red, border: `1px solid ${T.red}`, borderRadius: 6, padding: '5px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                                ✕ Rechazar
                              </button>
                            </>)}
                            {r.status === 'rejected' && (
                              <span style={{ fontSize: 12, color: T.red }}>{r.rejection_reason || 'Rechazada'}</span>
                            )}
                            {r.status === 'approved' && (
                              <span style={{ fontSize: 12, color: T.accent }}>Cuenta creada</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                    if (urRejectId === r.id) {
                      rows.push(
                        <tr key={r.id + '-reject'} style={{ background: T.redLight }}>
                          <td colSpan={7} style={{ padding: '14px 20px' }}>
                            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                              <span style={{ fontSize: 13, color: T.red, fontWeight: 600, whiteSpace: 'nowrap' }}>Motivo del rechazo:</span>
                              <input value={urRejectReason} onChange={e => setUrRejectReason(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && confirmRejectUser()}
                                placeholder="Ej: Email ya registrado, datos incorrectos..." autoFocus
                                style={{ flex: 1, background: T.surface, border: `1px solid ${T.red}`, borderRadius: 6, padding: '8px 12px', color: T.ink, fontSize: 13, fontFamily: 'inherit', outline: 'none' }} />
                              <button onClick={confirmRejectUser} disabled={saving || !urRejectReason.trim()}
                                style={{ background: T.red, color: '#fff', border: 'none', borderRadius: 6, padding: '8px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', opacity: !urRejectReason.trim() ? 0.5 : 1 }}>
                                Confirmar
                              </button>
                              <button onClick={() => { setUrRejectId(null); setUrRejectReason('') }}
                                style={{ background: 'transparent', border: 'none', color: T.muted, cursor: 'pointer', fontSize: 18 }}>✕</button>
                            </div>
                          </td>
                        </tr>
                      )
                    }
                    return rows
                  })}
                </tbody>
              </table>
            </div>
          )
        )}

        {/* ── TAB: Gestión ── */}
        {tab === 'gestion' && (
          gestionCompanyId ? (() => {
            const co = companies.find(c => c.id === gestionCompanyId)
            const profiles = companyProfiles[gestionCompanyId]
            return (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                  <button onClick={() => setGestionCompanyId(null)}
                    style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 7, padding: '6px 14px', color: T.muted, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
                    ← Volver
                  </button>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 800 }}>{co?.name}</div>
                    <div style={{ fontSize: 12, color: T.muted }}>{co?.cuit} · {co?.contact_person}</div>
                  </div>
                  {co && statusBadge(co.status)}
                </div>

                {!profiles ? (
                  <div style={{ textAlign: 'center', color: T.muted, padding: 40 }}>Cargando usuarios…</div>
                ) : profiles.length === 0 ? (
                  <div style={{ textAlign: 'center', color: T.muted, padding: 40, background: T.paper, borderRadius: 12, border: `1px solid ${T.border}` }}>
                    Esta empresa no tiene usuarios registrados.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {profiles.map(p => {
                      const isJefe = p.role === 'jefe'
                      const isEditing = editingProfileId === p.id
                      const isChangingPw = changingPasswordId === p.id
                      const displayName = p.display_name || (isJefe ? co?.contact_person : null) || '(sin nombre)'
                      const showPw = showPasswords[p.id]
                      return (
                        <div key={p.id} style={{ background: T.paper, border: `1px solid ${isJefe ? T.purple : T.border}`, borderRadius: 12, padding: '16px 20px' }}>
                          {/* Fila principal */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                            {/* Info usuario */}
                            <div style={{ flex: 1, minWidth: 200 }}>
                              {isEditing ? (
                                <input value={editForm.display_name || ''} onChange={e => setEditForm(f => ({ ...f, display_name: e.target.value }))}
                                  placeholder="Nombre visible"
                                  style={{ background: T.surface, border: `1px solid ${T.accent}`, borderRadius: 6, padding: '6px 10px', color: T.ink, fontSize: 14, fontFamily: 'inherit', fontWeight: 700, width: '100%', outline: 'none' }} />
                              ) : (
                                <div style={{ fontSize: 15, fontWeight: 700, color: T.ink }}>{displayName}</div>
                              )}
                              <div style={{ fontSize: 11, color: T.blue, marginTop: 2 }}>{p.email || '—'}</div>
                              {/* Contraseña */}
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
                                <span style={{ fontSize: 10, color: T.muted, fontWeight: 700, letterSpacing: 0.5 }}>CONTRASEÑA:</span>
                                {p._password ? (<>
                                  <span style={{ fontFamily: 'monospace', fontSize: 12, color: T.ink, letterSpacing: showPw ? 0 : 2 }}>
                                    {showPw ? p._password : '••••••••'}
                                  </span>
                                  <button onClick={() => setShowPasswords(s => ({ ...s, [p.id]: !s[p.id] }))}
                                    style={{ background: 'transparent', border: 'none', color: T.muted, fontSize: 11, cursor: 'pointer', padding: '0 4px', fontFamily: 'inherit' }}>
                                    {showPw ? 'Ocultar' : 'Ver'}
                                  </button>
                                </>) : (
                                  <span style={{ fontSize: 11, color: T.faint }}>no disponible</span>
                                )}
                              </div>
                            </div>

                            {/* Acciones */}
                            <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                              <span style={{ background: p.active ? T.accentLight : T.redLight, color: p.active ? T.accent : T.red, padding: '3px 10px', borderRadius: 8, fontSize: 11, fontWeight: 700 }}>
                                {p.active ? 'Activo' : 'Suspendido'}
                              </span>
                              <button onClick={() => toggleJefe(p.id, gestionCompanyId)}
                                style={{ background: isJefe ? T.purpleLight : T.surface2, color: isJefe ? T.purple : T.muted, border: `1px solid ${isJefe ? T.purple : T.border}`, borderRadius: 6, padding: '5px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                                {isJefe ? '★ Jefe' : '☆ Hacer jefe'}
                              </button>
                              <button onClick={() => toggleActive(p.id, gestionCompanyId)}
                                style={{ background: 'transparent', color: p.active ? T.red : T.accent, border: `1px solid ${p.active ? T.red : T.accent}`, borderRadius: 6, padding: '5px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                                {p.active ? 'Suspender' : 'Reactivar'}
                              </button>
                              <button onClick={() => { setChangingPasswordId(isChangingPw ? null : p.id); setNewPassword('') }}
                                style={{ background: T.blueLight, color: T.blue, border: `1px solid ${T.blue}`, borderRadius: 6, padding: '5px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                                🔑 Contraseña
                              </button>
                              {isEditing ? (<>
                                <button onClick={() => saveEditProfile(p.id, gestionCompanyId)}
                                  style={{ background: T.accentLight, color: T.accent, border: `1px solid ${T.accent}`, borderRadius: 6, padding: '5px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                                  Guardar
                                </button>
                                <button onClick={() => setEditingProfileId(null)}
                                  style={{ background: 'transparent', border: 'none', color: T.muted, cursor: 'pointer', fontSize: 18 }}>✕</button>
                              </>) : (
                                <button onClick={() => { setEditingProfileId(p.id); setEditForm({ display_name: p.display_name || '' }) }}
                                  style={{ background: T.surface2, color: T.muted, border: `1px solid ${T.border}`, borderRadius: 6, padding: '5px 12px', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
                                  Editar
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Panel cambio de contraseña */}
                          {isChangingPw && (
                            <div style={{ marginTop: 12, padding: '12px 16px', background: T.blueLight, borderRadius: 8, border: `1px solid ${T.blue}`, display: 'flex', gap: 10, alignItems: 'center' }}>
                              <span style={{ fontSize: 12, color: T.blue, fontWeight: 600, whiteSpace: 'nowrap' }}>Nueva contraseña:</span>
                              <input
                                value={newPassword}
                                onChange={e => setNewPassword(e.target.value)}
                                placeholder="Ingresá la nueva contraseña..."
                                autoFocus
                                style={{ flex: 1, background: T.surface, border: `1px solid ${T.blue}`, borderRadius: 6, padding: '7px 12px', color: T.ink, fontSize: 13, fontFamily: 'inherit', outline: 'none' }}
                              />
                              <button
                                onClick={() => { if (window.confirm(`¿Confirmas cambiar la contraseña de ${displayName}?`)) changePassword(p.id, gestionCompanyId) }}
                                disabled={!newPassword.trim()}
                                style={{ background: T.blue, color: '#fff', border: 'none', borderRadius: 6, padding: '7px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', opacity: !newPassword.trim() ? 0.5 : 1, whiteSpace: 'nowrap' }}>
                                Confirmar cambio
                              </button>
                              <button onClick={() => { setChangingPasswordId(null); setNewPassword('') }}
                                style={{ background: 'transparent', border: 'none', color: T.muted, cursor: 'pointer', fontSize: 18 }}>✕</button>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })() : (
            loading ? (
              <div style={{ textAlign: 'center', color: T.muted, padding: 40 }}>Cargando empresas…</div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14 }}>
                {companies.filter(c => c.status === 'approved').map(c => (
                  <div key={c.id}
                    onClick={() => { setGestionCompanyId(c.id); loadCompanyProfiles(c.id) }}
                    style={{ background: T.paper, border: `1px solid ${T.border}`, borderRadius: 12, padding: '18px 20px', cursor: 'pointer', transition: 'border-color 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = T.accent}
                    onMouseLeave={e => e.currentTarget.style.borderColor = T.border}>
                    <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>{c.name}</div>
                    <div style={{ fontSize: 11, color: T.orange, fontFamily: 'monospace', marginBottom: 6 }}>{c.cuit || '—'}</div>
                    <div style={{ fontSize: 12, color: T.muted }}>{c.contact_person || '—'}</div>
                  </div>
                ))}
                {companies.filter(c => c.status === 'approved').length === 0 && (
                  <div style={{ color: T.muted, fontSize: 13 }}>No hay empresas activas aún.</div>
                )}
              </div>
            )
          )
        )}
        </div>{/* fin contenido principal */}

        {/* ── Activity Feed ── */}
        {(() => {
          const icons = {
            company_request:  { icon: '📋', color: T.blue,   bg: T.blueLight,   label: 'Alta solicitada' },
            company_approved: { icon: '✓',  color: T.accent, bg: T.accentLight,  label: 'Alta aprobada' },
            company_rejected: { icon: '✕',  color: T.red,    bg: T.redLight,     label: 'Alta rechazada' },
            company_suspended:{ icon: '⏸',  color: T.orange, bg: T.yellowLight,  label: 'Cuenta suspendida' },
            user_approved:    { icon: '👤', color: T.accent, bg: T.accentLight,  label: 'Usuario aprobado' },
            user_rejected:    { icon: '✕',  color: T.red,    bg: T.redLight,     label: 'Usuario rechazado' },
            password_reset:   { icon: '🔑', color: T.yellow, bg: T.yellowLight,  label: 'Contraseña restablecida' },
          }
          const fmt = (iso) => {
            const d = new Date(iso)
            const now = new Date()
            const diff = Math.floor((now - d) / 1000)
            if (diff < 60) return 'hace un momento'
            if (diff < 3600) return `hace ${Math.floor(diff/60)} min`
            if (diff < 86400) return `hace ${Math.floor(diff/3600)}h`
            return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit' })
          }
          return (
            <div style={{ width: 300, flexShrink: 0, position: 'sticky', top: 24 }}>
              <div style={{ background: T.paper, border: `1px solid ${T.border}`, borderRadius: 14, overflow: 'hidden' }}>
                <div style={{ padding: '16px 20px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: T.ink }}>Actividad reciente</div>
                  <button onClick={loadActivityLog} style={{ background: 'transparent', border: 'none', color: T.muted, cursor: 'pointer', fontSize: 13, fontFamily: 'inherit' }}>↻</button>
                </div>
                <div style={{ maxHeight: 'calc(100vh - 160px)', overflowY: 'auto' }}>
                  {activityLog.length === 0 ? (
                    <div style={{ padding: '32px 20px', textAlign: 'center', color: T.muted, fontSize: 13 }}>Sin actividad registrada</div>
                  ) : activityLog.map(ev => {
                    const cfg = icons[ev.type] || { icon: '•', color: T.muted, bg: T.surface, label: ev.type }
                    return (
                      <div key={ev.id} style={{ padding: '12px 16px', borderBottom: `1px solid ${T.border}`, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                        <div style={{ width: 28, height: 28, borderRadius: 8, background: cfg.bg, color: cfg.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, flexShrink: 0, fontWeight: 700 }}>
                          {cfg.icon}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: cfg.color, marginBottom: 2 }}>{cfg.label}</div>
                          {ev.company_name && <div style={{ fontSize: 12, color: T.ink, fontWeight: 600, marginBottom: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev.company_name}</div>}
                          {ev.user_email && <div style={{ fontSize: 11, color: T.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev.user_email}</div>}
                          {ev.description && ev.description.includes('—') && (
                            <div style={{ fontSize: 11, color: T.muted, marginTop: 2, lineHeight: 1.4 }}>{ev.description.split('—').slice(1).join('—').trim()}</div>
                          )}
                          <div style={{ fontSize: 10, color: T.faint, marginTop: 3 }}>{fmt(ev.created_at)}</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )
        })()}

      </div>
    </div>
  )
}

// ─── AUTH GATE ────────────────────────────────────────────────────────────────
export default function AuthGate({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [mode, setMode] = useState('login') // 'login' | 'register' | 'setup' | 'forgot' | 'recovery'
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const profileLoaded = useRef(false)

  // Login
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  // Olvidé contraseña
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotSent, setForgotSent] = useState(false)
  const [forgotError, setForgotError] = useState('')
  const [forgotSubmitting, setForgotSubmitting] = useState(false)

  // Resetear contraseña (flujo recovery)
  const [resetPassword, setResetPassword] = useState('')
  const [resetConfirm, setResetConfirm] = useState('')
  const [resetError, setResetError] = useState('')
  const [resetSubmitting, setResetSubmitting] = useState(false)
  const [resetDone, setResetDone] = useState(false)

  // Registro / setup
  const [companyName, setCompanyName] = useState('')
  const [cuit, setCuit] = useState('')
  const [phone, setPhone] = useState('')
  const [contactPerson, setContactPerson] = useState('')
  const [address, setAddress] = useState('')

  const resetRegisterFields = () => { setCompanyName(''); setCuit(''); setPhone(''); setContactPerson(''); setAddress('') }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session && window.location.hash.includes('type=recovery')) {
        setMode('recovery')
        setLoading(false)
      } else if (session) {
        loadProfile(session.user.id, session.user.email)
      } else {
        setLoading(false)
      }
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        profileLoaded.current = false
        setSession(null); setProfile(null); setLoading(false); setMode('login')
      } else if (event === 'PASSWORD_RECOVERY') {
        setSession(session)
        setMode('recovery')
        setLoading(false)
      } else if (session && !profileLoaded.current) {
        setSession(session)
        await loadProfile(session.user.id, session.user.email)
      } else if (session) {
        setSession(session)
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  const withTimeout = (promise, ms = 20000) =>
    Promise.race([promise, new Promise((_, r) => setTimeout(() => r(new Error('timeout')), ms))])

  const loadProfile = async (userId, userEmail = '') => {
    setLoading(true); setError('')
    try {
      const profResult = await withTimeout(supabase.from('profiles').select('*').eq('id', userId).single())
      const prof = profResult?.data
      if (prof?.company_id) {
        const coResult = await withTimeout(
          supabase.from('companies')
            .select('name, status, rejection_reason, cuit, phone, contact_person, address')
            .eq('id', prof.company_id).single()
        )
        const co = coResult?.data || {}
        profileLoaded.current = true
        setProfile({ ...prof, email: userEmail, company_name: co.name || 'Mi Empresa', company_status: co.status || 'approved', company_rejection_reason: co.rejection_reason || '' })
      } else {
        profileLoaded.current = true
        setProfile({ ...(prof || { id: userId }), email: userEmail })
        setMode('setup')
      }
    } catch (e) {
      console.error('[AuthGate] loadProfile error:', e)
      setError('Error al cargar perfil: ' + e.message + '. Recargá la página.')
    }
    setLoading(false)
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    if (!email.trim() || !password) { setError('Ingresá email y contraseña'); return }
    setSubmitting(true); setError('')
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    if (error) setError(error.message === 'Invalid login credentials' ? 'Email o contraseña incorrectos' : error.message)
    setSubmitting(false)
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    if (!email.trim() || !password || !companyName.trim() || !cuit.trim() || !contactPerson.trim()) {
      setError('Completá los campos obligatorios (empresa, CUIT, contacto, email y contraseña)'); return
    }
    if (password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres'); return }
    setSubmitting(true); setError('')
    const { data, error } = await supabase.auth.signUp({ email: email.trim(), password })
    if (error) { setError(error.message); setSubmitting(false); return }
    if (data.session) {
      const { error: rpcErr } = await supabase.rpc('register_company', {
        p_company_name: companyName.trim(), p_user_id: data.session.user.id,
        p_cuit: cuit.trim(), p_phone: phone.trim(), p_contact_person: contactPerson.trim(), p_address: address.trim(),
      })
      if (rpcErr) { setError(rpcErr.message); setSubmitting(false); return }
      // Guardar email en companies y registrar en user_requests para visibilidad en panel admin
      const { data: profData } = await supabase.from('profiles').select('company_id').eq('id', data.session.user.id).single()
      if (profData?.company_id) {
        await supabase.from('companies').update({ email: email.trim() }).eq('id', profData.company_id)
        await supabase.from('activity_log').insert({ type: 'company_request', description: 'Alta solicitada', company_name: companyName.trim(), user_email: email.trim() })
        await supabase.from('user_requests').insert({
          email: email.trim(),
          password,
          company_id: profData.company_id,
          company_name: companyName.trim(),
          display_name: contactPerson.trim(),
          role: 'jefe',
          status: 'approved',
          requested_at: new Date().toISOString(),
        })
      }
      await loadProfile(data.session.user.id, data.session.user.email)
    } else {
      setError('Revisá tu email para confirmar la cuenta antes de continuar')
    }
    setSubmitting(false)
  }

  const handleSetupCompany = async (e) => {
    e.preventDefault()
    if (!companyName.trim()) { setError('Ingresá el nombre de la empresa'); return }
    setSubmitting(true); setError('')
    const { error } = await supabase.rpc('register_company', {
      p_company_name: companyName.trim(), p_user_id: session.user.id,
      p_cuit: cuit.trim(), p_phone: phone.trim(), p_contact_person: contactPerson.trim(), p_address: address.trim(),
    })
    if (error) { setError(error.message); setSubmitting(false); return }
    await loadProfile(session.user.id, session.user.email)
    setSubmitting(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setEmail(''); setPassword(''); resetRegisterFields(); setError('')
  }

  const handleForgotPassword = async (e) => {
    e.preventDefault()
    if (!forgotEmail.trim()) { setForgotError('Ingresá tu email'); return }
    setForgotSubmitting(true); setForgotError('')
    const { data: exists, error: rpcErr } = await supabase.rpc('check_email_exists', { p_email: forgotEmail.trim() })
    if (rpcErr || !exists) {
      setForgotError('No encontramos una cuenta activa con ese email.')
      setForgotSubmitting(false)
      return
    }
    const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail.trim(), {
      redirectTo: 'https://nexopyme.vercel.app',
    })
    if (error) setForgotError(error.message)
    else setForgotSent(true)
    setForgotSubmitting(false)
  }

  const handleUpdatePassword = async (e) => {
    e.preventDefault()
    if (!resetPassword || resetPassword.length < 6) { setResetError('La contraseña debe tener al menos 6 caracteres'); return }
    if (resetPassword !== resetConfirm) { setResetError('Las contraseñas no coinciden'); return }
    setResetSubmitting(true); setResetError('')
    const { data: userData } = await supabase.auth.getUser()
    const { error } = await supabase.auth.updateUser({ password: resetPassword })
    if (error) {
      setResetError(error.message)
    } else {
      setResetDone(true)
      const userEmail = userData?.user?.email || 'desconocido'
      supabase.from('activity_log').insert({ type: 'password_reset', description: 'Contraseña restablecida', user_email: userEmail })
      fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: 'nexo.pyme.admin@gmail.com',
          subject: 'Aviso: un usuario restableció su contraseña',
          html: `<div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px">
            <h2 style="color:#e3b341">Restablecimiento de contraseña</h2>
            <p>El siguiente usuario acaba de cambiar su contraseña en NexoPyme:</p>
            <div style="background:#2d1f02;border-left:4px solid #e3b341;padding:12px 16px;border-radius:6px;margin:16px 0">
              <strong style="color:#e3b341">Email:</strong> <span style="color:#e6edf3">${userEmail}</span>
            </div>
            <p style="color:#666;font-size:13px">Si este cambio no fue solicitado por el usuario, revisá la cuenta.</p>
          </div>`,
        }),
      }).catch(() => {})
    }
    setResetSubmitting(false)
  }

  const inputStyle = { width: '100%', background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: '11px 14px', color: T.ink, fontSize: 14, outline: 'none', fontFamily: "'DM Sans','Segoe UI',sans-serif" }
  const labelStyle = { fontSize: 11, fontWeight: 700, color: T.muted, letterSpacing: 0.5, display: 'block', marginBottom: 6 }
  const btnStyle = (disabled) => ({ width: '100%', background: T.accent, color: '#fff', border: 'none', borderRadius: 8, padding: '12px', fontSize: 14, fontWeight: 700, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.6 : 1, fontFamily: "'DM Sans','Segoe UI',sans-serif", transition: 'opacity 0.15s' })
  const globalStyles = `@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap'); *{box-sizing:border-box;margin:0;padding:0} input,select,button,textarea{font-family:inherit} input:focus,textarea:focus{border-color:${T.accent}!important;outline:none}`

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading || (error && !profile?.company_id)) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: T.bg, color: T.ink, fontFamily: "'DM Sans','Segoe UI',sans-serif" }}>
        <div style={{ textAlign: 'center', maxWidth: 380, padding: 24 }}>
          <div style={{ fontSize: 26, fontWeight: 800, marginBottom: 12 }}><span style={{ color: T.accent }}>Nexo</span>PyME</div>
          {error ? (<>
            <div style={{ background: T.redLight, color: T.red, borderRadius: 8, padding: '10px 14px', fontSize: 13, marginBottom: 16 }}>{error}</div>
            <button onClick={() => window.location.reload()} style={{ background: T.accent, color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700 }}>Recargar</button>
          </>) : (
            <div style={{ color: T.muted, fontSize: 14 }}>Cargando…</div>
          )}
        </div>
      </div>
    )
  }

  // ── Nueva contraseña (recovery link) ─────────────────────────────────────
  if (mode === 'recovery') {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: T.bg, fontFamily: "'DM Sans','Segoe UI',sans-serif" }}>
        <style>{globalStyles}</style>
        <div style={{ width: 420, background: T.paper, border: `1px solid ${T.border}`, borderRadius: 14, padding: '40px 36px' }}>
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{ fontSize: 26, fontWeight: 800, marginBottom: 10 }}><span style={{ color: T.accent }}>Nexo</span>PyME</div>
            <div style={{ fontSize: 17, fontWeight: 700, color: T.ink, marginBottom: 6 }}>Crear nueva contraseña</div>
            <div style={{ fontSize: 13, color: T.muted }}>Ingresá tu nueva contraseña para continuar</div>
          </div>
          {resetDone ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ background: T.accentLight, color: T.accent, borderRadius: 10, padding: '16px', fontSize: 14, marginBottom: 24 }}>
                ✓ Contraseña actualizada exitosamente
              </div>
              <button onClick={() => { setMode('login'); setResetPassword(''); setResetConfirm(''); setResetDone(false) }} style={btnStyle(false)}>
                Ir al inicio de sesión
              </button>
            </div>
          ) : (
            <form onSubmit={handleUpdatePassword}>
              <label style={labelStyle}>NUEVA CONTRASEÑA</label>
              <input type="password" style={{ ...inputStyle, marginBottom: 14 }} placeholder="Mínimo 6 caracteres" value={resetPassword} onChange={e => setResetPassword(e.target.value)} autoFocus />
              <label style={labelStyle}>CONFIRMAR CONTRASEÑA</label>
              <input type="password" style={{ ...inputStyle, marginBottom: 20 }} placeholder="Repetí la nueva contraseña" value={resetConfirm} onChange={e => setResetConfirm(e.target.value)} />
              {resetError && <div style={{ background: T.redLight, color: T.red, borderRadius: 8, padding: '10px 14px', fontSize: 13, marginBottom: 16 }}>{resetError}</div>}
              <button type="submit" style={btnStyle(resetSubmitting)} disabled={resetSubmitting}>
                {resetSubmitting ? 'Actualizando…' : 'Actualizar contraseña'}
              </button>
            </form>
          )}
        </div>
      </div>
    )
  }

  // ── Admin panel ───────────────────────────────────────────────────────────
  if (session && profile?.is_admin) {
    return <AdminPanel profile={profile} onLogout={handleLogout} />
  }

  // ── Cuenta pendiente ──────────────────────────────────────────────────────
  if (session && profile?.company_id && profile?.company_status === 'pending') {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: T.bg, fontFamily: "'DM Sans','Segoe UI',sans-serif" }}>
        <style>{globalStyles}</style>
        <div style={{ textAlign: 'center', maxWidth: 480, padding: 24 }}>
          <div style={{ fontSize: 26, fontWeight: 800, marginBottom: 28 }}><span style={{ color: T.accent }}>Nexo</span>PyME</div>
          <div style={{ background: T.paper, border: `1px solid ${T.border}`, borderRadius: 16, padding: '40px 36px' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: T.ink, marginBottom: 10 }}>Solicitud en revisión</div>
            <p style={{ fontSize: 14, color: T.muted, lineHeight: 1.7, marginBottom: 24 }}>Tu cuenta fue registrada correctamente. Nuestro equipo está revisando los datos de tu empresa y te habilitará el acceso a la brevedad.</p>
            <div style={{ background: T.surface, borderRadius: 10, padding: '14px 18px', textAlign: 'left', marginBottom: 24 }}>
              <div style={{ fontSize: 10, color: T.muted, fontWeight: 700, letterSpacing: 0.8, marginBottom: 4 }}>EMPRESA REGISTRADA</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: T.ink }}>{profile.company_name}</div>
            </div>
            <button onClick={handleLogout} style={{ background: 'transparent', border: `1px solid ${T.border}`, borderRadius: 8, padding: '9px 20px', color: T.muted, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>Cerrar sesión</button>
          </div>
        </div>
      </div>
    )
  }

  // ── Cuenta rechazada / suspendida ─────────────────────────────────────────
  if (session && profile?.company_id && profile?.company_status === 'rejected') {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: T.bg, fontFamily: "'DM Sans','Segoe UI',sans-serif" }}>
        <style>{globalStyles}</style>
        <div style={{ textAlign: 'center', maxWidth: 480, padding: 24 }}>
          <div style={{ fontSize: 26, fontWeight: 800, marginBottom: 28 }}><span style={{ color: T.accent }}>Nexo</span>PyME</div>
          <div style={{ background: T.paper, border: `1px solid ${T.red}`, borderRadius: 16, padding: '40px 36px' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>✕</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: T.red, marginBottom: 10 }}>Solicitud no aprobada</div>
            <p style={{ fontSize: 14, color: T.muted, lineHeight: 1.7, marginBottom: 16 }}>Tu solicitud de acceso no fue aprobada en esta oportunidad.</p>
            {profile.company_rejection_reason && (
              <div style={{ background: T.redLight, border: `1px solid ${T.red}`, borderRadius: 10, padding: '12px 16px', marginBottom: 20, textAlign: 'left' }}>
                <div style={{ fontSize: 10, color: T.red, fontWeight: 700, letterSpacing: 0.8, marginBottom: 4 }}>MOTIVO</div>
                <div style={{ fontSize: 13, color: T.ink }}>{profile.company_rejection_reason}</div>
              </div>
            )}
            <p style={{ fontSize: 13, color: T.muted, marginBottom: 24 }}>Si creés que hay un error, contactate con el administrador del sistema.</p>
            <button onClick={handleLogout} style={{ background: 'transparent', border: `1px solid ${T.border}`, borderRadius: 8, padding: '9px 20px', color: T.muted, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>Cerrar sesión</button>
          </div>
        </div>
      </div>
    )
  }

  // ── App principal (aprobada) ──────────────────────────────────────────────
  if (session && profile?.company_id && profile?.company_status === 'approved') {
    return children({ session, profile, onLogout: handleLogout })
  }

  // ── Setup de empresa ──────────────────────────────────────────────────────
  if (session && mode === 'setup') {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: T.bg, fontFamily: "'DM Sans','Segoe UI',sans-serif", overflowY: 'auto' }}>
        <style>{globalStyles}</style>
        <div style={{ width: 500, background: T.paper, border: `1px solid ${T.border}`, borderRadius: 14, padding: '40px 36px', margin: '32px 0' }}>
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{ fontSize: 26, fontWeight: 800, marginBottom: 10 }}><span style={{ color: T.accent }}>Nexo</span>PyME</div>
            <div style={{ fontSize: 17, fontWeight: 700, color: T.ink, marginBottom: 6 }}>Completá los datos de tu empresa</div>
            <div style={{ fontSize: 13, color: T.muted }}>Esta información se usa para la configuración del sistema</div>
          </div>
          <form onSubmit={handleSetupCompany}>
            <label style={labelStyle}>NOMBRE DE LA EMPRESA *</label>
            <input style={{ ...inputStyle, marginBottom: 14 }} placeholder="Ej: Distribuidora San Martín S.A." value={companyName} onChange={e => setCompanyName(e.target.value)} autoFocus />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
              <div><label style={labelStyle}>CUIT *</label><input style={inputStyle} placeholder="20-12345678-9" value={cuit} onChange={e => setCuit(e.target.value)} /></div>
              <div><label style={labelStyle}>TELÉFONO</label><input style={inputStyle} placeholder="+54 11 1234-5678" value={phone} onChange={e => setPhone(e.target.value)} /></div>
            </div>
            <label style={labelStyle}>PERSONA DE CONTACTO *</label>
            <input style={{ ...inputStyle, marginBottom: 14 }} placeholder="Nombre y apellido" value={contactPerson} onChange={e => setContactPerson(e.target.value)} />
            <label style={labelStyle}>DIRECCIÓN</label>
            <input style={{ ...inputStyle, marginBottom: 20 }} placeholder="Calle, número, ciudad" value={address} onChange={e => setAddress(e.target.value)} />
            {error && <div style={{ background: T.redLight, color: T.red, borderRadius: 8, padding: '10px 14px', fontSize: 13, marginBottom: 16 }}>{error}</div>}
            <button type="submit" style={btnStyle(submitting)} disabled={submitting}>{submitting ? 'Enviando solicitud…' : 'Enviar solicitud de acceso →'}</button>
          </form>
          <div style={{ marginTop: 16, textAlign: 'center' }}>
            <button onClick={handleLogout} style={{ background: 'none', border: 'none', color: T.muted, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>Cerrar sesión</button>
          </div>
        </div>
      </div>
    )
  }

  // ── Login / Registro ──────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', height: '100vh', background: T.bg, fontFamily: "'DM Sans','Segoe UI',sans-serif" }}>
      <style>{globalStyles}</style>

      {/* Panel branding */}
      <div style={{ flex: 1, background: `linear-gradient(145deg, ${T.sidebar} 0%, #0f1923 100%)`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 64px', borderRight: `1px solid ${T.border2}` }}>
        <div style={{ maxWidth: 380 }}>
          <div style={{ fontSize: 38, fontWeight: 800, letterSpacing: -1, marginBottom: 16 }}><span style={{ color: T.accent }}>Nexo</span><span style={{ color: T.ink }}>PyME</span></div>
          <div style={{ fontSize: 18, fontWeight: 600, color: T.ink, marginBottom: 10 }}>La plataforma integral para tu empresa</div>
          <div style={{ fontSize: 14, color: T.muted, lineHeight: 1.75, marginBottom: 40 }}>Gestioná ventas, compras, inventario, logística y recursos humanos desde un solo lugar.</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {['Facturas, remitos y presupuestos', 'Control de stock en tiempo real', 'RRHH con liquidación de sueldos', 'Reportes y exportación a Excel'].map(f => (
              <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, color: T.muted, fontSize: 13 }}>
                <span style={{ color: T.accent, fontWeight: 700 }}>✓</span> {f}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Panel formulario */}
      <div style={{ width: mode === 'register' ? 520 : 460, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 48px', overflowY: 'auto' }}>
        <div style={{ width: '100%' }}>

          {/* LOGIN */}
          {mode === 'login' && (<>
            <div style={{ marginBottom: 32 }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: T.ink, marginBottom: 8 }}>Bienvenido de vuelta</div>
              <div style={{ fontSize: 14, color: T.muted }}>Ingresá con tu cuenta para continuar</div>
            </div>
            <form onSubmit={handleLogin}>
              <label style={labelStyle}>EMAIL</label>
              <input type="email" style={{ ...inputStyle, marginBottom: 16 }} placeholder="tu@empresa.com" value={email} onChange={e => setEmail(e.target.value)} autoFocus />
              <label style={labelStyle}>CONTRASEÑA</label>
              <input type="password" style={{ ...inputStyle, marginBottom: 8 }} placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} />
              <div style={{ textAlign: 'right', marginBottom: 20 }}>
                <button type="button" onClick={() => { setMode('forgot'); setForgotEmail(''); setForgotSent(false); setForgotError('') }} style={{ background: 'none', border: 'none', color: T.muted, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
              {error && <div style={{ background: T.redLight, color: T.red, borderRadius: 8, padding: '10px 14px', fontSize: 13, marginBottom: 16 }}>{error}</div>}
              <button type="submit" style={btnStyle(submitting)} disabled={submitting}>{submitting ? 'Ingresando…' : 'Ingresar'}</button>
            </form>
            <div style={{ marginTop: 24, textAlign: 'center', fontSize: 13, color: T.muted }}>
              ¿No tenés cuenta?{' '}
              <button onClick={() => { setMode('register'); setError('') }} style={{ background: 'none', border: 'none', color: T.accent, fontWeight: 600, cursor: 'pointer', fontSize: 13, fontFamily: 'inherit' }}>Solicitá el acceso</button>
            </div>
          </>)}

          {/* OLVIDÉ CONTRASEÑA */}
          {mode === 'forgot' && (<>
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: T.ink, marginBottom: 8 }}>Recuperar contraseña</div>
              <div style={{ fontSize: 14, color: T.muted }}>Ingresá el email asociado a tu cuenta y te enviaremos un link para restablecer tu contraseña.</div>
            </div>
            {forgotSent ? (
              <div style={{ textAlign: 'center' }}>
                <div style={{ background: T.accentLight, color: T.accent, borderRadius: 10, padding: '20px 16px', fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>
                  ✓ Si el email existe, vas a recibir el link en los próximos minutos.<br/>
                  <span style={{ fontSize: 12, opacity: 0.8 }}>Revisá también la carpeta de spam.</span>
                </div>
                <button onClick={() => { setMode('login'); setForgotEmail(''); setForgotSent(false) }} style={{ background: 'none', border: `1px solid ${T.border}`, borderRadius: 8, padding: '9px 20px', color: T.muted, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
                  Volver al inicio de sesión
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword}>
                <label style={labelStyle}>EMAIL DE TU CUENTA</label>
                <input type="email" style={{ ...inputStyle, marginBottom: 20 }} placeholder="tu@empresa.com" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} autoFocus />
                {forgotError && <div style={{ background: T.redLight, color: T.red, borderRadius: 8, padding: '10px 14px', fontSize: 13, marginBottom: 16 }}>{forgotError}</div>}
                <button type="submit" style={btnStyle(forgotSubmitting)} disabled={forgotSubmitting}>
                  {forgotSubmitting ? 'Enviando…' : 'Enviar link de recuperación'}
                </button>
                <div style={{ marginTop: 16, textAlign: 'center' }}>
                  <button type="button" onClick={() => { setMode('login'); setForgotEmail(''); setForgotError('') }} style={{ background: 'none', border: 'none', color: T.muted, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
                    ← Volver
                  </button>
                </div>
              </form>
            )}
          </>)}

          {/* REGISTRO */}
          {mode === 'register' && (<>
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: T.ink, marginBottom: 8 }}>Solicitá tu acceso</div>
              <div style={{ fontSize: 14, color: T.muted }}>Completá los datos de tu empresa. Tu cuenta será revisada antes de activarse.</div>
            </div>
            <form onSubmit={handleRegister}>
              <div style={{ background: T.surface, borderRadius: 10, padding: 16, marginBottom: 14 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: T.muted, letterSpacing: 0.8, marginBottom: 12 }}>DATOS DE LA EMPRESA</div>
                <label style={labelStyle}>NOMBRE DE LA EMPRESA *</label>
                <input style={{ ...inputStyle, marginBottom: 12 }} placeholder="Ej: Distribuidora San Martín S.A." value={companyName} onChange={e => setCompanyName(e.target.value)} autoFocus />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                  <div><label style={labelStyle}>CUIT *</label><input style={inputStyle} placeholder="20-12345678-9" value={cuit} onChange={e => setCuit(e.target.value)} /></div>
                  <div><label style={labelStyle}>TELÉFONO</label><input style={inputStyle} placeholder="+54 11 1234-5678" value={phone} onChange={e => setPhone(e.target.value)} /></div>
                </div>
                <label style={labelStyle}>PERSONA DE CONTACTO *</label>
                <input style={{ ...inputStyle, marginBottom: 12 }} placeholder="Nombre y apellido" value={contactPerson} onChange={e => setContactPerson(e.target.value)} />
                <label style={labelStyle}>DIRECCIÓN</label>
                <input style={inputStyle} placeholder="Calle, número, ciudad" value={address} onChange={e => setAddress(e.target.value)} />
              </div>
              <div style={{ background: T.surface, borderRadius: 10, padding: 16, marginBottom: 14 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: T.muted, letterSpacing: 0.8, marginBottom: 12 }}>CREDENCIALES DE ACCESO</div>
                <label style={labelStyle}>EMAIL *</label>
                <input type="email" style={{ ...inputStyle, marginBottom: 12 }} placeholder="admin@empresa.com" value={email} onChange={e => setEmail(e.target.value)} />
                <label style={labelStyle}>CONTRASEÑA *</label>
                <input type="password" style={inputStyle} placeholder="Mínimo 6 caracteres" value={password} onChange={e => setPassword(e.target.value)} />
              </div>
              {error && <div style={{ background: T.redLight, color: T.red, borderRadius: 8, padding: '10px 14px', fontSize: 13, marginBottom: 12 }}>{error}</div>}
              <div style={{ background: T.yellowLight, border: `1px solid ${T.yellow}`, borderRadius: 8, padding: '10px 14px', fontSize: 12, color: T.yellow, marginBottom: 14 }}>
                ⚠ Tu cuenta quedará pendiente de aprobación hasta que sea revisada por el administrador.
              </div>
              <button type="submit" style={btnStyle(submitting)} disabled={submitting}>{submitting ? 'Enviando solicitud…' : 'Enviar solicitud de acceso'}</button>
            </form>
            <div style={{ marginTop: 20, textAlign: 'center', fontSize: 13, color: T.muted }}>
              ¿Ya tenés cuenta?{' '}
              <button onClick={() => { setMode('login'); setError(''); resetRegisterFields() }} style={{ background: 'none', border: 'none', color: T.accent, fontWeight: 600, cursor: 'pointer', fontSize: 13, fontFamily: 'inherit' }}>Iniciá sesión</button>
            </div>
          </>)}

        </div>
      </div>
    </div>
  )
}
