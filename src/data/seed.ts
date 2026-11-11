import type {
  Patient, Doctor, Appointment, PaymentTxn, RefundRequest, Investigation, MedicineOrder,
  ConsultationRecord, DietOrder, DietSelfRequest, Feedback, ServiceRequest, Complaint,
  NotificationItem, AuditEvent, StaffUser, Announcement, ChiefComplaint,
  ServiceMasterEntry, DepartmentMappingEntry, SLAMasterEntry, NotificationMasterEntry,
  IPVisit, VitalsReading, IPBill, CorrectionRequest, AccessGrant, CampRegistration,
  PayerMasterEntry, TariffMasterEntry, FeedbackMasterEntry, ComplaintCategoryMasterEntry,
} from './types';

export const APP_NAME = 'Tether';
export const HOSPITAL_NAME = 'Geetanjali Medical College & Hospital';
export const HOSPITAL_SHORT = 'GMCH';
export const HOSPITAL_CITY = 'Udaipur, Rajasthan';

export const seedPatients: Patient[] = [
  { uhid: 'GMCH-UD-204817', name: 'Deepak Chouhan', mobile: '9414023871', dob: '1985-08-15', gender: 'Male', address: 'Sector 4, Hiran Magri, Udaipur', patientType: 'OPD', payer: 'Cash', payerVerified: true },
  { uhid: 'GMCH-UD-204818', name: 'Kavita Chouhan', mobile: '9414023872', dob: '1988-03-22', gender: 'Female', address: 'Sector 4, Hiran Magri, Udaipur', patientType: 'IPD', payer: 'RGHS', payerVerified: true, familyHeadUhid: 'GMCH-UD-204817', relation: 'Wife', ward: 'General Medicine Ward B', bed: 'B-214' },
  { uhid: 'GMCH-UD-204819', name: 'Aarav Chouhan', mobile: '9414023873', dob: '2012-01-10', gender: 'Male', address: 'Sector 4, Hiran Magri, Udaipur', patientType: 'OPD', payer: 'Cash', payerVerified: true, familyHeadUhid: 'GMCH-UD-204817', relation: 'Son' },
  { uhid: 'GMCH-UD-205344', name: 'Sunita Rathore', mobile: '9829456712', dob: '1972-11-04', gender: 'Female', address: 'Fatehpura, Udaipur', patientType: 'IPD', payer: 'TPA', payerVerified: false, ward: 'Orthopedics Ward', bed: 'O-108' },
  { uhid: 'GMCH-UD-205512', name: 'Amit Verma', mobile: '9823456789', dob: '1990-06-18', gender: 'Male', address: 'Bhuwana, Udaipur', patientType: 'OPD', payer: 'Cash', payerVerified: true },
  // Minor nearing 18 — demonstrates the age-18 guardian-access auto-expiry concept (BRD D6/FR-M2-05); expires within 30 days of the app's "today" (2026-09-07).
  { uhid: 'GMCH-UD-205618', name: 'Ishaan Verma', mobile: '9823456789', dob: '2008-09-25', gender: 'Male', address: 'Bhuwana, Udaipur', patientType: 'OPD', payer: 'Cash', payerVerified: true, familyHeadUhid: 'GMCH-UD-205512', relation: 'Son' },
];

export const seedDoctors: Doctor[] = [
  { id: 'DOC-01', name: 'Dr. Ananya Mehta', department: 'Cardiology', unit: 'Unit 1', fee: 800, opdDays: ['Mon', 'Wed', 'Fri'], timing: '09:00 AM – 01:00 PM', slotDurationMin: 15, slotCapacity: 16, leaveDates: ['2026-09-09'], ratingAvg: 4.8, ratingCount: 214 },
  { id: 'DOC-02', name: 'Dr. Rajiv Kapoor', department: 'Orthopedics', unit: 'Unit 2', fee: 700, opdDays: ['Tue', 'Thu', 'Sat'], timing: '10:00 AM – 02:00 PM', slotDurationMin: 15, slotCapacity: 16, leaveDates: [], ratingAvg: 4.5, ratingCount: 132 },
  { id: 'DOC-03', name: 'Dr. Priya Nair', department: 'General Medicine', unit: 'Unit 1', fee: 500, opdDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], timing: '09:00 AM – 12:00 PM', slotDurationMin: 10, slotCapacity: 18, leaveDates: [], ratingAvg: 4.9, ratingCount: 356 },
  { id: 'DOC-04', name: 'Dr. Arjun Malhotra', department: 'Pediatrics', unit: 'Unit 1', fee: 600, opdDays: ['Mon', 'Wed', 'Thu', 'Sat'], timing: '11:00 AM – 02:00 PM', slotDurationMin: 15, slotCapacity: 12, leaveDates: [], ratingAvg: 4.7, ratingCount: 189 },
  { id: 'DOC-05', name: 'Dr. Meenal Joshi', department: 'Gynaecology', unit: 'Unit 1', fee: 650, opdDays: ['Mon', 'Tue', 'Thu', 'Fri'], timing: '10:00 AM – 01:00 PM', slotDurationMin: 15, slotCapacity: 12, leaveDates: [], ratingAvg: 4.6, ratingCount: 141 },
  { id: 'DOC-06', name: 'Dr. Sandeep Rao', department: 'Dermatology', unit: 'Unit 1', fee: 550, opdDays: ['Wed', 'Fri', 'Sat'], timing: '02:00 PM – 05:00 PM', slotDurationMin: 10, slotCapacity: 18, leaveDates: [], ratingAvg: 4.4, ratingCount: 98 },
  { id: 'DOC-07', name: 'Dr. Vivek Choudhary', department: 'General Surgery', unit: 'Unit 2', fee: 750, opdDays: ['Tue', 'Thu', 'Sat'], timing: '09:00 AM – 12:00 PM', slotDurationMin: 15, slotCapacity: 12, leaveDates: ['2026-09-10'], ratingAvg: 4.7, ratingCount: 167 },
  { id: 'DOC-08', name: 'Dr. Nisha Agarwal', department: 'ENT', unit: 'Unit 1', fee: 550, opdDays: ['Mon', 'Wed', 'Fri'], timing: '03:00 PM – 06:00 PM', slotDurationMin: 10, slotCapacity: 18, leaveDates: [], ratingAvg: 4.5, ratingCount: 121 },
];

// Feature 3 (Differentiators) — Symptom → Department routing wizard. Purely a navigational aid
// ("which department should I book with"), never a diagnosis — every screen using this shows a
// visible disclaimer to that effect.
export const SYMPTOM_DEPARTMENT_MAP: { symptom: string; departments: string[] }[] = [
  { symptom: 'Fever / body ache', departments: ['General Medicine'] },
  { symptom: 'Cough, cold or breathing difficulty', departments: ['General Medicine'] },
  { symptom: 'Chest pain / palpitations', departments: ['Cardiology'] },
  { symptom: 'High blood pressure follow-up', departments: ['Cardiology', 'General Medicine'] },
  { symptom: 'Joint, bone or back pain', departments: ['Orthopedics'] },
  { symptom: 'Fracture or sports injury', departments: ['Orthopedics'] },
  { symptom: 'Skin rash, acne or hair fall', departments: ['Dermatology'] },
  { symptom: 'Child illness or vaccination', departments: ['Pediatrics'] },
  { symptom: 'Pregnancy or women\'s health', departments: ['Gynaecology'] },
  { symptom: 'Ear, nose or throat issue', departments: ['ENT'] },
  { symptom: 'Diabetes / blood sugar concern', departments: ['General Medicine'] },
  { symptom: 'Needs surgery / surgical opinion', departments: ['General Surgery'] },
  { symptom: 'Not sure / general check-up', departments: ['General Medicine'] },
];

