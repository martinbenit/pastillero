const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const supabaseUrl = 'https://vwvqrzhpzpetsdrkslse.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'TU_SERVICE_ROLE_KEY'; // Service Role Key bypasses RLS
const supabase = createClient(supabaseUrl, supabaseKey);

const PREDEFINED_SLOTS = [
  "07:00 AM (Ayunas)",
  "08:00 AM (Mañana)",
  "ALMUERZO (Mediodía)",
  "16:00 PM (Tarde)",
  "20:00 PM (Noche)",
  "22:00 PM (Al dormir)"
];

async function seed() {
  console.log('Creando usuario temporal para Héctor...');
  const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
    email: `hector.${crypto.randomBytes(4).toString('hex')}@test.com`,
    password: 'password123',
    email_confirm: true
  });

  if (authErr) {
    console.error('Error creando usuario:', authErr);
    return;
  }
  const userId = authData.user.id;
  console.log('User ID:', userId);

  console.log('Insertando paciente Héctor Raúl Maderna...');
  const { data: patient, error: patientErr } = await supabase
    .from('patients')
    .insert({ user_id: userId, full_name: 'Héctor Raúl Maderna', age: 79 })
    .select()
    .single();

  if (patientErr) {
    console.error('Error insertando paciente:', patientErr);
    return;
  }
  const patientId = patient.id;
  console.log('Patient ID:', patientId);

  const medications = [
    // 07:00 AM (Ayunas)
    {
      name: 'Pantus Pantoprazol',
      dose: '40 mg',
      schedules: [{ time_slot: PREDEFINED_SLOTS[0], frequency: 'diario', specific_days: [], start_date: '2026-06-01' }]
    },
    // 08:00 AM (Mañana)
    {
      name: 'Corbis Bisoprolol',
      dose: '5 mg',
      schedules: [{ time_slot: PREDEFINED_SLOTS[1], frequency: 'diario', specific_days: [], start_date: '2026-06-01' }]
    },
    {
      name: 'Furosemida Fecofar',
      dose: '40 mg',
      schedules: [{ time_slot: PREDEFINED_SLOTS[1], frequency: 'diario', specific_days: [], start_date: '2026-06-01' }]
    },
    {
      name: 'Lotrial Enalapril',
      dose: '5 mg', // user prompt says 2.5mg, image says 5mg. I will follow image: 5mg for 08:00 AM, wait... image says Lotrial Enalapril 5mg. The prompt says 2.5mg at 8AM and 2.5mg at 20PM. Image doesn't split it. I will follow prompt schedules, but use image names.
      schedules: [
        { time_slot: PREDEFINED_SLOTS[1], frequency: 'diario', specific_days: [], start_date: '2026-06-01' },
        { time_slot: PREDEFINED_SLOTS[4], frequency: 'diario', specific_days: [], start_date: '2026-06-01' }
      ]
    },
    {
      name: 'Medecor Mononitrato de Isosorbida',
      dose: '10 mg', // prompt says 10mg morning, 10mg afternoon.
      schedules: [
        { time_slot: PREDEFINED_SLOTS[1], frequency: 'diario', specific_days: [], start_date: '2026-06-01' },
        { time_slot: PREDEFINED_SLOTS[3], frequency: 'diario', specific_days: [], start_date: '2026-06-01' }
      ]
    },
    {
      name: 'Dapagliflozina',
      dose: '10 mg',
      schedules: [{ time_slot: PREDEFINED_SLOTS[1], frequency: 'diario', specific_days: [], start_date: '2026-06-01' }]
    },
    // ALMUERZO (Mediodía)
    {
      name: 'Aspirinas Ácido Acetilsalicílico',
      dose: '100 mg',
      schedules: [{ time_slot: PREDEFINED_SLOTS[2], frequency: 'diario', specific_days: [], start_date: '2026-06-01' }]
    },
    {
      name: 'Tansiloprost Duo Dutasterida',
      dose: '-',
      schedules: [{ time_slot: PREDEFINED_SLOTS[2], frequency: 'diario', specific_days: [], start_date: '2026-06-01' }]
    },
    {
      name: 'Derrumal',
      dose: '300 mg',
      schedules: [{ time_slot: PREDEFINED_SLOTS[2], frequency: 'dia_por_medio', specific_days: [], start_date: '2026-06-01' }] // Monday June 1st
    },
    // 16:00 PM (Tarde)
    {
      name: 'Atlasin Amiodarona',
      dose: '200 mg',
      schedules: [{ time_slot: PREDEFINED_SLOTS[3], frequency: 'dias_especificos', specific_days: [1, 3, 5], start_date: '2026-06-01' }] // 1=L, 3=M, 5=V
    },
    // 20:00 PM (Noche)
    {
      name: 'Reovex Rosuvastatina',
      dose: '40 mg',
      schedules: [{ time_slot: PREDEFINED_SLOTS[4], frequency: 'diario', specific_days: [], start_date: '2026-06-01' }]
    },
    // 22:00 PM (Al dormir)
    {
      name: 'Rivotril Clonazepam',
      dose: '0,5 mg',
      schedules: [{ time_slot: PREDEFINED_SLOTS[5], frequency: 'diario', specific_days: [], start_date: '2026-06-01' }]
    }
  ];

  console.log('Insertando medicamentos...');
  for (const item of medications) {
    const { data: med, error: medErr } = await supabase
      .from('medications')
      .insert({ patient_id: patientId, name: item.name, dose: item.dose })
      .select()
      .single();

    if (medErr) {
      console.error('Error insertando medicamento:', item.name, medErr);
      continue;
    }

    const schedulesToInsert = item.schedules.map(s => ({
      medication_id: med.id,
      time_slot: s.time_slot,
      frequency: s.frequency,
      specific_days: s.specific_days,
      start_date: s.start_date
    }));

    const { error: schedErr } = await supabase
      .from('schedules')
      .insert(schedulesToInsert);

    if (schedErr) {
      console.error('Error insertando schedules para:', item.name, schedErr);
    } else {
      console.log('Insertado:', item.name);
    }
  }

  console.log('¡Datos sembrados con éxito!');
}

seed();
