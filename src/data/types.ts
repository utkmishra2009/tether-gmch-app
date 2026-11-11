export type PatientType = 'OPD' | 'IPD';
export type Payer = 'Cash' | 'RGHS' | 'TPA';

export interface Patient {
  uhid: string;
  name: string;
  mobile: string;
  dob: string;
  gender: 'Male' | 'Female';
  address: string;
  patientType: PatientType;
  payer: Payer;
  payerVerified: boolean;
  familyHeadUhid?: string; // if part of a family
  relation?: string; // relation to family head
  ward?: string; // if IPD
  bed?: string;
}

export interface Doctor {
  id: string;
  name: string;
  department: string;
  unit: string;
  fee: number;
  opdDays: string[]; // ['Mon','Tue',...]
  timing: string;
  slotDurationMin: number;
  slotCapacity: number;
  leaveDates: string[]; // ISO dates
  photo?: string;
  ratingAvg?: number; // aggregate patient-feedback rating (stars), 1-5
  ratingCount?: number; // number of ratings behind ratingAvg — raw comments are never shown, stars only
}

export type AppointmentStatus =
  | 'Appointment Requested'
  | 'Appointment Confirmed'
  | 'Payment Pending'
  | 'Payment Successful'
  | 'Authorization Pending'
  | 'Authorized'
  | 'Check-in Pending'
  | 'Checked-in'
  | 'Token Generated'
  | 'Consultation Started'
  | 'Consultation Completed'
  | 'Cancelled'
  | 'No Show';

export interface Appointment {
  id: string;
  patientUhid: string;
  doctorId: string;
  date: string; // ISO date
  time: string;
  payer: Payer;
  onlinePaid: number;
  finalTariff: number | null;
  paymentOption: 'Pay Now' | 'Pay Later';
  status: AppointmentStatus;
  token: string | null;
  createdAt: string;
  rescheduleCount: number;
}

export type PaymentStatus =
  | 'Success' | 'Failed' | 'Pending' | 'Timeout'
  | 'Paid at Counter' | 'Refund Pending' | 'Refunded';

export interface PaymentTxn {
  id: string;
  appointmentId?: string;
  patientUhid: string;
  amount: number;
  originalTariff?: number;
  finalTariff?: number;
  payer: Payer;
  method: string;
  status: PaymentStatus;
  timestamp: string;
  reference: string;
  purpose: 'OPD Consultation' | 'Investigation' | 'Medicine' | 'Counter Balance' | 'Refund';
}

export interface RefundRequest {
  id: string;
  transactionId: string;
  patientUhid: string;
  amount: number;
  reason: string;
  eligibility: 'Eligible' | 'Not Eligible' | 'Pending Review';
  authMethod?: 'Patient OTP' | 'Patient Portal Approval' | 'Authorised Staff';
  authorized: boolean;
  status: 'Requested' | 'Authorization Pending' | 'Staff Verification' | 'Processed' | 'Rejected';
  requestedAt: string;
  processedAt?: string;
}

export interface Investigation {
  id: string;
  patientUhid: string;
  name: string;
  orderedBy: string;
  orderedAt: string;
  charge: number;
  status: 'Pending Payment' | 'Paid' | 'Failed' | 'Completed' | 'Report Available' | 'Report Pending' | 'Cancelled';
  reportUrl?: string;
  resultSummary?: string; // populated once status is 'Report Available' or 'Completed'
}

export interface MedicineOrder {
  id: string;
  patientUhid: string;
  medicine: string;
  qty: number;
  unitPrice: number;
  prescribedBy: string;
  status: 'Pending Payment' | 'Paid' | 'Failed' | 'Dispensed';
}

// A single day's dose-taken record for a paid/dispensed medicine order. Generated schedules
// (Morning/Night etc.) are derived deterministically from the medicine name — see
// getDoseLabelsForMedicine in store.tsx — only the taken/untaken state is persisted here.
export interface DoseLogEntry {
  id: string;
  patientUhid: string;
  medicineOrderId: string;
  doseLabel: string; // e.g. 'Morning', 'Afternoon', 'Night'
  date: string; // ISO date (YYYY-MM-DD) this dose applies to
  takenAt: string; // ISO timestamp when marked taken
}