// Deterministic booked-slot map keyed doctorId|date -> array of booked "HH:MM AM/PM"
export const bookedSlotSeed: Record<string, string[]> = {
  'DOC-03|2026-09-07': ['09:00 AM', '09:10 AM', '09:20 AM', '09:30 AM', '09:40 AM'],
};

export const seedAppointments: Appointment[] = [
  {
    id: 'APT-2026-00821', patientUhid: 'GMCH-UD-204817', doctorId: 'DOC-03', date: '2026-09-07', time: '10:30 AM',
    payer: 'Cash', onlinePaid: 500, finalTariff: 500, paymentOption: 'Pay Now', status: 'Token Generated', token: 'G-042', createdAt: '2026-09-07T04:10:00Z', rescheduleCount: 0,
  },
  {
    id: 'APT-2026-00822', patientUhid: 'GMCH-UD-204819', doctorId: 'DOC-04', date: '2026-09-09', time: '11:15 AM',
    payer: 'Cash', onlinePaid: 0, finalTariff: null, paymentOption: 'Pay Later', status: 'Payment Pending', token: null, createdAt: '2026-09-06T09:00:00Z', rescheduleCount: 0,
  },
  {
    id: 'APT-2026-00815', patientUhid: 'GMCH-UD-204817', doctorId: 'DOC-01', date: '2026-08-28', time: '09:15 AM',
    payer: 'Cash', onlinePaid: 800, finalTariff: 800, paymentOption: 'Pay Now', status: 'Consultation Completed', token: 'C-018', createdAt: '2026-08-28T03:30:00Z', rescheduleCount: 0,
  },
  // Earlier tokens for the same doctor/date as APT-2026-00821, seeded so the live-queue widget has a
  // plausible "current token" to derive from (see getQueueEstimate in store.tsx).
  {
    id: 'APT-2026-00816', patientUhid: 'GMCH-UD-205512', doctorId: 'DOC-03', date: '2026-09-07', time: '09:00 AM',
    payer: 'Cash', onlinePaid: 500, finalTariff: 500, paymentOption: 'Pay Now', status: 'Consultation Completed', token: 'G-038', createdAt: '2026-09-07T03:00:00Z', rescheduleCount: 0,
  },
  {
    id: 'APT-2026-00817', patientUhid: 'GMCH-UD-205344', doctorId: 'DOC-03', date: '2026-09-07', time: '10:00 AM',
    payer: 'TPA', onlinePaid: 500, finalTariff: 500, paymentOption: 'Pay Now', status: 'Consultation Started', token: 'G-040', createdAt: '2026-09-07T03:30:00Z', rescheduleCount: 0,
  },
];

export const seedPayments: PaymentTxn[] = [
  { id: 'TXN-88231', appointmentId: 'APT-2026-00821', patientUhid: 'GMCH-UD-204817', amount: 500, originalTariff: 500, finalTariff: 500, payer: 'Cash', method: 'UPI', status: 'Success', timestamp: '2026-09-07T04:10:00Z', reference: 'UPI/2026090704102281', purpose: 'OPD Consultation' },
  { id: 'TXN-88175', appointmentId: 'APT-2026-00815', patientUhid: 'GMCH-UD-204817', amount: 800, originalTariff: 800, finalTariff: 800, payer: 'Cash', method: 'Card', status: 'Success', timestamp: '2026-08-28T03:30:00Z', reference: 'CARD/889213', purpose: 'OPD Consultation' },
];

export const seedRefunds: RefundRequest[] = [];

export const seedInvestigations: Investigation[] = [
  { id: 'INV-4471', patientUhid: 'GMCH-UD-204817', name: 'CBC (Complete Blood Count)', orderedBy: 'Dr. Priya Nair', orderedAt: '2026-08-28T03:35:00Z', charge: 350, status: 'Report Available', reportUrl: '#', resultSummary: 'Hemoglobin 13.2 g/dL, WBC 7,200/µL, Platelets 2.4L/µL — within normal range.' },
  { id: 'INV-4472', patientUhid: 'GMCH-UD-204817', name: 'Lipid Profile', orderedBy: 'Dr. Priya Nair', orderedAt: '2026-08-28T03:35:00Z', charge: 450, status: 'Pending Payment' },
  { id: 'INV-4499', patientUhid: 'GMCH-UD-204818', name: 'Chest X-Ray', orderedBy: 'Dr. Ananya Mehta', orderedAt: '2026-09-06T06:00:00Z', charge: 600, status: 'Completed', reportUrl: '#', resultSummary: 'No acute cardiopulmonary abnormality. Lung fields clear, cardiac silhouette normal size.' },
  { id: 'INV-4512', patientUhid: 'GMCH-UD-204817', name: 'Blood Sugar (Fasting)', orderedBy: 'Dr. Priya Nair', orderedAt: '2026-08-20T04:00:00Z', charge: 150, status: 'Report Available', reportUrl: '#', resultSummary: 'Fasting Blood Glucose: 94 mg/dL — within normal range.' },
  { id: 'INV-4520', patientUhid: 'GMCH-UD-204818', name: 'HbA1c', orderedBy: 'Dr. Priya Nair', orderedAt: '2026-09-03T05:00:00Z', charge: 500, status: 'Report Available', reportUrl: '#', resultSummary: 'HbA1c: 6.8% — fair glycemic control; continue Diabetic Diet and follow up in 4 weeks.' },
  // Additional HbA1c readings for Kavita Chouhan (Type 2 Diabetes Mellitus) so the Reports tab has a
  // repeating numeric investigation to trend, alongside INV-4520 above — see Records.tsx Reports tab.
  { id: 'INV-4460', patientUhid: 'GMCH-UD-204818', name: 'HbA1c', orderedBy: 'Dr. Priya Nair', orderedAt: '2026-06-15T05:00:00Z', charge: 500, status: 'Report Available', reportUrl: '#', resultSummary: 'HbA1c: 9.2% — poor glycemic control; medication and diet counselling advised.' },
  { id: 'INV-4490', patientUhid: 'GMCH-UD-204818', name: 'HbA1c', orderedBy: 'Dr. Priya Nair', orderedAt: '2026-07-20T05:00:00Z', charge: 500, status: 'Report Available', reportUrl: '#', resultSummary: 'HbA1c: 8.1% — improving; continue current Metformin/Glimepiride regimen and Diabetic Diet.' },
];

export const seedMedicines: MedicineOrder[] = [
  { id: 'MED-9012', patientUhid: 'GMCH-UD-204817', medicine: 'Paracetamol 500mg', qty: 10, unitPrice: 2, prescribedBy: 'Dr. Priya Nair', status: 'Paid' },
  { id: 'MED-9013', patientUhid: 'GMCH-UD-204817', medicine: 'Pantoprazole 40mg', qty: 10, unitPrice: 6, prescribedBy: 'Dr. Priya Nair', status: 'Pending Payment' },
  { id: 'MED-9020', patientUhid: 'GMCH-UD-204817', medicine: 'Amoxicillin 500mg', qty: 15, unitPrice: 8, prescribedBy: 'Dr. Ananya Mehta', status: 'Dispensed' },
  { id: 'MED-9021', patientUhid: 'GMCH-UD-204817', medicine: 'Cetirizine 10mg', qty: 10, unitPrice: 1, prescribedBy: 'Dr. Priya Nair', status: 'Dispensed' },
];

