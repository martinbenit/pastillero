import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

export type FrequencyType = 'diario' | 'dias_especificos' | 'dia_por_medio';

export interface Schedule {
  id?: string;
  medication_id?: string;
  time_slot: string;
  frequency: FrequencyType;
  specific_days: number[]; // 0 = Domingo, 1 = Lunes, etc.
  start_date: string; // YYYY-MM-DD
}

export interface Medication {
  id: string; 
  patient_id?: string;
  name: string;
  dose: string;
  instructions: string;
  schedules: Schedule[];
}

interface MedicationState {
  medications: Medication[];
  isLoading: boolean;
  setMedications: (medications: Medication[]) => void;
  addMedication: (medication: Medication) => void;
  updateMedication: (id: string, medication: Medication) => void;
  deleteMedication: (id: string) => void;
  fetchMedications: () => Promise<void>;
}

export const PREDEFINED_SLOTS = [
  "07:00 AM (Ayunas)",
  "08:00 AM (Mañana)",
  "ALMUERZO (Mediodía)",
  "16:00 PM (Tarde)",
  "20:00 PM (Noche)",
  "22:00 PM (Al dormir)"
];

export const useMedicationStore = create<MedicationState>((set, get) => ({
  medications: [],
  isLoading: false,
  
  setMedications: (medications) => set({ medications }),
  
  addMedication: (medication) => set((state) => ({ medications: [...state.medications, medication] })),
  
  updateMedication: (id, updatedMedication) => set((state) => ({
    medications: state.medications.map(med => med.id === id ? { ...med, ...updatedMedication } : med)
  })),
  
  deleteMedication: (id) => set((state) => ({
    medications: state.medications.filter(med => med.id !== id)
  })),

  fetchMedications: async () => {
    set({ isLoading: true });
    try {
      const { data: meds, error: medsError } = await supabase
        .from('medications')
        .select(`
          *,
          schedules (*)
        `);
      
      if (medsError) throw medsError;
      
      if (meds) {
        set({ medications: meds as Medication[] });
      }
    } catch (error) {
      console.error('Error fetching medications:', error);
    } finally {
      set({ isLoading: false });
    }
  }
}));
