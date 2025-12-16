import { Clock, LogOut, User, RefreshCw } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

type AdminHeaderProps = {
  currentPage: 'dashboard' | 'shifts' | 'employees' | 'requests' | 'reports' | 'manual' | 'mirror';
  onNavigate: (page: 'dashboard' | 'shifts' | 'employees' | 'requests' | 'reports' | 'manual' | 'mirror') => void;
  onRefresh?: () => void;
  pendingCount?: number;
};

export function AdminHeader({ currentPage, onNavigate, onRefresh, pendingCount }: AdminHeaderProps) {
  const { user, logout } = useAuth();

  return (
    <header style={{ backgroundColor: '#1E3A36' }} className="shadow-lg">
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          <div className="flex items-center space-x-3 flex-shrink-0">
            <div style={{ backgroundColor: '#0A6777' }} className="p-2 rounded-lg">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <div className="hidden sm:block">
              <h1 style={{ color: '#E0E0E0' }} className="text-xl font-bold whitespace-nowrap">VivaPonto Admin</h1>
              <p style={{ color: '#E0E0E0', opacity: 0.7 }} className="text-xs whitespace-nowrap">Painel Administrativo</p>
            </div>
          </div>

          <nav className="relative z-10 flex items-center space-x-1 overflow-x-auto flex-1 justify-end py-1">
            <button
              onClick={() => onNavigate('dashboard')}
              style={{
                backgroundColor: currentPage === 'dashboard' ? '#0A6777' : 'transparent',
                color: currentPage === 'dashboard' ? 'white' : '#E0E0E0'
              }}
              className="relative z-20 px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:opacity-80"
            >
              Dashboard
            </button>
            <button
              onClick={() => onNavigate('shifts')}
              style={{
                backgroundColor: currentPage === 'shifts' ? '#0A6777' : 'transparent',
                color: currentPage === 'shifts' ? 'white' : '#E0E0E0'
              }}
              className="relative z-20 px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:opacity-80"
            >
              Turnos
            </button>
            <button
              onClick={() => onNavigate('employees')}
              style={{
                backgroundColor: currentPage === 'employees' ? '#0A6777' : 'transparent',
                color: currentPage === 'employees' ? 'white' : '#E0E0E0'
              }}
              className="relative z-20 px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:opacity-80"
            >
              Funcionários
            </button>
            <button
              onClick={() => onNavigate('requests')}
              style={{
                backgroundColor: currentPage === 'requests' ? '#0A6777' : 'transparent',
                color: currentPage === 'requests' ? 'white' : '#E0E0E0'
              }}
              className="relative z-20 px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:opacity-80 whitespace-nowrap"
            >
              Solicitações
              {typeof pendingCount === 'number' && pendingCount > 0 && (
                <span
                  className="absolute w-5 h-5 rounded-full text-xs flex items-center justify-center font-bold"
                  style={{ backgroundColor: '#EF4444', color: 'white', top: '-4px', right: '-4px' }}
                >
                  {pendingCount > 9 ? '9+' : pendingCount}
                </span>
              )}
            </button>
            <button
              onClick={() => onNavigate('reports')}
              style={{
                backgroundColor: currentPage === 'reports' ? '#0A6777' : 'transparent',
                color: currentPage === 'reports' ? 'white' : '#E0E0E0'
              }}
              className="relative z-20 px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:opacity-80"
            >
              Relatórios
            </button>
            <button
              onClick={() => onNavigate('manual')}
              style={{
                backgroundColor: currentPage === 'manual' ? '#0A6777' : 'transparent',
                color: currentPage === 'manual' ? 'white' : '#E0E0E0'
              }}
              className="relative z-20 px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:opacity-80"
            >
              Ajustes Manuais
            </button>
            <button
              onClick={() => onNavigate('mirror')}
              style={{
                backgroundColor: currentPage === 'mirror' ? '#0A6777' : 'transparent',
                color: currentPage === 'mirror' ? 'white' : '#E0E0E0'
              }}
              className="relative z-20 px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:opacity-80"
            >
              Cartão Ponto
            </button>

            <div className="ml-4 pl-4 border-l flex items-center space-x-2" style={{ borderColor: '#0A67774D' }}>
              {onRefresh && (
                <button
                  onClick={onRefresh}
                  className="p-2 rounded-lg transition-colors hover:opacity-80"
                  style={{ backgroundColor: '#0A1A2F', color: '#0A6777' }}
                  title="Recarregar dados"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              )}
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
