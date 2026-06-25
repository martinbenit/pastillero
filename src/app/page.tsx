import MonthlySchedule from '@/components/MonthlySchedule';
import MedicationManager from '@/components/MedicationManager';

export default function Home() {
  return (
    <main className="min-h-screen bg-[#FDF6F5] selection:bg-black selection:text-white font-sans">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <header className="mb-12 border-b-4 border-gray-900 pb-6 flex items-end justify-between">
          <div>
            <h1 className="text-5xl font-black tracking-tighter text-gray-900 uppercase">Pastillero</h1>
            <p className="text-xl font-bold text-gray-500 mt-1 uppercase tracking-widest">Inteligente</p>
          </div>
        </header>
        
        <MonthlySchedule />
        
        <div className="my-24 border-t-4 border-dashed border-gray-900/20"></div>
        
        <MedicationManager />
      </div>
    </main>
  );
}