export const seedConsultations: ConsultationRecord[] = [
  { id: 'CON-3301', patientUhid: 'GMCH-UD-204817', doctorId: 'DOC-03', date: '2026-08-28', diagnosis: 'Viral fever with mild dehydration', prescription: ['Paracetamol 500mg', 'Pantoprazole 40mg'], advice: 'Adequate fluids and rest; review if fever persists beyond 3 days.', followUpDate: '2026-09-07' },
  { id: 'CON-3287', patientUhid: 'GMCH-UD-204817', doctorId: 'DOC-01', date: '2026-08-15', diagnosis: 'Essential hypertension, newly diagnosed', prescription: ['Amlodipine 5mg', 'Aspirin 75mg'], advice: 'Low-salt diet, daily BP monitoring, moderate exercise.', followUpDate: '2026-09-15' },
  { id: 'CON-3245', patientUhid: 'GMCH-UD-204817', doctorId: 'DOC-03', date: '2026-07-10', diagnosis: 'Acute upper respiratory tract infection', prescription: ['Amoxicillin 500mg', 'Cetirizine 10mg'], advice: 'Complete the full course of antibiotics; steam inhalation twice daily.' },
  { id: 'CON-3350', patientUhid: 'GMCH-UD-204818', doctorId: 'DOC-03', date: '2026-09-01', diagnosis: 'Type 2 Diabetes Mellitus — routine review', prescription: ['Metformin 500mg', 'Glimepiride 1mg'], advice: 'Continue Diabetic Diet strictly, avoid sugary and fried foods, walk 30 minutes daily.', followUpDate: '2026-10-01' },
  { id: 'CON-3298', patientUhid: 'GMCH-UD-204817', doctorId: 'DOC-06', date: '2026-08-20', diagnosis: 'Contact dermatitis, left forearm', prescription: ['Cetirizine 10mg', 'Calamine Lotion'], advice: 'Avoid the suspected irritant; apply lotion twice daily.', followUpDate: '2026-09-03' },
];

export const seedIPVisits: IPVisit[] = [
  {
    id: 'IPV-501', ipNo: 'IP-2026-00142', patientUhid: 'GMCH-UD-204818',
    admissionDate: '2026-08-30', dischargeDate: '2026-09-07',
    ward: 'General Medicine Ward B', bed: 'B-214', treatingDoctor: 'Dr. Priya Nair',
    dischargeSummary: 'Admitted on 30 Aug 2026 with fever, dehydration and poorly controlled Type 2 Diabetes Mellitus. During the stay, blood sugar was brought under control with adjusted Metformin and Glimepiride dosing, IV fluids and antipyretics resolved the fever within 48 hours, and blood pressure trended down to normal range with monitoring. Chest X-Ray and HbA1c were unremarkable/satisfactory. At discharge the patient is afebrile, hemodynamically stable and tolerating a normal diabetic diet. Discharge medications: Metformin 500mg twice daily, Glimepiride 1mg once daily before breakfast. Advised to continue Diabetic Diet strictly, monitor blood sugar at home, and follow up with Dr. Priya Nair (General Medicine OPD) in 4 weeks or earlier if fever or giddiness recurs.',
    recoveryChecklist: [
      { id: 'RC-1', label: 'Take Metformin 500mg twice daily with meals' },
      { id: 'RC-2', label: 'Take Glimepiride 1mg once daily before breakfast' },
      { id: 'RC-3', label: 'Monitor blood sugar at home daily' },
      { id: 'RC-4', label: 'Continue Diabetic Diet strictly — avoid sugary and fried foods' },
      { id: 'RC-5', label: 'Follow up with Dr. Priya Nair in 4 weeks (or earlier if fever/giddiness recurs)' },
    ],
  },
  {
    id: 'IPV-502', ipNo: 'IP-2026-00098', patientUhid: 'GMCH-UD-205344',
    admissionDate: '2026-09-02', dischargeDate: '2026-09-06',
    ward: 'Orthopedics Ward', bed: 'O-108', treatingDoctor: 'Dr. Rajiv Kapoor',
    dischargeSummary: 'Admitted on 2 Sep 2026 following a fall at home resulting in a closed fracture of the right distal radius. Underwent closed reduction and internal fixation under regional anaesthesia on the day of admission; the post-operative course was uneventful with good pain control and no signs of infection. Physiotherapy was initiated on the second post-operative day and the patient was mobilised independently before discharge. At discharge the surgical site is clean and dry with the limb immobilised in a cast. Discharge medications: Paracetamol 650mg for pain as needed, Calcium & Vitamin D3 supplement once daily. Advised cast care and to keep the limb elevated, avoid weight-bearing on the affected wrist, and follow up in the Orthopedics OPD with Dr. Rajiv Kapoor after 2 weeks for suture/wound review and repeat X-ray.',
    recoveryChecklist: [
      { id: 'RC-6', label: 'Take Paracetamol 650mg for pain as needed' },
      { id: 'RC-7', label: 'Take Calcium & Vitamin D3 supplement once daily' },
      { id: 'RC-8', label: 'Keep the cast dry and clean' },
      { id: 'RC-9', label: 'Avoid weight-bearing on the affected wrist; keep limb elevated' },
      { id: 'RC-10', label: 'Follow up with Dr. Rajiv Kapoor after 2 weeks for wound review and repeat X-ray' },
    ],
  },
  // Sunita Rathore's second admission — deliberately left "active" (discharge date in the future) to
  // demonstrate the Smart Appointment Engine's hard block on booking OPD visits during an active admission.
  {
    id: 'IPV-503', ipNo: 'IP-2026-00151', patientUhid: 'GMCH-UD-205344',
    admissionDate: '2026-09-07', dischargeDate: '2026-09-15',
    ward: 'Orthopedics Ward', bed: 'O-112', treatingDoctor: 'Dr. Rajiv Kapoor',
    dischargeSummary: '',
  },
];

