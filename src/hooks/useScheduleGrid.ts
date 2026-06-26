import { useState, useMemo } from 'react';
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, differenceInDays, parseISO, isSameMonth } from 'date-fns';
import { useMedicationStore, Medication, Schedule, PREDEFINED_SLOTS } from '@/store/useMedicationStore';

export interface GridCell {
  date: Date;
  isCurrentMonth: boolean;
  medications: { med: Medication; schedule: Schedule }[];
}

export interface GridRow {
  time_slot: string;
  days: GridCell[];
}

export interface GridWeek {
  weekDays: Date[];
  matrix: GridRow[];
}

export const useScheduleGrid = () => {
  const medications = useMedicationStore(state => state.medications);
  // Default to current date, or allow external control. We'll start with today.
  const [activeDate, setActiveDate] = useState(new Date());

  const grid = useMemo(() => {
    // 1. Identificar el mes
    const monthStart = startOfMonth(activeDate);
    const monthEnd = endOfMonth(monthStart);
    
    // 2. Establecer el rango visible (desde el primer Lunes del mes, o Lunes anterior si empieza otro día)
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const weeks: GridWeek[] = [];
    let currentDay = startDate;

    while (currentDay <= endDate) {
      const weekDays: Date[] = [];
      for (let i = 0; i < 7; i++) {
        weekDays.push(currentDay);
        currentDay = addDays(currentDay, 1);
      }
      
      // Extraer y ordenar todos los horarios (predefinidos + personalizados de los medicamentos)
      const customSlots = new Set<string>();
      medications.forEach(med => {
        med.schedules.forEach(sched => {
          if (sched.time_slot) customSlots.add(sched.time_slot);
        });
      });
      
      const allSlots = Array.from(new Set([...PREDEFINED_SLOTS, ...Array.from(customSlots)]))
        .sort((a, b) => {
          const getSortKey = (slot: string) => {
            if (slot.includes('ALMUERZO')) return '12:00';
            const match = slot.match(/\d{2}:\d{2}/);
            return match ? match[0] : slot;
          };
          return getSortKey(a).localeCompare(getSortKey(b));
        });

      const weekMatrix: GridRow[] = allSlots.map(slot => {
         const rowCells = weekDays.map(day => {
            const medsInSlot = medications.flatMap(med => {
              const activeSchedules = med.schedules.filter(sched => {
                // If it's a legacy ALMUERZO matching, just check strict equality since we normalized the slots to 24h
                if (sched.time_slot !== slot) return false;

                if (sched.frequency === 'diario') return true;

                if (sched.frequency === 'dias_especificos') {
                  // getDay(): 0 = Domingo, 1 = Lunes ... 6 = Sábado
                  return sched.specific_days.includes(day.getDay());
                }

                if (sched.frequency === 'dia_por_medio') {
                  if (!sched.start_date) return true;
                  const start = parseISO(sched.start_date);
                  start.setHours(0,0,0,0);
                  const compareDay = new Date(day);
                  compareDay.setHours(0,0,0,0);
                  
                  const diff = differenceInDays(compareDay, start);
                  return diff >= 0 && diff % 2 === 0;
                }

                return false;
              });

              return activeSchedules.map(schedule => ({ med, schedule }));
            });

            return { 
              date: day, 
              medications: medsInSlot, 
              isCurrentMonth: isSameMonth(day, activeDate) 
            };
         });

         return { time_slot: slot, days: rowCells };
      });

      weeks.push({ weekDays, matrix: weekMatrix });
    }

    return { 
      activeDate, 
      setActiveDate, 
      weeks 
    };
  }, [activeDate, medications]);

  return grid;
};
