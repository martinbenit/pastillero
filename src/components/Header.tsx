'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { User, LogOut } from 'lucide-react';
import UserProfileModal from './UserProfileModal';

export default function Header() {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [userName, setUserName] = useState<string>('');

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserName(user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuario');
      }
    };
    fetchUser();
  }, []);

  const handleSignOut = async () => {
    if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
      await supabase.auth.signOut();
      window.location.reload();
    }
  };

  return (
    <header className="mb-12 border-b-4 border-gray-900 pb-6 flex flex-col sm:flex-row items-center sm:items-end justify-between gap-6 print:hidden">
      <div className="text-center sm:text-left">
        <h1 className="text-5xl font-black tracking-tighter text-gray-900 uppercase">Pastillero</h1>
        <p className="text-xl font-bold text-gray-500 mt-1 uppercase tracking-widest">
          {userName ? `¡Hola, ${userName}!` : 'Inteligente'}
        </p>
      </div>
      
      <div className="flex items-center gap-4">
        <button
          onClick={() => setIsProfileOpen(true)}
          className="flex items-center gap-2 px-5 py-3 rounded-xl border-2 border-gray-900 font-bold bg-white hover:bg-gray-50 transition shadow-[4px_4px_0px_0px_rgba(17,24,39,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 text-gray-900"
        >
          <User className="w-5 h-5" />
          Mi Perfil
        </button>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 px-5 py-3 rounded-xl border-2 border-gray-900 font-bold bg-[#FDF6F5] hover:bg-red-50 hover:text-red-600 transition shadow-[4px_4px_0px_0px_rgba(17,24,39,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 text-gray-900"
        >
          <LogOut className="w-5 h-5" />
          Salir
        </button>
      </div>

      <UserProfileModal 
        isOpen={isProfileOpen} 
        onClose={() => setIsProfileOpen(false)} 
      />
    </header>
  );
}