export const seedVitals: VitalsReading[] = [
  // Deepak Chouhan (OPD) — one reading per OPD visit, spanning seeded consultation dates
  { id: 'VIT-101', patientUhid: 'GMCH-UD-204817', recordedAt: '2026-06-15T04:30:00Z', recordedBy: 'Nurse Meera Bhatt', context: 'OPD Visit — Dr. Priya Nair', bloodPressureSystolic: 124, bloodPressureDiastolic: 80, heartRateBpm: 82, temperatureF: 98.6 },
  { id: 'VIT-102', patientUhid: 'GMCH-UD-204817', recordedAt: '2026-07-10T04:15:00Z', recordedBy: 'Nurse Meera Bhatt', context: 'OPD Visit — Dr. Priya Nair', bloodPressureSystolic: 128, bloodPressureDiastolic: 82, heartRateBpm: 88, temperatureF: 99.8 },
  { id: 'VIT-103', patientUhid: 'GMCH-UD-204817', recordedAt: '2026-08-15T03:50:00Z', recordedBy: 'Nurse Kalpana Rathi', context: 'OPD Visit — Dr. Ananya Mehta', bloodPressureSystolic: 152, bloodPressureDiastolic: 96, heartRateBpm: 92, temperatureF: 98.6, weightKg: 78.4 },
  { id: 'VIT-104', patientUhid: 'GMCH-UD-204817', recordedAt: '2026-08-20T04:00:00Z', recordedBy: 'Nurse Meera Bhatt', context: 'OPD Visit — Dr. Priya Nair', bloodPressureSystolic: 134, bloodPressureDiastolic: 88, heartRateBpm: 84, temperatureF: 98.4, randomBloodSugarMgDl: 94 },
  { id: 'VIT-105', patientUhid: 'GMCH-UD-204817', recordedAt: '2026-08-28T03:35:00Z', recordedBy: 'Nurse Meera Bhatt', context: 'OPD Visit — Dr. Priya Nair', bloodPressureSystolic: 138, bloodPressureDiastolic: 88, heartRateBpm: 96, temperatureF: 100.4 },
  { id: 'VIT-106', patientUhid: 'GMCH-UD-204817', recordedAt: '2026-09-07T04:05:00Z', recordedBy: 'Nurse Meera Bhatt', context: 'OPD Visit — Dr. Priya Nair', bloodPressureSystolic: 128, bloodPressureDiastolic: 84, heartRateBpm: 78, temperatureF: 98.4, spo2Percent: 98, weightKg: 77.6 },

  // Kavita Chouhan (IPD) — multiple readings per day across her admission
  { id: 'VIT-201', patientUhid: 'GMCH-UD-204818', recordedAt: '2026-08-30T02:30:00Z', recordedBy: 'Nurse Sunita Meena', context: 'IPD Round — General Medicine Ward B', bloodPressureSystolic: 148, bloodPressureDiastolic: 94, heartRateBpm: 102, temperatureF: 101.2, spo2Percent: 96, randomBloodSugarMgDl: 210, weightKg: 64.5 },
  { id: 'VIT-202', patientUhid: 'GMCH-UD-204818', recordedAt: '2026-08-30T14:30:00Z', recordedBy: 'Nurse Sunita Meena', context: 'IPD Round — General Medicine Ward B', bloodPressureSystolic: 144, bloodPressureDiastolic: 92, heartRateBpm: 98, temperatureF: 100.6, spo2Percent: 97, randomBloodSugarMgDl: 190 },
  { id: 'VIT-203', patientUhid: 'GMCH-UD-204818', recordedAt: '2026-09-01T02:30:00Z', recordedBy: 'Dr. Priya Nair', context: 'IPD Round — General Medicine Ward B', bloodPressureSystolic: 138, bloodPressureDiastolic: 88, heartRateBpm: 90, temperatureF: 99.4, spo2Percent: 97, randomBloodSugarMgDl: 172 },
  { id: 'VIT-204', patientUhid: 'GMCH-UD-204818', recordedAt: '2026-09-01T14:30:00Z', recordedBy: 'Nurse Sunita Meena', context: 'IPD Round — General Medicine Ward B', bloodPressureSystolic: 134, bloodPressureDiastolic: 86, heartRateBpm: 86, temperatureF: 98.8, spo2Percent: 98, randomBloodSugarMgDl: 160 },
  { id: 'VIT-205', patientUhid: 'GMCH-UD-204818', recordedAt: '2026-09-04T03:30:00Z', recordedBy: 'Nurse Sunita Meena', context: 'IPD Round — General Medicine Ward B', bloodPressureSystolic: 128, bloodPressureDiastolic: 82, heartRateBpm: 80, temperatureF: 98.6, spo2Percent: 98, randomBloodSugarMgDl: 140, weightKg: 63.8 },
  { id: 'VIT-206', patientUhid: 'GMCH-UD-204818', recordedAt: '2026-09-06T03:30:00Z', recordedBy: 'Dr. Priya Nair', context: 'IPD Round — General Medicine Ward B', bloodPressureSystolic: 122, bloodPressureDiastolic: 80, heartRateBpm: 76, temperatureF: 98.4, spo2Percent: 99, randomBloodSugarMgDl: 128 },
  { id: 'VIT-207', patientUhid: 'GMCH-UD-204818', recordedAt: '2026-09-07T02:00:00Z', recordedBy: 'Nurse Sunita Meena', context: 'IPD Round — General Medicine Ward B (Discharge)', bloodPressureSystolic: 118, bloodPressureDiastolic: 78, heartRateBpm: 74, temperatureF: 98.2, spo2Percent: 99, randomBloodSugarMgDl: 118, weightKg: 63.2 },
];

export const seedIPBills: IPBill[] = [
  {
    id: 'IPB-701', ipNo: 'IP-2026-00142', patientUhid: 'GMCH-UD-204818',
    lineItems: [
      { label: 'Room Charges (General Ward B, 8 days)', amount: 12000 },
      { label: 'Nursing Charges', amount: 3200 },
      { label: 'Consultant Visit Charges (8 rounds)', amount: 4000 },
      { label: 'IP Pharmacy & Medicines', amount: 5400 },
      { label: 'Investigations (X-Ray, HbA1c)', amount: 1100 },
    ],
    totalAmount: 25700, amountPaid: 18000, balanceDue: 7700, status: 'Partially Paid', lastUpdated: '2026-09-07T02:30:00Z',
  },
  {
    id: 'IPB-702', ipNo: 'IP-2026-00098', patientUhid: 'GMCH-UD-205344',
    lineItems: [
      { label: 'Room Charges (Orthopedics Ward, 5 days)', amount: 9000 },
      { label: 'OT & Surgical Charges', amount: 22000 },
      { label: 'Nursing Charges', amount: 2500 },
      { label: 'Consultant Visit Charges', amount: 3000 },
      { label: 'Pharmacy Charges', amount: 2800 },
    ],
    totalAmount: 39300, amountPaid: 39300, balanceDue: 0, status: 'Settled', lastUpdated: '2026-09-06T09:00:00Z',
  },
];

export const seedDietOrders: DietOrder[] = [
  { id: 'DIET-771', patientUhid: 'GMCH-UD-204818', dietType: 'Diabetic Diet', mealType: 'Lunch', instructions: 'Low sugar, low salt; avoid fried items', effectiveDate: '2026-09-07', prescribedBy: 'Dr. Priya Nair (Dietitian-in-charge)', status: 'Active' },
];

export const TODAYS_MENU: Record<'Breakfast' | 'Lunch' | 'Dinner' | 'Evening Snack', string[]> = {
  Breakfast: ['Idli & Sambhar', 'Poha', 'Bread Omelette (Egg)', 'Vegetable Upma', 'Fruit Bowl', 'Milk/Tea'],
  Lunch: ['Dal, Rice & Roti', 'Mixed Vegetable Curry', 'Curd/Buttermilk', 'Khichdi', 'Salad'],
  Dinner: ['Roti & Dal', 'Vegetable Pulao', 'Clear Soup', 'Curd Rice', 'Salad'],
  'Evening Snack': ['Tea/Coffee', 'Biscuits', 'Fruit', 'Sprouts Salad'],
};

export const seedDietRequests: DietSelfRequest[] = [];

export const seedFeedback: Feedback[] = [
  { id: 'FB-6601', patientUhid: 'GMCH-UD-204818', service: 'Nursing', rating: 5, comment: 'Staff was very helpful.', department: 'Nursing', status: 'Recorded', createdAt: '2026-09-06T10:00:00Z' },
  { id: 'FB-6602', patientUhid: 'GMCH-UD-204818', service: 'Housekeeping', rating: 2, comment: 'Room cleaning was delayed.', department: 'Housekeeping', status: 'Escalated to Service Request', createdAt: '2026-09-06T11:00:00Z' },
];

export const seedServiceRequests: ServiceRequest[] = [
  { id: 'REQ-2026-00121', patientUhid: 'GMCH-UD-204818', category: 'Housekeeping', description: 'Room cleaning required', department: 'Housekeeping', assignedStaff: 'Rajesh Kumar', status: 'In Progress', createdAt: '2026-09-06T09:00:00Z', slaMinutes: 30 },
  { id: 'REQ-2026-00122', patientUhid: 'GMCH-UD-204818', category: 'Wheelchair', description: 'Wheelchair required for patient transfer', department: 'Nursing', assignedStaff: 'Neha Sharma', status: 'Completed', createdAt: '2026-09-05T14:00:00Z', slaMinutes: 15 },
  { id: 'REQ-2026-00123', patientUhid: 'GMCH-UD-205344', category: 'Maintenance (AC)', description: 'Room AC not cooling', department: 'Facilities', assignedStaff: 'Vikram Singh', status: 'SLA Breached', createdAt: '2026-09-05T08:00:00Z', slaMinutes: 60 },
];

