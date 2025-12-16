import { useState, useEffect } from 'react';
import { FileText, Calendar, Calculator } from 'lucide-react';
import { api } from '../services/api';
import {
  calculateWorkedMinutes as calculateWorkedMinutesUtil,
  formatMinutesToHours,
  formatTime as formatTimeUtil,
  safeParseInt
} from '../utils/timeCalculations';
import { generateDateRange } from '../utils/dateUtils';

type User = {
  id: number;
  name: string;
  email: string;
  cpf: string;
  role: string;
  shift?: Shift;
};

type Shift = {
  id: number;
  name: string;
  start_time: string;
  break_start: string;
  break_end: string;
  end_time: string;
  total_minutes: number;
};

type TimeRecord = {
  id?: number;
  user_id?: number;
  date: string;
  entry: string | null;
  break_start: string | null;
  break_end: string | null;
  exit: string | null;
};

type PeriodType = 'today' | 'week' | 'month' | 'year' | 'custom';

interface ReportRow {
  date: string;
  record: TimeRecord;
  shift: Shift | null;
  workedMinutes: number;
  expectedMinutes: number;
  balance: number;
}

function calculateWorkedMinutes(record: TimeRecord): number {
  if (!record?.entry || !record?.exit) {
    return 0;
  }

  return calculateWorkedMinutesUtil(
    record.entry,
    record.break_start,
    record.break_end,
    record.exit
  );
}

function calculateExpectedMinutes(shift: Shift | null | undefined): number {
  return safeParseInt(shift?.total_minutes, 0);
}

function formatTime(timeString: string | null | undefined): string {
  if (!timeString) return '-';
  try {
    return timeString.substring(0, 5);
  } catch {
    return '-';
  }
}

function getDateRange(period: PeriodType, customStart?: string, customEnd?: string): { start: string; end: string } {
  const today = new Date();
  let start: Date;
  let end: Date = today;

  switch (period) {
    case 'today':
      start = today;
      break;
    case 'week':
      start = new Date(today);
      const dayOfWeek = start.getDay();
      const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Se domingo, volta 6 dias, senão volta para segunda
      start.setDate(start.getDate() + diff);
      break;
    case 'month':
      start = new Date(today.getFullYear(), today.getMonth(), 1);
      break;
    case 'year':
      start = new Date(today.getFullYear(), 0, 1);
      break;
    case 'custom':
      if (customStart && customEnd) {
        return { start: customStart, end: customEnd };
      }
      start = today;
      break;
    default:
      start = today;
  }

  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0]
  };
}

