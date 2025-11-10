/**
 * Página de Login
 */
import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../contexts/authStore';
import { UserRole } from '../../types';
import './LoginPage.css';

export const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const user = useAuthStore((state) => state.user);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(username, password);

      // Redirigir según el rol del usuario
      const currentUser = useAuthStore.getState().user;
      if (currentUser) {
        switch (currentUser.role) {
          case UserRole.ADMIN:
            navigate('/dashboard/admin');
            break;
          case UserRole.ASISTENTE_ADMINISTRATIVO:
            navigate('/dashboard/asistente_administrativo');
            break;
          case UserRole.PERITO:
            navigate('/dashboard/perito');
            break;
          case UserRole.FISCAL:
            navigate('/dashboard/fiscal');
            break;
          default:
            navigate('/dashboard');
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al iniciar sesión');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>SIGECA</h1>
          <p>Sistema de Gestión de Cámaras Gesell</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="username">Usuario</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoFocus
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="btn-primary" disabled={isLoading}>
            {isLoading ? 'Iniciando sesión...' : 'Ingresar'}
          </button>
        </form>

        <div className="login-footer">
          <small>Instituto de Medicina Legal y Ciencias Forenses</small>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