export const seedComplaints: Complaint[] = [
  {
    id: 'CMP-2026-00421', patientUhid: 'GMCH-UD-204818', category: 'Waiting Time', description: 'Long wait for nursing round.', department: 'Nursing', level: 'L1', status: 'Resolved', slaMinutes: 30,
    slaDeadline: '2026-09-06T10:30:00Z', responsiblePerson: 'Neha Sharma', response: 'Rounds re-scheduled and ward supervisor briefed.', createdAt: '2026-09-06T10:00:00Z',
    timeline: [{ label: 'Submitted', timestamp: '2026-09-06T10:00:00Z' }, { label: 'Assigned to Neha Sharma (L1)', timestamp: '2026-09-06T10:05:00Z' }, { label: 'Response Provided', timestamp: '2026-09-06T10:25:00Z' }, { label: 'Resolved', timestamp: '2026-09-06T10:26:00Z' }],
  },
  {
    id: 'CMP-2026-00422', patientUhid: 'GMCH-UD-205344', category: 'Housekeeping', description: 'Washroom not cleaned since morning.', department: 'Housekeeping', level: 'L2', status: 'Escalated', slaMinutes: 30,
    slaDeadline: '2026-09-06T09:00:00Z', responsiblePerson: 'Vikram Singh (Dept Head)', createdAt: '2026-09-06T08:00:00Z',
    timeline: [{ label: 'Submitted', timestamp: '2026-09-06T08:00:00Z' }, { label: 'Assigned to Rajesh Kumar (L1)', timestamp: '2026-09-06T08:05:00Z' }, { label: 'SLA Breached at L1', timestamp: '2026-09-06T08:35:00Z', meta: 'auto-escalation' }, { label: 'Escalated to Neha Sharma (L2)', timestamp: '2026-09-06T08:35:00Z' }],
  },
  {
    id: 'CMP-2026-00423', patientUhid: 'GMCH-UD-204817', category: 'Billing', description: 'Discrepancy between online payment and counter tariff.', department: 'Billing', level: 'L1', status: 'SLA Breached', slaMinutes: 60,
    slaDeadline: '2026-09-06T13:00:00Z', responsiblePerson: 'Billing Supervisor', createdAt: '2026-09-06T12:00:00Z',
    timeline: [{ label: 'Submitted', timestamp: '2026-09-06T12:00:00Z' }, { label: 'Assigned to Billing Supervisor (L1)', timestamp: '2026-09-06T12:10:00Z' }, { label: 'SLA Breached at L1', timestamp: '2026-09-06T13:00:00Z' }],
  },
  {
    id: 'CMP-2026-00424', patientUhid: 'GMCH-UD-205344', category: 'Staff Behaviour', description: 'Attendant was rude during ward round.', department: 'Nursing', level: 'L2', status: 'Reopened', slaMinutes: 30,
    slaDeadline: '2026-09-05T17:00:00Z', responsiblePerson: 'Neha Sharma', response: 'Counselled the concerned staff member.', createdAt: '2026-09-05T16:00:00Z',
    timeline: [{ label: 'Submitted', timestamp: '2026-09-05T16:00:00Z' }, { label: 'Response Provided', timestamp: '2026-09-05T16:40:00Z' }, { label: 'Patient: Not Satisfied', timestamp: '2026-09-05T17:10:00Z' }, { label: 'Reopened & Escalated to L2', timestamp: '2026-09-05T17:10:00Z' }],
  },
  {
    id: 'CMP-2026-00425', patientUhid: 'GMCH-UD-204817', category: 'Pharmacy', description: 'Medicine out of stock at counter.', department: 'Pharmacy', level: 'L1', status: 'Closed', slaMinutes: 30,
    slaDeadline: '2026-08-30T12:00:00Z', responsiblePerson: 'Pharmacy Supervisor', response: 'Alternate brand dispensed with doctor confirmation.', createdAt: '2026-08-30T11:00:00Z',
    timeline: [{ label: 'Submitted', timestamp: '2026-08-30T11:00:00Z' }, { label: 'Response Provided', timestamp: '2026-08-30T11:40:00Z' }, { label: 'Patient: Satisfied', timestamp: '2026-08-30T11:50:00Z' }, { label: 'Closed', timestamp: '2026-08-30T11:50:00Z' }],
  },
];

export const seedNotifications: NotificationItem[] = [
  { id: 'N-1', recipient: 'Deepak Chouhan', channel: 'SMS', event: 'Appointment Confirmed — APT-2026-00821', status: 'Delivered', timestamp: '2026-09-07T04:10:05Z' },
  { id: 'N-2', recipient: 'Deepak Chouhan', channel: 'Portal', event: 'Appointment Confirmed — APT-2026-00821', status: 'Delivered', timestamp: '2026-09-07T04:10:05Z' },
  { id: 'N-3', recipient: 'Kavita Chouhan', channel: 'Portal', event: 'Complaint CMP-2026-00422 Escalated to L2', status: 'Delivered', timestamp: '2026-09-06T08:35:05Z' },
  { id: 'N-4', recipient: 'Vikram Singh (Staff)', channel: 'Staff Portal', event: 'Complaint CMP-2026-00422 assigned to you (L2)', status: 'Delivered', timestamp: '2026-09-06T08:35:10Z' },
  { id: 'N-5', recipient: 'Billing Supervisor (Staff)', channel: 'Email', event: 'SLA Breached — CMP-2026-00423', status: 'Delivered', timestamp: '2026-09-06T13:00:10Z' },
];

export const seedAudit: AuditEvent[] = [
  { id: 'AUD-1', timestamp: '2026-09-07T04:05:00Z', user: 'Deepak Chouhan', role: 'Patient', action: 'OTP Verified — Login', reference: 'GMCH-UD-204817' },
  { id: 'AUD-2', timestamp: '2026-09-07T04:10:00Z', user: 'Deepak Chouhan', role: 'Patient', action: 'Payment Success (Pay Now)', previousState: 'Appointment Requested', newState: 'Token Generated', reference: 'APT-2026-00821' },
  { id: 'AUD-3', timestamp: '2026-09-06T08:35:00Z', user: 'System', role: 'System', action: 'SLA Breach Auto-Escalation', previousState: 'L1', newState: 'L2', reference: 'CMP-2026-00422' },
];

// D1 (BRD §5.3/5.4) — tenant self-registration policy. Stored as store state (default preserves existing
// behaviour); this seed constant is only the initial value used to prime the store on load.
export const DEFAULT_SELF_REGISTRATION_MODE: 'HOSPITAL_ONLY' | 'SELF_WITH_DUP_CHECK' = 'SELF_WITH_DUP_CHECK';

export const HOSPITAL_ADDRESS = 'Geetanjali Medical College & Hospital, Geetanjali University Campus, Chitra-Kamalpura Road, Manwakhera, Udaipur, Rajasthan – 313001';
export const HOSPITAL_TIMINGS = 'Registration Counter: Mon–Sat, 8:00 AM – 6:00 PM · Emergency: 24×7';

export const seedCorrectionRequests: CorrectionRequest[] = [];

