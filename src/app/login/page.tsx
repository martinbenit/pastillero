'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Load saved email on mount
  useEffect(() => {
    const savedEmail = localStorage.getItem('savedEmail');
    if (savedEmail) {
      setEmail(savedEmail);
    }
  }, []);

  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setMessage(null);

    // Save email for future sessions
    localStorage.setItem('savedEmail', email);

    try {
      if (isLogin) {
        // Flujo de Login
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        if (data?.user) {
          // Check if patient exists for this user
          const { data: existingPatient } = await supabase
            .from('patients')
            .select('id')
            .eq('user_id', data.user.id)
            .maybeSingle();

          if (!existingPatient) {
            // Create a patient record for the new user
            const fullName = data.user.user_metadata?.full_name || 'Usuario';
            await supabase
              .from('patients')
              .insert([{ user_id: data.user.id, full_name: fullName }]);
          }
          
          router.push('/');
          router.refresh();
        }
      } else {
        // Flujo de Registro
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        
        if (error) throw error;
        
        setMessage('Registro exitoso. Revisa tu correo para confirmar la cuenta (si tienes la confirmación activada).');
        setIsLogin(true); // Volver a login después de registro
      }
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message || 'Error al conectar con Google');
    }
  };

  return (
    <div className="min-h-screen bg-[#FDF6F5] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl p-8 shadow-sm border-2 border-gray-900">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black text-gray-900 tracking-tighter uppercase mb-2">Pastillero</h1>
          <p className="text-gray-500 font-bold text-sm">
            {isLogin ? 'Iniciar sesión para continuar' : 'Crea una cuenta para comenzar'}
          </p>
        </div>

        {/* Google Login Button */}
        <button 
          onClick={handleGoogleLogin}
          className="w-full py-4 text-base font-bold rounded-xl border-2 border-gray-900 bg-white text-gray-900 hover:bg-gray-50 transition-colors flex items-center justify-center gap-3 mb-6"
        >
          <svg viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
            <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
              <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"/>
              <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"/>
              <path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"/>
              <path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"/>
            </g>
          </svg>
          Continuar con Google
        </button>

        <div className="flex items-center gap-4 mb-6">
          <div className="h-px bg-gray-200 flex-1"></div>
          <span className="text-xs text-gray-400 font-bold uppercase">o usando email</span>
          <div className="h-px bg-gray-200 flex-1"></div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-gray-50 border-2 border-gray-900 rounded-xl px-4 py-3 font-medium focus:outline-none focus:ring-4 focus:ring-black/5 transition-all"
              placeholder="tu@email.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-gray-50 border-2 border-gray-900 rounded-xl px-4 py-3 font-medium focus:outline-none focus:ring-4 focus:ring-black/5 transition-all"
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 text-sm font-bold p-4 rounded-xl border-2 border-red-200">
              {error}
            </div>
          )}

          {message && (
            <div className="bg-green-50 text-green-700 text-sm font-bold p-4 rounded-xl border-2 border-green-200">
              {message}
            </div>
          )}

          <button 
            type="submit" 
            className="w-full py-5 text-lg font-bold rounded-xl bg-gray-900 text-white hover:bg-gray-800 transition-colors"
            disabled={isLoading}
          >
            {isLoading ? 'Cargando...' : isLogin ? 'Entrar' : 'Registrarse'}
          </button>
        </form>

        <div className="mt-8 text-center">
          <button 
            onClick={() => {
              setIsLogin(!isLogin);
              setError(null);
              setMessage(null);
            }} 
            className="text-gray-500 hover:text-gray-900 font-bold text-sm underline underline-offset-4"
          >
            {isLogin ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
          </button>
        </div>
      </div>
    </div>
  );
}
