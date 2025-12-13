import { useState, useEffect } from 'react';
import { Clock, Send, CheckCircle, XCircle } from 'lucide-react';
import { api } from '../services/api';

type AdjustmentRequest = {
  id: number;
  date: string;
  old_time: string | null;
  new_time: string;
  type: 'entry' | 'break_start' | 'break_end' | 'exit';
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
};

const typeLabels = {
  entry: 'Entrada',
  break_start: 'Saída para Pausa',
  break_end: 'Retorno da Pausa',
  exit: 'Saída'
};

export function EmployeeRequests() {
  const [requests, setRequests] = useState<AdjustmentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    type: 'entry' as 'entry' | 'break_start' | 'break_end' | 'exit',
    new_time: '',
    reason: ''
  });
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    loadRequests();
  }, []);

  async function loadRequests() {
    try {
      const data = await api.adjustmentRequests.getAll();
      setRequests(data);
    } catch (error) {
      console.error('Erro ao carregar solicitações:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!formData.new_time || !formData.reason.trim()) {
      setMessage({ type: 'error', text: 'Preencha todos os campos obrigatórios' });
      return;
    }

    try {
      await api.adjustmentRequests.create({
        date: formData.date,
        new_time: formData.new_time,
        type: formData.type,
        reason: formData.reason
      });

      setMessage({ type: 'success', text: 'Solicitação enviada com sucesso!' });
      setFormData({
        date: new Date().toISOString().split('T')[0],
        type: 'entry',
        new_time: '',
        reason: ''
      });
      loadRequests();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Erro ao enviar solicitação' });
    }
  }

  function getStatusBadge(status: string) {
    const badges = {
      pending: { icon: Clock, color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30', text: 'Pendente' },
      approved: { icon: CheckCircle, color: 'bg-green-500/10 text-green-400 border-green-500/30', text: 'Aprovado' },
      rejected: { icon: XCircle, color: 'bg-red-500/10 text-red-400 border-red-500/30', text: 'Recusado' }
    };

    const badge = badges[status as keyof typeof badges];
    const Icon = badge.icon;

    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium border ${badge.color}`}>
        <Icon className="w-4 h-4" />
        {badge.text}
      </span>
    );
  }

  return (
    <div className="space-y-6">
      <div style={{ backgroundColor: '#253A4A' }} className="rounded-lg p-6 shadow-lg">
        <h2 className="text-2xl font-bold mb-6" style={{ color: '#E0E0E0' }}>
          Nova Solicitação de Ajuste
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#E0E0E0' }}>
                Data *
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                max={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-2 rounded-lg"
                style={{ backgroundColor: '#0A1A2F', color: '#E0E0E0', border: '1px solid #0A6777' }}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#E0E0E0' }}>
                Tipo de Registro *
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                className="w-full px-4 py-2 rounded-lg"
                style={{ backgroundColor: '#0A1A2F', color: '#E0E0E0', border: '1px solid #0A6777' }}
                required
              >
                <option value="entry">Entrada</option>
                <option value="break_start">Saída para Pausa</option>
                <option value="break_end">Retorno da Pausa</option>
                <option value="exit">Saída</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#E0E0E0' }}>
                Horário Correto *
              </label>
              <input
                type="time"
                value={formData.new_time}
                onChange={(e) => setFormData({ ...formData, new_time: e.target.value })}
                className="w-full px-4 py-2 rounded-lg"
                style={{ backgroundColor: '#0A1A2F', color: '#E0E0E0', border: '1px solid #0A6777' }}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#E0E0E0' }}>
              Motivo da Solicitação *
            </label>
            <textarea
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              rows={3}
              placeholder="Explique o motivo do ajuste (ex: esqueci de bater o ponto)"
              className="w-full px-4 py-2 rounded-lg"
              style={{ backgroundColor: '#0A1A2F', color: '#E0E0E0', border: '1px solid #0A6777' }}
              required
            />
          </div>

          {message && (
            <div
              className={`p-3 rounded-lg ${
                message.type === 'success' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
              }`}
            >
              {message.text}
            </div>
          )}

          <button
            type="submit"
            className="px-6 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
            style={{ backgroundColor: '#0A6777', color: '#E0E0E0' }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#0d9488')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#0A6777')}
          >
            <Send className="w-4 h-4" />
            Enviar Solicitação
          </button>
        </form>
      </div>

      <div style={{ backgroundColor: '#253A4A' }} className="rounded-lg p-6 shadow-lg">
        <h2 className="text-2xl font-bold mb-6" style={{ color: '#E0E0E0' }}>
          Minhas Solicitações
        </h2>

        {loading ? (
          <div className="text-center py-8" style={{ color: '#6B7280' }}>
            Carregando...
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-8" style={{ color: '#6B7280' }}>
            Nenhuma solicitação encontrada
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => (
              <div
                key={request.id}
                className="p-4 rounded-lg border"
                style={{ backgroundColor: '#0A1A2F', borderColor: '#0A6777' }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="font-semibold" style={{ color: '#0A6777' }}>
                        {typeLabels[request.type]}
                      </span>
                      <span style={{ color: '#6B7280' }}>•</span>
                      <span style={{ color: '#E0E0E0' }}>
                        {new Date(request.date).toLocaleDateString('pt-BR')}
                      </span>
                    </div>

                    <div className="flex items-center gap-2" style={{ color: '#E0E0E0' }}>
                      <span>Horário solicitado:</span>
                      <span className="font-semibold" style={{ color: '#0A6777' }}>
                        {request.new_time}
                      </span>
                    </div>

                    <p style={{ color: '#6B7280' }} className="text-sm">
                      {request.reason}
                    </p>

                    <p className="text-xs" style={{ color: '#6B7280' }}>
                      Solicitado em: {new Date(request.created_at).toLocaleString('pt-BR')}
                    </p>
                  </div>

                  <div>
                    {getStatusBadge(request.status)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
