'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const ERRORES: Record<string, string> = {
  'Invalid login credentials': 'Email o contraseña incorrectos',
  'Email not confirmed': 'Confirmá tu email antes de ingresar',
  'Too many requests': 'Demasiados intentos, esperá unos minutos',
}

function mensajeError(msg: string): string {
  return ERRORES[msg] ?? 'Error al iniciar sesión, intentá de nuevo'
}

export default function LoginPage() {
  const [modo, setModo] = useState<'login' | 'forgot'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [cargando, setCargando] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setCargando(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(mensajeError(error.message))
      setCargando(false)
    } else {
      router.push('/admin')
      router.refresh()
    }
  }

  async function handleForgot(e: React.FormEvent) {
    e.preventDefault()
    setCargando(true)
    setError('')
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/admin/update-password`,
    })
    setCargando(false)
    if (error) {
      setError('No se pudo enviar el email, revisá la dirección e intentá de nuevo')
    } else {
      setInfo('Revisá tu email — te llegó un link para cambiar la contraseña')
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm rounded-xl bg-white p-8 shadow-sm ring-1 ring-gray-200">
        <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-gray-400">
          KartManager · Admin
        </p>
        <h1 className="mb-6 text-xl font-semibold text-gray-900">
          {modo === 'login' ? 'Ingresá al panel' : 'Recuperar contraseña'}
        </h1>

        {modo === 'login' ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="organizador@ejemplo.com"
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={cargando}
              className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {cargando ? 'Ingresando...' : 'Ingresar'}
            </button>

            <button
              type="button"
              onClick={() => {
                setModo('forgot')
                setError('')
              }}
              className="w-full text-center text-sm text-gray-500 hover:text-gray-700"
            >
              ¿Olvidaste tu contraseña?
            </button>
          </form>
        ) : (
          <form onSubmit={handleForgot} className="space-y-4">
            <p className="text-sm text-gray-600">
              Ingresá tu email y te mandamos un link para cambiar la contraseña.
            </p>
            <div>
              <label
                htmlFor="email-forgot"
                className="block text-sm font-medium text-gray-700"
              >
                Email
              </label>
              <input
                id="email-forgot"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="organizador@ejemplo.com"
              />
            </div>

            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            )}
            {info && (
              <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
                {info}
              </p>
            )}

            {!info && (
              <button
                type="submit"
                disabled={cargando}
                className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {cargando ? 'Enviando...' : 'Enviar link'}
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setModo('login')
                setError('')
                setInfo('')
              }}
              className="w-full text-center text-sm text-gray-500 hover:text-gray-700"
            >
              ← Volver al login
            </button>
          </form>
        )}
      </div>
    </main>
  )
}
