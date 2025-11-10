/**
 * Layout principal de la aplicación
 */
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../contexts/authStore';
import { UserRole } from '../../types';
import './Layout.css';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getMenuItems = () => {
    if (!user) return [];

    const baseItems = [
      { path: `/dashboard/${user.role}`, label: 'Dashboard' },
    ];

    switch (user.role) {
      case UserRole.ADMIN:
        return [
          ...baseItems,
          { path: '/mantenimientos/sedes', label: 'Sedes' },
          { path: '/mantenimientos/salas', label: 'Salas' },
          { path: '/mantenimientos/peritos', label: 'Peritos' },
          { path: '/mantenimientos/despachos', label: 'Despachos' },
          { path: '/usuarios', label: 'Usuarios' },
          { path: '/reportes', label: 'Reportes' },
        ];

      case UserRole.ASISTENTE_ADMINISTRATIVO:
        return [
          ...baseItems,
          { path: '/solicitudes/pendientes', label: 'Solicitudes Pendientes' },
          { path: '/programacion/calendario', label: 'Calendario' },
          { path: '/reportes', label: 'Reportes' },
        ];

      case UserRole.PERITO:
        return [
          ...baseItems,
          { path: '/agenda/mis-citas', label: 'Mis Citas' },
        ];

      case UserRole.FISCAL:
        return [
          ...baseItems,
          { path: '/solicitudes/nueva', label: 'Nueva Solicitud' },
          { path: '/solicitudes/mis-solicitudes', label: 'Mis Solicitudes' },
        ];

      default:
        return baseItems;
    }
  };

  const menuItems = getMenuItems();

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>SIGECA</h2>
          <p className="user-info">{user?.full_name}</p>
          <span className="user-role">{user?.role.replace('_', ' ').toUpperCase()}</span>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <Link key={item.path} to={item.path} className="nav-item">
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button onClick={handleLogout} className="btn-logout">
            Cerrar Sesión
          </button>
        </div>
      </aside>

      <main className="main-content">
        <div className="content-wrapper">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