// M2 — Authorization table (BRD §6). Seeded to match the family already in seedPatients.
export const seedAccessGrants: AccessGrant[] = [
  // Aarav Chouhan (age 14, DOB 2012-01-10) — natural guardian grants, auto-expiring on his 18th birthday.
  { id: 'AG-101', patientUhid: 'GMCH-UD-204819', authorizedUserUhid: 'GMCH-UD-204817', relationship: 'Natural Guardian', basis: 'Natural Guardianship', scope: ['Full'], validFrom: '2012-01-10', validUntil: '2030-01-10', revocable: true, createdAt: '2012-01-10T00:00:00Z', createdBy: 'Registration Staff' },
  { id: 'AG-102', patientUhid: 'GMCH-UD-204819', authorizedUserUhid: 'GMCH-UD-204818', relationship: 'Natural Guardian', basis: 'Natural Guardianship', scope: ['Full'], validFrom: '2012-01-10', validUntil: '2030-01-10', revocable: true, createdAt: '2012-01-10T00:00:00Z', createdBy: 'Registration Staff' },
  // Kavita Chouhan (adult) — husband has consent-based access, revocable any time, no expiry.
  { id: 'AG-103', patientUhid: 'GMCH-UD-204818', authorizedUserUhid: 'GMCH-UD-204817', relationship: 'Spouse', basis: 'Patient Consent', scope: ['Appointments', 'Payments', 'Reports'], validFrom: '2020-05-01', revocable: true, createdAt: '2020-05-01T00:00:00Z', createdBy: 'Kavita Chouhan (Patient Portal)' },
  // Ishaan Verma (age 17, DOB 2008-09-25) — natural guardian grant expiring within 30 days of "today"
  // (2026-09-07), specifically to demonstrate the age-18 expiry-notice banner.
  { id: 'AG-104', patientUhid: 'GMCH-UD-205618', authorizedUserUhid: 'GMCH-UD-205512', relationship: 'Natural Guardian', basis: 'Natural Guardianship', scope: ['Full'], validFrom: '2008-09-25', validUntil: '2026-09-25', revocable: true, createdAt: '2008-09-25T00:00:00Z', createdBy: 'Registration Staff' },
];

export const seedStaff: StaffUser[] = [
  { id: 'STF-01', name: 'Rajesh Kumar', username: 'rajesh.staff', role: 'Staff', department: 'Housekeeping' },
  { id: 'STF-02', name: 'Neha Sharma', username: 'neha.supervisor', role: 'Supervisor', department: 'Housekeeping' },
  { id: 'STF-03', name: 'Vikram Singh', username: 'vikram.depthead', role: 'Department Head', department: 'Facilities' },
  { id: 'STF-04', name: 'Pooja Mehta', username: 'pooja.admin', role: 'Admin', department: 'Administration' },
  { id: 'STF-05', name: 'Sanjay Verma', username: 'sanjay.management', role: 'Management', department: 'Hospital Administration' },
];

export const CHIEF_COMPLAINT_OPTIONS: string[] = [
  'Fever', 'Cough & Cold', 'Headache', 'Abdominal Pain', 'Chest Pain', 'Body Ache',
  'Vomiting/Nausea', 'Dizziness', 'Skin Rash/Allergy', 'Joint Pain', 'Follow-up Visit', 'Other',
];

export const seedChiefComplaints: ChiefComplaint[] = [];

export const seedServiceMaster: ServiceMasterEntry[] = [
  { id: 'SVM-01', serviceName: 'Housekeeping', serviceCategory: 'Housekeeping', applicability: 'Both', active: true, portalVisible: true, feedbackEnabled: true, complaintEnabled: true, requestEnabled: true },
  { id: 'SVM-02', serviceName: 'Ward Nursing Care', serviceCategory: 'Nursing', applicability: 'IPD', active: true, portalVisible: true, feedbackEnabled: true, complaintEnabled: true, requestEnabled: true },
  { id: 'SVM-03', serviceName: 'Billing & Cashier', serviceCategory: 'Billing', applicability: 'Both', active: true, portalVisible: true, feedbackEnabled: true, complaintEnabled: true, requestEnabled: false },
  { id: 'SVM-04', serviceName: 'Pharmacy Dispensing', serviceCategory: 'Pharmacy', applicability: 'Both', active: true, portalVisible: true, feedbackEnabled: true, complaintEnabled: true, requestEnabled: false },
  { id: 'SVM-05', serviceName: 'Laboratory Services', serviceCategory: 'Laboratory', applicability: 'Both', active: true, portalVisible: true, feedbackEnabled: true, complaintEnabled: true, requestEnabled: false },
  { id: 'SVM-06', serviceName: 'Hospital Security', serviceCategory: 'Security', applicability: 'Both', active: true, portalVisible: false, feedbackEnabled: false, complaintEnabled: true, requestEnabled: false },
  { id: 'SVM-07', serviceName: 'Dietary & Meals', serviceCategory: 'Dietary', applicability: 'IPD', active: true, portalVisible: true, feedbackEnabled: true, complaintEnabled: true, requestEnabled: true },
  { id: 'SVM-08', serviceName: 'Doctor Consultation', serviceCategory: 'Doctor Consultation', applicability: 'OPD', active: true, portalVisible: true, feedbackEnabled: true, complaintEnabled: true, requestEnabled: false },
];

export const seedDepartmentMappingMaster: DepartmentMappingEntry[] = [
  { id: 'DMM-01', serviceOrCategory: 'Housekeeping', department: 'Housekeeping', level1Person: 'Rajesh Kumar (Staff)', level2Person: 'Neha Sharma (Supervisor)', level3Person: 'Vikram Singh (Dept Head)', finalEscalationAuthority: 'Hospital Management' },
  { id: 'DMM-02', serviceOrCategory: 'Nursing', department: 'Nursing', level1Person: 'Ward Nursing Staff', level2Person: 'Nursing Supervisor', level3Person: 'Nursing Superintendent', finalEscalationAuthority: 'Medical Superintendent' },
  { id: 'DMM-03', serviceOrCategory: 'Billing', department: 'Billing', level1Person: 'Billing Supervisor', level2Person: 'Billing Manager', level3Person: 'Finance Head', finalEscalationAuthority: 'Hospital Management' },
  { id: 'DMM-04', serviceOrCategory: 'Pharmacy', department: 'Pharmacy', level1Person: 'Pharmacy Supervisor', level2Person: 'Pharmacy Manager', level3Person: 'Medical Superintendent', finalEscalationAuthority: 'Hospital Management' },
  { id: 'DMM-05', serviceOrCategory: 'Laboratory', department: 'Laboratory', level1Person: 'Lab Technician-in-charge', level2Person: 'Lab Supervisor', level3Person: 'Lab Head', finalEscalationAuthority: 'Medical Superintendent' },
  { id: 'DMM-06', serviceOrCategory: 'Security', department: 'Security', level1Person: 'Security Guard-in-charge', level2Person: 'Security Supervisor', level3Person: 'Chief Security Officer', finalEscalationAuthority: 'Hospital Management' },
  { id: 'DMM-07', serviceOrCategory: 'Dietary', department: 'Dietary', level1Person: 'Dietary Staff', level2Person: 'Dietitian-in-charge', level3Person: 'Chief Dietitian', finalEscalationAuthority: 'Medical Superintendent' },
  { id: 'DMM-08', serviceOrCategory: 'Doctor Consultation', department: 'Facilities', level1Person: 'Facilities Staff', level2Person: 'Vikram Singh (Dept Head)', level3Person: 'Medical Superintendent', finalEscalationAuthority: 'Hospital Management' },
];

