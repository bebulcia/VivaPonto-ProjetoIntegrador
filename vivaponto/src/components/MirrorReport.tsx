import { useState, useEffect } from 'react';
import { Calendar, FileText, Printer, Clock } from 'lucide-react';
import { api } from '../services/api';
import { calculateWorkedMinutes } from '../utils/timeCalculations';
import { generateDateRange } from '../utils/dateUtils';

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
};

type DayRecord = {
  date: string;
  records: TimeRecord[];
  totalWorked: number;
  expectedMinutes: number;
  balance: number;
};

type PeriodType = 'today' | 'week' | 'month' | 'year' | 'custom';

export function MirrorReport() {
  const [employees, setEmployees] = useState<User[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number>(0);
  const [period, setPeriod] = useState<PeriodType>('month');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [dayRecords, setDayRecords] = useState<DayRecord[]>([]);
  const [employeeInfo, setEmployeeInfo] = useState<any>(null);

  useEffect(() => {
    loadEmployees();
  }, []);

  useEffect(() => {
    if (selectedEmployeeId) {
      loadData();
    }
  }, [selectedEmployeeId, period, customStartDate, customEndDate]);

  const loadEmployees = async () => {
    try {
      const data = await api.users.getAll();
      setEmployees(data || []);
      if (data && data.length > 0) {
        setSelectedEmployeeId(data[0].id);
      }
    } catch (error) {
      console.error('Erro ao carregar funcionários:', error);
    }
  };

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
        const weekDiff = (today.getDay() + 6) % 7;
        start.setDate(today.getDate() - weekDiff);
        end = today;
        break;

      case 'month':
        start = new Date(today.getFullYear(), today.getMonth(), 1);
        end = today;
        break;

      case 'year':
        start = new Date(today.getFullYear(), 0, 1);
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
      const { start, end } = getDateRange();

      const records = await api.timeRecords.getAll({
        user_id: selectedEmployeeId,
        start_date: start,
        end_date: end,
      });

      const allUsers = await api.users.getAll();
      const employee = allUsers.find((u: User) => u.id === selectedEmployeeId);
      setEmployeeInfo(employee);

      const groupedByDay: { [key: string]: TimeRecord[] } = {};
      records.forEach((record: TimeRecord) => {
        if (!groupedByDay[record.date]) {
          groupedByDay[record.date] = [];
        }
        groupedByDay[record.date].push(record);
      });

      const allDates = generateDateRange(start, end);
      const days: DayRecord[] = allDates.map((dateStr) => {
        const dayRecords = groupedByDay[dateStr] || [];
        dayRecords.sort((a, b) => a.time.localeCompare(b.time));

        const entry = dayRecords.find(r => r.type === 'entry');
        const exit = dayRecords.find(r => r.type === 'exit');
        const breakStart = dayRecords.find(r => r.type === 'break_start');
        const breakEnd = dayRecords.find(r => r.type === 'break_end');

        let totalWorked = 0;
        if (entry && exit) {
          totalWorked = calculateWorkedMinutes(
            entry.time,
            breakStart?.time,
            breakEnd?.time,
            exit.time
          );
        }

        const employeeShiftMinutes = employee ? (employee.shift?.total_minutes ?? 480) : 480;
        const expectedMinutes = employeeShiftMinutes;
        const balance = totalWorked - expectedMinutes;

        return {
          date: dateStr,
          records: dayRecords,
          totalWorked,
          expectedMinutes,
          balance,
        };
      });

      setDayRecords(days);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatMinutes = (minutes: number): string => {
    const hours = Math.floor(Math.abs(minutes) / 60);
    const mins = Math.abs(minutes) % 60;
    const sign = minutes < 0 ? '-' : '';
    return `${sign}${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
  };

  const getDayOfWeek = (dateStr: string): string => {
    const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const date = new Date(dateStr + 'T00:00:00');
    return days[date.getDay()];
  };

  const getPeriodLabel = (): string => {
    const { start, end } = getDateRange();
    const formatDisplay = (dateStr: string) => {
      const date = new Date(dateStr + 'T00:00:00');
      return date.toLocaleDateString('pt-BR');
    };

    if (period === 'custom') {
      return `${formatDisplay(start)} - ${formatDisplay(end)}`;
    }

    const labels = {
      today: 'Hoje',
      week: 'Esta Semana',
      month: 'Este Mês',
      year: 'Este Ano'
    };

    return labels[period] || '';
  };

  const handlePrint = () => {
    window.print();
  };

  const totalBalance = dayRecords.reduce((sum, day) => sum + day.balance, 0);
  const selectedEmployee = employees.find(emp => emp.id === selectedEmployeeId);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <style>
        {`
          @media print {
            @page {
              size: A4 portrait;
              margin: 1cm;
            }

            body * {
              visibility: hidden;
            }

            .print-area, .print-area * {
              visibility: visible;
            }

            .print-area {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              background: white !important;
            }

            .no-print {
              display: none !important;
            }

            .print-header {
              margin-bottom: 20px;
              padding-bottom: 10px;
              border-bottom: 2px solid #000;
              background: white !important;
            }

            .print-header h1 {
              color: #000 !important;
              font-size: 20pt;
              font-weight: bold;
            }

            .print-header p {
              color: #000 !important;
              font-size: 10pt;
            }

            table {
              border-collapse: collapse;
              width: 100%;
              background: white !important;
              page-break-inside: auto;
            }

            tr {
              page-break-inside: avoid;
              page-break-after: auto;
              background: white !important;
            }

            thead {
              display: table-header-group;
            }

            tfoot {
              display: table-footer-group;
            }

            th, td {
              border: 1px solid #000 !important;
              padding: 6px 8px;
              text-align: left;
              color: #000 !important;
              background: white !important;
              font-size: 9pt;
            }

            th {
              background-color: #e0e0e0 !important;
              font-weight: bold;
              font-size: 10pt;
            }

            tfoot td {
              background-color: #f5f5f5 !important;
              font-weight: bold;
              font-size: 11pt;
            }

            .print-footer {
              margin-top: 20px;
              font-size: 8pt;
              color: #666 !important;
            }
          }
        `}
      </style>

      <div className="no-print mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <FileText style={{ color: '#0A6777' }} className="w-8 h-8" />
            <h2 style={{ color: '#E0E0E0' }} className="text-3xl font-bold">
              Cartão de Ponto
            </h2>
          </div>
          <button
            onClick={handlePrint}
            className="px-6 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
            style={{ backgroundColor: '#0A6777', color: 'white' }}
          >
            <Printer className="w-5 h-5" />
            <span>Imprimir Cartão</span>
          </button>
        </div>

        <div className="rounded-lg shadow-xl p-6 mb-6" style={{ backgroundColor: '#253A4A' }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                Período
              </label>
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
            </div>

            {period === 'custom' && (
              <div className="md:col-span-2 flex items-center space-x-4">
                <div className="flex items-center space-x-2 flex-1">
                  <label style={{ color: '#E0E0E0' }} className="text-sm">
                    De:
                  </label>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
                    style={{ backgroundColor: '#0A1A2F', borderColor: '#0A67774D', color: '#E0E0E0' }}
                  />
                </div>
                <div className="flex items-center space-x-2 flex-1">
                  <label style={{ color: '#E0E0E0' }} className="text-sm">
                    Até:
                  </label>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
                    style={{ backgroundColor: '#0A1A2F', borderColor: '#0A67774D', color: '#E0E0E0' }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="print-area">
        <div className="print-header mb-6">
          <h1 className="text-2xl font-bold text-center" style={{ color: '#0A6777' }}>
            CARTÃO DE PONTO
          </h1>
          {selectedEmployee && (
            <div className="mt-4">
              <p className="text-sm" style={{ color: '#E0E0E0' }}>
                <strong>Funcionário:</strong> {selectedEmployee.name}
              </p>
              <p className="text-sm" style={{ color: '#E0E0E0' }}>
                <strong>CPF:</strong> {selectedEmployee.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')}
              </p>
              <p className="text-sm" style={{ color: '#E0E0E0' }}>
                <strong>Período:</strong> {getPeriodLabel()}
              </p>
            </div>
          )}
        </div>

        {loading ? (
          <div className="text-center py-12 no-print">
            <div
              className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto"
              style={{ borderColor: '#0A6777' }}
            />
            <p className="mt-4" style={{ color: '#E0E0E099' }}>
              Carregando dados...
            </p>
          </div>
        ) : (
          <>
            <div className="rounded-lg shadow-xl overflow-hidden" style={{ backgroundColor: '#253A4A' }}>
              <table className="w-full">
                <thead>
                  <tr style={{ backgroundColor: '#0A1A2F' }}>
                    <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: '#E0E0E0' }}>Data</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: '#E0E0E0' }}>Dia</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: '#E0E0E0' }}>Entrada</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: '#E0E0E0' }}>Saída Pausa</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: '#E0E0E0' }}>Volta Pausa</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: '#E0E0E0' }}>Saída</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold" style={{ color: '#E0E0E0' }}>Total</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold" style={{ color: '#E0E0E0' }}>Saldo</th>
                  </tr>
                </thead>
                <tbody>
                  {dayRecords.map((day, index) => {
                    const entry = day.records.find(r => r.type === 'entry');
                    const exit = day.records.find(r => r.type === 'exit');
                    const breakStart = day.records.find(r => r.type === 'break_start');
                    const breakEnd = day.records.find(r => r.type === 'break_end');
                    const hasRecords = day.records.length > 0;

                    return (
                      <tr
                        key={day.date}
                        style={{
                          backgroundColor: index % 2 === 0 ? '#0A1A2F' : '#253A4A',
                          opacity: hasRecords ? 1 : 0.5,
                        }}
                      >
                        <td className="px-4 py-2 text-sm" style={{ color: '#E0E0E0' }}>
                          {new Date(day.date + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                        </td>
                        <td className="px-4 py-2 text-sm" style={{ color: '#E0E0E0' }}>
                          {getDayOfWeek(day.date)}
                        </td>
                        <td className="px-4 py-2 text-sm" style={{ color: '#E0E0E0' }}>
                          {entry ? entry.time : '-'}
                        </td>
                        <td className="px-4 py-2 text-sm" style={{ color: '#E0E0E0' }}>
                          {breakStart ? breakStart.time : '-'}
                        </td>
                        <td className="px-4 py-2 text-sm" style={{ color: '#E0E0E0' }}>
                          {breakEnd ? breakEnd.time : '-'}
                        </td>
                        <td className="px-4 py-2 text-sm" style={{ color: '#E0E0E0' }}>
                          {exit ? exit.time : '-'}
                        </td>
                        <td className="px-4 py-2 text-sm text-center font-semibold" style={{ color: '#E0E0E0' }}>
                          {hasRecords ? formatMinutes(day.totalWorked) : '-'}
                        </td>
                        <td
                          className="px-4 py-2 text-sm text-center font-semibold"
                          style={{
                            color: day.balance > 0 ? '#22C55E' : day.balance < 0 ? '#EF4444' : '#E0E0E0',
                          }}
                        >
                          {hasRecords ? formatMinutes(day.balance) : '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr style={{ backgroundColor: '#0A6777' }}>
                    <td colSpan={6} className="px-4 py-3 text-right text-sm font-bold" style={{ color: 'white' }}>
                      SALDO TOTAL DO PERÍODO:
                    </td>
                    <td colSpan={2} className="px-4 py-3 text-center text-lg font-bold" style={{ color: 'white' }}>
                      {formatMinutes(totalBalance)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="mt-8 print-footer text-center text-xs" style={{ color: '#6B7280' }}>
              <p>Este documento foi gerado automaticamente pelo sistema VivaPonto</p>
              <p>Data de emissão: {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR')}</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
