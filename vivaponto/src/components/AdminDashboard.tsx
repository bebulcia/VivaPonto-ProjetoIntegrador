import React, { useState, useEffect } from 'react';
import { Users, Clock, AlertCircle, CheckCircle, XCircle, UserCheck } from 'lucide-react';
import { api } from '../services/api';
import { formatTime as formatTimeUtil } from '../utils/timeCalculations';

interface Stats {
  totalEmployees: number;
  pendingRequests: number;
  presentToday: number;
}

interface User {
  id: number;
  email: string;
  name: string;
}

interface TimeRecord {
  id: number;
  user_id: number;
  check_in?: string;
  check_out?: string;
  break_start?: string;
  break_end?: string;
  date: string;
}

interface AdjustmentRequest {
  id: number;
  user_id: number;
  time_record_id?: number;
  date: string;
  old_time?: string;
  new_time: string;
  type: string;
  reason: string;
  status: string;
  created_at: string;
  reviewed_at?: string;
  user?: User;
  time_record?: TimeRecord;
}

interface Employee {
  id: number;
  name: string;
  email: string;
}

interface AdminDashboardProps {
  onRequestProcessed?: () => void;
}

export function AdminDashboard({ onRequestProcessed }: AdminDashboardProps = {}) {
  const [stats, setStats] = useState<Stats>({
    totalEmployees: 0,
    pendingRequests: 0,
    presentToday: 0,
  });
  const [pendingRequests, setPendingRequests] = useState<AdjustmentRequest[]>([]);
  const [presentEmployees, setPresentEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    await Promise.all([
      loadStats(),
      loadPendingRequests(),
      loadPresentEmployees(),
    ]);
    setLoading(false);
  };

  const loadStats = async () => {
    try {
      const statsData = await api.users.getStats();

      setStats({
        totalEmployees: statsData.totalEmployees || 0,
        pendingRequests: statsData.pendingRequests || 0,
        presentToday: statsData.presentToday || 0,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadPendingRequests = async () => {
    try {
      const data = await api.adjustmentRequests.getAll('pending');
      setPendingRequests(data.slice(0, 5) || []);
    } catch (error) {
      console.error('Error loading pending requests:', error);
    }
  };

  const loadPresentEmployees = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];

      const timeRecords = await api.timeRecords.getAll({ date: today });
      const allUsers = await api.users.getAll();

      const uniqueEmployees = new Map<number, Employee>();

      timeRecords.forEach((record: any) => {
        if (record.type === 'entry' && !uniqueEmployees.has(record.user_id)) {
          const user = allUsers.find((u: any) => u.id === record.user_id);
          if (user) {
            uniqueEmployees.set(record.user_id, {
              id: user.id,
              name: user.name,
              email: user.email
            });
          }
        }
      });

      setPresentEmployees(Array.from(uniqueEmployees.values()));
    } catch (error) {
      console.error('Error loading present employees:', error);
    }
  };

  const handleApproveRequest = async (
    requestId: number
  ) => {
    try {
      await api.adjustmentRequests.approve(requestId);
      await loadDashboardData();
      onRequestProcessed?.();
      alert('Solicitação aprovada com sucesso!');
    } catch (error) {
      console.error('Error approving request:', error);
      alert('Erro ao aprovar solicitação');
    }
  };

  const handleRejectRequest = async (requestId: number) => {
    try {
      await api.adjustmentRequests.reject(requestId);
      await loadDashboardData();
      onRequestProcessed?.();
      alert('Solicitação rejeitada');
    } catch (error) {
      console.error('Error rejecting request:', error);
      alert('Erro ao rejeitar solicitação');
    }
  };


  const formatFieldName = (type: string): string => {
    const fieldNames: { [key: string]: string } = {
      entry: 'Entrada',
      exit: 'Saída',
      break_start: 'Início do Intervalo',
      break_end: 'Fim do Intervalo',
    };
    return fieldNames[type] || type;
  };

  const formatTimeDisplay = (timestamp: string | null | undefined): string => {
    if (!timestamp) return 'N/A';
    try {
      if (timestamp.includes(':')) {
        return timestamp.substring(0, 5);
      }
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) {
        return 'N/A';
      }
      return date.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'N/A';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: '#0A1A2F' }}>
        <div className="text-xl" style={{ color: '#E0E0E0' }}>Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8" style={{ backgroundColor: '#0A1A2F' }}>
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8" style={{ color: '#E0E0E0' }}>
          Dashboard do Administrador
        </h1>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Total de Funcionários */}
          <div className="p-6 rounded-lg shadow-lg" style={{ backgroundColor: '#253A4A' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm mb-2" style={{ color: '#E0E0E0', opacity: 0.7 }}>
                  Total de Funcionários
                </p>
                <p className="text-3xl font-bold" style={{ color: '#E0E0E0' }}>
                  {stats.totalEmployees}
                </p>
              </div>
              <div className="p-3 rounded-full" style={{ backgroundColor: '#0A6777' }}>
                <Users size={24} style={{ color: '#E0E0E0' }} />
              </div>
            </div>
          </div>

          {/* Solicitações Pendentes */}
          <div className="p-6 rounded-lg shadow-lg" style={{ backgroundColor: '#253A4A' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm mb-2" style={{ color: '#E0E0E0', opacity: 0.7 }}>
                  Solicitações Pendentes
                </p>
                <p className="text-3xl font-bold" style={{ color: '#E0E0E0' }}>
                  {stats.pendingRequests}
                </p>
              </div>
              <div className="p-3 rounded-full" style={{ backgroundColor: '#0A6777' }}>
                <AlertCircle size={24} style={{ color: '#E0E0E0' }} />
              </div>
            </div>
          </div>

          {/* Funcionários Presentes Hoje */}
          <div className="p-6 rounded-lg shadow-lg" style={{ backgroundColor: '#253A4A' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm mb-2" style={{ color: '#E0E0E0', opacity: 0.7 }}>
                  Funcionários Presentes Hoje
                </p>
                <p className="text-3xl font-bold" style={{ color: '#E0E0E0' }}>
                  {stats.presentToday}
                </p>
              </div>
              <div className="p-3 rounded-full" style={{ backgroundColor: '#0A6777' }}>
                <UserCheck size={24} style={{ color: '#E0E0E0' }} />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Solicitações Pendentes */}
          <div className="p-6 rounded-lg shadow-lg" style={{ backgroundColor: '#253A4A' }}>
            <div className="flex items-center mb-4">
              <Clock size={24} style={{ color: '#0A6777' }} className="mr-2" />
              <h2 className="text-xl font-bold" style={{ color: '#E0E0E0' }}>
                Solicitações Pendentes (últimas 5)
              </h2>
            </div>

            {pendingRequests.length === 0 ? (
              <p style={{ color: '#E0E0E0', opacity: 0.7 }}>
                Nenhuma solicitação pendente
              </p>
            ) : (
              <div className="space-y-4">
                {pendingRequests.map((request) => (
                  <div
                    key={request.id}
                    className="p-4 rounded-lg border"
                    style={{
                      backgroundColor: '#0A1A2F',
                      borderColor: '#0A6777',
                    }}
                  >
                    <div className="mb-3">
                      <p className="font-semibold mb-1" style={{ color: '#E0E0E0' }}>
                        {(request as any).user_name || request.user?.name || 'Funcionário Desconhecido'}
                      </p>
                      <p className="text-sm mb-1" style={{ color: '#E0E0E0', opacity: 0.8 }}>
                        Campo: <span className="font-medium">{formatFieldName(request.type)}</span>
                      </p>
                      {request.old_time && (
                        <p className="text-sm mb-1" style={{ color: '#E0E0E0', opacity: 0.8 }}>
                          Valor Atual: <span className="font-medium">{formatTimeDisplay(request?.old_time)}</span>
                        </p>
                      )}
                      <p className="text-sm mb-1" style={{ color: '#E0E0E0', opacity: 0.8 }}>
                        Novo Valor: <span className="font-medium">{formatTimeDisplay(request?.new_time)}</span>
                      </p>
                      {request.reason && (
                        <p className="text-sm italic mt-2" style={{ color: '#E0E0E0', opacity: 0.7 }}>
                          Motivo: {request.reason}
                        </p>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApproveRequest(request.id)}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg transition-opacity hover:opacity-80"
                        style={{ backgroundColor: '#0A6777', color: '#E0E0E0' }}
                      >
                        <CheckCircle size={16} />
                        Aprovar
                      </button>
                      <button
                        onClick={() => handleRejectRequest(request.id)}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg transition-opacity hover:opacity-80"
                        style={{ backgroundColor: '#8B3333', color: '#E0E0E0' }}
                      >
                        <XCircle size={16} />
                        Rejeitar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Funcionários Presentes Hoje */}
          <div className="p-6 rounded-lg shadow-lg" style={{ backgroundColor: '#253A4A' }}>
            <div className="flex items-center mb-4">
              <UserCheck size={24} style={{ color: '#0A6777' }} className="mr-2" />
              <h2 className="text-xl font-bold" style={{ color: '#E0E0E0' }}>
                Funcionários Presentes Hoje
              </h2>
            </div>

            {presentEmployees.length === 0 ? (
              <p style={{ color: '#E0E0E0', opacity: 0.7 }}>
                Nenhum funcionário registrou entrada hoje
              </p>
            ) : (
              <div className="space-y-3">
                {presentEmployees.map((employee) => (
                  <div
                    key={employee.id}
                    className="p-4 rounded-lg border"
                    style={{
                      backgroundColor: '#0A1A2F',
                      borderColor: '#0A6777',
                    }}
                  >
                    <div className="flex items-center">
                      <div className="p-2 rounded-full mr-3" style={{ backgroundColor: '#0A6777' }}>
                        <Users size={16} style={{ color: '#E0E0E0' }} />
                      </div>
                      <div>
                        <p className="font-semibold" style={{ color: '#E0E0E0' }}>
                          {employee.name}
                        </p>
                        <p className="text-sm" style={{ color: '#E0E0E0', opacity: 0.7 }}>
                          {employee.email}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
