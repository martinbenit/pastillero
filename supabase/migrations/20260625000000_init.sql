-- Schema for Medication Management Application

-- 1. Patients Table
CREATE TABLE public.patients (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    age INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for patients
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own patients"
    ON public.patients FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own patients"
    ON public.patients FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own patients"
    ON public.patients FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own patients"
    ON public.patients FOR DELETE
    USING (auth.uid() = user_id);

-- 2. Medications Table
CREATE TABLE public.medications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    dose TEXT NOT NULL,
    instructions TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for medications
ALTER TABLE public.medications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view medications for their patients"
    ON public.medications FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.patients
            WHERE patients.id = medications.patient_id AND patients.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert medications for their patients"
    ON public.medications FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.patients
            WHERE patients.id = medications.patient_id AND patients.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update medications for their patients"
    ON public.medications FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.patients
            WHERE patients.id = medications.patient_id AND patients.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.patients
            WHERE patients.id = medications.patient_id AND patients.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete medications for their patients"
    ON public.medications FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.patients
            WHERE patients.id = medications.patient_id AND patients.user_id = auth.uid()
        )
    );

-- 3. Schedules Table
-- Custom type for frequency
CREATE TYPE frequency_type AS ENUM ('diario', 'dias_especificos', 'dia_por_medio');

CREATE TABLE public.schedules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    medication_id UUID NOT NULL REFERENCES public.medications(id) ON DELETE CASCADE,
    time_slot TEXT NOT NULL, -- e.g. '08:00', '12:00', '20:00', or 'Desayuno', 'Almuerzo'
    frequency frequency_type NOT NULL DEFAULT 'diario',
    specific_days INTEGER[] DEFAULT '{}', -- e.g. [1, 3, 5] for Monday, Wednesday, Friday
    start_date DATE DEFAULT CURRENT_DATE, -- useful for calculating 'dia_por_medio'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for schedules
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view schedules of their medications"
    ON public.schedules FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.medications
            JOIN public.patients ON medications.patient_id = patients.id
            WHERE medications.id = schedules.medication_id AND patients.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert schedules for their medications"
    ON public.schedules FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.medications
            JOIN public.patients ON medications.patient_id = patients.id
            WHERE medications.id = schedules.medication_id AND patients.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update schedules for their medications"
    ON public.schedules FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.medications
            JOIN public.patients ON medications.patient_id = patients.id
            WHERE medications.id = schedules.medication_id AND patients.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.medications
            JOIN public.patients ON medications.patient_id = patients.id
            WHERE medications.id = schedules.medication_id AND patients.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete schedules for their medications"
    ON public.schedules FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.medications
            JOIN public.patients ON medications.patient_id = patients.id
            WHERE medications.id = schedules.medication_id AND patients.user_id = auth.uid()
        )
    );

-- Create a view for easy querying from the frontend to avoid complex joins on every request
CREATE VIEW public.medication_details AS
    SELECT 
        m.id as medication_id,
        m.patient_id,
        m.name as medication_name,
        m.dose,
        m.instructions,
        s.id as schedule_id,
        s.time_slot,
        s.frequency,
        s.specific_days,
        s.start_date,
        p.user_id
    FROM public.medications m
    LEFT JOIN public.schedules s ON m.id = s.medication_id
    JOIN public.patients p ON m.patient_id = p.id;

-- Wait, creating a view requires granting permissions if not using service role, but since users query tables, 
-- it's fine. Actually, it's safer to query tables directly with Supabase JS client. I'll drop the view idea to keep RLS clean.
