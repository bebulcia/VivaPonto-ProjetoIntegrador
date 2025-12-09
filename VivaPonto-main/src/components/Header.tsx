import { Clock } from 'lucide-react';

type HeaderProps = {
  currentPage: 'clockin' | 'employees' | 'reports';
  onNavigate: (page: 'clockin' | 'employees' | 'reports') => void;
};

export function Header({ currentPage, onNavigate }: HeaderProps) {
  return (
    <header style={{ backgroundColor: '#1E3A36' }} className="shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-3">
            <div style={{ backgroundColor: '#0A6777' }} className="p-2 rounded-lg">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 style={{ color: '#E0E0E0' }} className="text-xl font-bold">VivaPonto</h1>
              <p style={{ color: '#E0E0E0', opacity: 0.7 }} className="text-xs">Controle de Jornada</p>
            </div>
          </div>

          <nav className="flex space-x-1">
            <button
              onClick={() => onNavigate('clockin')}
              style={{
                backgroundColor: currentPage === 'clockin' ? '#0A6777' : 'transparent',
                color: currentPage === 'clockin' ? 'white' : '#E0E0E0'
              }}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:opacity-80"
            >
              Registrar Ponto
            </button>
            <button
              onClick={() => onNavigate('employees')}
              style={{
                backgroundColor: currentPage === 'employees' ? '#0A6777' : 'transparent',
                color: currentPage === 'employees' ? 'white' : '#E0E0E0'
              }}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:opacity-80"
            >
              Gestão de Funcionários
            </button>
            <button
              onClick={() => onNavigate('reports')}
              style={{
                backgroundColor: currentPage === 'reports' ? '#0A6777' : 'transparent',
                color: currentPage === 'reports' ? 'white' : '#E0E0E0'
              }}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:opacity-80"
            >
              Relatório de Pontos
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
}
