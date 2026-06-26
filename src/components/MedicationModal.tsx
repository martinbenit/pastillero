'use client';

import { useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { X, Plus, Trash2 } from 'lucide-react';
import { useMedicationStore, Medication, PREDEFINED_SLOTS } from '@/store/useMedicationStore';

interface MedicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  medication: Medication | null;
}

export default function MedicationModal({ isOpen, onClose, medication }: MedicationModalProps) {
  const { addMedication, updateMedication } = useMedicationStore();
  
  const { register, control, handleSubmit, reset, watch } = useForm<Medication>({
    defaultValues: {
      name: '',
      dose: '',
      instructions: '',
      schedules: [{ time_slot: '08:00', frequency: 'diario', specific_days: [], start_date: new Date().toISOString().split('T')[0] }]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'schedules'
  });

  useEffect(() => {
    if (medication) {
      reset(medication);
    } else {
      reset({
        name: '',
        dose: '',
        instructions: '',
        schedules: [{ time_slot: '08:00', frequency: 'diario', specific_days: [], start_date: new Date().toISOString().split('T')[0] }]
      });
    }
  }, [medication, reset, isOpen]);

  if (!isOpen) return null;

  const onSubmit = (data: Medication) => {
    const cleanData = {
      ...data,
      schedules: data.schedules.map(s => ({
        ...s,
        specific_days: s.specific_days.map(Number)
      }))
    };

    if (medication && medication.id) {
      updateMedication(medication.id, cleanData);
    } else {
      addMedication({ ...cleanData, id: crypto.randomUUID() });
    }
    onClose();
  };

  const daysOfWeek = [
    { value: 1, label: 'L' },
    { value: 2, label: 'M' },
    { value: 3, label: 'X' },
    { value: 4, label: 'J' },
    { value: 5, label: 'V' },
    { value: 6, label: 'S' },
    { value: 0, label: 'D' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-[2rem] border-2 border-gray-900 w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-[8px_8px_0px_0px_rgba(17,24,39,1)]">
        <div className="sticky top-0 bg-white/90 backdrop-blur-md px-8 py-6 border-b-2 border-gray-900 flex justify-between items-center z-10">
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">
            {medication ? 'Editar Medicamento' : 'Nuevo Medicamento'}
          </h2>
          <button onClick={onClose} className="p-2 bg-gray-100 border-2 border-gray-900 rounded-full hover:bg-black hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-sm font-black text-gray-900 mb-2">Nombre del Medicamento</label>
              <input
                {...register('name', { required: true })}
                className="w-full bg-[#FDF6F5] border-2 border-gray-900 text-gray-900 font-bold rounded-xl px-4 py-3 outline-none focus:ring-4 focus:ring-black/10 transition-all"
                placeholder="Ej: Losartán"
              />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-sm font-black text-gray-900 mb-2">Dosis</label>
              <input
                {...register('dose', { required: true })}
                className="w-full bg-[#FDF6F5] border-2 border-gray-900 text-gray-900 font-bold rounded-xl px-4 py-3 outline-none focus:ring-4 focus:ring-black/10 transition-all"
                placeholder="Ej: 50mg"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-black text-gray-900 mb-2">Instrucciones Especiales</label>
              <input
                {...register('instructions')}
                className="w-full bg-[#FDF6F5] border-2 border-gray-900 text-gray-900 font-bold rounded-xl px-4 py-3 outline-none focus:ring-4 focus:ring-black/10 transition-all"
                placeholder="Ej: Tomar con mucha agua"
              />
            </div>
          </div>

          <div className="pt-6 border-t-2 border-gray-900">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-black text-gray-900">Horarios de Toma</h3>
              <button
                type="button"
                onClick={() => append({ time_slot: '08:00', frequency: 'diario', specific_days: [], start_date: new Date().toISOString().split('T')[0] })}
                className="text-sm font-bold text-white bg-black px-4 py-2 rounded-xl flex items-center gap-1 hover:bg-gray-800 transition-colors"
              >
                <Plus className="w-4 h-4" /> Agregar
              </button>
            </div>

            <div className="space-y-4">
              {fields.map((field, index) => {
                const freq = watch(`schedules.${index}.frequency`);
                return (
                  <div key={field.id} className="p-4 bg-white rounded-2xl border-2 border-gray-900 shadow-[4px_4px_0px_0px_rgba(17,24,39,1)] relative">
                    {fields.length > 1 && (
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        className="absolute -top-3 -right-3 bg-white border-2 border-gray-900 p-1.5 rounded-full hover:bg-red-500 hover:text-white transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2 sm:col-span-1">
                        <label className="block text-xs font-black text-gray-500 uppercase tracking-wide mb-2">Horario Fijo</label>
                        <input
                          type="time"
                          {...register(`schedules.${index}.time_slot` as const)}
                          className="w-full bg-[#FDF6F5] border-2 border-gray-900 text-gray-900 font-bold rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-black/10"
                          required
                        />
                      </div>
                      <div className="col-span-2 sm:col-span-1">
                        <label className="block text-xs font-black text-gray-500 uppercase tracking-wide mb-2">Frecuencia</label>
                        <select
                          {...register(`schedules.${index}.frequency` as const)}
                          className="w-full bg-[#FDF6F5] border-2 border-gray-900 text-gray-900 font-bold rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-black/10"
                        >
                          <option value="diario">Todos los días</option>
                          <option value="dias_especificos">Días Específicos</option>
                          <option value="dia_por_medio">Día por medio</option>
                        </select>
                      </div>
                    </div>

                    {freq === 'dias_especificos' && (
                      <div className="mt-4">
                        <label className="block text-xs font-black text-gray-500 uppercase tracking-wide mb-2">Seleccionar Días</label>
                        <div className="flex gap-2">
                          {daysOfWeek.map((day) => (
                            <label key={day.value} className="flex-1 cursor-pointer">
                              <input
                                type="checkbox"
                                value={day.value}
                                {...register(`schedules.${index}.specific_days` as const)}
                                className="peer sr-only"
                              />
                              <div className="text-center py-2 bg-white border-2 border-gray-900 rounded-lg peer-checked:bg-black peer-checked:text-white transition-all text-sm font-black">
                                {day.label}
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}

                    {freq === 'dia_por_medio' && (
                      <div className="mt-4">
                        <label className="block text-xs font-black text-gray-500 uppercase tracking-wide mb-2">Fecha de Inicio</label>
                        <input
                          type="date"
                          {...register(`schedules.${index}.start_date` as const)}
                          className="w-full bg-[#FDF6F5] border-2 border-gray-900 text-gray-900 font-bold rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-black/10"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-6 border-t-2 border-gray-900 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 rounded-xl font-bold text-gray-900 border-2 border-gray-900 hover:bg-gray-100 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-8 py-3 rounded-xl font-bold bg-black text-white hover:bg-gray-800 shadow-[4px_4px_0px_0px_rgba(200,200,200,1)] hover:shadow-none hover:translate-y-1 hover:translate-x-1 transition-all border-2 border-black"
            >
              Guardar Cambios
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
