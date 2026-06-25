'use client';

import { format, addMonths, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import { useScheduleGrid } from '@/hooks/useScheduleGrid';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function MonthlySchedule() {
  const { activeDate, setActiveDate, weeks } = useScheduleGrid();

  const handlePrevMonth = () => setActiveDate(subMonths(activeDate, 1));
  const handleNextMonth = () => setActiveDate(addMonths(activeDate, 1));

  const weekHeader = ["DOM", "LUN", "MAR", "MIE", "JUE", "VIE", "SAB"];

  return (
    <div className="w-full">
      {/* Header del Calendario */}
      <div className="flex justify-between items-center mb-8 px-2">
        <h2 className="text-4xl sm:text-6xl font-black text-gray-900 uppercase tracking-tighter">
          {format(activeDate, 'MMMM', { locale: es })}
        </h2>
        <div className="flex items-center gap-6">
          <h2 className="text-4xl sm:text-6xl font-black text-gray-900 tracking-tighter hidden sm:block">
            {format(activeDate, 'yyyy')}
          </h2>
          <div className="flex gap-2">
            <button onClick={handlePrevMonth} className="p-3 bg-white hover:bg-black hover:text-white rounded-full transition shadow-sm border border-gray-200">
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button onClick={handleNextMonth} className="p-3 bg-white hover:bg-black hover:text-white rounded-full transition shadow-sm border border-gray-200">
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Semanas (Bloques apilados) */}
      <div className="space-y-12">
        {weeks.map((week, wIdx) => (
          <div key={wIdx} className="bg-white rounded-[2rem] shadow-sm border-2 border-gray-900 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[900px]">
                <thead>
                  <tr>
                    <th className="sticky left-0 z-20 p-4 border-b-2 border-r-2 border-gray-900 font-bold text-gray-900 w-48 text-sm uppercase tracking-wider text-center bg-white">
                      Horarios
                    </th>
                    {week.weekDays.map((day, dIdx) => {
                      const isToday = new Date().toDateString() === day.toDateString();
                      return (
                        <th key={dIdx} className="p-3 border-b-2 border-r-2 last:border-r-0 border-gray-900 font-bold text-gray-900 text-center w-32 bg-white">
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
                      <tr key={rIdx} className="transition-colors">
                        <td className="sticky left-0 z-10 p-4 border-r-2 border-gray-900 font-medium text-gray-900 bg-white text-center">
                          <div className="flex flex-col items-center justify-center">
                            <span className="text-sm font-black">{time}</span>
                            {desc && <span className="text-xs text-gray-500 font-bold mt-0.5">{desc}</span>}
                          </div>
                        </td>
                        
                        {row.days.map((cell, cIdx) => (
                          <td key={cIdx} className={cn(
                            "p-2 border-r-2 last:border-r-0 border-gray-900 align-top",
                            cell.isCurrentMonth ? "bg-white hover:bg-[#FDF6F5]/50" : "bg-gray-100"
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
