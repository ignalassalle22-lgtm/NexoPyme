import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import AuthGate from './AuthGate.jsx'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthGate>
      {({ session, profile, onLogout }) => (
        <App session={session} profile={profile} onLogout={onLogout} />
      )}
    </AuthGate>
  </StrictMode>
)
