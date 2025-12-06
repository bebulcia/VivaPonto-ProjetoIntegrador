import { Clock, LogOut, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

type AdminHeaderProps = {
  currentPage: 'dashboard' | 'shifts' | 'employees' | 'requests' | 'reports';
  onNavigate: (page: 'dashboard' | 'shifts' | 'employees' | 'requests' | 'reports') => void;
};

export function AdminHeader({ currentPage, onNavigate }: AdminHeaderProps) {
  const { user, logout } = useAuth();

  return (
    <header style={{ backgroundColor: '#1E3A36' }} className="shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-3">
            <div style={{ backgroundColor: '#0A6777' }} className="p-2 rounded-lg">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 style={{ color: '#E0E0E0' }} className="text-xl font-bold">VivaPonto Admin</h1>
              <p style={{ color: '#E0E0E0', opacity: 0.7 }} className="text-xs">Painel Administrativo</p>
            </div>
          </div>

          <nav className="flex items-center space-x-1">
            <button
              onClick={() => onNavigate('dashboard')}
              style={{
                backgroundColor: currentPage === 'dashboard' ? '#0A6777' : 'transparent',
                color: currentPage === 'dashboard' ? 'white' : '#E0E0E0'
              }}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:opacity-80"
            >
              Dashboard
            </button>
            <button
              onClick={() => onNavigate('shifts')}
              style={{
                backgroundColor: currentPage === 'shifts' ? '#0A6777' : 'transparent',
                color: currentPage === 'shifts' ? 'white' : '#E0E0E0'
              }}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:opacity-80"
            >
              Turnos
            </button>
            <button
              onClick={() => onNavigate('employees')}
              style={{
                backgroundColor: currentPage === 'employees' ? '#0A6777' : 'transparent',
                color: currentPage === 'employees' ? 'white' : '#E0E0E0'
              }}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:opacity-80"
            >
              Funcionários
            </button>
            <button
              onClick={() => onNavigate('requests')}
              style={{
                backgroundColor: currentPage === 'requests' ? '#0A6777' : 'transparent',
                color: currentPage === 'requests' ? 'white' : '#E0E0E0'
              }}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:opacity-80"
            >
              Solicitações
            </button>
            <button
              onClick={() => onNavigate('reports')}
              style={{
                backgroundColor: currentPage === 'reports' ? '#0A6777' : 'transparent',
                color: currentPage === 'reports' ? 'white' : '#E0E0E0'
              }}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:opacity-80"
            >
              Relatórios
            </button>

            <div className="ml-4 pl-4 border-l flex items-center space-x-2" style={{ borderColor: '#0A67774D' }}>
              <div className="flex items-center space-x-2 px-3 py-1 rounded-lg" style={{ backgroundColor: '#0A1A2F' }}>
                <User className="w-4 h-4" style={{ color: '#0A6777' }} />
                <span className="text-sm" style={{ color: '#E0E0E0' }}>{user?.email}</span>
              </div>
              <button
                onClick={logout}
                className="p-2 rounded-lg transition-colors hover:opacity-80"
                style={{ backgroundColor: '#0A1A2F', color: '#E0E0E0' }}
                title="Sair"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
}
