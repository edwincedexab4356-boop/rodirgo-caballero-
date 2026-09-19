import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { BullEmblem } from '../components/BullEmblem';
import { Lock, User as UserIcon, ShieldAlert, KeyRound, ArrowRight } from 'lucide-react';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setError('Por favor ingrese el nombre de usuario o correo asignado.');
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      await login({ username, password });
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Error al autenticar credenciales.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickLogin = (demoUser: string, demoPass = '123456') => {
    setUsername(demoUser);
    setPassword(demoPass);
    setError(null);
  };

  return (
    <div className="min-h-screen w-full bg-[#080808] flex flex-col justify-between items-center p-4 sm:p-6 lg:p-8 relative">
      {/* Top Security Banner - Flat styling */}
      <div className="w-full max-w-md pt-4 flex items-center justify-between text-[11px] text-[#707070] tracking-wider uppercase border-b border-[#1E1E1E] pb-3">
        <span className="flex items-center gap-1.5 text-[#C9A227] font-semibold">
          <Lock className="w-3.5 h-3.5" />
          Servidor Ganadero Privado
        </span>
        <span className="font-mono text-[#555555]">Hacienda Caballero</span>
      </div>

      {/* Main Login Card - Flat Matte Solid */}
      <div className="w-full max-w-md my-auto z-10 py-6">
        <div className="bg-[#101010] border border-[#242424] rounded-lg p-7 sm:p-9">
          {/* System Identity & Livestock Silhouette */}
          <div className="text-center mb-6">
            <div className="flex justify-center mb-3">
              <BullEmblem size={72} glow={false} />
            </div>

            <h1 className="text-xl font-bold tracking-wider text-[#FFFFFF] uppercase">
              GESTIÓN GANADERA
            </h1>
            <p className="text-xs text-[#C9A227] font-medium tracking-wide mt-1">
              Hacienda Ganadera Caballero & Cía.
            </p>

            <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded bg-[#161616] border border-[#2B2B2B] text-[10px] tracking-wider text-[#A0A0A0] uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-[#C9A227]" />
              Acceso Restringido y Privado
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-5 p-3 rounded bg-[#201111] border border-[#441818] flex items-start gap-2.5 text-xs text-[#FF9999]">
              <ShieldAlert className="w-4 h-4 flex-shrink-0 text-[#E57373] mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Access Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Field: Usuario */}
            <div className="space-y-1">
              <label 
                htmlFor="username-input"
                className="block text-[11px] font-semibold tracking-wider text-[#A0A0A0] uppercase"
              >
                USUARIO O CORREO
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#666666]">
                  <UserIcon className="w-4 h-4" />
                </div>
                <input
                  id="username-input"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Ej: rodrigo caballero, migdalia..."
                  disabled={isSubmitting}
                  className="w-full pl-10 pr-4 py-2.5 bg-[#141414] border border-[#282828] focus:border-[#C9A227] text-xs text-[#FFFFFF] placeholder-[#555555] rounded-lg outline-none transition-colors"
                  required
                />
              </div>
            </div>

            {/* Field: Contraseña */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label 
                  htmlFor="password-input"
                  className="block text-[11px] font-semibold tracking-wider text-[#A0A0A0] uppercase"
                >
                  CONTRASEÑA
                </label>
                <span className="text-[10px] text-[#555555]">
                  Clave: 123456
                </span>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#666666]">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  id="password-input"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••"
                  disabled={isSubmitting}
                  className="w-full pl-10 pr-4 py-2.5 bg-[#141414] border border-[#282828] focus:border-[#C9A227] text-xs text-[#FFFFFF] placeholder-[#555555] rounded-lg outline-none transition-colors"
                />
              </div>
            </div>

            {/* Submit Button - Solid Flat */}
            <button
              id="btn-login-submit"
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 py-3 px-4 rounded-lg font-bold text-xs tracking-wider uppercase transition-colors bg-[#C9A227] hover:bg-[#D4AF37] text-[#0A0A0A] flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-[#0A0A0A] border-t-transparent rounded-full animate-spin" />
                  <span>VERIFICANDO ACCESO...</span>
                </>
              ) : (
                <>
                  <span>INGRESAR AL SISTEMA</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* User selector for easy access */}
          <div className="mt-6 pt-5 border-t border-[#1F1F1F]">
            <p className="text-[10px] text-[#707070] uppercase tracking-wider text-center font-semibold mb-2.5">
              Acceso Rápido por Usuario
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => handleQuickLogin('rodrigo caballero', '123456')}
                className="px-3 py-2.5 text-[11px] font-semibold rounded bg-[#16140C] text-[#C9A227] hover:bg-[#201C10] border border-[#3A3215] transition-colors flex flex-col items-center cursor-pointer text-center"
              >
                <span>Rodrigo Caballero</span>
                <span className="text-[9px] text-[#807040] font-normal">Administrador</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('migdalia', '123456')}
                className="px-3 py-2.5 text-[11px] font-semibold rounded bg-[#141414] text-[#E0E0E0] hover:bg-[#1C1C1C] hover:text-[#FFFFFF] border border-[#282828] transition-colors flex flex-col items-center cursor-pointer text-center"
              >
                <span>Sra. Migdalia</span>
                <span className="text-[9px] text-[#888888] font-normal">Operadora</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Legal / System Footnote */}
      <div className="w-full max-w-md pb-4 text-center text-[11px] text-[#555555]">
        <p>Sistema Privado de Gestión Ganadera & Lechería</p>
        <p className="text-[10px] text-[#404040] mt-0.5">
          Conectado con Firebase Firestore
        </p>
      </div>
    </div>
  );
};