export const seedSLAMaster: SLAMasterEntry[] = [
  { id: 'SLM-01', serviceOrCategory: 'Housekeeping', initialResponseMinutes: 10, level1SlaMinutes: 30, level2SlaMinutes: 60, level3SlaMinutes: 120, escalationMinutes: 15 },
  { id: 'SLM-02', serviceOrCategory: 'Nursing', initialResponseMinutes: 5, level1SlaMinutes: 20, level2SlaMinutes: 45, level3SlaMinutes: 90, escalationMinutes: 10 },
  { id: 'SLM-03', serviceOrCategory: 'Billing', initialResponseMinutes: 15, level1SlaMinutes: 60, level2SlaMinutes: 120, level3SlaMinutes: 240, escalationMinutes: 20 },
  { id: 'SLM-04', serviceOrCategory: 'Pharmacy', initialResponseMinutes: 10, level1SlaMinutes: 30, level2SlaMinutes: 60, level3SlaMinutes: 120, escalationMinutes: 15 },
  { id: 'SLM-05', serviceOrCategory: 'Laboratory', initialResponseMinutes: 10, level1SlaMinutes: 40, level2SlaMinutes: 80, level3SlaMinutes: 150, escalationMinutes: 15 },
  { id: 'SLM-06', serviceOrCategory: 'Security', initialResponseMinutes: 5, level1SlaMinutes: 15, level2SlaMinutes: 30, level3SlaMinutes: 60, escalationMinutes: 10 },
  { id: 'SLM-07', serviceOrCategory: 'Dietary', initialResponseMinutes: 10, level1SlaMinutes: 30, level2SlaMinutes: 60, level3SlaMinutes: 120, escalationMinutes: 15 },
  { id: 'SLM-08', serviceOrCategory: 'Doctor Consultation', initialResponseMinutes: 15, level1SlaMinutes: 45, level2SlaMinutes: 90, level3SlaMinutes: 150, escalationMinutes: 20 },
];

export const seedNotificationMaster: NotificationMasterEntry[] = [
  { id: 'NTM-01', eventType: 'Creation', recipient: 'Patient', portal: true, whatsapp: false, sms: true, email: false },
  { id: 'NTM-02', eventType: 'Creation', recipient: 'Staff', portal: true, whatsapp: false, sms: false, email: true },
  { id: 'NTM-03', eventType: 'Assignment', recipient: 'Staff', portal: true, whatsapp: true, sms: false, email: false },
  { id: 'NTM-04', eventType: 'Response', recipient: 'Patient', portal: true, whatsapp: true, sms: false, email: false },
  { id: 'NTM-05', eventType: 'Escalation', recipient: 'Staff', portal: true, whatsapp: true, sms: true, email: true },
  { id: 'NTM-06', eventType: 'Escalation', recipient: 'Patient', portal: true, whatsapp: false, sms: false, email: false },
  { id: 'NTM-07', eventType: 'Closure', recipient: 'Patient', portal: true, whatsapp: false, sms: true, email: false },
  { id: 'NTM-08', eventType: 'Closure', recipient: 'Staff', portal: true, whatsapp: false, sms: false, email: false },
];

// M14 — Health Camps, Offers & Advertisements (BRD §18). One item per category, plus a few extra
// to demonstrate the visibility window (expired/future), targeting (IPD-only, gender-targeted),
// the maker-checker approval flow (one Pending Approval item) and the pinned/emergency lane.
export const seedAnnouncements: Announcement[] = [
  {
    id: 'ANN-1', category: 'Health Camp', title: 'Free Diabetes & Blood Pressure Screening Camp',
    body: 'A free community screening camp for diabetes and hypertension, including on-the-spot blood sugar and BP checks, dietary counselling, and doctor consultation for anyone flagged at risk. Walk-ins welcome, but pre-registration guarantees a slot.',
    venue: 'GMCH Community Health Pavilion, Ground Floor',
    startDate: '2026-09-05', endDate: '2026-09-14',
    registrationOpenDate: '2026-08-25', registrationCloseDate: '2026-09-13',
    capacity: 6, feeType: 'Free', organizingDoctor: 'Dr. Priya Nair',
    eligibility: 'Open to all adults above 30 years', contactNumber: '0294-2450100',
    priority: 'Medium', displaySequence: 1, active: true,
    targeting: { patientType: 'All' }, placements: ['Home Carousel', 'Camps Tab'],
    cta: 'Register for Camp', approvalStatus: 'Approved', createdBy: 'Marketing Desk (PRO)', pinned: false,
  },
  {
    id: 'ANN-2', category: 'Health Camp', title: 'Free Eye Check-up Camp — August Edition',
    body: 'A completed free eye check-up and cataract screening camp held in partnership with the Ophthalmology department.',
    venue: 'OPD Block, 2nd Floor', startDate: '2026-08-10', endDate: '2026-08-20',
    registrationOpenDate: '2026-08-01', registrationCloseDate: '2026-08-19',
    capacity: 80, feeType: 'Free', organizingDoctor: 'Dr. Sandeep Rao',
    eligibility: 'All age groups', contactNumber: '0294-2450100',
    priority: 'Low', displaySequence: 2, active: true,
    targeting: { patientType: 'All' }, placements: ['Camps Tab'],
    cta: 'Register for Camp', approvalStatus: 'Approved', createdBy: 'Marketing Desk (PRO)', pinned: false,
  },
  {
    id: 'ANN-3', category: 'Health Camp', title: "Women's Health & Gynaecology Camp — October",
    body: 'A dedicated camp for women\'s health screening including PCOS, PCOD and routine gynaecological check-ups, led by our Gynaecology unit.',
    venue: 'Gynaecology OPD, 1st Floor', startDate: '2026-10-05', endDate: '2026-10-06',
    registrationOpenDate: '2026-09-15', registrationCloseDate: '2026-10-04',
    capacity: 50, feeType: 'Free', organizingDoctor: 'Dr. Meenal Joshi',
    eligibility: 'Women aged 18 and above', contactNumber: '0294-2450100',
    priority: 'Medium', displaySequence: 3, active: true,
    targeting: { patientType: 'All', gender: 'Female' }, placements: ['Home Carousel', 'Camps Tab'],
    cta: 'Register for Camp', approvalStatus: 'Approved', createdBy: 'Marketing Desk (PRO)', pinned: false,
  },
  {
    id: 'ANN-4', category: 'New Doctor', title: 'New Cardiology Specialist Joining — Dr. Ananya Mehta',
    body: 'GMCH welcomes Dr. Ananya Mehta, a senior interventional cardiologist, to the Cardiology department. Book a consultation for comprehensive heart-health evaluation.',
    startDate: '2026-09-01', endDate: '2026-09-30', feeType: 'Paid',
    priority: 'High', displaySequence: 4, active: true,
    targeting: { patientType: 'All' }, placements: ['Home Carousel'],
    cta: 'Book Appointment', ctaTarget: 'Cardiology', approvalStatus: 'Approved', createdBy: 'Marketing Desk (PRO)', pinned: false,
  },
  {
    id: 'ANN-5', category: 'Health Check-up Package', title: 'Executive Full Body Health Check-up Package',
    body: 'A comprehensive executive health check-up covering blood work, cardiac screening, chest X-ray and consultation — designed for working professionals aged 25 to 60.',
    startDate: '2026-09-01', endDate: '2026-09-30', feeType: 'Paid', fee: 2499,
    eligibility: 'Adults aged 25–60', contactNumber: '0294-2450100',
    priority: 'Medium', displaySequence: 5, active: true,
    targeting: { patientType: 'All', ageMin: 25, ageMax: 60 }, placements: ['Home Carousel', 'Camps Tab'],
    cta: 'View Package', approvalStatus: 'Approved', createdBy: 'Marketing Desk (PRO)', pinned: false,
  },
  {
    id: 'ANN-6', category: 'Achievement', title: 'GMCH Cardiac Care Unit Achieves NABH Accreditation',
    body: 'We are proud to announce that our Cardiac Care Unit has been awarded NABH (National Accreditation Board for Hospitals) accreditation, recognising our commitment to patient safety and quality of care.',
    startDate: '2026-08-20', endDate: '2026-09-20', feeType: 'Free',
    priority: 'Low', displaySequence: 6, active: true,
    targeting: { patientType: 'All' }, placements: ['Home Carousel'],
    cta: 'None', approvalStatus: 'Approved', createdBy: 'Marketing Desk (PRO)', pinned: false,
  },
  {
    id: 'ANN-7', category: 'Offer', title: 'Festive Season Offer — 20% off Master Health Check-ups',
    body: 'Celebrate the festive season with 20% off all Master Health Check-up packages booked this month. Limited slots available per day.',
    startDate: '2026-09-01', endDate: '2026-09-30', feeType: 'Paid', fee: 1999,
    priority: 'Medium', displaySequence: 7, active: true,
    targeting: { patientType: 'All' }, placements: ['Home Carousel', 'Camps Tab'],
    cta: 'View Package', approvalStatus: 'Approved', createdBy: 'Marketing Desk (PRO)',
    disclaimer: 'Valid till slots last. Cannot be combined with any other offer. Terms & conditions apply.', pinned: false,
  },
  {
    id: 'ANN-8', category: 'Announcement', title: 'Water Supply Disruption — Wards B & C, 8th September',
    body: 'Due to scheduled municipal maintenance, water supply to General Medicine Ward B and Ward C will be disrupted on 8th September from 10 AM to 4 PM. Tanker supply has been arranged; patients and attendants are requested to plan accordingly.',
    startDate: '2026-09-06', endDate: '2026-09-09', feeType: 'Free', contactNumber: '0294-2450100',
    priority: 'High', displaySequence: 0, active: true,
    targeting: { patientType: 'All' }, placements: ['Home Carousel', 'Interstitial'],
    cta: 'None', approvalStatus: 'Approved', createdBy: 'Hospital Administration', pinned: true,
  },
  {
    id: 'ANN-9', category: 'New Facility', title: 'New Physiotherapy Facility Launched — Ward Block C',
    body: 'A new, fully-equipped physiotherapy and rehabilitation facility is now operational in Ward Block C, exclusively for admitted patients requiring post-operative and mobility rehabilitation.',
    venue: 'Ward Block C, Ground Floor', startDate: '2026-09-01', endDate: '2026-09-30', feeType: 'Free',
    priority: 'Medium', displaySequence: 9, active: true,
    targeting: { patientType: 'IPD' }, placements: ['Home Carousel', 'Camps Tab'],
    cta: 'None', approvalStatus: 'Pending Approval', createdBy: 'PRO Desk (Rajesh Kumar)', pinned: false,
  },
];

