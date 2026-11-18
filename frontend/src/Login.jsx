import { useState } from 'react';
import { iniciarSesion } from './api';
import { handleInvalid, limpiarValidacion } from './validacion';

export default function Login({ onLogin, aviso }) {
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setEnviando(true);
    try {
      const sesion = await iniciarSesion(usuario, password);
      onLogin(sesion);
    } catch (err) {
      setError(err.message || 'No se pudo iniciar sesión.');
      setPassword('');
    } finally {
      setEnviando(false);
    }
  }

  function alCambiar(setter) {
    return (e) => {
      e.target.setCustomValidity('');
      setter(e.target.value);
    };
  }

  return (
    <div className="login-page">
      <section className="login-card">
        <h1>POS · Productos</h1>
        <p className="subtitle">Inicia sesión para continuar</p>

        {aviso && !error && (
          <div className="alert alert-error" role="status">
            <span>⏰ {aviso}</span>
          </div>
        )}

        {error && (
          <div className="alert alert-error" role="alert">
            <span>⚠️ {error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="login-usuario">Usuario</label>
            <input
              id="login-usuario"
              type="text"
              name="usuario"
              value={usuario}
              onChange={alCambiar(setUsuario)}
              onInvalid={handleInvalid}
              autoComplete="username"
              autoFocus
              required
              disabled={enviando}
            />
          </div>

          <div className="form-group">
            <label htmlFor="login-password">Contraseña</label>
            <input
              id="login-password"
              type="password"
              name="password"
              value={password}
              onChange={alCambiar(setPassword)}
              onInvalid={handleInvalid}
              autoComplete="current-password"
              required
              disabled={enviando}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary login-submit"
            onClick={(e) => limpiarValidacion(e.currentTarget.form)}
            disabled={enviando}
          >
            {enviando ? 'Ingresando...' : 'Iniciar sesión'}
          </button>
        </form>
      </section>
    </div>
  );
}
