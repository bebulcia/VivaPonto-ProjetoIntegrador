import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Login } from './components/Login';
import { AdminHeader } from './components/AdminHeader';
import { EmployeeHeader } from './components/EmployeeHeader';
import { AdminDashboard } from './components/AdminDashboard';
import { ShiftManagement } from './components/ShiftManagement';
import { EmployeeManagement } from './components/EmployeeManagement';
import { RequestsCenter } from './components/RequestsCenter';
import { AdvancedReports } from './components/AdvancedReports';
import { ClockIn } from './components/ClockIn';
import { Reports } from './components/Reports';
import { EmployeeRequests } from './components/EmployeeRequests';

type AdminPage = 'dashboard' | 'shifts' | 'employees' | 'requests' | 'reports';
type EmployeePage = 'clock-in' | 'reports' | 'requests';

function AppContent() {
  const { user, loading, logout } = useAuth();
  const [adminPage, setAdminPage] = useState<AdminPage>('dashboard');
  const [employeePage, setEmployeePage] = useState<EmployeePage>('clock-in');

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
        <AdminHeader currentPage={adminPage} onNavigate={setAdminPage} />
        <main>
          {adminPage === 'dashboard' && <AdminDashboard />}
          {adminPage === 'shifts' && <ShiftManagement />}
          {adminPage === 'employees' && <EmployeeManagement />}
          {adminPage === 'requests' && <RequestsCenter adminUserId={user.id} />}
          {adminPage === 'reports' && <AdvancedReports />}
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
      />
      <main className="max-w-7xl mx-auto p-6">
        {employeePage === 'clock-in' && <ClockIn />}
        {employeePage === 'reports' && <Reports />}
        {employeePage === 'requests' && <EmployeeRequests />}
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
