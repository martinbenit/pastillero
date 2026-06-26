const postgres = require('postgres');
const crypto = require('crypto');

const connectionString = 'postgresql://postgres:GjESmkGBZP4h8DkL@db.vwvqrzhpzpetsdrkslse.supabase.co:5432/postgres';
const sql = postgres(connectionString, { ssl: 'require' });

const PREDEFINED_SLOTS = [
  "07:00 AM (Ayunas)",
  "08:00 AM (Mañana)",
  "ALMUERZO (Mediodía)",
  "16:00 PM (Tarde)",
  "20:00 PM (Noche)",
  "22:00 PM (Al dormir)"
];

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
    dose: '2,5 mg',
    schedules: [
      { time_slot: PREDEFINED_SLOTS[1], frequency: 'diario', specific_days: [], start_date: '2026-06-01' },
      { time_slot: PREDEFINED_SLOTS[4], frequency: 'diario', specific_days: [], start_date: '2026-06-01' }
    ]
  },
  {
    name: 'Medecor Mononitrato de Isosorbida',
    dose: '10 mg',
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
    schedules: [{ time_slot: PREDEFINED_SLOTS[2], frequency: 'dia_por_medio', specific_days: [], start_date: '2026-06-01' }]
  },
  // 16:00 PM (Tarde)
  {
    name: 'Atlasin Amiodarona',
    dose: '200 mg',
    schedules: [{ time_slot: PREDEFINED_SLOTS[3], frequency: 'dias_especificos', specific_days: [1, 3, 5], start_date: '2026-06-01' }]
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

async function seed() {
  try {
    console.log('Buscando usuario hector...');
    const users = await sql`SELECT id FROM auth.users WHERE email = 'hector.6e205759@test.com'`;
    if (users.length === 0) {
      console.error('El usuario no existe. Asegúrate de que alguien haya iniciado sesión al menos una vez o crea el usuario en supabase auth.');
      return;
    }
    const userId = users[0].id;
    console.log('User ID:', userId);

    console.log('Limpiando datos viejos...');
    await sql`DELETE FROM public.patients WHERE user_id = ${userId}`;

    console.log('Insertando paciente Héctor Raúl Maderna...');
    const patients = await sql`
      INSERT INTO public.patients (user_id, full_name, age)
      VALUES (${userId}, 'Héctor Raúl Maderna', 79)
      RETURNING id
    `;
    const patientId = patients[0].id;
    console.log('Patient ID:', patientId);

    console.log('Insertando medicamentos...');
    for (const item of medications) {
      const insertedMeds = await sql`
        INSERT INTO public.medications (patient_id, name, dose)
        VALUES (${patientId}, ${item.name}, ${item.dose})
        RETURNING id
      `;
      const medId = insertedMeds[0].id;

      for (const s of item.schedules) {
        await sql`
          INSERT INTO public.schedules (medication_id, time_slot, frequency, specific_days, start_date)
          VALUES (${medId}, ${s.time_slot}, ${s.frequency}, ${s.specific_days || []}, ${s.start_date})
        `;
      }
      console.log('Insertado:', item.name);
    }
    console.log('¡Datos sembrados con éxito usando postgres directamente!');
  } catch (error) {
    console.error('Error seeding data:', error);
  } finally {
    await sql.end();
  }
}

seed();
