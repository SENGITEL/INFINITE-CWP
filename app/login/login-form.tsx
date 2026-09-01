"use client"

import { useState } from "react"

export function LoginForm() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      })
      if (res.ok) {
        window.location.href = "/"
        return
      }
      if (res.status === 401) {
        setError("Usuario o contraseña incorrectos.")
      } else {
        setError("No se pudo iniciar sesión. Intenta de nuevo.")
      }
    } catch {
      setError("Error de conexión. Intenta de nuevo.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <style>{cssText}</style>
      <main className="noc-login">
        <div className="grid-overlay" aria-hidden="true" />
        <form className="card" onSubmit={handleSubmit}>
          <div className="brand">
            <span className="dot" aria-hidden="true" />
            <div>
              <h1>NOC CWP</h1>
              <p>Centro de Operaciones · Bitácora</p>
            </div>
          </div>

          <label className="field">
            <span>Usuario</span>
            <input
              type="text"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="admin"
              required
              autoFocus
            />
          </label>

          <label className="field">
            <span>Contraseña</span>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </label>

          {error ? (
            <p className="error" role="alert">
              {error}
            </p>
          ) : null}

          <button type="submit" disabled={loading}>
            {loading ? "Verificando…" : "Ingresar"}
          </button>

          <p className="hint">Acceso restringido a personal autorizado.</p>
        </form>
      </main>
    </>
  )
}

const cssText = `
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Inter:wght@400;500;600;700;800&display=swap');

.noc-login{
  --bg:#060a13; --panel:#0f1729; --line:#26385c; --text:#eef2fb;
  --text-dim:#94a6cc; --text-faint:#5c6d8f; --accent:#2ee8d4; --danger:#ff4d6d;
  position:relative; min-height:100dvh; display:flex; align-items:center;
  justify-content:center; padding:24px; background:var(--bg);
  font-family:'Inter',sans-serif; color:var(--text); overflow:hidden;
}
.noc-login .grid-overlay{
  position:absolute; inset:0;
  background-image:linear-gradient(rgba(46,232,212,0.06) 1px,transparent 1px),
    linear-gradient(90deg,rgba(46,232,212,0.06) 1px,transparent 1px);
  background-size:44px 44px;
  mask-image:radial-gradient(circle at 50% 40%,#000 0%,transparent 70%);
}
.noc-login .card{
  position:relative; z-index:1; width:100%; max-width:380px;
  display:flex; flex-direction:column; gap:18px;
  background:var(--panel); border:1px solid var(--line); border-radius:14px;
  padding:32px; box-shadow:0 20px 60px -20px rgba(0,0,0,0.7);
}
.noc-login .brand{ display:flex; align-items:center; gap:12px; margin-bottom:6px; }
.noc-login .brand .dot{
  width:12px; height:12px; border-radius:50%; background:var(--accent);
  box-shadow:0 0 0 4px rgba(46,232,212,0.15),0 0 16px var(--accent);
  flex:0 0 auto;
}
.noc-login .brand h1{
  font-family:'JetBrains Mono',monospace; font-size:20px; font-weight:800;
  letter-spacing:2px; margin:0; color:var(--text);
}
.noc-login .brand p{ margin:2px 0 0; font-size:12px; color:var(--text-faint); }
.noc-login .field{ display:flex; flex-direction:column; gap:7px; }
.noc-login .field span{
  font-size:11px; font-weight:600; letter-spacing:1px; text-transform:uppercase;
  color:var(--text-dim); font-family:'JetBrains Mono',monospace;
}
.noc-login input{
  background:#0a0f1c; border:1px solid var(--line); border-radius:9px;
  padding:12px 14px; color:var(--text); font-size:14px; font-family:inherit;
  outline:none; transition:border-color .15s,box-shadow .15s;
}
.noc-login input::placeholder{ color:var(--text-faint); }
.noc-login input:focus{
  border-color:var(--accent); box-shadow:0 0 0 3px rgba(46,232,212,0.15);
}
.noc-login button{
  margin-top:4px; padding:13px 16px; border:none; border-radius:9px;
  background:var(--accent); color:#03211e; font-size:14px; font-weight:700;
  letter-spacing:.5px; cursor:pointer; font-family:inherit;
  transition:filter .15s,transform .05s;
}
.noc-login button:hover:not(:disabled){ filter:brightness(1.08); }
.noc-login button:active:not(:disabled){ transform:translateY(1px); }
.noc-login button:disabled{ opacity:.6; cursor:default; }
.noc-login .error{
  margin:0; font-size:13px; color:var(--danger); background:rgba(255,77,109,0.1);
  border:1px solid rgba(255,77,109,0.3); border-radius:8px; padding:9px 12px;
}
.noc-login .hint{
  margin:2px 0 0; text-align:center; font-size:11px; color:var(--text-faint);
}
`
