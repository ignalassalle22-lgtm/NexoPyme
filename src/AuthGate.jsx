import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'

const T = {
  bg: "#0d1117", sidebar: "#0a0e14", paper: "#161b22", surface: "#1c2333",
  surface2: "#212836", border: "#2a3441", border2: "#1e2d3d",
  ink: "#e6edf3", muted: "#7d8590", faint: "#3d4a5c",
  accent: "#2ea043", accentLight: "#0d2818",
  red: "#f85149", redLight: "#2d0f0e",
}

export default function AuthGate({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [mode, setMode] = useState('login') // 'login' | 'register' | 'setup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) loadProfile(session.user.id)
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session)
      if (session) {
        await loadProfile(session.user.id)
      } else {
        setProfile(null)
        setLoading(false)
        setMode('login')
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const withTimeout = (promise, ms = 8000) =>
    Promise.race([promise, new Promise((_, r) => setTimeout(() => r(new Error('timeout')), ms))])

  const loadProfile = async (userId) => {
    setLoading(true)
    try {
      const sessResult = await supabase.auth.getSession()
      const userEmail = sessResult?.data?.session?.user?.email || ''

      const profResult = await withTimeout(
        supabase.from('profiles').select('*').eq('id', userId).single()
      )
      const prof = profResult?.data

      if (prof?.company_id) {
        const coResult = await withTimeout(
          supabase.from('companies').select('name').eq('id', prof.company_id).single()
        )
        setProfile({ ...prof, email: userEmail, company_name: coResult?.data?.name || 'Mi Empresa' })
      } else {
        setProfile({ ...(prof || { id: userId }), email: userEmail })
        setMode('setup')
      }
    } catch (e) {
      console.error('loadProfile error:', e)
      setError('Error al cargar perfil: ' + e.message + '. Recargá la página.')
    }
    setLoading(false)
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    if (!email.trim() || !password) { setError('Ingresá email y contraseña'); return }
    setSubmitting(true); setError('')
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    if (error) {
      setError(error.message === 'Invalid login credentials' ? 'Email o contraseña incorrectos' : error.message)
    }
    setSubmitting(false)
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    if (!email.trim() || !password || !companyName.trim()) { setError('Completá todos los campos'); return }
    if (password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres'); return }
    setSubmitting(true); setError('')
    const { data, error } = await supabase.auth.signUp({ email: email.trim(), password })
    if (error) { setError(error.message); setSubmitting(false); return }
    if (data.session) {
      const { error: rpcErr } = await supabase.rpc('register_company', {
        p_company_name: companyName.trim(),
        p_user_id: data.session.user.id
      })
      if (rpcErr) { setError(rpcErr.message); setSubmitting(false); return }
      await loadProfile(data.session.user.id)
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
      p_company_name: companyName.trim(),
      p_user_id: session.user.id
    })
    if (error) { setError(error.message); setSubmitting(false); return }
    await loadProfile(session.user.id)
    setSubmitting(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setEmail(''); setPassword(''); setCompanyName(''); setError('')
  }

  const inputStyle = {
    width: '100%', background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8,
    padding: '11px 14px', color: T.ink, fontSize: 14, outline: 'none',
    fontFamily: "'DM Sans', 'Segoe UI', sans-serif", marginBottom: 0,
  }
  const btnStyle = (disabled) => ({
    width: '100%', background: T.accent, color: '#fff', border: 'none', borderRadius: 8,
    padding: '12px', fontSize: 14, fontWeight: 700, cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.6 : 1, fontFamily: "'DM Sans', 'Segoe UI', sans-serif", transition: 'opacity 0.15s',
  })

  if (loading || (error && !profile?.company_id)) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: T.bg, color: T.ink, fontFamily: "'DM Sans', 'Segoe UI', sans-serif" }}>
        <div style={{ textAlign: 'center', maxWidth: 380, padding: 24 }}>
          <div style={{ fontSize: 26, fontWeight: 800, marginBottom: 12 }}>
            <span style={{ color: T.accent }}>Nexo</span>PyME
          </div>
          {error ? (
            <>
              <div style={{ background: T.redLight, color: T.red, borderRadius: 8, padding: '10px 14px', fontSize: 13, marginBottom: 16 }}>{error}</div>
              <button onClick={() => window.location.reload()} style={{ background: T.accent, color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700 }}>Recargar</button>
            </>
          ) : (
            <div style={{ color: T.muted, fontSize: 14 }}>Cargando…</div>
          )}
        </div>
      </div>
    )
  }

  if (session && profile?.company_id) {
    return children({ session, profile, onLogout: handleLogout })
  }

  if (session && mode === 'setup') {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: T.bg, fontFamily: "'DM Sans', 'Segoe UI', sans-serif" }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap'); * { box-sizing: border-box; margin: 0; padding: 0; } input { font-family: inherit; } input:focus { border-color: ${T.accent} !important; outline: none; }`}</style>
        <div style={{ width: 420, background: T.paper, border: `1px solid ${T.border}`, borderRadius: 14, padding: '40px 36px' }}>
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{ fontSize: 26, fontWeight: 800, marginBottom: 10 }}><span style={{ color: T.accent }}>Nexo</span>PyME</div>
            <div style={{ fontSize: 17, fontWeight: 700, color: T.ink, marginBottom: 6 }}>Configurá tu empresa</div>
            <div style={{ fontSize: 13, color: T.muted }}>Ingresá el nombre de tu empresa para comenzar</div>
          </div>
          <form onSubmit={handleSetupCompany}>
            <label style={{ fontSize: 11, fontWeight: 700, color: T.muted, letterSpacing: 0.5, display: 'block', marginBottom: 6 }}>NOMBRE DE LA EMPRESA</label>
            <input style={{ ...inputStyle, marginBottom: 20 }} placeholder="Ej: Distribuidora San Martín S.A." value={companyName} onChange={e => setCompanyName(e.target.value)} autoFocus />
            {error && <div style={{ background: T.redLight, color: T.red, borderRadius: 8, padding: '10px 14px', fontSize: 13, marginBottom: 16 }}>{error}</div>}
            <button type="submit" style={btnStyle(submitting)} disabled={submitting}>{submitting ? 'Configurando…' : 'Comenzar →'}</button>
          </form>
          <div style={{ marginTop: 16, textAlign: 'center' }}>
            <button onClick={handleLogout} style={{ background: 'none', border: 'none', color: T.muted, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>Cerrar sesión</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', height: '100vh', background: T.bg, fontFamily: "'DM Sans', 'Segoe UI', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap'); * { box-sizing: border-box; margin: 0; padding: 0; } input { font-family: inherit; } input:focus { border-color: ${T.accent} !important; outline: none; }`}</style>

      {/* Branding panel */}
      <div style={{ flex: 1, background: `linear-gradient(145deg, ${T.sidebar} 0%, #0f1923 100%)`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 64px', borderRight: `1px solid ${T.border2}` }}>
        <div style={{ maxWidth: 380 }}>
          <div style={{ fontSize: 38, fontWeight: 800, letterSpacing: -1, marginBottom: 16 }}>
            <span style={{ color: T.accent }}>Nexo</span><span style={{ color: T.ink }}>PyME</span>
          </div>
          <div style={{ fontSize: 18, fontWeight: 600, color: T.ink, marginBottom: 10 }}>La plataforma integral para tu empresa</div>
          <div style={{ fontSize: 14, color: T.muted, lineHeight: 1.75, marginBottom: 40 }}>
            Gestioná ventas, compras, inventario, logística y recursos humanos desde un solo lugar.
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {['Facturas, remitos y presupuestos', 'Control de stock en tiempo real', 'RRHH con liquidación de sueldos', 'Reportes y exportación a Excel'].map(f => (
              <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, color: T.muted, fontSize: 13 }}>
                <span style={{ color: T.accent, fontWeight: 700 }}>✓</span> {f}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Form panel */}
      <div style={{ width: 460, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 56px' }}>
        <div style={{ width: '100%' }}>
          {mode === 'login' ? (
            <>
              <div style={{ marginBottom: 32 }}>
                <div style={{ fontSize: 24, fontWeight: 800, color: T.ink, marginBottom: 8 }}>Bienvenido de vuelta</div>
                <div style={{ fontSize: 14, color: T.muted }}>Ingresá con tu cuenta para continuar</div>
              </div>
              <form onSubmit={handleLogin}>
                <label style={{ fontSize: 11, fontWeight: 700, color: T.muted, letterSpacing: 0.5, display: 'block', marginBottom: 6 }}>EMAIL</label>
                <input type="email" style={{ ...inputStyle, marginBottom: 16 }} placeholder="tu@empresa.com" value={email} onChange={e => setEmail(e.target.value)} autoFocus />
                <label style={{ fontSize: 11, fontWeight: 700, color: T.muted, letterSpacing: 0.5, display: 'block', marginBottom: 6 }}>CONTRASEÑA</label>
                <input type="password" style={{ ...inputStyle, marginBottom: 24 }} placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} />
                {error && <div style={{ background: T.redLight, color: T.red, borderRadius: 8, padding: '10px 14px', fontSize: 13, marginBottom: 16 }}>{error}</div>}
                <button type="submit" style={btnStyle(submitting)} disabled={submitting}>{submitting ? 'Ingresando…' : 'Ingresar'}</button>
              </form>
              <div style={{ marginTop: 24, textAlign: 'center', fontSize: 13, color: T.muted }}>
                ¿No tenés cuenta?{' '}
                <button onClick={() => { setMode('register'); setError('') }} style={{ background: 'none', border: 'none', color: T.accent, fontWeight: 600, cursor: 'pointer', fontSize: 13, fontFamily: 'inherit' }}>Crear cuenta</button>
              </div>
            </>
          ) : (
            <>
              <div style={{ marginBottom: 32 }}>
                <div style={{ fontSize: 24, fontWeight: 800, color: T.ink, marginBottom: 8 }}>Crear cuenta</div>
                <div style={{ fontSize: 14, color: T.muted }}>Registrá tu empresa en NexoPyME</div>
              </div>
              <form onSubmit={handleRegister}>
                <label style={{ fontSize: 11, fontWeight: 700, color: T.muted, letterSpacing: 0.5, display: 'block', marginBottom: 6 }}>EMPRESA</label>
                <input style={{ ...inputStyle, marginBottom: 16 }} placeholder="Nombre de tu empresa" value={companyName} onChange={e => setCompanyName(e.target.value)} autoFocus />
                <label style={{ fontSize: 11, fontWeight: 700, color: T.muted, letterSpacing: 0.5, display: 'block', marginBottom: 6 }}>EMAIL</label>
                <input type="email" style={{ ...inputStyle, marginBottom: 16 }} placeholder="admin@empresa.com" value={email} onChange={e => setEmail(e.target.value)} />
                <label style={{ fontSize: 11, fontWeight: 700, color: T.muted, letterSpacing: 0.5, display: 'block', marginBottom: 6 }}>CONTRASEÑA</label>
                <input type="password" style={{ ...inputStyle, marginBottom: 24 }} placeholder="Mínimo 6 caracteres" value={password} onChange={e => setPassword(e.target.value)} />
                {error && <div style={{ background: T.redLight, color: T.red, borderRadius: 8, padding: '10px 14px', fontSize: 13, marginBottom: 16 }}>{error}</div>}
                <button type="submit" style={btnStyle(submitting)} disabled={submitting}>{submitting ? 'Creando cuenta…' : 'Crear cuenta'}</button>
              </form>
              <div style={{ marginTop: 24, textAlign: 'center', fontSize: 13, color: T.muted }}>
                ¿Ya tenés cuenta?{' '}
                <button onClick={() => { setMode('login'); setError('') }} style={{ background: 'none', border: 'none', color: T.accent, fontWeight: 600, cursor: 'pointer', fontSize: 13, fontFamily: 'inherit' }}>Iniciá sesión</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
