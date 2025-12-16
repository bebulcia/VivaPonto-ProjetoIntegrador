import { useState, useEffect } from 'react';
import { Edit, Trash2, Plus, Clock, AlertCircle, Shield } from 'lucide-react';
import { api } from '../services/api';

type User = {
  id: number;
  name: string;
  email: string;
  cpf: string;
};

type TimeRecord = {
  id: number;
  user_id: number;
  date: string;
  time: string;
  type: string;
  edited_by_admin: number;
  admin_id: number | null;
  admin_justification: string | null;
  user_name?: string;
};

type ModalState = {
  isOpen: boolean;
  mode: 'add' | 'edit' | 'delete';
  record?: TimeRecord;
};

export function ManualAdjustments() {
  const [employees, setEmployees] = useState<User[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number>(0);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [records, setRecords] = useState<TimeRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState<ModalState>({ isOpen: false, mode: 'add' });
  const [formData, setFormData] = useState({ time: '', type: 'entry', justification: '' });
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadEmployees();
    const today = new Date().toISOString().split('T')[0];
    setSelectedDate(today);
  }, []);

  useEffect(() => {
    if (selectedEmployeeId && selectedDate) {
      loadRecords();
    }
  }, [selectedEmployeeId, selectedDate]);

  const loadEmployees = async () => {
    try {
      const data = await api.users.getAll();
      setEmployees(data || []);
      if (data && data.length > 0) {
        setSelectedEmployeeId(data[0].id);
      }
    } catch (error) {
      console.error('Erro ao carregar funcionários:', error);
      showMessage('error', 'Erro ao carregar lista de funcionários');
    }
  };

  const loadRecords = async () => {
    setLoading(true);
    try {
      const data = await api.manual.getRecords(selectedEmployeeId, selectedDate);
      setRecords(data || []);
    } catch (error) {
      console.error('Erro ao carregar registros:', error);
      showMessage('error', 'Erro ao carregar registros do dia');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  const openModal = (mode: 'add' | 'edit' | 'delete', record?: TimeRecord) => {
    if (mode === 'edit' && record) {
      setFormData({ time: record.time, type: record.type, justification: '' });
    } else if (mode === 'add') {
      setFormData({ time: '', type: 'entry', justification: '' });
    } else {
      setFormData({ time: '', type: 'entry', justification: '' });
    }
    setModal({ isOpen: true, mode, record });
  };

  const closeModal = () => {
    setModal({ isOpen: false, mode: 'add' });
    setFormData({ time: '', type: 'entry', justification: '' });
  };

  const handleSubmit = async () => {
    if (!formData.justification.trim()) {
      showMessage('error', 'A justificativa é obrigatória');
      return;
    }

    try {
      if (modal.mode === 'add') {
        await api.manual.add({
          user_id: selectedEmployeeId,
          date: selectedDate,
          time: formData.time,
          type: formData.type,
          justification: formData.justification,
        });
        showMessage('success', 'Batida adicionada com sucesso');
      } else if (modal.mode === 'edit' && modal.record) {
        await api.manual.edit(modal.record.id, {
          time: formData.time,
          justification: formData.justification,
        });
        showMessage('success', 'Batida editada com sucesso');
      } else if (modal.mode === 'delete' && modal.record) {
        await api.manual.delete(modal.record.id, formData.justification);
        showMessage('success', 'Batida excluída com sucesso');
      }

      closeModal();
      loadRecords();
    } catch (error: any) {
      showMessage('error', error.response?.data?.error || 'Erro ao processar operação');
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      entry: 'Entrada',
      break_start: 'Início Pausa',
      break_end: 'Fim Pausa',
      exit: 'Saída',
    };
    return labels[type] || type;
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      entry: '#10b981',
      break_start: '#eab308',
      break_end: '#f97316',
      exit: '#ef4444',
    };
    return colors[type] || '#6B7280';
  };

  const selectedEmployee = employees.find(emp => emp.id === selectedEmployeeId);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-2">
          <Shield style={{ color: '#0A6777' }} className="w-8 h-8" />
          <h2 style={{ color: '#E0E0E0' }} className="text-3xl font-bold">
            Ajustes Manuais
          </h2>
        </div>
        <p style={{ color: '#E0E0E0', opacity: 0.7 }} className="text-sm">
          Adicionar, editar ou excluir batidas de ponto com justificativa obrigatória
        </p>
      </div>

      {message && (
        <div
          className="mb-6 p-4 rounded-lg flex items-center space-x-2"
          style={{
            backgroundColor: message.type === 'success' ? '#22C55E33' : '#EF444433',
            borderLeft: `4px solid ${message.type === 'success' ? '#22C55E' : '#EF4444'}`,
          }}
        >
          <AlertCircle
            className="w-5 h-5"
            style={{ color: message.type === 'success' ? '#22C55E' : '#EF4444' }}
          />
          <span style={{ color: message.type === 'success' ? '#22C55E' : '#EF4444' }}>
            {message.text}
          </span>
        </div>
      )}

      <div className="rounded-lg shadow-xl p-6 mb-6" style={{ backgroundColor: '#253A4A' }}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#E0E0E0' }}>
              Funcionário
            </label>
            <select
              value={selectedEmployeeId}
              onChange={(e) => setSelectedEmployeeId(Number(e.target.value))}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2"
              style={{ backgroundColor: '#0A1A2F', borderColor: '#0A67774D', color: '#E0E0E0' }}
            >
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.name} - CPF: {employee.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#E0E0E0' }}>
              Data
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2"
              style={{ backgroundColor: '#0A1A2F', borderColor: '#0A67774D', color: '#E0E0E0' }}
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={() => openModal('add')}
              className="w-full px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
              style={{ backgroundColor: '#0A6777', color: 'white' }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#0d9488')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#0A6777')}
            >
              <Plus className="w-5 h-5" />
              <span>Adicionar Batida</span>
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-lg shadow-xl p-6" style={{ backgroundColor: '#253A4A' }}>
        <div className="flex items-center space-x-2 mb-6">
          <Clock className="w-5 h-5" style={{ color: '#0A6777' }} />
          <h3 className="text-xl font-semibold" style={{ color: '#E0E0E0' }}>
            Batidas do Dia {selectedDate && `- ${new Date(selectedDate + 'T00:00:00').toLocaleDateString('pt-BR')}`}
          </h3>
          {selectedEmployee && (
            <span className="text-sm" style={{ color: '#6B7280' }}>
              ({selectedEmployee.name})
            </span>
          )}
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div
              className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto"
              style={{ borderColor: '#0A6777' }}
            />
            <p className="mt-4" style={{ color: '#E0E0E099' }}>
              Carregando registros...
            </p>
          </div>
        ) : records.length === 0 ? (
          <div className="text-center py-12">
            <Clock className="w-16 h-16 mx-auto mb-4" style={{ color: '#E0E0E04D' }} />
            <p style={{ color: '#E0E0E099' }}>
              Nenhuma batida registrada para este dia
            </p>
            <button
              onClick={() => openModal('add')}
              className="mt-4 px-6 py-2 rounded-lg font-medium transition-colors"
              style={{ backgroundColor: '#0A6777', color: 'white' }}
            >
              Adicionar Primeira Batida
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {records.map((record) => (
              <div
                key={record.id}
                className="p-4 rounded-lg border flex items-center justify-between"
                style={{
                  backgroundColor: record.edited_by_admin ? '#3B82F61A' : '#0A1A2F',
                  borderColor: record.edited_by_admin ? '#3B82F6' : '#0A67774D',
                }}
              >
                <div className="flex items-center space-x-4">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: getTypeColor(record.type) }}
                  />
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold" style={{ color: '#E0E0E0', fontSize: '1.1rem' }}>
                        {record.time}
                      </span>
                      <span
                        className="text-sm px-2 py-1 rounded"
                        style={{
                          backgroundColor: `${getTypeColor(record.type)}33`,
                          color: getTypeColor(record.type),
                        }}
                      >
                        {getTypeLabel(record.type)}
                      </span>
                      {record.edited_by_admin === 1 && (
                        <span
                          className="text-xs px-2 py-1 rounded flex items-center space-x-1"
                          style={{ backgroundColor: '#3B82F633', color: '#3B82F6' }}
                          title={record.admin_justification || 'Editado por admin'}
                        >
                          <Shield className="w-3 h-3" />
                          <span>Ajuste Manual</span>
                        </span>
                      )}
                    </div>
                    {record.admin_justification && (
                      <p className="text-xs mt-1" style={{ color: '#6B7280' }}>
                        Justificativa: {record.admin_justification}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => openModal('edit', record)}
                    className="p-2 rounded-lg transition-colors"
                    style={{ backgroundColor: '#0A1A2F', color: '#0A6777' }}
                    title="Editar batida"
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#0d9488')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#0A1A2F')}
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => openModal('delete', record)}
                    className="p-2 rounded-lg transition-colors"
                    style={{ backgroundColor: '#0A1A2F', color: '#ef4444' }}
                    title="Excluir batida"
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#ef4444')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#0A1A2F')}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {modal.isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={closeModal}
        >
          <div
            className="rounded-lg shadow-2xl p-6 max-w-md w-full mx-4"
            style={{ backgroundColor: '#253A4A' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold mb-4" style={{ color: '#E0E0E0' }}>
              {modal.mode === 'add' && 'Adicionar Batida Manual'}
              {modal.mode === 'edit' && 'Editar Batida'}
              {modal.mode === 'delete' && 'Excluir Batida'}
            </h3>

            {modal.mode === 'delete' ? (
              <div className="mb-4">
                <p style={{ color: '#E0E0E0' }} className="mb-2">
                  Tem certeza que deseja excluir esta batida?
                </p>
                <div className="p-3 rounded" style={{ backgroundColor: '#0A1A2F' }}>
                  <p style={{ color: '#E0E0E0' }}>
                    <strong>{modal.record?.time}</strong> - {getTypeLabel(modal.record?.type || '')}
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4 mb-4">
                {modal.mode === 'add' && (
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#E0E0E0' }}>
                      Tipo de Batida
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2"
                      style={{ backgroundColor: '#0A1A2F', borderColor: '#0A67774D', color: '#E0E0E0' }}
                    >
                      <option value="entry">Entrada</option>
                      <option value="break_start">Início Pausa</option>
                      <option value="break_end">Fim Pausa</option>
                      <option value="exit">Saída</option>
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#E0E0E0' }}>
                    Horário
                  </label>
                  <input
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2"
                    style={{ backgroundColor: '#0A1A2F', borderColor: '#0A67774D', color: '#E0E0E0' }}
                  />
                </div>
              </div>
            )}

            <div className="mb-6">
              <label className="block text-sm font-medium mb-2" style={{ color: '#E0E0E0' }}>
                Justificativa <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <textarea
                value={formData.justification}
                onChange={(e) => setFormData({ ...formData, justification: e.target.value })}
                placeholder="Descreva o motivo desta alteração..."
                rows={3}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2"
                style={{ backgroundColor: '#0A1A2F', borderColor: '#0A67774D', color: '#E0E0E0' }}
              />
              <p className="text-xs mt-1" style={{ color: '#6B7280' }}>
                A justificativa é obrigatória e ficará registrada no sistema
              </p>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={closeModal}
                className="flex-1 px-4 py-2 rounded-lg font-medium transition-colors"
                style={{ backgroundColor: '#0A1A2F', color: '#E0E0E0' }}
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                disabled={!formData.justification.trim()}
                className="flex-1 px-4 py-2 rounded-lg font-medium transition-colors"
                style={{
                  backgroundColor: formData.justification.trim()
                    ? modal.mode === 'delete'
                      ? '#ef4444'
                      : '#0A6777'
                    : '#6B7280',
                  color: 'white',
                  cursor: formData.justification.trim() ? 'pointer' : 'not-allowed',
                  opacity: formData.justification.trim() ? 1 : 0.5,
                }}
              >
                {modal.mode === 'add' && 'Adicionar'}
                {modal.mode === 'edit' && 'Salvar'}
                {modal.mode === 'delete' && 'Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