// OP (outpatient) visit record — one entry per OPD consultation.
export interface ConsultationRecord {
  id: string;
  patientUhid: string;
  doctorId: string;
  date: string;
  diagnosis: string;
  prescription: string[];
  advice: string;
  followUpDate?: string;
}

// IP (inpatient) admission/visit. Patients only ever see the discharge summary for an
// IP visit — no separate diagnosis/prescription/advice breakdown is exposed, since the
// discharge summary already synthesizes the full course of treatment.
export interface RecoveryChecklistItem {
  id: string;
  label: string;
}

export interface IPVisit {
  id: string;
  ipNo: string; // e.g. 'IP-2026-00142', distinct numbering from OP Appointment IDs
  patientUhid: string;
  admissionDate: string;
  dischargeDate: string;
  ward: string;
  bed: string;
  treatingDoctor: string;
  dischargeSummary: string; // the only clinical content patients can view for an IP visit
  // Structured, checkable post-discharge follow-up items (medication reminders, monitoring advice,
  // the follow-up date, etc.) distilled from the discharge summary — present only for discharged visits.
  recoveryChecklist?: RecoveryChecklistItem[];
}

// Patient-side tick state for one RecoveryChecklistItem on one IP visit.
export interface RecoveryChecklistLogEntry {
  id: string;
  patientUhid: string;
  ipVisitId: string;
  itemId: string;
  completedAt: string;
}

export interface VitalsReading {
  id: string;
  patientUhid: string;
  recordedAt: string; // ISO timestamp
  recordedBy: string; // e.g. "Nurse Kavita Joshi" or "Dr. Priya Nair"
  context: string; // e.g. "OPD Visit — Dr. Priya Nair" or "IPD Round — General Medicine Ward B"
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  heartRateBpm?: number;
  temperatureF?: number;
  spo2Percent?: number;
  randomBloodSugarMgDl?: number;
  weightKg?: number;
}

export interface IPBillLineItem {
  label: string; // e.g. "Room Charges (General Ward, 4 days)", "Nursing Charges", "Admission Deposit", "Consultant Visit Charges"
  amount: number;
}

export interface IPBill {
  id: string;
  ipNo: string; // links to the same IPVisit.ipNo
  patientUhid: string;
  lineItems: IPBillLineItem[];
  totalAmount: number;
  amountPaid: number;
  balanceDue: number;
  status: 'Ongoing' | 'Settled' | 'Partially Paid';
  lastUpdated: string;
}

export interface DietOrder {
  id: string;
  patientUhid: string;
  dietType: string;
  mealType: string;
  instructions: string;
  effectiveDate: string;
  prescribedBy: string;
  status: 'Active' | 'Revised' | 'Discontinued';
}

export interface DietSelfRequest {
  id: string;
  patientUhid: string;
  mealType: 'Breakfast' | 'Lunch' | 'Dinner' | 'Evening Snack';
  menuItems: string[]; // selected items from that meal's menu
  adhocRequest: string; // free text for anything not on the menu, optional
  status: 'Submitted' | 'Approved' | 'Blocked' | 'Delivered';
  blockedReason?: string;
  createdAt: string;
}

export interface Feedback {
  id: string;
  patientUhid: string;
  service: string;
  rating: number;
  comment: string;
  department: string;
  status: 'Recorded' | 'Escalated to Service Request';
  createdAt: string;
  appointmentId?: string; // links a Doctor Consultation feedback to the OP appointment it gates (BRD FR-M10-04)
}

export interface ServiceRequest {
  id: string;
  patientUhid: string;
  category: string;
  description: string;
  department: string;
  assignedStaff?: string;
  status: 'Submitted' | 'Assigned' | 'In Progress' | 'Completed' | 'SLA Breached';
  createdAt: string;
  slaMinutes: number;
}

