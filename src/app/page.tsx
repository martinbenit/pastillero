import MonthlySchedule from '@/components/MonthlySchedule';
import MedicationManager from '@/components/MedicationManager';
import Header from '@/components/Header';

export default function Home() {
  return (
    <main className="min-h-screen bg-[#FDF6F5] selection:bg-black selection:text-white font-sans">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Header />
        
        <MonthlySchedule />
        
        <div className="my-24 border-t-4 border-dashed border-gray-900/20"></div>
        
        <MedicationManager />
      </div>
    </main>
  );
}
