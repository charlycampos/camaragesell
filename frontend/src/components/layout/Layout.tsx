/**
 * Layout principal de la aplicación - Refactorizado con Tailwind CSS
 */
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../contexts/authStore';
import { UserRole } from '../../types';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  Building2,
  DoorOpen,
  Users,
  FileText,
  Calendar,
  ClipboardList,
  PlusCircle,
  FolderOpen,
  BarChart3,
  LogOut,
  User,
  MapPin
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

interface MenuItem {
  path: string;
  label: string;
  icon: React.ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error during logout:', error);
      // Forzar navegación a login incluso si hay error
      navigate('/login');
    }
  };

  const getMenuItems = (): MenuItem[] => {
    if (!user) return [];

    const baseItems: MenuItem[] = [
      {
        path: `/dashboard/${user.role}`,
        label: 'Dashboard',
        icon: <LayoutDashboard className="h-5 w-5" />
      },
    ];

    switch (user.role) {
      case UserRole.ADMIN:
        return [
          ...baseItems,
          {
            path: '/mantenimientos/distritos-fiscales',
            label: 'Distritos Fiscales',
            icon: <MapPin className="h-5 w-5" />
          },
          {
            path: '/mantenimientos/sedes',
            label: 'Sedes',
            icon: <Building2 className="h-5 w-5" />
          },
          {
            path: '/mantenimientos/salas',
            label: 'Salas',
            icon: <DoorOpen className="h-5 w-5" />
          },
          {
            path: '/mantenimientos/peritos',
            label: 'Peritos',
            icon: <User className="h-5 w-5" />
          },
          {
            path: '/mantenimientos/despachos',
            label: 'Despachos',
            icon: <FileText className="h-5 w-5" />
          },
          {
            path: '/usuarios',
            label: 'Usuarios',
            icon: <Users className="h-5 w-5" />
          },
          {
            path: '/reportes',
            label: 'Reportes',
            icon: <BarChart3 className="h-5 w-5" />
          },
        ];

      case UserRole.ASISTENTE_ADMINISTRATIVO:
        return [
          ...baseItems,
          {
            path: '/solicitudes/pendientes',
            label: 'Solicitudes Pendientes',
            icon: <ClipboardList className="h-5 w-5" />
          },
          {
            path: '/programacion/calendario',
            label: 'Calendario',
            icon: <Calendar className="h-5 w-5" />
          },
          {
            path: '/reportes',
            label: 'Reportes',
            icon: <BarChart3 className="h-5 w-5" />
          },
        ];

      case UserRole.PERITO:
        return [
          ...baseItems,
          {
            path: '/agenda/mis-citas',
            label: 'Mis Citas',
            icon: <Calendar className="h-5 w-5" />
          },
        ];

      case UserRole.FISCAL:
        return [
          ...baseItems,
          {
            path: '/solicitudes/nueva',
            label: 'Nueva Solicitud',
            icon: <PlusCircle className="h-5 w-5" />
          },
          {
            path: '/solicitudes/mis-solicitudes',
            label: 'Mis Solicitudes',
            icon: <FolderOpen className="h-5 w-5" />
          },
          {
            path: '/solicitudes/mis-programaciones',
            label: 'Mis Programaciones',
            icon: <Calendar className="h-5 w-5" />
          },
        ];

      default:
        return baseItems;
    }
  };

  const menuItems = getMenuItems();

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-64 bg-card border-r border-border flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-border">
          <h2 className="text-2xl font-bold tracking-tight">SIGECA</h2>
          <div className="mt-4 space-y-1">
            <p className="text-sm font-medium">{user?.full_name}</p>
            <span className="inline-block text-xs bg-primary/10 text-primary px-2 py-1 rounded-md font-medium">
              {user?.role.replace('_', ' ').toUpperCase()}
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`
                  flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors
                  ${isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  }
                `}
              >
                {item.icon}
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-border">
          <Button
            onClick={handleLogout}
            variant="ghost"
            className="w-full justify-start gap-3"
          >
            <LogOut className="h-5 w-5" />
            Cerrar Sesión
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="container mx-auto p-6">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