export type ComplaintLevel = 'L1' | 'L2' | 'L3';
export type ComplaintStatus =
  | 'Submitted' | 'Assigned' | 'In Progress' | 'Response Provided'
  | 'Resolved' | 'Closed' | 'Reopened' | 'Escalated' | 'SLA Breached' | 'Rejected';

export interface TimelineEvent {
  label: string;
  timestamp: string;
  meta?: string;
}

export interface Complaint {
  id: string;
  patientUhid: string;
  category: string;
  description: string;
  department: string;
  level: ComplaintLevel;
  status: ComplaintStatus;
  slaMinutes: number;
  slaDeadline: string;
  responsiblePerson: string;
  response?: string;
  createdAt: string;
  timeline: TimelineEvent[];
}

export interface NotificationItem {
  id: string;
  recipient: string;
  channel: 'Portal' | 'WhatsApp' | 'SMS' | 'Email' | 'Staff Portal';
  event: string;
  status: 'Delivered' | 'Failed' | 'Pending';
  timestamp: string;
}

export interface AuditEvent {
  id: string;
  timestamp: string;
  user: string;
  role: string;
  action: string;
  previousState?: string;
  newState?: string;
  reference: string;
}

export interface StaffUser {
  id: string;
  name: string;
  username: string;
  role: 'Staff' | 'Supervisor' | 'Department Head' | 'Admin' | 'Management';
  department: string;
}