export function AdvancedReports() {
  const [employees, setEmployees] = useState<User[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number>(0);
  const [period, setPeriod] = useState<PeriodType>('month');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [reportData, setReportData] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(false);

  function handlePeriodChange(newPeriod: PeriodType) {
    setPeriod(newPeriod);

    if (newPeriod !== 'custom') {
      setCustomStartDate('');
      setCustomEndDate('');
    }
  }

  useEffect(() => {
    loadEmployees();
  }, []);

  useEffect(() => {
    if (selectedEmployeeId) {
      loadReport();
    }
  }, [selectedEmployeeId, period, customStartDate, customEndDate]);

  async function loadEmployees() {
    try {
      const data = await api.users.getAll();
      setEmployees(data || []);
      if (data && data.length > 0) {
        setSelectedEmployeeId(data[0].id);
      }
    } catch (error) {
      console.error('Erro ao carregar funcionários:', error);
    }
  }

  async function loadReport() {
    if (!selectedEmployeeId) return;

    setLoading(true);

    try {
      const dateRange = getDateRange(period, customStartDate, customEndDate);

      const data = await api.timeRecords.getReport({
        user_id: selectedEmployeeId,
        start_date: dateRange.start,
        end_date: dateRange.end,
      });

      const selectedEmployee = employees.find(emp => emp.id === selectedEmployeeId);
      const shift = selectedEmployee?.shift || null;

      const allDates = generateDateRange(dateRange.start, dateRange.end);

      const rows: ReportRow[] = allDates.map((date) => {
        const existingRecord = (data || []).find((record: any) => record.date === date);

        const record: TimeRecord = existingRecord || {
          date: date,
          entry: null,
          break_start: null,
          break_end: null,
          exit: null,
        };

        const workedMinutes = calculateWorkedMinutes(record);
        const expectedMinutes = calculateExpectedMinutes(shift);
        const balance = (workedMinutes || 0) - (expectedMinutes || 0);

        return {
          date: date,
          record,
          shift: shift || null,
          workedMinutes,
          expectedMinutes,
          balance
        };
      });

      setReportData(rows);
    } catch (error) {
      console.error('Erro ao carregar relatório:', error);
    } finally {
      setLoading(false);
    }
  }

  const totals = reportData.reduce(
    (acc, row) => ({
      worked: acc.worked + (row?.workedMinutes || 0),
      expected: acc.expected + (row?.expectedMinutes || 0),
      balance: acc.balance + (row?.balance || 0)
    }),
    { worked: 0, expected: 0, balance: 0 }
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold mb-2" style={{ color: '#E0E0E0' }}>
          Relatório Avançado de Horas
        </h2>
        <p style={{ color: '#E0E0E0B3' }}>
          Análise detalhada de horas trabalhadas, previstas e saldo
        </p>
      </div>

      {/* Filtros */}
      <div className="rounded-lg shadow-xl p-6 mb-6" style={{ backgroundColor: '#253A4A' }}>
        <div className="flex items-center space-x-2 mb-4">
          <FileText className="w-5 h-5" style={{ color: '#0A6777' }} />
          <h3 className="text-xl font-semibold" style={{ color: '#E0E0E0' }}>Filtros</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Select de Funcionário */}
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

          {/* Select de Período */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#E0E0E0' }}>
              Período
            </label>
            <select
              value={period}
              onChange={(e) => handlePeriodChange(e.target.value as PeriodType)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2"
              style={{ backgroundColor: '#0A1A2F', borderColor: '#0A67774D', color: '#E0E0E0' }}
            >
              <option value="today">Hoje</option>
              <option value="week">Esta Semana</option>
              <option value="month">Este Mês</option>
              <option value="year">Este Ano</option>
              <option value="custom">Personalizado</option>
            </select>
          </div>

          {/* Date inputs para período personalizado */}
          {period === 'custom' && (
            <>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#E0E0E0' }}>
                  Data Inicial
                </label>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2"
                  style={{ backgroundColor: '#0A1A2F', borderColor: '#0A67774D', color: '#E0E0E0' }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#E0E0E0' }}>
                  Data Final
                </label>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2"
                  style={{ backgroundColor: '#0A1A2F', borderColor: '#0A67774D', color: '#E0E0E0' }}
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Tabela de Cálculo de Horas */}
      <div className="rounded-lg shadow-xl p-6 mb-6" style={{ backgroundColor: '#253A4A' }}>
        <div className="flex items-center space-x-2 mb-6">
          <Calendar className="w-5 h-5" style={{ color: '#0A6777' }} />
          <h3 className="text-xl font-semibold" style={{ color: '#E0E0E0' }}>
            Cálculo de Horas
          </h3>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div
              className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto"
              style={{ borderColor: '#0A6777' }}
            ></div>
            <p className="mt-4" style={{ color: '#E0E0E099' }}>
              Carregando relatório...
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b" style={{ borderColor: '#0A67774D' }}>
                  <th className="text-left py-3 px-4 font-semibold" style={{ color: '#E0E0E0' }}>
                    Data
                  </th>
                  <th className="text-center py-3 px-4 font-semibold" style={{ color: '#E0E0E0' }}>
                    Entrada
                  </th>
                  <th className="text-center py-3 px-4 font-semibold" style={{ color: '#E0E0E0' }}>
                    Pausa
                  </th>
                  <th className="text-center py-3 px-4 font-semibold" style={{ color: '#E0E0E0' }}>
                    Retorno
                  </th>
                  <th className="text-center py-3 px-4 font-semibold" style={{ color: '#E0E0E0' }}>
                    Saída
                  </th>
                  <th className="text-center py-3 px-4 font-semibold" style={{ color: '#E0E0E0' }}>
                    Turno
                  </th>
                  <th className="text-center py-3 px-4 font-semibold" style={{ color: '#E0E0E0' }}>
                    Horas Trabalhadas
                  </th>
                  <th className="text-center py-3 px-4 font-semibold" style={{ color: '#E0E0E0' }}>
                    Horas Previstas
                  </th>
                  <th className="text-center py-3 px-4 font-semibold" style={{ color: '#E0E0E0' }}>
                    Saldo
                  </th>
                </tr>
              </thead>
              <tbody>
                {reportData.map((row, index) => (
                  <tr
                    key={index}
                    className="border-b transition-colors"
                    style={{ borderColor: '#0A67771A' }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#0A1A2F80')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <td className="py-4 px-4">
                      <div className="font-medium" style={{ color: '#E0E0E0' }}>
                        {row?.date ? new Date(row.date + 'T00:00:00').toLocaleDateString('pt-BR') : '--'}
                      </div>
                      <div className="text-xs capitalize" style={{ color: '#E0E0E099' }}>
                        {row?.date ? new Date(row.date + 'T00:00:00').toLocaleDateString('pt-BR', {
                          weekday: 'long'
                        }) : ''}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center" style={{ color: '#E0E0E0' }}>
                      {formatTime(row?.record?.entry)}
                    </td>
                    <td className="py-4 px-4 text-center" style={{ color: '#E0E0E0' }}>
                      {formatTime(row?.record?.break_start)}
                    </td>
                    <td className="py-4 px-4 text-center" style={{ color: '#E0E0E0' }}>
                      {formatTime(row?.record?.break_end)}
                    </td>
                    <td className="py-4 px-4 text-center" style={{ color: '#E0E0E0' }}>
                      {formatTime(row?.record?.exit)}
                    </td>
                    <td className="py-4 px-4 text-center">
                      {row?.shift ? (
                        <div>
                          <div className="font-medium" style={{ color: '#0A6777' }}>
                            {row.shift.name}
                          </div>
                          <div className="text-xs" style={{ color: '#E0E0E099' }}>
                            {row.shift.start_time} - {row.shift.end_time}
                          </div>
                        </div>
                      ) : (
                        <span style={{ color: '#E0E0E066' }}>Sem turno</span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span
                        className="inline-block px-3 py-1 rounded font-medium"
                        style={{ backgroundColor: '#0A677733', color: '#0A6777' }}
                      >
                        {formatMinutesToHours(row?.workedMinutes)}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span
                        className="inline-block px-3 py-1 rounded font-medium"
                        style={{ backgroundColor: '#3B82F633', color: '#93C5FD' }}
                      >
                        {formatMinutesToHours(row?.expectedMinutes)}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span
                        className="inline-block px-3 py-1 rounded font-bold"
                        style={{
                          backgroundColor: (row?.balance || 0) >= 0 ? '#22C55E33' : '#EF444433',
                          color: (row?.balance || 0) >= 0 ? '#22C55E' : '#EF4444'
                        }}
                      >
                        {formatMinutesToHours(row?.balance)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Resumo */}
      {reportData.length > 0 && (
        <div className="rounded-lg shadow-xl p-6" style={{ backgroundColor: '#253A4A' }}>
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
    </div>
  );
}
