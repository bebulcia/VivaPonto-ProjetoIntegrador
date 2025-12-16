import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { CheckCircle, XCircle, Clock, AlertCircle, Calendar, User } from 'lucide-react';

type RequestsCenterProps = {
  adminUserId: number;
  onRequestProcessed?: () => void;
};

type FilterStatus = 'pending' | 'approved' | 'rejected' | 'all';

type AdjustmentRequest = {
  id: number;
  user_id: number;
  date: string;
  old_time: string | null;
  new_time: string;
  type: string;
  reason: string;
  status: string;
  reviewed_by: number | null;
  reviewed_at: string | null;
  created_at: string;
  user?: {
    id: number;
    name: string;
    email: string;
  };
};

const RequestsCenter: React.FC<RequestsCenterProps> = ({ adminUserId, onRequestProcessed }) => {
  const [requests, setRequests] = useState<AdjustmentRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<AdjustmentRequest[]>([]);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('pending');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<number | null>(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  useEffect(() => {
    applyFilter();
  }, [filterStatus, requests]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const data = await api.adjustmentRequests.getAll();

      const mappedData = (data || []).map((req: any) => ({
        ...req,
        user: {
          id: req.user_id,
          name: req.user_name || 'Usuário desconhecido',
          email: req.user_email || ''
        }
      }));

      setRequests(mappedData);
    } catch (error) {
      console.error('Erro ao buscar solicitações:', error);
      alert('Erro ao carregar solicitações');
    } finally {
      setLoading(false);
    }
  };

  const applyFilter = () => {
    if (filterStatus === 'all') {
      setFilteredRequests(requests);
    } else {
      setFilteredRequests(requests.filter(req => req.status === filterStatus));
    }
  };

  const handleApprove = async (request: AdjustmentRequest) => {
    if (!confirm(`Aprovar solicitação de ${request.user?.name}?`)) {
      return;
    }

    try {
      setProcessing(request.id);

      await api.adjustmentRequests.approve(request.id);

      alert('Solicitação aprovada com sucesso!');
      await fetchRequests();
      onRequestProcessed?.();
    } catch (error) {
      console.error('Erro ao aprovar solicitação:', error);
      alert('Erro ao aprovar solicitação');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (request: AdjustmentRequest) => {
    if (!confirm(`Rejeitar solicitação de ${request.user?.name}?`)) {
      return;
    }

    try {
      setProcessing(request.id);

      await api.adjustmentRequests.reject(request.id);

      alert('Solicitação rejeitada!');
      await fetchRequests();
      onRequestProcessed?.();
    } catch (error) {
      console.error('Erro ao rejeitar solicitação:', error);
      alert('Erro ao rejeitar solicitação');
    } finally {
      setProcessing(null);
    }
  };

  const getFieldLabel = (type: string): string => {
    const labels: Record<string, string> = {
      entry_time: 'Entrada',
      break_start: 'Início da Pausa',
      break_end: 'Retorno da Pausa',
      exit_time: 'Saída',
    };
    return labels[type] || type;
  };

  const formatTime = (time: string | null): string => {
    if (!time) return 'Não registrado';
    return time;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock style={{ color: '#FFA726' }} size={20} />;
      case 'approved':
        return <CheckCircle style={{ color: '#66BB6A' }} size={20} />;
      case 'rejected':
        return <XCircle style={{ color: '#EF5350' }} size={20} />;
      default:
        return <AlertCircle style={{ color: '#E0E0E0' }} size={20} />;
    }
  };

  const getStatusLabel = (status: string): string => {
    const labels: Record<string, string> = {
      pending: 'Pendente',
      approved: 'Aprovada',
      rejected: 'Rejeitada',
    };
    return labels[status] || status;
  };

  const getStatusCount = (status: FilterStatus): number => {
    if (status === 'all') return requests.length;
    return requests.filter(req => req.status === status).length;
  };

  if (loading) {
    return (
      <div style={{
        backgroundColor: '#0A1A2F',
        minHeight: '100vh',
        padding: '20px',
        color: '#E0E0E0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div>Carregando solicitações...</div>
      </div>
    );
  }

  return (
    <div style={{
      backgroundColor: '#0A1A2F',
      minHeight: '100vh',
      padding: '20px',
      color: '#E0E0E0',
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
      }}>
        <h1 style={{
          fontSize: '28px',
          fontWeight: 'bold',
          marginBottom: '30px',
          color: '#E0E0E0',
        }}>
          Central de Solicitações
        </h1>

        {/* Filtros/Tabs */}
        <div style={{
          display: 'flex',
          gap: '10px',
          marginBottom: '30px',
          flexWrap: 'wrap',
        }}>
          {(['pending', 'approved', 'rejected', 'all'] as FilterStatus[]).map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              style={{
                padding: '10px 20px',
                backgroundColor: filterStatus === status ? '#0A6777' : '#253A4A',
                color: '#E0E0E0',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
              onMouseEnter={(e) => {
                if (filterStatus !== status) {
                  e.currentTarget.style.backgroundColor = '#2D4A5C';
                }
              }}
              onMouseLeave={(e) => {
                if (filterStatus !== status) {
                  e.currentTarget.style.backgroundColor = '#253A4A';
                }
              }}
            >
              {status === 'pending' && <Clock size={16} />}
              {status === 'approved' && <CheckCircle size={16} />}
              {status === 'rejected' && <XCircle size={16} />}
              {status === 'all' && <AlertCircle size={16} />}
              <span>
                {status === 'all' ? 'Todas' : getStatusLabel(status)}
              </span>
              <span style={{
                backgroundColor: filterStatus === status ? '#0A1A2F' : '#0A6777',
                padding: '2px 8px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: 'bold',
              }}>
                {getStatusCount(status)}
              </span>
            </button>
          ))}
        </div>

        {/* Lista de Solicitações */}
        {filteredRequests.length === 0 ? (
          <div style={{
            backgroundColor: '#253A4A',
            padding: '40px',
            borderRadius: '12px',
            textAlign: 'center',
            color: '#E0E0E0',
          }}>
            <AlertCircle size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
            <p style={{ fontSize: '16px' }}>
              Nenhuma solicitação {filterStatus !== 'all' ? getStatusLabel(filterStatus).toLowerCase() : 'encontrada'}
            </p>
          </div>
        ) : (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}>
            {filteredRequests.map((request) => (
              <div
                key={request.id}
                style={{
                  backgroundColor: '#253A4A',
                  borderRadius: '12px',
                  padding: '20px',
                  border: '1px solid #2D4A5C',
                }}
              >
                {/* Header do Card */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '16px',
                  flexWrap: 'wrap',
                  gap: '12px',
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <User size={18} style={{ color: '#0A6777' }} />
                      <span style={{ fontSize: '18px', fontWeight: '600', color: '#E0E0E0' }}>
                        {request.user?.name || 'Usuário desconhecido'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#B0B0B0' }}>
                      <Calendar size={16} />
                      <span>{formatDate(request.date || request.created_at)}</span>
                    </div>
                  </div>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 16px',
                    backgroundColor: '#0A1A2F',
                    borderRadius: '8px',
                  }}>
                    {getStatusIcon(request.status)}
                    <span style={{ fontSize: '14px', fontWeight: '500' }}>
                      {getStatusLabel(request.status)}
                    </span>
                  </div>
                </div>

                {/* Detalhes da Solicitação */}
                <div style={{
                  backgroundColor: '#0A1A2F',
                  padding: '16px',
                  borderRadius: '8px',
                  marginBottom: '16px',
                }}>
                  <div style={{ fontSize: '14px', color: '#B0B0B0', marginBottom: '12px', fontWeight: '600' }}>
                    {getFieldLabel(request.type)}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {request.old_time ? (
                      <>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '20px' }}>⏱️</span>
                          <div>
                            <span style={{ fontSize: '14px', color: '#6B7280' }}>Batida registrada: </span>
                            <span style={{ fontSize: '16px', fontWeight: '500', color: '#6B7280' }}>
                              {formatTime(request.old_time)}
                            </span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '20px' }}>✅</span>
                          <div>
                            <span style={{ fontSize: '14px', color: '#0A6777' }}>Solicita alterar para: </span>
                            <span style={{ fontSize: '18px', fontWeight: '700', color: '#0A6777' }}>
                              {formatTime(request.new_time)}
                            </span>
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '20px' }}>❌</span>
                          <span style={{ fontSize: '14px', fontWeight: '500', color: '#EF5350' }}>
                            Batida não registrada
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '20px' }}>✅</span>
                          <div>
                            <span style={{ fontSize: '14px', color: '#0A6777' }}>Solicita registrar: </span>
                            <span style={{ fontSize: '18px', fontWeight: '700', color: '#0A6777' }}>
                              {formatTime(request.new_time)}
                            </span>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Motivo */}
                {request.reason && (
                  <div style={{
                    backgroundColor: '#0A1A2F',
                    padding: '12px',
                    borderRadius: '8px',
                    marginBottom: '16px',
                  }}>
                    <div style={{ fontSize: '12px', color: '#B0B0B0', marginBottom: '6px' }}>
                      Justificativa
                    </div>
                    <div style={{ fontSize: '14px', color: '#E0E0E0', lineHeight: '1.5' }}>
                      {request.reason}
                    </div>
                  </div>
                )}

                {/* Informações de Revisão */}
                {request.reviewed_at && (
                  <div style={{
                    fontSize: '12px',
                    color: '#B0B0B0',
                    marginBottom: '16px',
                    fontStyle: 'italic',
                  }}>
                    Revisado em {formatDate(request.reviewed_at)}
                  </div>
                )}

                {/* Botões de Ação */}
                {request.status === 'pending' && (
                  <div style={{
                    display: 'flex',
                    gap: '12px',
                    flexWrap: 'wrap',
                  }}>
                    <button
                      onClick={() => handleApprove(request)}
                      disabled={processing === request.id}
                      style={{
                        flex: 1,
                        minWidth: '150px',
                        padding: '12px 24px',
                        backgroundColor: '#66BB6A',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: processing === request.id ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        transition: 'all 0.2s',
                        opacity: processing === request.id ? 0.6 : 1,
                      }}
                      onMouseEnter={(e) => {
                        if (processing !== request.id) {
                          e.currentTarget.style.backgroundColor = '#57A95A';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (processing !== request.id) {
                          e.currentTarget.style.backgroundColor = '#66BB6A';
                        }
                      }}
                    >
                      <CheckCircle size={18} />
                      {processing === request.id ? 'Processando...' : 'Aprovar'}
                    </button>

                    <button
                      onClick={() => handleReject(request)}
                      disabled={processing === request.id}
                      style={{
                        flex: 1,
                        minWidth: '150px',
                        padding: '12px 24px',
                        backgroundColor: '#EF5350',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: processing === request.id ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        transition: 'all 0.2s',
                        opacity: processing === request.id ? 0.6 : 1,
                      }}
                      onMouseEnter={(e) => {
                        if (processing !== request.id) {
                          e.currentTarget.style.backgroundColor = '#E53935';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (processing !== request.id) {
                          e.currentTarget.style.backgroundColor = '#EF5350';
                        }
                      }}
                    >
                      <XCircle size={18} />
                      {processing === request.id ? 'Processando...' : 'Rejeitar'}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export { RequestsCenter };