export const seedCampRegistrations: CampRegistration[] = [];

// BRD §19.1 — remaining Admin Masters.
export const seedPayerMaster: PayerMasterEntry[] = [
  { id: 'PYM-01', payerCategory: 'Cash', description: 'Self-pay patients, no third-party billing.', active: true },
  { id: 'PYM-02', payerCategory: 'RGHS', description: 'Rajasthan Government Health Scheme beneficiaries.', active: true },
  { id: 'PYM-03', payerCategory: 'TPA', description: 'Third Party Administrator / insurance-linked billing.', active: true },
  { id: 'PYM-04', payerCategory: 'Corporate', description: 'Corporate tie-up / employer-sponsored billing.', active: false },
];

const TARIFF_BASE: Record<string, number> = { 'OPD Consultation': 500, 'X-Ray': 600, 'CBC': 350, 'HbA1c': 500, 'Chest X-Ray': 600 };
const TARIFF_FACTOR: Record<string, number> = { Cash: 1, RGHS: 0.7, TPA: 1.15, Corporate: 1.1 };
export const seedTariffMaster: TariffMasterEntry[] = Object.keys(TARIFF_BASE).flatMap((svc, si) =>
  Object.keys(TARIFF_FACTOR).map((pc, pi) => ({
    id: `TRM-${si}${pi}`, serviceName: svc, payerCategory: pc,
    amount: Math.round((TARIFF_BASE[svc] * TARIFF_FACTOR[pc]) / 10) * 10,
  }))
);

export const seedFeedbackMaster: FeedbackMasterEntry[] = [
  { id: 'FBM-01', serviceName: 'Doctor Consultation', applicablePatientType: 'OPD', ratingScale: 5, escalationThreshold: 2 },
  { id: 'FBM-02', serviceName: 'Nursing', applicablePatientType: 'IPD', ratingScale: 5, escalationThreshold: 2 },
  { id: 'FBM-03', serviceName: 'Housekeeping', applicablePatientType: 'Both', ratingScale: 5, escalationThreshold: 2 },
  { id: 'FBM-04', serviceName: 'Billing', applicablePatientType: 'Both', ratingScale: 5, escalationThreshold: 3 },
  { id: 'FBM-05', serviceName: 'Pharmacy', applicablePatientType: 'Both', ratingScale: 5, escalationThreshold: 2 },
];

export const seedComplaintCategoryMaster: ComplaintCategoryMasterEntry[] = [
  { id: 'CCM-01', categoryName: 'Waiting Time', department: 'Nursing', slaCategory: 'Nursing' },
  { id: 'CCM-02', categoryName: 'Housekeeping', department: 'Housekeeping', slaCategory: 'Housekeeping' },
  { id: 'CCM-03', categoryName: 'Billing', department: 'Billing', slaCategory: 'Billing' },
  { id: 'CCM-04', categoryName: 'Staff Behaviour', department: 'Nursing', slaCategory: 'Nursing' },
  { id: 'CCM-05', categoryName: 'Pharmacy', department: 'Pharmacy', slaCategory: 'Pharmacy' },
  { id: 'CCM-06', categoryName: 'Facilities', department: 'Facilities', slaCategory: 'Security' },
];

export const departmentMapping: Record<string, { l1: string; l2: string; l3: string }> = {
  Housekeeping: { l1: 'Rajesh Kumar (Staff)', l2: 'Neha Sharma (Supervisor)', l3: 'Vikram Singh (Dept Head)' },
  Nursing: { l1: 'Ward Nursing Staff', l2: 'Nursing Supervisor', l3: 'Nursing Superintendent' },
  Billing: { l1: 'Billing Supervisor', l2: 'Billing Manager', l3: 'Finance Head' },
  Pharmacy: { l1: 'Pharmacy Supervisor', l2: 'Pharmacy Manager', l3: 'Medical Superintendent' },
  Facilities: { l1: 'Facilities Staff', l2: 'Vikram Singh (Dept Head)', l3: 'Hospital Management' },
};

export const slaMaster: Record<string, { l1: number; l2: number; l3: number }> = {
  Housekeeping: { l1: 30, l2: 60, l3: 120 },
  Nursing: { l1: 20, l2: 45, l3: 90 },
  Billing: { l1: 60, l2: 120, l3: 240 },
  Pharmacy: { l1: 30, l2: 60, l3: 120 },
  Facilities: { l1: 45, l2: 90, l3: 150 },
};

// DPDP — placeholders for the hospital's legal / compliance team to confirm before go-live.
export const CONSENT_VERSION = '1.0';
export const DPO_NAME = 'Data Protection Officer, ' + HOSPITAL_NAME;
export const DPO_EMAIL = 'dpo@gmch.example';
export const DPO_PHONE = '+91 294 000 0000';
export const GRIEVANCE_SLA_DAYS = 30;
