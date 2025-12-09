import { useState, useEffect } from 'react';
import { Clock, CheckCircle } from 'lucide-react';
import { api } from '../services/api';

type TimeRecord = {
  id: number;
  user_id: number;
  date: string;
  entry: string | null;
  break_start: string | null;
  break_end: string | null;
  exit: string | null;
  created_at: string;
  updated_at: string;
};

export function ClockIn() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [todayRecords, setTodayRecords] = useState<TimeRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    loadTodayRecords();

    return () => clearInterval(timer);
  }, []);

  const loadTodayRecords = async () => {
    try {
      const data = await api.timeRecords.getToday();
      setTodayRecords(data);
    } catch (error) {
      console.error('Erro ao carregar registros:', error);
    }
  };

  const getNextRecordType = (): string | null => {
    if (!todayRecords) return 'entry';
    if (!todayRecords.entry) return 'entry';
    if (!todayRecords.break_start) return 'break_start';
    if (!todayRecords.break_end) return 'break_end';
    if (!todayRecords.exit) return 'exit';
    return null;
  };

  const getButtonText = (): string => {
    const nextType = getNextRecordType();
    switch (nextType) {
      case 'entry': return 'Registrar Entrada';
      case 'break_start': return 'Registrar Pausa';
      case 'break_end': return 'Registrar Retorno';
      case 'exit': return 'Registrar Saída';
      default: return 'Registro Completo';
    }
  };

  const handleClockIn = async () => {
    const nextType = getNextRecordType();

    if (!nextType) {
      setMessage('Todos os registros de hoje já foram realizados!');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    setLoading(true);
    try {
      await api.timeRecords.create(nextType);
      setMessage('Ponto registrado com sucesso!');
      await loadTodayRecords();
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Erro ao registrar ponto');
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timeString: string | null): string => {
    if (!timeString) return '--:--';
    return timeString.substring(0, 5);
  };

  const formatDateTime = (date: Date): string => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');

    return `${day}/${month}/${year} - ${hours}:${minutes}:${seconds}`;
  };

  const isButtonDisabled = getNextRecordType() === null || loading;

  return (
    <div
      style={{ backgroundColor: '#253A4A' }}
      className="rounded-lg shadow-lg p-8"
    >
      <div className="flex items-center justify-between mb-6">
        <h2 style={{ color: '#E0E0E0' }} className="text-2xl font-bold">
          Registrar Ponto
        </h2>
        <Clock style={{ color: '#0A6777' }} className="w-8 h-8" />
      </div>

      <div className="text-center mb-8">
        <div
          style={{
            backgroundColor: '#0A1A2F',
            color: '#E0E0E0',
            fontSize: '2rem',
            fontWeight: 'bold',
            padding: '1.5rem',
            borderRadius: '0.5rem',
            fontFamily: 'monospace',
          }}
        >
          {formatDateTime(currentTime)}
        </div>
      </div>

      <div className="flex justify-center mb-8">
        <button
          onClick={handleClockIn}
          disabled={isButtonDisabled}
          style={{
            backgroundColor: isButtonDisabled ? '#6B7280' : '#0A6777',
            color: 'white',
            opacity: isButtonDisabled ? 0.6 : 1,
            cursor: isButtonDisabled ? 'not-allowed' : 'pointer',
          }}
          className="px-8 py-4 rounded-lg text-lg font-semibold transition-opacity hover:opacity-90 flex items-center space-x-2 min-w-[250px] justify-center"
        >
          <CheckCircle className="w-6 h-6" />
          <span>{getButtonText()}</span>
        </button>
      </div>

      {message && (
        <div
          style={{
            backgroundColor: message.includes('sucesso') ? '#10b981' : '#ef4444',
            color: 'white',
          }}
          className="p-3 rounded-lg text-center mb-6"
        >
          {message}
        </div>
      )}

      <div style={{ backgroundColor: '#0A1A2F' }} className="rounded-lg p-6">
        <h3 style={{ color: '#E0E0E0' }} className="text-lg font-semibold mb-4">
          Batidas de Hoje
        </h3>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center space-x-2">
            <span style={{ color: '#10b981', fontSize: '1.5rem' }}>●</span>
            <span style={{ color: '#E0E0E0' }} className="text-sm">Entrada:</span>
            <span
              style={{
                color: todayRecords?.entry ? '#10b981' : '#6B7280',
                fontWeight: 'bold',
                fontFamily: 'monospace',
              }}
              className="text-lg"
            >
              {formatTime(todayRecords?.entry || null)}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <span style={{ color: '#eab308', fontSize: '1.5rem' }}>●</span>
            <span style={{ color: '#E0E0E0' }} className="text-sm">Pausa:</span>
            <span
              style={{
                color: todayRecords?.break_start ? '#eab308' : '#6B7280',
                fontWeight: 'bold',
                fontFamily: 'monospace',
              }}
              className="text-lg"
            >
              {formatTime(todayRecords?.break_start || null)}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <span style={{ color: '#f97316', fontSize: '1.5rem' }}>●</span>
            <span style={{ color: '#E0E0E0' }} className="text-sm">Retorno:</span>
            <span
              style={{
                color: todayRecords?.break_end ? '#f97316' : '#6B7280',
                fontWeight: 'bold',
                fontFamily: 'monospace',
              }}
              className="text-lg"
            >
              {formatTime(todayRecords?.break_end || null)}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <span style={{ color: '#ef4444', fontSize: '1.5rem' }}>●</span>
            <span style={{ color: '#E0E0E0' }} className="text-sm">Saída:</span>
            <span
              style={{
                color: todayRecords?.exit ? '#ef4444' : '#6B7280',
                fontWeight: 'bold',
                fontFamily: 'monospace',
              }}
              className="text-lg"
            >
              {formatTime(todayRecords?.exit || null)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
