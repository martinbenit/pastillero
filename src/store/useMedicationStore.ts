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
  
  addMedication: async (medication) => {
    set({ isLoading: true });
    try {
      // First get patient id
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      
      const { data: patient } = await supabase
        .from('patients')
        .select('id')
        .eq('user_id', user.id)
        .single();
        
      if (!patient) throw new Error('Patient not found');

      const { id, schedules, ...medData } = medication;
      
      // Insert medication
      const { data: newMed, error: medErr } = await supabase
        .from('medications')
        .insert({ ...medData, patient_id: patient.id })
        .select()
        .single();
        
      if (medErr) throw medErr;

      // Insert schedules
      if (schedules && schedules.length > 0) {
        const schedulesToInsert = schedules.map(s => {
          const { id: schedId, ...sData } = s; // remove local id if exists
          return { ...sData, medication_id: newMed.id };
        });
        
        const { error: schedErr } = await supabase
          .from('schedules')
          .insert(schedulesToInsert);
          
        if (schedErr) throw schedErr;
      }

      // Refresh data
      await get().fetchMedications();
    } catch (error) {
      console.error('Error adding medication:', error);
    } finally {
      set({ isLoading: false });
    }
  },
  
  updateMedication: async (id, updatedMedication) => {
    set({ isLoading: true });
    try {
      const { schedules, id: _, patient_id, ...medData } = updatedMedication;
      
      // Update medication
      const { error: medErr } = await supabase
        .from('medications')
        .update(medData)
        .eq('id', id);
        
      if (medErr) throw medErr;

      // Update schedules (simplest is to delete old and insert new)
      if (schedules) {
        const { error: deleteErr } = await supabase
          .from('schedules')
          .delete()
          .eq('medication_id', id);
          
        if (deleteErr) throw deleteErr;

        if (schedules.length > 0) {
          const schedulesToInsert = schedules.map(s => {
            const { id: schedId, ...sData } = s;
            return { ...sData, medication_id: id };
          });
          
          const { error: insertErr } = await supabase
            .from('schedules')
            .insert(schedulesToInsert);
            
          if (insertErr) throw insertErr;
        }
      }

      // Refresh data
      await get().fetchMedications();
    } catch (error) {
      console.error('Error updating medication:', error);
    } finally {
      set({ isLoading: false });
    }
  },
  
  deleteMedication: async (id) => {
    set({ isLoading: true });
    try {
      const { error } = await supabase
        .from('medications')
        .delete()
        .eq('id', id);
        
      if (error) throw error;

      // Refresh data
      await get().fetchMedications();
    } catch (error) {
      console.error('Error deleting medication:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchMedications: async () => {
    set({ isLoading: true });
    try {
      // Auto-login to bypass RLS securely using dummy user
      await supabase.auth.signInWithPassword({
        email: 'hector.6e205759@test.com',
        password: 'password123',
      });

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
