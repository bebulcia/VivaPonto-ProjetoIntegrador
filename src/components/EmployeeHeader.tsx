import { Clock, User, LogOut, RefreshCw } from 'lucide-react';

type EmployeeHeaderProps = {
  userName: string;
  currentPage: string;
  onNavigate: (page: string) => void;
  onLogout: () => void;
  onRefresh?: () => void;
};

export function EmployeeHeader({ userName, currentPage, onNavigate, onLogout, onRefresh }: EmployeeHeaderProps) {
  const menuItems = [
    { id: 'clock-in', label: 'Registrar Ponto' },
    { id: 'reports', label: 'Relatórios' },
    { id: 'requests', label: 'Solicitações' },
  ];

  return (
    <header style={{ backgroundColor: '#0A1A2F' }} className="shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-3">
            <div style={{ backgroundColor: '#0A6777' }} className="p-2 rounded-lg">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 style={{ color: '#E0E0E0' }} className="text-xl font-bold">
                VivaPonto
              </h1>
              <p style={{ color: '#E0E0E0', opacity: 0.7 }} className="text-xs">
                Painel do Funcionário
              </p>
            </div>
          </div>

          <nav className="flex items-center space-x-1">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                style={{
                  backgroundColor: currentPage === item.id ? '#0A6777' : 'transparent',
                  color: currentPage === item.id ? 'white' : '#E0E0E0',
                }}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-all hover:bg-opacity-80"
                onMouseEnter={(e) => {
                  if (currentPage !== item.id) {
                    e.currentTarget.style.backgroundColor = '#0d9488';
                  }
                }}
                onMouseLeave={(e) => {
                  if (currentPage !== item.id) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                {item.label}
              </button>
            ))}

            <div
              className="ml-4 pl-4 border-l flex items-center space-x-2"
              style={{ borderColor: '#0A67774D' }}
            >
              {onRefresh && (
                <button
                  onClick={onRefresh}
                  className="p-2 rounded-lg transition-all"
                  style={{ backgroundColor: '#253A4A', color: '#0A6777' }}
                  title="Recarregar dados"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#0d9488';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#253A4A';
                  }}
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              )}
              <div
                className="flex items-center space-x-2 px-3 py-1 rounded-lg"
                style={{ backgroundColor: '#253A4A' }}
              >
                <User className="w-4 h-4" style={{ color: '#0A6777' }} />
                <span className="text-sm" style={{ color: '#E0E0E0' }}>
                  {userName}
                </span>
              </div>

              <button
                onClick={onLogout}
                className="p-2 rounded-lg transition-all"
                style={{ backgroundColor: '#253A4A', color: '#E0E0E0' }}
                title="Sair"
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#ef4444';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#253A4A';
                }}
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
