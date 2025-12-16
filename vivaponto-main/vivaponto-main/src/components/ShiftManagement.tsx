import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Clock, Plus, Trash2, Edit2, X } from 'lucide-react';

interface Shift {
  id: number;
  name: string;
  start_time: string;
  break_start: string;
  break_end: string;
  end_time: string;
  total_minutes: number;
  created_at?: string;
}

function calculateTotalMinutes(entry: string, lunchStart: string, lunchEnd: string, exit: string): number {
  const timeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const entryMinutes = timeToMinutes(entry);
  const lunchStartMinutes = timeToMinutes(lunchStart);
  const lunchEndMinutes = timeToMinutes(lunchEnd);
  const exitMinutes = timeToMinutes(exit);

  const morningWork = lunchStartMinutes - entryMinutes;
  const afternoonWork = exitMinutes - lunchEndMinutes;

  return morningWork + afternoonWork;
}

function formatMinutesToHours(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins.toString().padStart(2, '0')}m`;
}

export function ShiftManagement() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    start_time: '',
    break_start: '',
    break_end: '',
    end_time: ''
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [totalMinutes, setTotalMinutes] = useState(0);

  useEffect(() => {
    fetchShifts();
  }, []);

  useEffect(() => {
    if (formData.start_time && formData.break_start && formData.break_end && formData.end_time) {
      const total = calculateTotalMinutes(
        formData.start_time,
        formData.break_start,
        formData.break_end,
        formData.end_time
      );
      setTotalMinutes(total);
    } else {
      setTotalMinutes(0);
    }
  }, [formData.start_time, formData.break_start, formData.break_end, formData.end_time]);

  async function fetchShifts() {
    try {
      const data = await api.shifts.getAll();
      setShifts(data || []);
    } catch (error) {
      console.error('Error fetching shifts:', error);
      alert('Erro ao carregar turnos');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!formData.name || !formData.start_time || !formData.break_start ||
        !formData.break_end || !formData.end_time) {
      alert('Preencha todos os campos');
      return;
    }

    const total = calculateTotalMinutes(
      formData.start_time,
      formData.break_start,
      formData.break_end,
      formData.end_time
    );

    if (total <= 0) {
      alert('Horários inválidos. Verifique os horários informados.');
      return;
    }

    try {
      if (editingId) {
        await api.shifts.update(editingId, {
          name: formData.name,
          start_time: formData.start_time,
          break_start: formData.break_start,
          break_end: formData.break_end,
          end_time: formData.end_time,
          total_minutes: total
        });
        alert('Turno atualizado com sucesso!');
      } else {
        await api.shifts.create({
          name: formData.name,
          start_time: formData.start_time,
          break_start: formData.break_start,
          break_end: formData.break_end,
          end_time: formData.end_time,
          total_minutes: total
        });
        alert('Turno criado com sucesso!');
      }

      resetForm();
      fetchShifts();
    } catch (error) {
      console.error('Error saving shift:', error);
      alert('Erro ao salvar turno');
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Tem certeza que deseja excluir este turno?')) return;

    try {
      await api.shifts.delete(id);
      alert('Turno excluído com sucesso!');
      fetchShifts();
    } catch (error) {
      console.error('Error deleting shift:', error);
      alert('Erro ao excluir turno');
    }
  }

  function handleEdit(shift: Shift) {
    setFormData({
      name: shift.name,
      start_time: shift.start_time,
      break_start: shift.break_start,
      break_end: shift.break_end,
      end_time: shift.end_time
    });
    setEditingId(shift.id);
  }

  function resetForm() {
    setFormData({
      name: '',
      start_time: '',
      break_start: '',
      break_end: '',
      end_time: ''
    });
    setEditingId(null);
    setTotalMinutes(0);
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg" style={{ color: '#E0E0E0' }}>Carregando...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Clock className="w-8 h-8" style={{ color: '#0A6777' }} />
          <h1 className="text-3xl font-bold" style={{ color: '#E0E0E0' }}>
            Gerenciamento de Turnos
          </h1>
        </div>

        {/* Form */}
        <div
          className="p-6 rounded-lg shadow-lg mb-8"
          style={{ backgroundColor: '#253A4A' }}
        >
          <h2 className="text-xl font-semibold mb-4" style={{ color: '#E0E0E0' }}>
            {editingId ? 'Editar Turno' : 'Criar Novo Turno'}
          </h2>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2" style={{ color: '#E0E0E0' }}>
                  Nome do Turno
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Manhã, Tarde, Noite"
                  className="w-full px-4 py-2 rounded-lg border-2 focus:outline-none focus:border-opacity-80"
                  style={{
                    backgroundColor: '#0A1A2F',
                    color: '#E0E0E0',
                    borderColor: '#0A6777'
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#E0E0E0' }}>
                  Horário de Entrada
                </label>
                <input
                  type="time"
                  value={formData.start_time}
                  onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border-2 focus:outline-none focus:border-opacity-80"
                  style={{
                    backgroundColor: '#0A1A2F',
                    color: '#E0E0E0',
                    borderColor: '#0A6777'
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#E0E0E0' }}>
                  Saída para Almoço
                </label>
                <input
                  type="time"
                  value={formData.break_start}
                  onChange={(e) => setFormData({ ...formData, break_start: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border-2 focus:outline-none focus:border-opacity-80"
                  style={{
                    backgroundColor: '#0A1A2F',
                    color: '#E0E0E0',
                    borderColor: '#0A6777'
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#E0E0E0' }}>
                  Retorno do Almoço
                </label>
                <input
                  type="time"
                  value={formData.break_end}
                  onChange={(e) => setFormData({ ...formData, break_end: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border-2 focus:outline-none focus:border-opacity-80"
                  style={{
                    backgroundColor: '#0A1A2F',
                    color: '#E0E0E0',
                    borderColor: '#0A6777'
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#E0E0E0' }}>
                  Horário de Saída
                </label>
                <input
                  type="time"
                  value={formData.end_time}
                  onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border-2 focus:outline-none focus:border-opacity-80"
                  style={{
                    backgroundColor: '#0A1A2F',
                    color: '#E0E0E0',
                    borderColor: '#0A6777'
                  }}
                />
              </div>
            </div>

            {/* Total Hours Display */}
            {totalMinutes > 0 && (
              <div
                className="p-4 rounded-lg mb-4"
                style={{ backgroundColor: '#0A1A2F' }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium" style={{ color: '#E0E0E0' }}>
                    Carga Horária Total:
                  </span>
                  <span className="text-2xl font-bold" style={{ color: '#0A6777' }}>
                    {formatMinutesToHours(totalMinutes)}
                  </span>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="submit"
                className="flex items-center gap-2 px-6 py-2 rounded-lg font-semibold hover:opacity-90 transition-opacity"
                style={{
                  backgroundColor: '#0A6777',
                  color: '#E0E0E0'
                }}
              >
                {editingId ? (
                  <>
                    <Edit2 className="w-4 h-4" />
                    Atualizar Turno
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Criar Turno
                  </>
                )}
              </button>

              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex items-center gap-2 px-6 py-2 rounded-lg font-semibold hover:opacity-90 transition-opacity"
                  style={{
                    backgroundColor: '#253A4A',
                    color: '#E0E0E0',
                    border: '2px solid #0A6777'
                  }}
                >
                  <X className="w-4 h-4" />
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Shifts List */}
        <div>
          <h2 className="text-xl font-semibold mb-4" style={{ color: '#E0E0E0' }}>
            Turnos Cadastrados ({shifts.length})
          </h2>

          {shifts.length === 0 ? (
            <div
              className="p-8 rounded-lg text-center"
              style={{ backgroundColor: '#253A4A' }}
            >
              <Clock className="w-16 h-16 mx-auto mb-4 opacity-50" style={{ color: '#E0E0E0' }} />
              <p style={{ color: '#E0E0E0' }}>
                Nenhum turno cadastrado. Crie o primeiro turno acima.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {shifts.map((shift) => (
                <div
                  key={shift.id}
                  className="p-5 rounded-lg shadow-lg hover:shadow-xl transition-shadow"
                  style={{ backgroundColor: '#253A4A' }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-lg font-bold" style={{ color: '#E0E0E0' }}>
                      {shift.name}
                    </h3>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(shift)}
                        className="p-2 rounded-lg hover:opacity-80 transition-opacity"
                        style={{ backgroundColor: '#0A6777' }}
                        title="Editar"
                      >
                        <Edit2 className="w-4 h-4" style={{ color: '#E0E0E0' }} />
                      </button>
                      <button
                        onClick={() => handleDelete(shift.id)}
                        className="p-2 rounded-lg hover:opacity-80 transition-opacity"
                        style={{ backgroundColor: '#0A1A2F' }}
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" style={{ color: '#E0E0E0' }} />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span style={{ color: '#E0E0E0', opacity: 0.8 }}>Entrada:</span>
                      <span style={{ color: '#E0E0E0' }} className="font-medium">
                        {shift.start_time}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span style={{ color: '#E0E0E0', opacity: 0.8 }}>Saída Almoço:</span>
                      <span style={{ color: '#E0E0E0' }} className="font-medium">
                        {shift.break_start}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span style={{ color: '#E0E0E0', opacity: 0.8 }}>Retorno Almoço:</span>
                      <span style={{ color: '#E0E0E0' }} className="font-medium">
                        {shift.break_end}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span style={{ color: '#E0E0E0', opacity: 0.8 }}>Saída:</span>
                      <span style={{ color: '#E0E0E0' }} className="font-medium">
                        {shift.end_time}
                      </span>
                    </div>
                  </div>

                  <div
                    className="pt-3 border-t-2 flex items-center justify-between"
                    style={{ borderColor: '#0A6777' }}
                  >
                    <span className="text-sm font-medium" style={{ color: '#E0E0E0' }}>
                      Carga Horária:
                    </span>
                    <span className="text-lg font-bold" style={{ color: '#0A6777' }}>
                      {formatMinutesToHours(shift.total_minutes)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
