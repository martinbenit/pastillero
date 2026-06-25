'use client';

import { useState, useEffect } from 'react';
import { useMedicationStore, Medication } from '@/store/useMedicationStore';
import { Plus, Edit2, Trash2, Pill, Loader2 } from 'lucide-react';
import MedicationModal from './MedicationModal';

export default function MedicationManager() {
  const { medications, isLoading, fetchMedications, deleteMedication } = useMedicationStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMed, setEditingMed] = useState<Medication | null>(null);

  useEffect(() => {
    fetchMedications();
  }, [fetchMedications]);

  const handleAdd = () => {
    setEditingMed(null);
    setIsModalOpen(true);
  };

  const handleEdit = (med: Medication) => {
    setEditingMed(med);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Estás seguro de que deseas eliminar este medicamento?')) {
      deleteMedication(id);
    }
  };

  return (
    <div className="mt-12 mb-24">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-4">
        <div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight uppercase">Mis Medicamentos</h2>
          <p className="text-gray-500 mt-1 font-bold">Gestiona los medicamentos y sus frecuencias.</p>
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 bg-black text-white px-6 py-3 rounded-xl font-bold hover:bg-gray-800 transition-colors shadow-[4px_4px_0px_0px_rgba(200,200,200,1)] hover:shadow-none hover:translate-y-1 hover:translate-x-1 border-2 border-black"
        >
          <Plus className="w-5 h-5" />
          Agregar Nuevo
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-12 h-12 text-gray-400 animate-spin" />
        </div>
      ) : medications.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-[2rem] border-4 border-dashed border-gray-900/20">
          <Pill className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-2xl font-black text-gray-900">No hay medicamentos</h3>
          <p className="text-gray-500 font-bold mt-2">Comienza agregando tu primera receta.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {medications.map((med) => (
            <div key={med.id} className="bg-white rounded-[2rem] p-6 shadow-sm border-2 border-gray-900 transition-all hover:shadow-[8px_8px_0px_0px_rgba(17,24,39,1)]">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                  <div className="bg-[#FDF6F5] p-3 rounded-xl border-2 border-gray-900">
                    <Pill className="w-6 h-6 text-gray-900" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-gray-900 uppercase">{med.name}</h3>
                    <p className="text-sm font-bold text-gray-500">{med.dose}</p>
                  </div>
                </div>
              </div>
              
              <div className="mb-8">
                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Horarios</h4>
                <div className="space-y-3">
                  {med.schedules?.map((sched, idx) => {
                    const [time, ...rest] = sched.time_slot.split(' (');
                    return (
                      <div key={idx} className="flex justify-between items-center text-sm bg-[#FDF6F5] border-2 border-gray-900 px-3 py-2 rounded-xl">
                        <span className="font-black text-gray-900">{time}</span>
                        <span className="text-gray-600 font-bold text-xs uppercase">
                          {sched.frequency === 'diario' ? 'Diario' : 
                           sched.frequency === 'dia_por_medio' ? 'Día por medio' : 'Días específicos'}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="flex gap-3 pt-6 border-t-2 border-gray-900 border-dashed">
                <button
                  onClick={() => handleEdit(med)}
                  className="flex-1 flex justify-center items-center gap-2 py-3 text-sm font-black text-gray-900 bg-white border-2 border-gray-900 rounded-xl hover:bg-gray-100 transition-colors shadow-[2px_2px_0px_0px_rgba(17,24,39,1)] hover:shadow-none hover:translate-y-0.5 hover:translate-x-0.5"
                >
                  <Edit2 className="w-4 h-4" />
                  Editar
                </button>
                <button
                  onClick={() => med.id && handleDelete(med.id)}
                  className="flex-1 flex justify-center items-center gap-2 py-3 text-sm font-black text-red-600 bg-white border-2 border-red-600 rounded-xl hover:bg-red-50 transition-colors shadow-[2px_2px_0px_0px_rgba(220,38,38,1)] hover:shadow-none hover:translate-y-0.5 hover:translate-x-0.5"
                >
                  <Trash2 className="w-4 h-4" />
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <MedicationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        medication={editingMed}
      />
    </div>
  );
}
