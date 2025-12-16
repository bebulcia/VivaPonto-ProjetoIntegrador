import { useState, useEffect } from 'react';
import { FileText, Calendar, Calculator } from 'lucide-react';
import { api } from '../services/api';
import {
  calculateWorkedMinutes,
  calculateBalance,
  formatMinutesToHours,
  formatTime,
  formatDate,
  safeParseInt
} from '../utils/timeCalculations';
import { generateDateRange, formatDate as formatDateDisplay, getDayOfWeek } from '../utils/dateUtils';

type ReportRecord = {
  date: string;
  entry: string | null;
  break_start: string | null;
  break_end: string | null;
  exit: string | null;
};

type UserData = {
  id: number;
  name: string;
  email: string;
  shift?: {
    id: number;
    name: string;
    total_minutes: number;
  };
};

type PeriodType = 'today' | 'week' | 'month' | 'custom';

export function Reports({ initialPeriod }: { initialPeriod?: 'today' | 'week' | 'month' | 'custom' }) {
  const [period, setPeriod] = useState<PeriodType>('week');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [reportData, setReportData] = useState<ReportRecord[]>([]);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [period, customStartDate, customEndDate]);

  useEffect(() => {
    if (initialPeriod) {
      setPeriod(initialPeriod as PeriodType);
    }
    // only when initialPeriod changes we set it; otherwise leave user's selection
  }, [initialPeriod]);

  const getDateRange = () => {
    const today = new Date();
    let start = new Date();
    let end = new Date();

    switch (period) {
      case 'today':
        start = today;
        end = today;
        break;

      case 'week':
        start = new Date(today);
        const weekDiff = (today.getDay() + 6) % 7; // distance from Monday (Mon=0)
        start.setDate(today.getDate() - weekDiff);
        end = today;
        break;

      case 'month':
        start = new Date(today.getFullYear(), today.getMonth(), 1);
        end = today;
        break;

      case 'custom':
        if (customStartDate && customEndDate) {
          return { start: customStartDate, end: customEndDate };
        }
        start = today;
        end = today;
        break;

      default:
        start = today;
        end = today;
    }

    const formatDateString = (date: Date) => {
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    return {
      start: formatDateString(start),
      end: formatDateString(end)
    };
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const user = await api.users.getMe();
      setUserData(user);

      const { start, end } = getDateRange();
      console.log('[Reports] Date range:', start, end);

      const report = await api.timeRecords.getReport({
        start_date: start,
        end_date: end,
      });
      console.log('[Reports] report rows:', report && report.length, report);

      setReportData(report);
    } catch (error) {
      console.error('Erro ao carregar relatório:', error);
    } finally {
      setLoading(false);
    }
  };

  const getShiftMinutes = (): number => {
    return safeParseInt(userData?.shift?.total_minutes, 480);
  };

  const generateCompleteCalendar = () => {
    const { start, end } = getDateRange();
    const allDates = generateDateRange(start, end);

    return allDates.map((date) => {
      const existingRecord = reportData.find((record) => record.date === date);

      return {
        date,
        entry: existingRecord?.entry || null,
        break_start: existingRecord?.break_start || null,
        break_end: existingRecord?.break_end || null,
        exit: existingRecord?.exit || null,
      };
    });
  };

  const calendar = generateCompleteCalendar();
  const totals = calendar.reduce(
    (acc, rec) => {
      const worked = calculateWorkedMinutes(rec.entry, rec.break_start, rec.break_end, rec.exit);
      const expectedPerDay = getShiftMinutes();
      return {
        worked: acc.worked + worked,
        expected: acc.expected + expectedPerDay,
        balance: acc.balance + (worked - expectedPerDay),
      };
    },
    { worked: 0, expected: 0, balance: 0 }
  );

  return (
    <div
      style={{ backgroundColor: '#253A4A' }}
      className="rounded-lg shadow-lg p-8"
    >
      <div className="mb-6">
        <div className="flex items-center space-x-3 mb-4">
          <FileText style={{ color: '#0A6777' }} className="w-8 h-8" />
          <h2 style={{ color: '#E0E0E0' }} className="text-2xl font-bold">
            Meus Relatórios
          </h2>
        </div>

        <div className="flex flex-col space-y-4">
          <div className="flex items-center space-x-2">
            <Calendar style={{ color: '#E0E0E0' }} className="w-5 h-5" />
            <select
              value={period}
              onChange={(e) => {
                setPeriod(e.target.value as PeriodType);
                if (e.target.value !== 'custom') {
                  setCustomStartDate('');
                  setCustomEndDate('');
                }
              }}
              style={{
                backgroundColor: '#0A1A2F',
                color: '#E0E0E0',
                border: '1px solid #0A6777',
              }}
              className="px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2"
            >
              <option value="today">Hoje</option>
              <option value="week">Esta Semana</option>
              <option value="month">Este Mês</option>
              <option value="custom">Personalizado</option>
            </select>
          </div>

          {period === 'custom' && (
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <label style={{ color: '#E0E0E0' }} className="text-sm">
                  De:
                </label>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  style={{
                    backgroundColor: '#0A1A2F',
                    color: '#E0E0E0',
                    border: '1px solid #0A6777',
                  }}
                  className="px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2"
                />
              </div>
              <div className="flex items-center space-x-2">
                <label style={{ color: '#E0E0E0' }} className="text-sm">
                  Até:
                </label>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  style={{
                    backgroundColor: '#0A1A2F',
                    color: '#E0E0E0',
                    border: '1px solid #0A6777',
                  }}
                  className="px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Resumo */}
      {calendar.length > 0 && (
        <div className="rounded-lg shadow-xl p-6 mb-6" style={{ backgroundColor: '#253A4A' }}>
          <div className="flex items-center space-x-2 mb-6">
            <Calculator className="w-5 h-5" style={{ color: '#0A6777' }} />
            <h3 className="text-xl font-semibold" style={{ color: '#E0E0E0' }}>
              Resumo do Período
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div
              className="rounded-lg p-6 text-center"
              style={{ backgroundColor: '#0A1A2F', borderLeft: '4px solid #0A6777' }}
            >
              <div className="text-sm mb-2" style={{ color: '#E0E0E099' }}>
                Total de Horas Trabalhadas
              </div>
              <div className="text-3xl font-bold" style={{ color: '#0A6777' }}>
                {formatMinutesToHours(totals.worked)}
              </div>
            </div>

            <div
              className="rounded-lg p-6 text-center"
              style={{ backgroundColor: '#0A1A2F', borderLeft: '4px solid #3B82F6' }}
            >
              <div className="text-sm mb-2" style={{ color: '#E0E0E099' }}>
                Total de Horas Previstas
              </div>
              <div className="text-3xl font-bold" style={{ color: '#3B82F6' }}>
                {formatMinutesToHours(totals.expected)}
              </div>
            </div>

            <div
              className="rounded-lg p-6 text-center"
              style={{
                backgroundColor: '#0A1A2F',
                borderLeft: `4px solid ${totals.balance >= 0 ? '#22C55E' : '#EF4444'}`
              }}
            >
              <div className="text-sm mb-2" style={{ color: '#E0E0E099' }}>
                Saldo Total
              </div>
              <div
                className="text-3xl font-bold"
                style={{ color: totals.balance >= 0 ? '#22C55E' : '#EF4444' }}
              >
                {formatMinutesToHours(totals.balance)}
              </div>
              <div className="text-xs mt-2" style={{ color: '#E0E0E099' }}>
                {totals.balance >= 0 ? 'Horas extras acumuladas' : 'Horas a compensar'}
              </div>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ color: '#E0E0E0' }} className="text-center py-8">
          Carregando relatório...
        </div>
      ) : (
        <div style={{ backgroundColor: '#0A1A2F' }} className="rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ backgroundColor: '#253A4A' }}>
                  <th
                    style={{ color: '#E0E0E0' }}
                    className="px-4 py-3 text-left text-sm font-semibold"
                  >
                    Data
                  </th>
                  <th
                    style={{ color: '#E0E0E0' }}
                    className="px-4 py-3 text-center text-sm font-semibold"
                  >
                    Entrada
                  </th>
                  <th
                    style={{ color: '#E0E0E0' }}
                    className="px-4 py-3 text-center text-sm font-semibold"
                  >
                    Pausa
                  </th>
                  <th
                    style={{ color: '#E0E0E0' }}
                    className="px-4 py-3 text-center text-sm font-semibold"
                  >
                    Retorno
                  </th>
                  <th
                    style={{ color: '#E0E0E0' }}
                    className="px-4 py-3 text-center text-sm font-semibold"
                  >
                    Saída
                  </th>
                  <th
                    style={{ color: '#E0E0E0' }}
                    className="px-4 py-3 text-center text-sm font-semibold"
                  >
                    Horas Trabalhadas
                  </th>
                  <th
                    style={{ color: '#E0E0E0' }}
                    className="px-4 py-3 text-center text-sm font-semibold"
                  >
                    Saldo
                  </th>
                </tr>
              </thead>
              <tbody>
                {generateCompleteCalendar().map((record, index) => {
                    const workedMinutes = calculateWorkedMinutes(
                      record?.entry,
                      record?.break_start,
                      record?.break_end,
                      record?.exit
                    );

                    const shiftMinutes = getShiftMinutes();
                    const balanceResult = calculateBalance(workedMinutes, shiftMinutes);

                    return (
                      <tr
                        key={index}
                        style={{
                          backgroundColor: index % 2 === 0 ? '#0A1A2F' : '#1A2A3F',
                        }}
                        className="border-t border-gray-700"
                      >
                        <td
                          style={{ color: '#E0E0E0' }}
                          className="px-4 py-3 text-sm"
                        >
                          <div>{formatDateDisplay(record?.date || '')}</div>
                          <div style={{ color: '#6B7280', fontSize: '0.75rem' }}>{getDayOfWeek(record?.date || '')}</div>
                        </td>
                        <td
                          style={{
                            color: record?.entry ? '#10b981' : '#6B7280',
                            fontFamily: 'monospace',
                          }}
                          className="px-4 py-3 text-sm text-center font-semibold"
                        >
                          {formatTime(record?.entry)}
                        </td>
                        <td
                          style={{
                            color: record?.break_start ? '#eab308' : '#6B7280',
                            fontFamily: 'monospace',
                          }}
                          className="px-4 py-3 text-sm text-center font-semibold"
                        >
                          {formatTime(record?.break_start)}
                        </td>
                        <td
                          style={{
                            color: record?.break_end ? '#f97316' : '#6B7280',
                            fontFamily: 'monospace',
                          }}
                          className="px-4 py-3 text-sm text-center font-semibold"
                        >
                          {formatTime(record?.break_end)}
                        </td>
                        <td
                          style={{
                            color: record?.exit ? '#ef4444' : '#6B7280',
                            fontFamily: 'monospace',
                          }}
                          className="px-4 py-3 text-sm text-center font-semibold"
                        >
                          {formatTime(record?.exit)}
                        </td>
                        <td
                          style={{
                            color: workedMinutes > 0 ? '#E0E0E0' : '#6B7280',
                            fontFamily: 'monospace',
                          }}
                          className="px-4 py-3 text-sm text-center font-semibold"
                        >
                          {formatMinutesToHours(workedMinutes)}
                        </td>
                        <td
                          style={{
                            color: balanceResult.minutes === 0 ? '#6B7280' : balanceResult.isNegative ? '#ef4444' : '#10b981',
                            fontFamily: 'monospace',
                          }}
                          className="px-4 py-3 text-sm text-center font-bold"
                        >
                          {balanceResult.minutes === 0 ? '--' : `${balanceResult.isNegative ? '' : '+'}${balanceResult.balance}`}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {userData?.shift && (
        <div
          style={{ backgroundColor: '#0A1A2F', color: '#E0E0E0' }}
          className="mt-4 p-4 rounded-lg text-sm"
        >
          <strong>Turno:</strong> {userData.shift.name} - Jornada esperada: {formatMinutesToHours(userData.shift.total_minutes)}
        </div>
      )}
    </div>
  );
}
