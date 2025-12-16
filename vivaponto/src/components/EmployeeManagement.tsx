import { useState, useEffect } from 'react';
import { UserPlus, Trash2, Users, Edit, X } from 'lucide-react';
import { api } from '../services/api';

interface User {
  id: number;
  email: string;
  name: string;
  role: string;
}

interface Shift {
  id: number;
  name: string;
  start_time: string;
  break_start: string;
  break_end: string;
  end_time: string;
  total_minutes: number;
}

interface Employee extends User {
  shift?: Shift;
}

export function EmployeeManagement() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [name, setName] = useState('');
  const [cpf, setCpf] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [shiftId, setShiftId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editShiftId, setEditShiftId] = useState<number | null>(null);
  const [editLoading, setEditLoading] = useState(false);

  useEffect(() => {
    loadEmployees();
    loadShifts();
  }, []);

  async function loadEmployees() {
    try {
      const data = await api.users.getAll();
      const employeesOnly = data.filter((user: User) => user.role === 'employee');
      setEmployees(employeesOnly || []);
    } catch (error) {
      console.error('Erro ao carregar funcionários:', error);
    }
  }

  async function loadShifts() {
    try {
      const data = await api.shifts.getAll();
      setShifts(data || []);
      if (data && data.length > 0) {
        setShiftId(data[0].id);
      }
    } catch (error) {
      console.error('Erro ao carregar turnos:', error);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!name || !cpf || !email || !password || !shiftId) {
      setMessage({ type: 'error', text: 'Preencha todos os campos' });
      return;
    }

    const cleanCpf = cpf.replace(/\D/g, '');
    if (cleanCpf.length !== 11) {
      setMessage({ type: 'error', text: 'CPF deve ter 11 dígitos' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      await api.auth.register({
        name,
        email,
        cpf: cleanCpf,
        password,
        role: 'employee',
        shift_id: shiftId
      });

      setLoading(false);
      setMessage({ type: 'success', text: 'Funcionário cadastrado com sucesso!' });
      setName('');
      setCpf('');
      setEmail('');
      setPassword('');
      setShiftId(shifts.length > 0 ? shifts[0].id : null);
      loadEmployees();
    } catch (err: any) {
      setLoading(false);
      const errorMessage = err.message || 'Erro ao cadastrar funcionário';
      if (errorMessage.includes('email')) {
        setMessage({ type: 'error', text: 'Email já cadastrado' });
      } else if (errorMessage.includes('cpf')) {
        setMessage({ type: 'error', text: 'CPF já cadastrado' });
      } else {
        setMessage({ type: 'error', text: errorMessage });
      }
      console.error('Erro:', err);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Deseja realmente excluir este funcionário? Todos os registros de ponto serão perdidos.')) {
      return;
    }

    try {
      await api.users.delete(id);
      setMessage({ type: 'success', text: 'Funcionário excluído com sucesso!' });
      loadEmployees();
    } catch (error) {
      console.error('Erro ao excluir funcionário:', error);
      setMessage({ type: 'error', text: 'Erro ao excluir funcionário' });
    }
  }

  function formatCpf(value: string) {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      return numbers
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    }
    return numbers.slice(0, 11);
  }

  function displayCpf(cpf: string) {
    return cpf
      .replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }

  function handleEditClick(employee: Employee) {
    setEditingEmployee(employee);
    setEditName(employee.name);
    setEditEmail(employee.email);
    setEditShiftId(employee.shift?.id || null);
    setIsEditModalOpen(true);
  }

  function handleCloseEditModal() {
    setIsEditModalOpen(false);
    setEditingEmployee(null);
    setEditName('');
    setEditEmail('');
    setEditShiftId(null);
    setMessage(null);
  }

  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!editName || !editEmail || !editShiftId) {
      setMessage({ type: 'error', text: 'Preencha todos os campos' });
      return;
    }

    if (!editingEmployee) return;

    setEditLoading(true);
    setMessage(null);

    try {
      await api.users.update(editingEmployee.id, {
        name: editName,
        email: editEmail,
        shift_id: editShiftId
      });

      setEditLoading(false);
      setMessage({ type: 'success', text: 'Funcionário atualizado com sucesso!' });
      loadEmployees();

      setTimeout(() => {
        handleCloseEditModal();
      }, 1500);
    } catch (err: any) {
      setEditLoading(false);
      const errorMessage = err.message || 'Erro ao atualizar funcionário';
      if (errorMessage.includes('email')) {
        setMessage({ type: 'error', text: 'Email já cadastrado' });
      } else {
        setMessage({ type: 'error', text: errorMessage });
      }
      console.error('Erro:', err);
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold mb-2" style={{ color: '#E0E0E0' }}>Gestão de Funcionários</h2>
        <p style={{ color: '#E0E0E0B3' }}>Cadastre e gerencie os colaboradores da empresa</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-lg shadow-xl p-6" style={{ backgroundColor: '#253A4A' }}>
          <div className="flex items-center space-x-2 mb-6">
            <UserPlus className="w-5 h-5" style={{ color: '#0A6777' }} />
            <h3 className="text-xl font-semibold" style={{ color: '#E0E0E0' }}>Novo Funcionário</h3>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#E0E0E0' }}>
                Nome Completo
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2"
                style={{ backgroundColor: '#0A1A2F', borderColor: '#0A67774D', color: '#E0E0E0' }}
                placeholder="Digite o nome completo"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#E0E0E0' }}>
                CPF
              </label>
              <input
                type="text"
                value={cpf}
                onChange={(e) => setCpf(formatCpf(e.target.value))}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2"
                style={{ backgroundColor: '#0A1A2F', borderColor: '#0A67774D', color: '#E0E0E0' }}
                placeholder="000.000.000-00"
                maxLength={14}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#E0E0E0' }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2"
                style={{ backgroundColor: '#0A1A2F', borderColor: '#0A67774D', color: '#E0E0E0' }}
                placeholder="email@exemplo.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#E0E0E0' }}>
                Senha
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2"
                style={{ backgroundColor: '#0A1A2F', borderColor: '#0A67774D', color: '#E0E0E0' }}
                placeholder="Digite a senha"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#E0E0E0' }}>
                Turno de Trabalho
              </label>
              <select
                value={shiftId || ''}
                onChange={(e) => setShiftId(Number(e.target.value))}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2"
                style={{ backgroundColor: '#0A1A2F', borderColor: '#0A67774D', color: '#E0E0E0' }}
              >
                {shifts.length === 0 ? (
                  <option value="">Carregando turnos...</option>
                ) : (
                  shifts.map((shift) => (
                    <option key={shift.id} value={shift.id}>
                      {shift.name}
                    </option>
                  ))
                )}
              </select>
            </div>

            {message && (
              <div
                className={`p-3 rounded-lg text-sm ${
                  message.type === 'success'
                    ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                    : 'bg-red-500/20 text-red-300 border border-red-500/30'
                }`}
              >
                {message.text}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full text-white font-medium py-3 rounded-lg transition-colors disabled:opacity-50"
              style={{ backgroundColor: '#0A6777' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#0A6777CC'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#0A6777'}
            >
              {loading ? 'Cadastrando...' : 'Cadastrar Funcionário'}
            </button>
          </form>
        </div>

        <div className="rounded-lg shadow-xl p-6" style={{ backgroundColor: '#253A4A' }}>
          <div className="flex items-center space-x-2 mb-6">
            <Users className="w-5 h-5" style={{ color: '#0A6777' }} />
            <h3 className="text-xl font-semibold" style={{ color: '#E0E0E0' }}>Funcionários Cadastrados</h3>
          </div>

          <div className="space-y-3 max-h-[500px] overflow-y-auto">
            {employees.length === 0 ? (
              <p className="text-center py-8" style={{ color: '#E0E0E099' }}>
                Nenhum funcionário cadastrado ainda
              </p>
            ) : (
              employees.map((employee) => (
                <div
                  key={employee.id}
                  className="rounded-lg p-4 flex items-center justify-between transition-colors"
                  style={{ backgroundColor: '#0A1A2F' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1E3A3680'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#0A1A2F'}
                >
                  <div>
                    <h4 className="font-medium" style={{ color: '#E0E0E0' }}>{employee.name}</h4>
                    <p className="text-sm" style={{ color: '#E0E0E099' }}>
                      Email: {employee.email}
                    </p>
                    {employee.shift && (
                      <p className="text-xs mt-1" style={{ color: '#0A6777' }}>
                        Turno: {employee.shift.name}
                      </p>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEditClick(employee)}
                      className="p-2 rounded-lg transition-colors"
                      style={{ color: '#0A6777' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#0d948833'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(employee.id)}
                      className="p-2 text-red-400 rounded-lg transition-colors"
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#EF444433'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Modal de Edição */}
      {isEditModalOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={handleCloseEditModal}
        >
          <div
            className="rounded-lg shadow-xl p-6 max-w-md w-full"
            style={{ backgroundColor: '#253A4A' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold" style={{ color: '#E0E0E0' }}>
                Editar Funcionário
              </h3>
              <button
                onClick={handleCloseEditModal}
                className="p-1 rounded-lg transition-colors"
                style={{ color: '#E0E0E0' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#0A1A2F'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#E0E0E0' }}>
                  Nome Completo
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2"
                  style={{ backgroundColor: '#0A1A2F', borderColor: '#0A6777', color: '#E0E0E0' }}
                  placeholder="Digite o nome completo"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#E0E0E0' }}>
                  Email
                </label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2"
                  style={{ backgroundColor: '#0A1A2F', borderColor: '#0A6777', color: '#E0E0E0' }}
                  placeholder="email@exemplo.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#E0E0E0' }}>
                  Turno de Trabalho
                </label>
                <select
                  value={editShiftId || ''}
                  onChange={(e) => setEditShiftId(Number(e.target.value))}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2"
                  style={{ backgroundColor: '#0A1A2F', borderColor: '#0A6777', color: '#E0E0E0' }}
                >
                  <option value="">Selecione um turno</option>
                  {shifts.map((shift) => (
                    <option key={shift.id} value={shift.id}>
                      {shift.name}
                    </option>
                  ))}
                </select>
              </div>

              {message && (
                <div
                  className={`p-3 rounded-lg text-sm ${
                    message.type === 'success'
                      ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                      : 'bg-red-500/20 text-red-300 border border-red-500/30'
                  }`}
                >
                  {message.text}
                </div>
              )}

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={handleCloseEditModal}
                  className="flex-1 text-white font-medium py-3 rounded-lg transition-colors"
                  style={{ backgroundColor: '#6B7280' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#4B5563'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#6B7280'}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="flex-1 text-white font-medium py-3 rounded-lg transition-colors disabled:opacity-50"
                  style={{ backgroundColor: '#0A6777' }}
                  onMouseEnter={(e) => !editLoading && (e.currentTarget.style.backgroundColor = '#0d9488')}
                  onMouseLeave={(e) => !editLoading && (e.currentTarget.style.backgroundColor = '#0A6777')}
                >
                  {editLoading ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
