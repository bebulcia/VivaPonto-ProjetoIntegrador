import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Login } from './components/Login';
import { AdminHeader } from './components/AdminHeader';
import { EmployeeHeader } from './components/EmployeeHeader';
import { AdminDashboard } from './components/AdminDashboard';
import { ShiftManagement } from './components/ShiftManagement';
import { EmployeeManagement } from './components/EmployeeManagement';
import { RequestsCenter } from './components/RequestsCenter';
import { AdvancedReports } from './components/AdvancedReports';
import { ManualAdjustments } from './components/ManualAdjustments';
import { MirrorReport } from './components/MirrorReport';
import { ClockIn } from './components/ClockIn';
import { Reports } from './components/Reports';
import { EmployeeRequests } from './components/EmployeeRequests';
import { api } from './services/api';

type AdminPage = 'dashboard' | 'shifts' | 'employees' | 'requests' | 'reports' | 'manual' | 'mirror';
type EmployeePage = 'clock-in' | 'reports' | 'requests';

function AppContent() {
  const { user, loading, logout } = useAuth();
  const [adminPage, setAdminPage] = useState<AdminPage>('dashboard');
  const [employeePage, setEmployeePage] = useState<EmployeePage>('clock-in');
  const [refreshKey, setRefreshKey] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const loadPendingCount = async () => {
    if (user?.role === 'admin') {
      try {
        const data = await api.adjustmentRequests.getAll('pending');
        setPendingCount(data?.length || 0);
      } catch (error) {
        console.error('Erro ao carregar contador de pendências:', error);
      }
    }
  };

  useEffect(() => {
    loadPendingCount();
    const interval = setInterval(loadPendingCount, 30000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    if (user && user.role !== 'admin') {
      setEmployeePage('clock-in');
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0A1A2F' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: '#0A6777' }}></div>
          <p style={{ color: '#E0E0E0' }}>Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  if (user.role === 'admin') {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#0A1A2F' }}>
        <AdminHeader
          currentPage={adminPage}
          onNavigate={setAdminPage}
          onRefresh={handleRefresh}
          pendingCount={pendingCount}
        />
        <main>
          {adminPage === 'dashboard' && <AdminDashboard key={refreshKey} onRequestProcessed={loadPendingCount} />}
          {adminPage === 'shifts' && <ShiftManagement key={refreshKey} />}
          {adminPage === 'employees' && <EmployeeManagement key={refreshKey} />}
          {adminPage === 'requests' && <RequestsCenter adminUserId={user.id} key={refreshKey} onRequestProcessed={loadPendingCount} />}
          {adminPage === 'reports' && <AdvancedReports key={refreshKey} />}
          {adminPage === 'manual' && <ManualAdjustments key={refreshKey} />}
          {adminPage === 'mirror' && <MirrorReport key={refreshKey} />}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0A1A2F' }}>
      <EmployeeHeader
        userName={user.name || user.email}
        currentPage={employeePage}
        onNavigate={(page) => setEmployeePage(page as EmployeePage)}
        onLogout={logout}
        onRefresh={handleRefresh}
      />
      <main className="max-w-7xl mx-auto p-6">
        {employeePage === 'clock-in' && <ClockIn key={refreshKey} />}
        {employeePage === 'reports' && <Reports key={refreshKey} initialPeriod="today" />}
        {employeePage === 'requests' && <EmployeeRequests key={refreshKey} />}
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
