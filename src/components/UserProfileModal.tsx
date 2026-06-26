'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { X, Save, Loader2, UserRound, Bell, BellOff, Smartphone } from 'lucide-react';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function UserProfileModal({ isOpen, onClose }: UserProfileModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{type: 'success'|'error', text: string} | null>(null);
  
  // Notification states
  const [notifSupported, setNotifSupported] = useState(false);
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  const [profile, setProfile] = useState({
    full_name: '',
    age: '',
    health_insurance: '',
    blood_type: '',
    emergency_contact: ''
  });

  useEffect(() => {
    if (isOpen) {
      loadProfile();
      checkNotificationStatus();
    }
  }, [isOpen]);

  const checkNotificationStatus = async () => {
    // Check if we're on iOS
    const ua = navigator.userAgent;
    const isiOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    setIsIOS(isiOS);

    // Check if running as standalone (installed PWA)
    const standalone = window.matchMedia('(display-mode: standalone)').matches 
      || (window.navigator as any).standalone === true;
    setIsStandalone(standalone);

    // Check support
    const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
    setNotifSupported(supported);

    if (!supported) return;

    setNotifPermission(Notification.permission);

    // Check existing subscription
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
    } catch {
      setIsSubscribed(false);
    }
  };

  const handleSubscribe = async () => {
    setIsSubscribing(true);
    try {
      // Register service worker if not already
      const registration = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      // Request permission
      const permission = await Notification.requestPermission();
      setNotifPermission(permission);

      if (permission !== 'granted') {
        setMessage({ type: 'error', text: 'Necesitás permitir las notificaciones para recibir recordatorios.' });
        return;
      }

      // Subscribe
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      // Send to server
      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription.toJSON()),
      });

      if (!response.ok) {
        throw new Error('Error al guardar la suscripción');
      }

      setIsSubscribed(true);
      setMessage({ type: 'success', text: '🔔 ¡Notificaciones activadas! Recibirás alertas cuando sea hora de tus medicamentos.' });
    } catch (err: any) {
      console.error('Subscribe error:', err);
      setMessage({ type: 'error', text: err.message || 'Error al activar notificaciones' });
    } finally {
      setIsSubscribing(false);
    }
  };

  const handleUnsubscribe = async () => {
    setIsSubscribing(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        // Remove from server
        await fetch('/api/push/subscribe', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });

        // Unsubscribe locally
        await subscription.unsubscribe();
      }

      setIsSubscribed(false);
      setMessage({ type: 'success', text: 'Notificaciones desactivadas.' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Error al desactivar notificaciones' });
    } finally {
      setIsSubscribing(false);
    }
  };

  const loadProfile = async () => {
    setIsLoading(true);
    setMessage(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.user_metadata) {
        setProfile({
          full_name: user.user_metadata.full_name || '',
          age: user.user_metadata.age || '',
          health_insurance: user.user_metadata.health_insurance || '',
          blood_type: user.user_metadata.blood_type || '',
          emergency_contact: user.user_metadata.emergency_contact || ''
        });
      }
    } catch (err) {
      console.error('Error loading profile', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);
    try {
      const { error } = await supabase.auth.updateUser({
        data: profile
      });
      if (error) throw error;
      setMessage({ type: 'success', text: '¡Perfil guardado correctamente!' });
      setTimeout(() => {
        onClose();
        setMessage(null);
      }, 2000);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Error al guardar el perfil' });
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div 
        className="bg-white w-full max-w-2xl rounded-[2rem] border-4 border-gray-900 shadow-[8px_8px_0px_0px_rgba(17,24,39,1)] overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="flex justify-between items-center p-6 sm:p-8 border-b-4 border-gray-900 bg-[#FDF6F5]">
          <div className="flex items-center gap-4">
            <div className="bg-white p-3 rounded-full border-2 border-gray-900 shadow-sm">
              <UserRound className="w-8 h-8 text-gray-900" />
            </div>
            <div>
              <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tighter">Mi Perfil</h2>
              <p className="text-gray-500 font-bold">Datos personales y de salud</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors"
          >
            <X className="w-8 h-8" />
          </button>
        </div>

        <div className="p-6 sm:p-8 overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-12 h-12 text-gray-400 animate-spin" />
            </div>
          ) : (
            <form id="profile-form" onSubmit={handleSave} className="space-y-6">
              {message && (
                <div className={`p-4 rounded-xl border-2 font-bold ${
                  message.type === 'success' 
                    ? 'bg-green-50 text-green-700 border-green-200' 
                    : 'bg-red-50 text-red-700 border-red-200'
                }`}>
                  {message.text}
                </div>
              )}

              {/* --- Notification Section --- */}
              <div className="bg-[#FDF6F5] border-2 border-gray-900 rounded-2xl p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <Bell className="w-6 h-6 text-gray-900" />
                  <h3 className="text-lg font-black text-gray-900 uppercase tracking-wide">Recordatorios</h3>
                </div>

                {!notifSupported ? (
                  <p className="text-sm text-gray-500 font-bold">
                    Tu navegador no soporta notificaciones push. Probá con Chrome, Edge o Safari actualizado.
                  </p>
                ) : isIOS && !isStandalone ? (
                  <div className="space-y-3">
                    <div className="flex items-start gap-3 bg-yellow-50 border-2 border-yellow-300 rounded-xl p-4">
                      <Smartphone className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-black text-yellow-800 text-sm">Para recibir notificaciones en iPhone:</p>
                        <ol className="text-sm text-yellow-700 font-bold mt-2 space-y-1 list-decimal list-inside">
                          <li>Tocá el botón <strong>Compartir</strong> (el cuadrado con flecha) en Safari</li>
                          <li>Elegí <strong>&quot;Agregar a Pantalla de Inicio&quot;</strong></li>
                          <li>Abrí la app desde el nuevo ícono en tu pantalla</li>
                          <li>Volvé acá y activá las notificaciones</li>
                        </ol>
                      </div>
                    </div>
                  </div>
                ) : notifPermission === 'denied' ? (
                  <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
                    <p className="text-sm text-red-700 font-bold">
                      <BellOff className="w-4 h-4 inline mr-1" />
                      Las notificaciones fueron bloqueadas. Para activarlas, entrá a la configuración de tu navegador y permitilas para este sitio.
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-gray-900 text-sm">
                        {isSubscribed 
                          ? '🔔 Notificaciones activas' 
                          : '🔕 Notificaciones desactivadas'}
                      </p>
                      <p className="text-xs text-gray-500 font-bold mt-1">
                        {isSubscribed
                          ? 'Recibirás alertas cuando sea hora de tus medicamentos.'
                          : 'Activá las notificaciones para que te avisemos.'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={isSubscribed ? handleUnsubscribe : handleSubscribe}
                      disabled={isSubscribing}
                      className={`px-5 py-3 rounded-xl font-black text-sm border-2 transition-all shadow-[3px_3px_0px_0px_rgba(17,24,39,1)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 ${
                        isSubscribed
                          ? 'bg-white border-gray-900 text-gray-900 hover:bg-red-50 hover:text-red-600'
                          : 'bg-gray-900 border-gray-900 text-white hover:bg-gray-800'
                      }`}
                    >
                      {isSubscribing ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : isSubscribed ? (
                        <span className="flex items-center gap-2"><BellOff className="w-4 h-4" /> Desactivar</span>
                      ) : (
                        <span className="flex items-center gap-2"><Bell className="w-4 h-4" /> Activar</span>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* --- Profile Fields --- */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="sm:col-span-2">
                  <label className="block text-lg font-black text-gray-900 mb-2 uppercase tracking-wide">Nombre y Apellido</label>
                  <input
                    type="text"
                    value={profile.full_name}
                    onChange={(e) => setProfile({...profile, full_name: e.target.value})}
                    className="w-full bg-gray-50 border-2 border-gray-900 rounded-xl px-4 py-4 text-lg font-bold focus:outline-none focus:ring-4 focus:ring-black/10 transition-all"
                    placeholder="Ej. Héctor García"
                  />
                </div>

                <div>
                  <label className="block text-lg font-black text-gray-900 mb-2 uppercase tracking-wide">Edad</label>
                  <input
                    type="number"
                    value={profile.age}
                    onChange={(e) => setProfile({...profile, age: e.target.value})}
                    className="w-full bg-gray-50 border-2 border-gray-900 rounded-xl px-4 py-4 text-lg font-bold focus:outline-none focus:ring-4 focus:ring-black/10 transition-all"
                    placeholder="Ej. 78"
                  />
                </div>

                <div>
                  <label className="block text-lg font-black text-gray-900 mb-2 uppercase tracking-wide">Grupo Sanguíneo</label>
                  <input
                    type="text"
                    value={profile.blood_type}
                    onChange={(e) => setProfile({...profile, blood_type: e.target.value})}
                    className="w-full bg-gray-50 border-2 border-gray-900 rounded-xl px-4 py-4 text-lg font-bold focus:outline-none focus:ring-4 focus:ring-black/10 transition-all"
                    placeholder="Ej. A+"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-lg font-black text-gray-900 mb-2 uppercase tracking-wide">Obra Social / Prepaga</label>
                  <input
                    type="text"
                    value={profile.health_insurance}
                    onChange={(e) => setProfile({...profile, health_insurance: e.target.value})}
                    className="w-full bg-gray-50 border-2 border-gray-900 rounded-xl px-4 py-4 text-lg font-bold focus:outline-none focus:ring-4 focus:ring-black/10 transition-all"
                    placeholder="Nombre y número de afiliado"
                  />
                </div>
                
                <div className="sm:col-span-2">
                  <label className="block text-lg font-black text-gray-900 mb-2 uppercase tracking-wide">Contacto de Emergencia</label>
                  <input
                    type="text"
                    value={profile.emergency_contact}
                    onChange={(e) => setProfile({...profile, emergency_contact: e.target.value})}
                    className="w-full bg-gray-50 border-2 border-gray-900 rounded-xl px-4 py-4 text-lg font-bold focus:outline-none focus:ring-4 focus:ring-black/10 transition-all"
                    placeholder="Nombre y teléfono"
                  />
                </div>
              </div>
            </form>
          )}
        </div>

        <div className="p-6 sm:p-8 border-t-4 border-gray-900 bg-gray-50 flex justify-end gap-4">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-4 rounded-xl font-black text-gray-700 bg-white border-2 border-gray-300 hover:bg-gray-100 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="profile-form"
            disabled={isSaving || isLoading}
            className="flex items-center gap-2 bg-black text-white px-8 py-4 rounded-xl font-black text-lg hover:bg-gray-800 transition-colors shadow-[4px_4px_0px_0px_rgba(150,150,150,1)] hover:shadow-none hover:translate-y-1 hover:translate-x-1 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <Save className="w-6 h-6" />
            )}
            {isSaving ? 'Guardando...' : 'Guardar Perfil'}
          </button>
        </div>
      </div>
    </div>
  );
}