export interface ChiefComplaint {
  id: string;
  appointmentId: string;
  patientUhid: string;
  predefinedItems: string[];
  freeText: string;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceMasterEntry {
  id: string;
  serviceName: string;
  serviceCategory: string;
  applicability: 'IPD' | 'OPD' | 'Both';
  active: boolean;
  portalVisible: boolean;
  feedbackEnabled: boolean;
  complaintEnabled: boolean;
  requestEnabled: boolean;
}

export interface DepartmentMappingEntry {
  id: string;
  serviceOrCategory: string;
  department: string;
  level1Person: string;
  level2Person: string;
  level3Person: string;
  finalEscalationAuthority: string;
}

export interface SLAMasterEntry {
  id: string;
  serviceOrCategory: string;
  initialResponseMinutes: number;
  level1SlaMinutes: number;
  level2SlaMinutes: number;
  level3SlaMinutes: number;
  escalationMinutes: number;
}

export interface NotificationMasterEntry {
  id: string;
  eventType: 'Creation' | 'Assignment' | 'Response' | 'Escalation' | 'Closure';
  recipient: 'Patient' | 'Staff';
  portal: boolean;
  whatsapp: boolean;
  sms: boolean;
  email: boolean;
}

export type SelfRegistrationMode = 'HOSPITAL_ONLY' | 'SELF_WITH_DUP_CHECK';

export type CorrectionField = 'Name' | 'DOB' | 'Gender' | 'Mobile Number' | 'Other';

export interface CorrectionRequest {
  id: string;
  patientUhid: string;
  field: CorrectionField;
  currentValue: string;
  requestedValue: string;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  staffRemarks?: string;
  createdAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
}

export type AccessRelationship = 'Natural Guardian' | 'Spouse' | 'Parent' | 'Child' | 'Caregiver' | 'Legal Guardian' | 'Other';
export type AccessBasis = 'Natural Guardianship' | 'Patient Consent' | 'Legal Guardianship';
export type AccessScope = 'Appointments' | 'Payments' | 'Reports' | 'Prescriptions' | 'IPD Services' | 'Full';

export interface AccessGrant {
  id: string;
  patientUhid: string; // whose record
  authorizedUserUhid: string; // who may access
  relationship: AccessRelationship;
  basis: AccessBasis;
  scope: AccessScope[];
  validFrom: string;
  validUntil?: string; // undefined = no expiry
  revocable: boolean;
  createdAt: string;
  createdBy: string;
  revokedAt?: string;
  revokedBy?: string;
  revokedReason?: string;
}

// M14 — Health Camps, Offers & Advertisements (BRD §18). Single content-item model driving the Home
// carousel, the dedicated Discover tab and the Content Console (staff maker-checker screen).
export type ContentCategory =
  | 'Health Camp' | 'Health Check-up Package' | 'New Doctor' | 'Achievement'
  | 'New Facility' | 'Offer' | 'Announcement';
export type ContentPlacement = 'Home Carousel' | 'Camps Tab' | 'Interstitial';
export type ContentCTA = 'Book Appointment' | 'Register for Camp' | 'View Package' | 'Call Hospital' | 'Get Directions' | 'None';
export type ContentApprovalStatus = 'Draft' | 'Pending Approval' | 'Approved' | 'Rejected';

export interface ContentTargeting {
  patientType: 'IPD' | 'OPD' | 'All';
  gender?: 'Male' | 'Female' | 'All';
  ageMin?: number;
  ageMax?: number;
}

export interface Announcement {
  id: string;
  category: ContentCategory;
  title: string;
  body: string;
  venue?: string;
  startDate: string;
  endDate: string;
  registrationOpenDate?: string;
  registrationCloseDate?: string;
  capacity?: number;
  feeType: 'Free' | 'Paid';
  fee?: number;
  organizingDoctor?: string;
  eligibility?: string;
  contactNumber?: string;
  priority: 'High' | 'Medium' | 'Low';
  displaySequence: number;
  active: boolean;
  targeting: ContentTargeting;
  placements: ContentPlacement[];
  cta: ContentCTA;
  ctaTarget?: string;
  approvalStatus: ContentApprovalStatus;
  createdBy: string;
  disclaimer?: string;
  pinned: boolean;
  // languageVariants intentionally omitted — single-language mock (see report simplifications).
}

export interface CampRegistration {
  id: string;
  contentId: string;
  patientUhid: string;
  registeredAt: string;
}

// BRD §19.1 — remaining Admin Masters.
export interface PayerMasterEntry {
  id: string;
  payerCategory: 'Cash' | 'RGHS' | 'TPA' | 'Corporate';
  description: string;
  active: boolean;
}

export interface TariffMasterEntry {
  id: string;
  serviceName: string;
  payerCategory: string;
  amount: number;
}

export interface FeedbackMasterEntry {
  id: string;
  serviceName: string;
  applicablePatientType: 'IPD' | 'OPD' | 'Both';
  ratingScale: number;
  escalationThreshold: number; // rating at or below this auto-escalates to a Service Request
}

export interface ComplaintCategoryMasterEntry {
  id: string;
  categoryName: string;
  department: string;
  slaCategory: string; // references SLAMasterEntry.serviceOrCategory
}

// Waitlist for a doctor/date that had no available slots at the time of booking — the patient is
// notified (existing notification mechanism) if a slot on that doctor/date is later freed up by a
// cancellation or reschedule-away.
export interface WaitlistEntry {
  id: string;
  patientUhid: string;
  doctorId: string;
  date: string; // ISO date
  createdAt: string;
}

// ---- DPDP Act 2023: consent ledger & data-principal rights ----
export type ConsentPurpose = 'care' | 'reminders' | 'whatsapp' | 'marketing' | 'research' | 'share-access' | 'qr-share' | 'family-link' | 'guardian';
export interface ConsentRecord {
  id: string;
  subject: string;          // mobile number of the account holder (consent is captured before a UHID is known)
  purpose: ConsentPurpose;
  granted: boolean;         // false = withdrawn
  version: string;          // notice version the person saw
  timestamp: string;
  channel: 'Login' | 'Consent Centre' | 'Sharing' | 'Family';
  detail?: string;
}
export type DataRightType = 'Access' | 'Correction' | 'Erasure' | 'Nominate' | 'Grievance';
export interface DataRightRequest {
  id: string;
  patientUhid: string;
  type: DataRightType;
  detail: string;
  status: 'Submitted' | 'In Review' | 'Completed';
  createdAt: string;
  dueBy: string;
}
export interface Nominee { subject: string; name: string; relation: string; mobile: string; }
