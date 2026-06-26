'use client';

import { useEffect } from 'react';
import { format, addMonths, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import { useScheduleGrid } from '@/hooks/useScheduleGrid';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function MonthlySchedule() {
  const { activeDate, setActiveDate, weeks } = useScheduleGrid();

  const handlePrevMonth = () => setActiveDate(subMonths(activeDate, 1));
  const handleNextMonth = () => setActiveDate(addMonths(activeDate, 1));
  const handleGoToToday = (isSmooth = true) => {
    setActiveDate(new Date());
    setTimeout(() => {
      const todayEl = document.getElementById('dia-hoy');
      if (todayEl) {
        todayEl.scrollIntoView({ 
          behavior: isSmooth ? 'smooth' : 'auto', 
          block: 'center', 
          inline: 'center' 
        });
      }
    }, 100);
  };

  useEffect(() => {
    // Small delay to ensure render is complete
    setTimeout(() => handleGoToToday(false), 500);
  }, []);

  const weekHeader = ["DOM", "LUN", "MAR", "MIE", "JUE", "VIE", "SAB"];

  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4 px-2">
        <div className="flex flex-col gap-1">
          <h2 className="text-4xl sm:text-6xl font-black text-gray-900 uppercase tracking-tighter">
            {format(activeDate, 'MMMM', { locale: es })}
          </h2>
        </div>
        <div className="flex items-center gap-6">
          <h2 className="text-4xl sm:text-6xl font-black text-gray-900 tracking-tighter hidden sm:block">
            {format(activeDate, 'yyyy')}
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={() => handleGoToToday(true)} className="px-4 py-2 mr-2 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 transition shadow-sm border-2 border-gray-900 print:hidden text-sm uppercase">
              Ir a Hoy
            </button>
            <button onClick={handlePrevMonth} className="p-3 bg-white hover:bg-black hover:text-white rounded-xl transition shadow-sm border-2 border-gray-900 print:hidden">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button onClick={handleNextMonth} className="p-3 bg-white hover:bg-black hover:text-white rounded-xl transition shadow-sm border-2 border-gray-900 print:hidden">
              <ChevronRight className="w-5 h-5" />
            </button>
            <button onClick={() => window.print()} className="p-3 bg-[#D4E8D4] hover:bg-[#b5d5b5] text-gray-900 rounded-xl transition shadow-sm border-2 border-gray-900 print:hidden ml-2 flex gap-2 items-center font-bold text-sm uppercase" title="Exportar a PDF / Imprimir">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
              PDF / Imprimir
            </button>
          </div>
        </div>
      </div>

      {/* Semanas (Bloques apilados) */}
      <div className="space-y-12 print:space-y-6">
        {weeks.map((week, wIdx) => (
          <div key={wIdx} className="bg-white rounded-[2rem] shadow-sm border-2 border-gray-900 overflow-hidden print:border-2 print:rounded-lg print:break-inside-avoid">
            <div className="overflow-x-auto print:overflow-visible">
              <table className="w-full text-left border-collapse min-w-[900px] print:min-w-0 print:text-xs">
                <thead>
                  <tr>
                    <th className="sticky left-0 z-20 p-4 border-b-2 border-r-2 border-gray-900 font-bold text-gray-900 w-48 text-sm uppercase tracking-wider text-center bg-white print:static print:w-auto print:p-2">
                      Horarios
                    </th>
                    {week.weekDays.map((day, dIdx) => {
                      const isToday = new Date().toDateString() === day.toDateString();
                      return (
                        <th key={dIdx} id={isToday ? 'dia-hoy' : undefined} className="p-3 border-b-2 border-r-2 last:border-r-0 border-gray-900 font-bold text-gray-900 text-center w-32 bg-white">
                          <div className="flex flex-col items-center">
                            <span className="text-xs uppercase tracking-widest text-gray-500 font-bold mb-1">{weekHeader[day.getDay()]}</span>
                            <span className={cn(
                              "text-xl font-black w-8 h-8 flex items-center justify-center rounded-full",
                              isToday ? "bg-black text-white" : ""
                            )}>
                              {format(day, 'd')}
                            </span>
                          </div>
                        </th>
                      )
                    })}
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-gray-900">
                  {week.matrix.map((row, rIdx) => {
                    const [time, ...rest] = row.time_slot.split(' (');
                    const desc = rest.length > 0 ? `(${rest.join(' (')}` : '';
                    
                    return (
                      <tr key={rIdx} className="transition-colors print:break-inside-avoid">
                        <td className="sticky left-0 z-10 p-4 border-r-2 border-gray-900 font-medium text-gray-900 bg-white text-center print:static print:p-2">
                          <div className="flex flex-col items-center justify-center">
                            <span className="text-sm font-black print:text-xs">{time}</span>
                            {desc && <span className="text-xs text-gray-500 font-bold mt-0.5 print:hidden">{desc}</span>}
                          </div>
                        </td>
                        
                        {row.days.map((cell, cIdx) => (
                          <td key={cIdx} className={cn(
                            "p-2 border-r-2 last:border-r-0 border-gray-900 align-top print:p-1",
                            cell.isCurrentMonth ? "bg-white hover:bg-[#FDF6F5]/50 print:bg-white" : "bg-gray-100 print:bg-gray-50"
                          )}>
                            <div className="flex flex-col gap-2 min-h-[70px]">
                              {cell.medications.map((item, mIdx) => (
                                <div key={mIdx} className="text-xs font-bold text-gray-900 bg-[#FDF6F5] border-2 border-gray-900 px-2 py-1.5 rounded-lg text-center break-words leading-tight">
                                  {item.med.name} <br/> <span className="font-semibold opacity-70">{item.med.dose}</span>
                                </div>
                              ))}
                            </div>
                          </td>
                        ))}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
