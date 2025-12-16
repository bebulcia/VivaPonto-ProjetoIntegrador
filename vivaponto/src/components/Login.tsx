import { useState } from 'react';
import { LogIn, Lock, Mail } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!email || !password) {
      setError('Preencha todos os campos');
      return;
    }

    setLoading(true);
    setError('');

    const success = await login(email, password);

    setLoading(false);

    if (!success) {
      setError('Email ou senha incorretos');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: '#0A1A2F' }}>
      <div className="w-full max-w-md">
        <div className="rounded-lg shadow-2xl p-8" style={{ backgroundColor: '#253A4A' }}>
          <div className="flex items-center justify-center mb-8">
            <div className="p-4 rounded-full" style={{ backgroundColor: '#0A6777' }}>
              <Lock className="w-12 h-12 text-white" />
            </div>
          </div>

          <h1 className="text-3xl font-bold text-center mb-2" style={{ color: '#E0E0E0' }}>
            VivaPonto
          </h1>
          <p className="text-center mb-8" style={{ color: '#E0E0E0B3' }}>
            Sistema de Controle de Jornada
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#E0E0E0' }}>
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" style={{ color: '#0A6777' }} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2"
                  style={{
                    backgroundColor: '#0A1A2F',
                    borderColor: '#0A67774D',
                    color: '#E0E0E0'
                  }}
                  placeholder="seu@email.com"
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#E0E0E0' }}>
                Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" style={{ color: '#0A6777' }} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2"
                  style={{
                    backgroundColor: '#0A1A2F',
                    borderColor: '#0A67774D',
                    color: '#E0E0E0'
                  }}
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-lg text-sm bg-red-500/20 text-red-300 border border-red-500/30">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full text-white font-medium py-3 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
              style={{ backgroundColor: '#0A6777' }}
              onMouseEnter={(e) => !loading && (e.currentTarget.style.backgroundColor = '#0A6777CC')}
              onMouseLeave={(e) => !loading && (e.currentTarget.style.backgroundColor = '#0A6777')}
            >
              <LogIn className="w-5 h-5" />
              <span>{loading ? 'Entrando...' : 'Entrar'}</span>
            </button>
          </form>
        </div>

        <p className="text-center text-sm mt-6" style={{ color: '#E0E0E066' }}>
          VivaPonto - Controle de Ponto Eletrônico
        </p>
      </div>
    </div>
  );
}
