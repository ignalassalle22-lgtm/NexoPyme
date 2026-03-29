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

// ─── ADMIN PANEL ──────────────────────────────────────────────────────────────
function AdminPanel({ profile, onLogout }) {
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('pending')
  const [rejectId, setRejectId] = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const [saving, setSaving] = useState(false)
  const [expandedId, setExpandedId] = useState(null)

  // User requests
  const [userRequests, setUserRequests] = useState([])
  const [urLoading, setUrLoading] = useState(false)
  const [urRejectId, setUrRejectId] = useState(null)
  const [urRejectReason, setUrRejectReason] = useState('')

  useEffect(() => { loadCompanies() }, [])
  useEffect(() => { if (tab === 'usuarios') loadUserRequests() }, [tab])

  const loadCompanies = async () => {
    setLoading(true)
    const { data } = await supabase.from('companies').select('*').order('requested_at', { ascending: false })
    if (data) setCompanies(data)
    setLoading(false)
  }

  const approve = async (id) => {
    setSaving(true)
    await supabase.from('companies').update({ status: 'approved' }).eq('id', id)
    setCompanies(prev => prev.map(c => c.id === id ? { ...c, status: 'approved' } : c))
    setSaving(false)
  }

  const confirmReject = async () => {
    if (!rejectReason.trim()) return
    setSaving(true)
    await supabase.from('companies').update({ status: 'rejected', rejection_reason: rejectReason.trim() }).eq('id', rejectId)
    setCompanies(prev => prev.map(c => c.id === rejectId ? { ...c, status: 'rejected', rejection_reason: rejectReason.trim() } : c))
    setRejectId(null); setRejectReason(''); setSaving(false)
  }

  const suspend = async (id) => {
    if (!window.confirm('¿Suspender esta cuenta? El usuario no podrá acceder hasta que la reactives.')) return
    await supabase.from('companies').update({ status: 'rejected', rejection_reason: 'Cuenta suspendida por el administrador.' }).eq('id', id)
    setCompanies(prev => prev.map(c => c.id === id ? { ...c, status: 'rejected', rejection_reason: 'Cuenta suspendida por el administrador.' } : c))
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
    const { error } = await supabase.rpc('approve_user_request', { p_request_id: id })
    if (error) alert('Error al aprobar: ' + error.message)
    else setUserRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'approved' } : r))
    setSaving(false)
  }

  const confirmRejectUser = async () => {
    if (!urRejectReason.trim()) return
    setSaving(true)
    await supabase.from('user_requests').update({ status: 'rejected', rejection_reason: urRejectReason.trim() }).eq('id', urRejectId)
    setUserRequests(prev => prev.map(r => r.id === urRejectId ? { ...r, status: 'rejected', rejection_reason: urRejectReason.trim() } : r))
    setUrRejectId(null); setUrRejectReason(''); setSaving(false)
  }

  const pending = companies.filter(c => c.status === 'pending')
  const shown = tab === 'pending' ? pending : tab === 'approved' ? companies.filter(c => c.status === 'approved') : companies

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

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '36px 40px' }}>
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

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: T.surface, borderRadius: 10, padding: 4, width: 'fit-content' }}>
          {[
            ['pending', `Pendientes (${pending.length})`],
            ['approved', 'Activas'],
            ['all', 'Todas'],
            ['usuarios', `Usuarios (${userRequests.filter(r => r.status === 'pending').length})`],
          ].map(([v, l]) => (
            <button key={v} onClick={() => setTab(v)}
              style={{ padding: '7px 18px', borderRadius: 7, border: 'none', background: tab === v ? T.paper : 'transparent', color: tab === v ? T.ink : T.muted, fontWeight: tab === v ? 700 : 500, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
              {l}
            </button>
          ))}
        </div>

        {/* Tabla solicitudes de usuarios */}
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
                              <input
                                value={urRejectReason}
                                onChange={e => setUrRejectReason(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && confirmRejectUser()}
                                placeholder="Ej: Email ya registrado, datos incorrectos..."
                                autoFocus
                                style={{ flex: 1, background: T.surface, border: `1px solid ${T.red}`, borderRadius: 6, padding: '8px 12px', color: T.ink, fontSize: 13, fontFamily: 'inherit', outline: 'none' }}
                              />
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

        {/* Tabla empresas */}
        {tab !== 'usuarios' && (loading ? (
          <div style={{ textAlign: 'center', color: T.muted, padding: 40 }}>Cargando cuentas…</div>
        ) : shown.length === 0 ? (
          <div style={{ textAlign: 'center', color: T.muted, padding: 40, background: T.paper, borderRadius: 12, border: `1px solid ${T.border}` }}>
            {tab === 'pending' ? 'No hay solicitudes pendientes.' : 'No hay cuentas en esta categoría.'}
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
                {shown.flatMap(c => {
                  const rows = []

                  // Fila principal
                  rows.push(
                    <tr key={c.id} style={{ borderTop: `1px solid ${T.border}`, cursor: 'pointer' }} onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}>
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

                  // Detalle expandido
                  if (expandedId === c.id) {
                    rows.push(
                      <tr key={c.id + '-detail'} style={{ background: T.surface }}>
                        <td colSpan={7} style={{ padding: '14px 20px' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
                            {[
                              ['Nombre empresa', c.name],
                              ['CUIT', c.cuit || '—'],
                              ['Persona de contacto', c.contact_person || '—'],
                              ['Teléfono', c.phone || '—'],
                              ['Dirección', c.address || '—'],
                              ['Estado', c.status],
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

                  // Fila de motivo de rechazo
                  if (rejectId === c.id) {
                    rows.push(
                      <tr key={c.id + '-reject'} style={{ background: T.redLight }}>
                        <td colSpan={7} style={{ padding: '14px 20px' }}>
                          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                            <span style={{ fontSize: 13, color: T.red, fontWeight: 600, whiteSpace: 'nowrap' }}>Motivo del rechazo:</span>
                            <input
                              value={rejectReason}
                              onChange={e => setRejectReason(e.target.value)}
                              onKeyDown={e => e.key === 'Enter' && confirmReject()}
                              placeholder="Ej: CUIT no verificado, información incompleta..."
                              autoFocus
                              style={{ flex: 1, background: T.surface, border: `1px solid ${T.red}`, borderRadius: 6, padding: '8px 12px', color: T.ink, fontSize: 13, fontFamily: 'inherit', outline: 'none' }}
                            />
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
        ))}
      </div>
    </div>
  )
}

// ─── AUTH GATE ────────────────────────────────────────────────────────────────
export default function AuthGate({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [mode, setMode] = useState('login') // 'login' | 'register' | 'setup'
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const profileLoaded = useRef(false)

  // Login
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

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
      if (session) loadProfile(session.user.id, session.user.email)
      else setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        profileLoaded.current = false
        setSession(null); setProfile(null); setLoading(false); setMode('login')
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
              <input type="password" style={{ ...inputStyle, marginBottom: 24 }} placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} />
              {error && <div style={{ background: T.redLight, color: T.red, borderRadius: 8, padding: '10px 14px', fontSize: 13, marginBottom: 16 }}>{error}</div>}
              <button type="submit" style={btnStyle(submitting)} disabled={submitting}>{submitting ? 'Ingresando…' : 'Ingresar'}</button>
            </form>
            <div style={{ marginTop: 24, textAlign: 'center', fontSize: 13, color: T.muted }}>
              ¿No tenés cuenta?{' '}
              <button onClick={() => { setMode('register'); setError('') }} style={{ background: 'none', border: 'none', color: T.accent, fontWeight: 600, cursor: 'pointer', fontSize: 13, fontFamily: 'inherit' }}>Solicitá el acceso</button>
            </div>
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
