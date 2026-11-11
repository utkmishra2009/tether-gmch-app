import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import * as seed from './seed';
import type {
  Patient, Appointment, PaymentTxn, RefundRequest, Investigation, MedicineOrder,
  DietSelfRequest, Feedback, ServiceRequest, Complaint, NotificationItem, AuditEvent,
  Doctor, ComplaintLevel, ChiefComplaint, ServiceMasterEntry, DepartmentMappingEntry,
  SLAMasterEntry, NotificationMasterEntry, IPVisit, VitalsReading, IPBill,
  SelfRegistrationMode, CorrectionRequest, CorrectionField, AccessGrant,
  AccessRelationship, AccessBasis, AccessScope, Announcement, CampRegistration,
  PayerMasterEntry, TariffMasterEntry, FeedbackMasterEntry, ComplaintCategoryMasterEntry,
  DoseLogEntry, RecoveryChecklistLogEntry, WaitlistEntry,
  ConsentRecord, ConsentPurpose, DataRightRequest, DataRightType, Nominee,
} from './types';

const CHECKED_IN_STATUSES: Appointment['status'][] = ['Checked-in', 'Token Generated', 'Consultation Started', 'Consultation Completed'];
export function isChiefComplaintLocked(apt: Appointment) { return CHECKED_IN_STATUSES.includes(apt.status); }

function nowIso() { return new Date().toISOString(); }
function genId(prefix: string) { return `${prefix}-${Math.floor(1000 + Math.random() * 9000)}`; }
function fmtToken(prefix: string, n: number) { return `${prefix}-${String(n).padStart(3, '0')}`; }

const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function dayCode(dateIso: string) {
  return DOW[new Date(dateIso + 'T00:00:00').getDay()];
}

export interface SlotInfo { time: string; available: boolean; }

export function getSlotsForDoctor(doctor: Doctor, dateIso: string): { reason: string | null; slots: SlotInfo[] } {
  const dow = dayCode(dateIso);
  if (doctor.leaveDates.includes(dateIso)) {
    return { reason: 'Doctor on approved leave for this date.', slots: [] };
  }
  if (!doctor.opdDays.includes(dow)) {
    return { reason: `${doctor.name} does not hold OPD on ${dow}. Approved OPD days: ${doctor.opdDays.join(', ')}.`, slots: [] };
  }
  const key = `${doctor.id}|${dateIso}`;
  const booked = new Set(seed.bookedSlotSeed[key] || []);
  // generate slots across timing window (simple 2hr block of times for demo based on slotDurationMin)
  const [startStr] = doctor.timing.split('–').map(s => s.trim());
  const start = parseTimeToMinutes(startStr);
  const slots: SlotInfo[] = [];
  for (let i = 0; i < doctor.slotCapacity; i++) {
    const t = start + i * doctor.slotDurationMin;
    const label = minutesToTime(t);
    slots.push({ time: label, available: !booked.has(label) });
  }
  return { reason: null, slots };
}

export function parseTimeToMinutes(t: string) {
  const m = t.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!m) return 9 * 60;
  let h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  const ap = m[3].toUpperCase();
  if (ap === 'PM' && h !== 12) h += 12;
  if (ap === 'AM' && h === 12) h = 0;
  return h * 60 + min;
}
function minutesToTime(mins: number) {
  let h = Math.floor(mins / 60);
  const m = mins % 60;
  const ap = h >= 12 ? 'PM' : 'AM';
  h = h % 12; if (h === 0) h = 12;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')} ${ap}`;
}

export function getAppointmentDateTime(apt: Appointment): Date {
  const d = new Date(apt.date + 'T00:00:00');
  d.setMinutes(d.getMinutes() + parseTimeToMinutes(apt.time));
  return d;
}

// Free reschedule/cancellation up to 4 hours before the slot; ₹100 fee inside that window,
// waived for a Pay Later appointment that has not yet been paid for.
export function getCancellationPolicy(apt: Appointment): { withinFreeWindow: boolean; fee: number; hoursUntil: number } {
  const dt = getAppointmentDateTime(apt);
  const hoursUntil = (dt.getTime() - Date.now()) / 3600000;
  const withinFreeWindow = hoursUntil >= 4;
  const waived = apt.paymentOption === 'Pay Later' && apt.onlinePaid === 0;
  const fee = withinFreeWindow || waived ? 0 : 100;
  return { withinFreeWindow, fee, hoursUntil };
}

export function isPatientActivelyAdmitted(ipVisits: IPVisit[], patientUhid: string): IPVisit | undefined {
  const now = Date.now();
  return ipVisits.find(v => v.patientUhid === patientUhid && (!v.dischargeDate || new Date(v.dischargeDate).getTime() > now));
}

const AVG_CONSULT_MIN = 8;

export function getQueueEstimate(appointments: Appointment[], apt: Appointment): { currentToken: number; myToken: number; waitMinutes: number } | null {
  if (!apt.token || !['Checked-in', 'Token Generated'].includes(apt.status)) return null;
  const tokenNum = (t: string) => parseInt(t.split('-')[1] || '0', 10);
  const myToken = tokenNum(apt.token);
  const sameSession = appointments.filter(a => a.doctorId === apt.doctorId && a.date === apt.date && a.token);
  const completedNums = sameSession.filter(a => a.status === 'Consultation Completed').map(a => tokenNum(a.token!));
  const inProgress = sameSession.find(a => a.status === 'Consultation Started');
  let currentToken = completedNums.length ? Math.max(...completedNums) : Math.max(myToken - 5, 1);
  if (inProgress) currentToken = Math.max(currentToken, tokenNum(inProgress.token!));
  const waitMinutes = Math.max(myToken - currentToken, 0) * AVG_CONSULT_MIN;
  return { currentToken, myToken, waitMinutes };
}

// Mock dose-schedule derivation (Feature 2): a plausible daily dose schedule inferred from the
// medicine name, not a real prescription-frequency parser. Antibiotics get a three-times-daily
// schedule; everything else defaults to a sensible twice-daily Morning/Night schedule.
export function getDoseLabelsForMedicine(medicine: string): string[] {
  const n = medicine.toLowerCase();
  if (n.includes('amoxicillin') || n.includes('antibiotic')) return ['Morning', 'Afternoon', 'Night'];
  return ['Morning', 'Night'];
}

export function getAge(dob: string): number {
  const d = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
  return age;
}

interface StoreShape {
  patients: Patient[];
  doctors: Doctor[];
  appointments: Appointment[];
  payments: PaymentTxn[];
  refunds: RefundRequest[];
  investigations: Investigation[];
  medicines: MedicineOrder[];
  dietRequests: DietSelfRequest[];
  feedback: Feedback[];
  serviceRequests: ServiceRequest[];
  complaints: Complaint[];
  notifications: NotificationItem[];
  audit: AuditEvent[];
  chiefComplaints: ChiefComplaint[];
  serviceMaster: ServiceMasterEntry[];
  departmentMappingMaster: DepartmentMappingEntry[];
  slaMasterConfig: SLAMasterEntry[];
  notificationMaster: NotificationMasterEntry[];
  ipVisits: IPVisit[];
  vitals: VitalsReading[];
  ipBills: IPBill[];
  correctionRequests: CorrectionRequest[];
  accessGrants: AccessGrant[];
  contentItems: Announcement[];
  campRegistrations: CampRegistration[];
  bookmarkedContentIds: string[];
  contentAnalytics: Record<string, { impressions: number; taps: number }>;
  payerMaster: PayerMasterEntry[];
  tariffMaster: TariffMasterEntry[];
  feedbackMaster: FeedbackMasterEntry[];
  complaintCategoryMaster: ComplaintCategoryMasterEntry[];
  doseLog: DoseLogEntry[];
  recoveryChecklistLog: RecoveryChecklistLogEntry[];
  waitlist: WaitlistEntry[];

  currentPatientUhid: string | null;
  authedAsFamilyHead: string | null;
  currentStaffId: string | null;
  selfRegistrationMode: SelfRegistrationMode;
  setSelfRegistrationMode: (mode: SelfRegistrationMode) => void;

  // Policy & Configuration (BRD §19.1) — tenant flags. Most are display-only simplifications in this
  // prototype; ENABLE_PAY_LATER and ENABLE_LIVE_QUEUE genuinely gate app behaviour (see Book.tsx /
  // Appointments.tsx), as does SELF_REGISTRATION_MODE above.
  enablePayLater: boolean;
  setEnablePayLater: (v: boolean) => void;
  enableLiveQueue: boolean;
  setEnableLiveQueue: (v: boolean) => void;
  emrVisibilityWindowDays: number;
  setEmrVisibilityWindowDays: (v: number) => void;
  emrDownloadLimitPerDoc: number;
  setEmrDownloadLimitPerDoc: (v: number) => void;
  mandatoryFeedbackGateOpPost: boolean;
  setMandatoryFeedbackGateOpPost: (v: boolean) => void;
  mandatoryFeedbackGateIpPreDischarge: boolean;
  setMandatoryFeedbackGateIpPreDischarge: (v: boolean) => void;
  allowInappCorrectionRequest: boolean;
  setAllowInappCorrectionRequest: (v: boolean) => void;
  autoAuthorizeLinkedUhids: boolean;
  setAutoAuthorizeLinkedUhids: (v: boolean) => void;

  loginWithOtp: (mobile: string, otp: string) => { ok: boolean; message: string; multiMatch?: Patient[] };
  selectPatientProfile: (uhid: string) => void;
  logout: () => void;
  registerPatient: (data: Partial<Patient>) => { outcome: 'created' | 'conclusive' | 'uncertain'; patient?: Patient; message: string };
  addFamilyMember: (data: { name: string; mobile: string; dob: string; idNumber: string }) => { outcome: 'linked' | 'uncertain'; message: string };
  switchActivePatient: (uhid: string) => void;

  bookAppointment: (opts: { patientUhid: string; doctorId: string; date: string; time: string; paymentOption: 'Pay Now' | 'Pay Later' }) => Appointment;
  payNow: (appointmentId: string, simulate: 'success' | 'failed' | 'timeout') => void;
  counterCollectPayLater: (appointmentId: string) => void;
  reconcileAtCounter: (appointmentId: string, finalTariff: number, newPayer?: 'Cash' | 'RGHS' | 'TPA') => void;
  rescheduleAppointment: (appointmentId: string, newDate: string, newTime: string) => { ok: boolean; message: string; fee: number };
  cancelAppointment: (appointmentId: string) => { ok: boolean; message: string; fee: number };

  submitCorrectionRequest: (field: CorrectionField, currentValue: string, requestedValue: string, reason: string) => CorrectionRequest;
  staffResolveCorrectionRequest: (id: string, decision: 'Approved' | 'Rejected', remarks: string) => void;

  grantAccess: (opts: { patientUhid: string; authorizedUserUhid: string; relationship: AccessRelationship; basis: AccessBasis; scope: AccessScope[]; validUntil?: string; revocable: boolean }) => { ok: boolean; message: string; grant?: AccessGrant };
  revokeAccessGrant: (grantId: string, reason: string) => { ok: boolean; message: string };
  getGrantsForPatient: (patientUhid: string) => AccessGrant[];
  getGrantsByUser: (userUhid: string) => AccessGrant[];
  isGrantExpiringSoon: (grant: AccessGrant) => boolean;
  logRecordAccess: (targetUhid: string, detail: string) => void;

  requestRefund: (txnId: string, reason: string) => RefundRequest;
  authorizeRefund: (refundId: string, method: 'Patient OTP' | 'Patient Portal Approval' | 'Authorised Staff') => void;
  staffApproveRefund: (refundId: string) => void;

  payInvestigation: (id: string, result: 'success' | 'failed') => void;
  payMedicine: (id: string, result: 'success' | 'failed') => void;

  submitDietRequest: (mealType: DietSelfRequest['mealType'], menuItems: string[], adhocRequest: string) => DietSelfRequest;
  submitFeedback: (service: string, department: string, rating: number, comment: string, appointmentId?: string) => Feedback;
  submitServiceRequest: (category: string, department: string, description: string) => ServiceRequest;
  submitComplaint: (category: string, department: string, description: string) => Complaint;
  escalateOverdueComplaints: () => void;
  patientConfirmComplaint: (id: string, satisfied: boolean) => void;

  staffRespondComplaint: (id: string, response: string) => void;
  staffCloseComplaint: (id: string) => void;

  submitChiefComplaint: (appointmentId: string, data: { predefinedItems: string[]; freeText: string }) => ChiefComplaint;
  getChiefComplaint: (appointmentId: string) => ChiefComplaint | undefined;

  staffLogin: (username: string, password: string) => { ok: boolean; message: string };
  staffLogout: () => void;
  staffRespondServiceRequest: (id: string, response: string) => void;
  staffCloseServiceRequest: (id: string) => void;
  staffEscalateServiceRequest: (id: string) => void;

  updateServiceMasterEntry: (id: string, patch: Partial<ServiceMasterEntry>) => void;
  updateDepartmentMappingEntry: (id: string, patch: Partial<DepartmentMappingEntry>) => void;
  updateSLAMasterEntry: (id: string, patch: Partial<SLAMasterEntry>) => void;
  updateNotificationMasterEntry: (id: string, patch: Partial<NotificationMasterEntry>) => void;
  updatePayerMasterEntry: (id: string, patch: Partial<PayerMasterEntry>) => void;
  updateTariffMasterEntry: (id: string, patch: Partial<TariffMasterEntry>) => void;
  updateFeedbackMasterEntry: (id: string, patch: Partial<FeedbackMasterEntry>) => void;
  updateComplaintCategoryMasterEntry: (id: string, patch: Partial<ComplaintCategoryMasterEntry>) => void;

  // Feature 2 — Medicine dose reminders / daily checklist
  toggleDoseTaken: (patientUhid: string, medicineOrderId: string, doseLabel: string, date: string) => void;

  // Feature 4 — Post-discharge recovery checklist
  toggleRecoveryChecklistItem: (patientUhid: string, ipVisitId: string, itemId: string) => void;

  // Feature 5 — Waitlist for fully-booked slots
  joinWaitlist: (patientUhid: string, doctorId: string, date: string) => { ok: boolean; message: string };
  cancelWaitlistEntry: (id: string) => void;
  getWaitlistForPatient: (patientUhid: string) => WaitlistEntry[];

  // M14 — Health Camps, Offers & Advertisements (BRD §18)
  getVisibleContent: (patient: Patient) => Announcement[];
  getTargetedContent: (patient: Patient) => Announcement[];
  registerForCamp: (contentId: string, patientUhid: string) => { ok: boolean; message: string };
  getCampRegistrationCount: (contentId: string) => number;
  bookmarkContent: (id: string) => void;
  unbookmarkContent: (id: string) => void;
  recordImpression: (id: string) => void;
  recordTap: (id: string) => void;
  createContentItem: (data: Omit<Announcement, 'id' | 'approvalStatus' | 'displaySequence'> & { displaySequence?: number }) => Announcement;
  updateContentItem: (id: string, patch: Partial<Announcement>) => void;
  setContentApproval: (id: string, status: 'Approved' | 'Rejected') => void;
  toggleContentActive: (id: string) => void;
  reorderContent: (id: string, direction: 'up' | 'down') => void;

  pushNotification: (n: Omit<NotificationItem, 'id' | 'timestamp'>) => void;
  pushAudit: (a: Omit<AuditEvent, 'id' | 'timestamp'>) => void;

  // DPDP consent ledger + data-principal rights
  consents: ConsentRecord[];
  dataRequests: DataRightRequest[];
  nominees: Nominee[];
  getConsentState: (subject: string) => Partial<Record<ConsentPurpose, boolean>>;
  setConsent: (subject: string, purpose: ConsentPurpose, granted: boolean, channel: ConsentRecord['channel'], detail?: string) => void;
  recordLoginConsent: (subject: string, optional: Partial<Record<ConsentPurpose, boolean>>) => void;
  submitDataRequest: (patientUhid: string, type: DataRightType, detail: string, completeNow?: boolean) => DataRightRequest;
  setNominee: (subject: string, n: Omit<Nominee, 'subject'> | null) => void;
}

const StoreContext = createContext<StoreShape | null>(null);

let otpAttempts: Record<string, number> = {};
let tokenCounterG = 42;
let tokenCounterC = 18;

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [patients, setPatients] = useState<Patient[]>(seed.seedPatients);
  const [doctors] = useState<Doctor[]>(seed.seedDoctors);
  const [appointments, setAppointments] = useState<Appointment[]>(seed.seedAppointments);
  const [payments, setPayments] = useState<PaymentTxn[]>(seed.seedPayments);
  const [refunds, setRefunds] = useState<RefundRequest[]>(seed.seedRefunds);
  const [investigations, setInvestigations] = useState<Investigation[]>(seed.seedInvestigations);
  const [medicines, setMedicines] = useState<MedicineOrder[]>(seed.seedMedicines);
  const [dietRequests, setDietRequests] = useState<DietSelfRequest[]>(seed.seedDietRequests);
  const [feedback, setFeedback] = useState<Feedback[]>(seed.seedFeedback);
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>(seed.seedServiceRequests);
  const [complaints, setComplaints] = useState<Complaint[]>(seed.seedComplaints);
  const [notifications, setNotifications] = useState<NotificationItem[]>(seed.seedNotifications);
  const [audit, setAudit] = useState<AuditEvent[]>(seed.seedAudit);
  const [consents, setConsents] = useState<ConsentRecord[]>(() => {
    const base = (purpose: ConsentPurpose, granted: boolean, ts: string): ConsentRecord => ({ id: 'CON-' + purpose + ts, subject: '9414023871', purpose, granted, version: seed.CONSENT_VERSION, timestamp: ts, channel: 'Login' });
    return [base('care', true, '2026-08-12T10:02:00.000Z'), base('reminders', true, '2026-08-12T10:02:00.000Z')];
  });
  const [dataRequests, setDataRequests] = useState<DataRightRequest[]>([]);
  const [nominees, setNominees] = useState<Nominee[]>([]);
  const [chiefComplaints, setChiefComplaints] = useState<ChiefComplaint[]>(seed.seedChiefComplaints);
  const [serviceMaster, setServiceMaster] = useState<ServiceMasterEntry[]>(seed.seedServiceMaster);
  const [departmentMappingMaster, setDepartmentMappingMaster] = useState<DepartmentMappingEntry[]>(seed.seedDepartmentMappingMaster);
  const [slaMasterConfig, setSlaMasterConfig] = useState<SLAMasterEntry[]>(seed.seedSLAMaster);
  const [notificationMaster, setNotificationMaster] = useState<NotificationMasterEntry[]>(seed.seedNotificationMaster);
  const [ipVisits] = useState<IPVisit[]>(seed.seedIPVisits);
  const [vitals] = useState<VitalsReading[]>(seed.seedVitals);
  const [ipBills] = useState<IPBill[]>(seed.seedIPBills);
  const [correctionRequests, setCorrectionRequests] = useState<CorrectionRequest[]>(seed.seedCorrectionRequests);
  const [accessGrants, setAccessGrants] = useState<AccessGrant[]>(seed.seedAccessGrants);
  const [contentItems, setContentItems] = useState<Announcement[]>(seed.seedAnnouncements);
  const [campRegistrations, setCampRegistrations] = useState<CampRegistration[]>(seed.seedCampRegistrations);
  const [bookmarkedContentIds, setBookmarkedContentIds] = useState<string[]>([]);
  const [contentAnalytics, setContentAnalytics] = useState<Record<string, { impressions: number; taps: number }>>({});
  const [payerMaster, setPayerMaster] = useState<PayerMasterEntry[]>(seed.seedPayerMaster);
  const [tariffMaster, setTariffMaster] = useState<TariffMasterEntry[]>(seed.seedTariffMaster);
  const [feedbackMaster, setFeedbackMaster] = useState<FeedbackMasterEntry[]>(seed.seedFeedbackMaster);
  const [complaintCategoryMaster, setComplaintCategoryMaster] = useState<ComplaintCategoryMasterEntry[]>(seed.seedComplaintCategoryMaster);
  const [doseLog, setDoseLog] = useState<DoseLogEntry[]>([]);
  const [recoveryChecklistLog, setRecoveryChecklistLog] = useState<RecoveryChecklistLogEntry[]>([]);
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([]);

  const [currentPatientUhid, setCurrentPatientUhid] = useState<string | null>(null);
  const [authedAsFamilyHead, setAuthedAsFamilyHead] = useState<string | null>(null);
  const [currentStaffId, setCurrentStaffId] = useState<string | null>(null);
  const [selfRegistrationMode, setSelfRegistrationMode] = useState<SelfRegistrationMode>(seed.DEFAULT_SELF_REGISTRATION_MODE);

  // Policy & Configuration (BRD §19.1)
  const [enablePayLater, setEnablePayLater] = useState<boolean>(true);
  const [enableLiveQueue, setEnableLiveQueue] = useState<boolean>(true);
  const [emrVisibilityWindowDays, setEmrVisibilityWindowDays] = useState<number>(365);
  const [emrDownloadLimitPerDoc, setEmrDownloadLimitPerDoc] = useState<number>(0);
  const [mandatoryFeedbackGateOpPost, setMandatoryFeedbackGateOpPost] = useState<boolean>(true);
  const [mandatoryFeedbackGateIpPreDischarge, setMandatoryFeedbackGateIpPreDischarge] = useState<boolean>(true);
  const [allowInappCorrectionRequest, setAllowInappCorrectionRequest] = useState<boolean>(true);
  const [autoAuthorizeLinkedUhids, setAutoAuthorizeLinkedUhids] = useState<boolean>(false);

  const pushNotification = useCallback((n: Omit<NotificationItem, 'id' | 'timestamp'>) => {
    setNotifications(prev => [{ ...n, id: genId('N'), timestamp: nowIso() }, ...prev]);
  }, []);

  const pushAudit = useCallback((a: Omit<AuditEvent, 'id' | 'timestamp'>) => {
    setAudit(prev => [{ ...a, id: genId('AUD'), timestamp: nowIso() }, ...prev]);
  }, []);

  const getConsentState = useCallback((subject: string) => {
    const out: Partial<Record<ConsentPurpose, boolean>> = {};
    [...consents].filter(c => c.subject === subject).sort((a, b) => a.timestamp.localeCompare(b.timestamp)).forEach(c => { out[c.purpose] = c.granted; });
    return out;
  }, [consents]);

  const setConsent = useCallback((subject: string, purpose: ConsentPurpose, granted: boolean, channel: ConsentRecord['channel'], detail?: string) => {
    setConsents(prev => [...prev, { id: genId('CON'), subject, purpose, granted, version: seed.CONSENT_VERSION, timestamp: nowIso(), channel, detail }]);
    pushAudit({ user: subject, role: 'Patient', action: `Consent ${granted ? 'Granted' : 'Withdrawn'} — ${purpose}${detail ? ` (${detail})` : ''} [notice v${seed.CONSENT_VERSION}, ${channel}]`, reference: subject });
  }, [pushAudit]);

  const recordLoginConsent = useCallback((subject: string, optional: Partial<Record<ConsentPurpose, boolean>>) => {
    const ts = nowIso();
    const rows: ConsentRecord[] = [{ id: genId('CON'), subject, purpose: 'care', granted: true, version: seed.CONSENT_VERSION, timestamp: ts, channel: 'Login' }];
    (['reminders', 'whatsapp', 'marketing'] as ConsentPurpose[]).forEach(pp => rows.push({ id: genId('CON'), subject, purpose: pp, granted: !!optional[pp], version: seed.CONSENT_VERSION, timestamp: ts, channel: 'Login' }));
    setConsents(prev => [...prev, ...rows]);
    pushAudit({ user: subject, role: 'Patient', action: `Consent captured at login — required: care; optional: ${(['reminders', 'whatsapp', 'marketing'] as ConsentPurpose[]).filter(pp => optional[pp]).join(', ') || 'none'} [notice v${seed.CONSENT_VERSION}]`, reference: subject });
  }, [pushAudit]);

  const submitDataRequest = useCallback((patientUhid: string, type: DataRightType, detail: string, completeNow?: boolean) => {
    const created = new Date();
    const due = new Date(created.getTime() + seed.GRIEVANCE_SLA_DAYS * 86400000);
    const req: DataRightRequest = { id: genId('DPR'), patientUhid, type, detail, status: completeNow ? 'Completed' : 'Submitted', createdAt: created.toISOString(), dueBy: due.toISOString() };
    setDataRequests(prev => [req, ...prev]);
    const name = patients.find(p => p.uhid === patientUhid)?.name || 'Patient';
    pushAudit({ user: name, role: 'Patient', action: `Data Right Request — ${type}${completeNow ? ' (fulfilled instantly)' : ''}`, reference: req.id });
    pushNotification({ recipient: patientUhid, channel: 'Portal', event: completeNow ? `Privacy: your data copy (${req.id}) is ready` : `Privacy: ${type} request ${req.id} received — response due within ${seed.GRIEVANCE_SLA_DAYS} days`, status: 'Delivered' });
    return req;
  }, [patients, pushAudit, pushNotification]);

  const setNominee = useCallback((subject: string, n: Omit<Nominee, 'subject'> | null) => {
    setNominees(prev => { const rest = prev.filter(x => x.subject !== subject); return n ? [...rest, { subject, ...n }] : rest; });
    pushAudit({ user: subject, role: 'Patient', action: n ? `Nominee set — ${n.name} (${n.relation})` : 'Nominee removed', reference: subject });
  }, [pushAudit]);

  const loginWithOtp = useCallback((mobile: string, otp: string) => {
    const key = mobile;
    if (otp !== '123456') {
      otpAttempts[key] = (otpAttempts[key] || 0) + 1;
      if (otpAttempts[key] >= 3) {
        return { ok: false, message: 'Account locked after 3 incorrect OTP attempts. Please retry after some time or contact the hospital.' };
      }
      return { ok: false, message: `Invalid OTP. ${3 - otpAttempts[key]} attempt(s) remaining. (Demo OTP: 123456)` };
    }
    otpAttempts[key] = 0;
    const matches = patients.filter(p => p.mobile === mobile);
    if (matches.length === 0) {
      return { ok: false, message: 'No matching HIMS profile found for this mobile number. Proceed to New Patient Registration.' };
    }
    if (matches.length > 1) {
      return { ok: false, message: 'Multiple HIMS records share this mobile number. Please select your profile to continue.', multiMatch: matches };
    }
    setCurrentPatientUhid(matches[0].uhid);
    setAuthedAsFamilyHead(matches[0].familyHeadUhid ? null : matches[0].uhid);
    pushAudit({ user: matches[0].name, role: 'Patient', action: 'OTP Verified — Login', reference: matches[0].uhid });
    return { ok: true, message: 'Login successful.' };
  }, [patients, pushAudit]);

  const selectPatientProfile = useCallback((uhid: string) => {
    const p = patients.find(pp => pp.uhid === uhid);
    if (!p) return;
    setCurrentPatientUhid(uhid);
    setAuthedAsFamilyHead(p.familyHeadUhid ? null : p.uhid);
    pushAudit({ user: p.name, role: 'Patient', action: 'Profile Selected (multi-match resolution) — Login', reference: uhid });
  }, [patients, pushAudit]);

  const logout = useCallback(() => { setCurrentPatientUhid(null); setAuthedAsFamilyHead(null); }, []);

  const registerPatient = useCallback((data: Partial<Patient>) => {
    const nameNorm = (data.name || '').trim().toLowerCase();
    const dob = data.dob;
    // Conclusive duplicate: same name + dob match an existing record
    const conclusive = patients.find(p => p.name.trim().toLowerCase() === nameNorm && p.dob === dob);
    if (conclusive) {
      return { outcome: 'conclusive' as const, patient: conclusive, message: `An existing HIMS profile (${conclusive.uhid}) matches this name and date of birth. Please confirm to reuse this profile instead of creating a duplicate.` };
    }
    // Uncertain duplicate: same name only, different DOB — simulated ambiguous case
    const uncertain = patients.find(p => p.name.trim().toLowerCase() === nameNorm && p.dob !== dob);
    if (uncertain) {
      return { outcome: 'uncertain' as const, message: 'A similarly-named record exists in HIMS but demographic details do not conclusively match. Registration is stopped — please visit the hospital Registration/OPD Counter for manual verification.' };
    }
    const newUhid = `GMCH-UD-${200000 + Math.floor(Math.random() * 9000)}`;
    const newPatient: Patient = {
      uhid: newUhid,
      name: data.name || 'New Patient',
      mobile: data.mobile || '',
      dob: data.dob || '',
      gender: (data.gender as any) || 'Male',
      address: data.address || '',
      patientType: 'OPD',
      payer: 'Cash',
      payerVerified: true,
    };
    setPatients(prev => [...prev, newPatient]);
    setCurrentPatientUhid(newUhid);
    setAuthedAsFamilyHead(newUhid);
    pushAudit({ user: newPatient.name, role: 'Patient', action: 'New UHID Created (Self-Registration)', newState: 'Cash / Cash Tariff', reference: newUhid });
    return { outcome: 'created' as const, patient: newPatient, message: `New UHID ${newUhid} created. You are registered as a Cash patient.` };
  }, [patients, pushAudit]);

  const addFamilyMember = useCallback((data: { name: string; mobile: string; dob: string; idNumber: string }) => {
    if (!authedAsFamilyHead) return { outcome: 'uncertain' as const, message: 'Only an authenticated Family Head may add family members.' };
    const nameNorm = data.name.trim().toLowerCase();
    // conclusive: matches an unlinked existing patient by name+dob+mobile (at least 2 of 3 parameters)
    const candidate = patients.find(p => p.name.trim().toLowerCase() === nameNorm);
    const paramMatches = candidate ? [candidate.dob === data.dob, candidate.mobile === data.mobile].filter(Boolean).length : 0;
    if (candidate && paramMatches >= 2) {
      setPatients(prev => prev.map(p => p.uhid === candidate.uhid ? { ...p, familyHeadUhid: authedAsFamilyHead, relation: 'Family Member' } : p));
      pushAudit({ user: patients.find(p => p.uhid === authedAsFamilyHead)?.name || '', role: 'Patient (Family Head)', action: `Family Member Linked — ${candidate.name}`, reference: candidate.uhid });
      return { outcome: 'linked' as const, message: `${candidate.name} (${candidate.uhid}) matched conclusively on multiple parameters and has been linked to your family account.` };
    }
    pushAudit({ user: patients.find(p => p.uhid === authedAsFamilyHead)?.name || '', role: 'Patient (Family Head)', action: `Family Link Attempt — Uncertain Match (${data.name})`, reference: 'N/A' });
    return { outcome: 'uncertain' as const, message: 'Identity could not be conclusively matched against HIMS using name, DOB, mobile and ID together. This member has not been linked — please visit the hospital Registration Counter for manual verification. (Aadhar/ID alone is never sufficient.)' };
  }, [authedAsFamilyHead, patients, pushAudit]);

  const submitCorrectionRequest = useCallback((field: CorrectionField, currentValue: string, requestedValue: string, reason: string) => {
    const patient = patients.find(p => p.uhid === currentPatientUhid);
    const req: CorrectionRequest = {
      id: genId('COR'), patientUhid: currentPatientUhid || '', field, currentValue, requestedValue, reason,
      status: 'Pending', createdAt: nowIso(),
    };
    setCorrectionRequests(prev => [req, ...prev]);
    pushNotification({ recipient: 'MRD Queue (Staff)', channel: 'Staff Portal', event: `New Profile Correction Request ${req.id} (${field})`, status: 'Delivered' });
    pushAudit({ user: patient?.name || 'Patient', role: 'Patient', action: `Profile Correction Request Submitted (${field}: "${currentValue}" → "${requestedValue}")`, reference: req.id });
    return req;
  }, [currentPatientUhid, patients, pushNotification, pushAudit]);

  const staffResolveCorrectionRequest = useCallback((id: string, decision: 'Approved' | 'Rejected', remarks: string) => {
    setCorrectionRequests(prev => prev.map(r => {
      if (r.id !== id) return r;
      if (decision === 'Approved') {
        const fieldMap: Partial<Record<CorrectionField, keyof Patient>> = { Name: 'name', DOB: 'dob', Gender: 'gender', 'Mobile Number': 'mobile' };
        const patientField = fieldMap[r.field];
        if (patientField) {
          setPatients(pp => pp.map(p => p.uhid === r.patientUhid ? { ...p, [patientField]: r.requestedValue } : p));
        }
      }
      pushNotification({ recipient: r.patientUhid, channel: 'Portal', event: `Profile Correction Request ${r.id} ${decision}`, status: 'Delivered' });
      pushAudit({ user: 'MRD Staff', role: 'MRD / Registration Staff', action: `Profile Correction Request ${decision} (${r.field})${remarks ? ` — ${remarks}` : ''}`, previousState: 'Pending', newState: decision, reference: r.id });
      return { ...r, status: decision, staffRemarks: remarks, resolvedAt: nowIso(), resolvedBy: 'MRD Staff' };
    }));
  }, [pushNotification, pushAudit]);

  const getGrantsForPatient = useCallback((patientUhid: string) => accessGrants.filter(g => g.patientUhid === patientUhid && !g.revokedAt), [accessGrants]);
  const getGrantsByUser = useCallback((userUhid: string) => accessGrants.filter(g => g.authorizedUserUhid === userUhid && !g.revokedAt), [accessGrants]);
  const isGrantExpiringSoon = useCallback((grant: AccessGrant) => {
    if (!grant.validUntil) return false;
    const days = (new Date(grant.validUntil).getTime() - Date.now()) / 86400000;
    return days >= 0 && days <= 30;
  }, []);

  const grantAccess = useCallback((opts: { patientUhid: string; authorizedUserUhid: string; relationship: AccessRelationship; basis: AccessBasis; scope: AccessScope[]; validUntil?: string; revocable: boolean }) => {
    const patient = patients.find(p => p.uhid === opts.patientUhid);
    const authorizedUser = patients.find(p => p.uhid === opts.authorizedUserUhid);
    if (!authorizedUser) return { ok: false, message: `No HIMS profile found for UHID ${opts.authorizedUserUhid}.` };
    if (opts.authorizedUserUhid === opts.patientUhid) return { ok: false, message: 'Cannot grant access to yourself.' };
    const grant: AccessGrant = {
      id: genId('AG'), patientUhid: opts.patientUhid, authorizedUserUhid: opts.authorizedUserUhid,
      relationship: opts.relationship, basis: opts.basis, scope: opts.scope,
      validFrom: nowIso().slice(0, 10), validUntil: opts.validUntil, revocable: opts.revocable,
      createdAt: nowIso(), createdBy: patient?.name || 'Patient',
    };
    setAccessGrants(prev => [grant, ...prev]);
    pushNotification({ recipient: authorizedUser.name, channel: 'Portal', event: `You have been granted access to ${patient?.name}'s records (${opts.relationship})`, status: 'Delivered' });
    pushAudit({ user: patient?.name || 'Patient', role: 'Patient', action: `Access Grant Created — ${authorizedUser.name} (${opts.relationship}, ${opts.basis}, scope: ${opts.scope.join(', ')})`, reference: grant.id });
    return { ok: true, message: `Access granted to ${authorizedUser.name}.`, grant };
  }, [patients, pushNotification, pushAudit]);

  const revokeAccessGrant = useCallback((grantId: string, reason: string) => {
    const grant = accessGrants.find(g => g.id === grantId);
    if (!grant) return { ok: false, message: 'Grant not found.' };
    if (!grant.revocable) return { ok: false, message: 'This grant is not revocable in-app — hospital/legal action is required (documented guardianship).' };
    const patient = patients.find(p => p.uhid === grant.patientUhid);
    setAccessGrants(prev => prev.map(g => g.id === grantId ? { ...g, revokedAt: nowIso(), revokedBy: patient?.name || 'Patient', revokedReason: reason } : g));
    pushAudit({ user: patient?.name || 'Patient', role: 'Patient', action: `Access Grant Revoked — ${grant.relationship} (${reason})`, previousState: 'Active', newState: 'Revoked', reference: grantId });
    return { ok: true, message: 'Access revoked.' };
  }, [accessGrants, patients, pushAudit]);

  const logRecordAccess = useCallback((targetUhid: string, detail: string) => {
    const viewer = patients.find(p => p.uhid === currentPatientUhid);
    const target = patients.find(p => p.uhid === targetUhid);
    if (!viewer || !target || viewer.uhid === target.uhid) return;
    const grant = accessGrants.find(g => g.patientUhid === targetUhid && g.authorizedUserUhid === currentPatientUhid && !g.revokedAt);
    pushAudit({
      user: viewer.name, role: 'Patient (Authorized User)',
      action: `Cross-Patient Record Access — ${detail}${grant ? ` (under grant ${grant.id}, ${grant.relationship})` : ' (family-group view)'}`,
      reference: target.uhid,
    });
  }, [patients, currentPatientUhid, accessGrants, pushAudit]);

  const switchActivePatient = useCallback((uhid: string) => {
    if (uhid !== currentPatientUhid) logRecordAccess(uhid, 'Switched active profile');
    setCurrentPatientUhid(uhid);
  }, [currentPatientUhid, logRecordAccess]);

  const bookAppointment = useCallback((opts: { patientUhid: string; doctorId: string; date: string; time: string; paymentOption: 'Pay Now' | 'Pay Later' }) => {
    const patient = patients.find(p => p.uhid === opts.patientUhid)!;
    const doctor = doctors.find(d => d.id === opts.doctorId)!;
    // Smart Appointment Engine — hard block: an actively admitted IP patient cannot book an OPD appointment.
    if (isPatientActivelyAdmitted(ipVisits, opts.patientUhid)) {
      throw new Error(`${patient.name} is currently admitted (active IP visit). OPD booking is blocked while admission is active — please contact the ward for OPD consultation needs during admission.`);
    }
    // revalidate availability (race condition guard)
    const { slots } = getSlotsForDoctor(doctor, opts.date);
    const slot = slots.find(s => s.time === opts.time);
    if (!slot || !slot.available) {
      throw new Error('Selected slot is no longer available. Please choose another slot.');
    }
    const apt: Appointment = {
      id: `APT-2026-${String(10000 + appointments.length + 1).slice(-5)}`,
      patientUhid: opts.patientUhid,
      doctorId: opts.doctorId,
      date: opts.date,
      time: opts.time,
      payer: patient.payer,
      onlinePaid: 0,
      finalTariff: doctor.fee,
      paymentOption: opts.paymentOption,
      status: opts.paymentOption === 'Pay Now' ? 'Appointment Requested' : 'Payment Pending',
      token: null,
      createdAt: nowIso(),
      rescheduleCount: 0,
    };
    setAppointments(prev => [apt, ...prev]);
    pushAudit({ user: patient.name, role: 'Patient', action: `Appointment Created (${opts.paymentOption})`, newState: apt.status, reference: apt.id });
    return apt;
  }, [patients, doctors, appointments, ipVisits, pushAudit]);

  const payNow = useCallback((appointmentId: string, simulate: 'success' | 'failed' | 'timeout') => {
    setAppointments(prev => prev.map(a => {
      if (a.id !== appointmentId) return a;
      const patient = patients.find(p => p.uhid === a.patientUhid)!;
      const doctor = doctors.find(d => d.id === a.doctorId)!;
      const amount = doctor.fee;
      if (simulate === 'success') {
        const token = fmtToken('G', ++tokenCounterG);
        setPayments(pp => [{ id: `TXN-${Math.floor(80000 + Math.random() * 9000)}`, appointmentId, patientUhid: a.patientUhid, amount, originalTariff: amount, finalTariff: amount, payer: a.payer, method: 'UPI', status: 'Success', timestamp: nowIso(), reference: `UPI/${Date.now()}`, purpose: 'OPD Consultation' }, ...pp]);
        pushNotification({ recipient: patient.name, channel: 'SMS', event: `Appointment Confirmed — ${a.id}, Token ${token}`, status: 'Delivered' });
        pushNotification({ recipient: patient.name, channel: 'Portal', event: `Appointment Confirmed — ${a.id}, Token ${token}`, status: 'Delivered' });
        pushAudit({ user: patient.name, role: 'Patient', action: 'Pay Now — Payment Success', previousState: 'Appointment Requested', newState: 'Token Generated', reference: a.id });
        return { ...a, status: 'Token Generated', token, onlinePaid: amount, finalTariff: amount };
      } else {
        setPayments(pp => [{ id: `TXN-${Math.floor(80000 + Math.random() * 9000)}`, appointmentId, patientUhid: a.patientUhid, amount, payer: a.payer, method: 'UPI', status: simulate === 'timeout' ? 'Timeout' : 'Failed', timestamp: nowIso(), reference: `UPI/${Date.now()}`, purpose: 'OPD Consultation' }, ...pp]);
        pushAudit({ user: patient.name, role: 'Patient', action: `Pay Now — Payment ${simulate === 'timeout' ? 'Timeout' : 'Failed'}`, previousState: 'Appointment Requested', newState: 'Cancelled', reference: a.id });
        return { ...a, status: 'Cancelled' };
      }
    }));
  }, [patients, doctors, pushNotification, pushAudit]);

  const counterCollectPayLater = useCallback((appointmentId: string) => {
    setAppointments(prev => prev.map(a => {
      if (a.id !== appointmentId) return a;
      const patient = patients.find(p => p.uhid === a.patientUhid)!;
      const doctor = doctors.find(d => d.id === a.doctorId)!;
      const amount = doctor.fee;
      const token = fmtToken('C', ++tokenCounterC);
      setPayments(pp => [{ id: `TXN-${Math.floor(80000 + Math.random() * 9000)}`, appointmentId, patientUhid: a.patientUhid, amount, originalTariff: amount, finalTariff: amount, payer: a.payer, method: 'Cash (Counter)', status: 'Paid at Counter', timestamp: nowIso(), reference: `CTR/${Date.now()}`, purpose: 'OPD Consultation' }, ...pp]);
      pushNotification({ recipient: patient.name, channel: 'Portal', event: `Checked-in — OPD Slip generated, Token ${token}`, status: 'Delivered' });
      pushAudit({ user: 'OPD Counter Staff', role: 'Counter Staff', action: 'Pay Later — Counter Payment Collected, Checked-in', previousState: 'Payment Pending', newState: 'Token Generated', reference: a.id });
      return { ...a, status: 'Token Generated', token, onlinePaid: amount, finalTariff: amount };
    }));
  }, [patients, doctors, pushNotification, pushAudit]);

  const reconcileAtCounter = useCallback((appointmentId: string, finalTariff: number, newPayer?: 'Cash' | 'RGHS' | 'TPA') => {
    setAppointments(prev => prev.map(a => {
      if (a.id !== appointmentId) return a;
      const originalTariff = a.finalTariff ?? a.onlinePaid;
      const diff = finalTariff - a.onlinePaid;
      let purpose: 'Counter Balance' | 'Refund' = 'Counter Balance';
      let txnStatus: PaymentTxn['status'] = 'Paid at Counter';
      let amount = 0;
      if (diff > 0) { amount = diff; purpose = 'Counter Balance'; txnStatus = 'Paid at Counter'; }
      else if (diff < 0) { amount = Math.abs(diff); purpose = 'Refund'; txnStatus = 'Refund Pending'; }
      if (diff !== 0) {
        setPayments(pp => [{ id: `TXN-${Math.floor(80000 + Math.random() * 9000)}`, appointmentId, patientUhid: a.patientUhid, amount, originalTariff, finalTariff, payer: newPayer || a.payer, method: diff > 0 ? 'Cash (Counter)' : 'Adjustment', status: txnStatus, timestamp: nowIso(), reference: `RCN/${Date.now()}`, purpose }, ...pp]);
      }
      pushAudit({
        user: 'OPD Counter Staff', role: 'Counter Staff',
        action: `Tariff Reconciliation${newPayer && newPayer !== a.payer ? ` — Payer changed ${a.payer} → ${newPayer}` : ''}${diff > 0 ? ` — Collected ₹${diff}` : diff < 0 ? ` — Refund/Advance ₹${Math.abs(diff)}` : ' — Exact match'}`,
        previousState: `Tariff ₹${originalTariff}`, newState: `Tariff ₹${finalTariff}`, reference: a.id,
      });
      return { ...a, finalTariff, payer: newPayer || a.payer, status: 'Checked-in' };
    }));
  }, [pushAudit]);

  // Feature 5 — notify any waitlisted patients when a doctor/date slot may have freed up
  // (called from cancelAppointment / rescheduleAppointment below).
  const notifyWaitlistForOpening = useCallback((doctorId: string, date: string) => {
    const doctor = doctors.find(d => d.id === doctorId);
    waitlist.filter(w => w.doctorId === doctorId && w.date === date).forEach(w => {
      const p = patients.find(pp => pp.uhid === w.patientUhid);
      pushNotification({ recipient: p?.name || w.patientUhid, channel: 'Portal', event: `A slot may have opened up with ${doctor?.name || 'your doctor'} on ${date} — tap to check availability and book.`, status: 'Delivered' });
      pushAudit({ user: 'System', role: 'System', action: `Waitlist Notification Sent — ${doctor?.name || doctorId} on ${date}`, reference: w.id });
    });
  }, [waitlist, doctors, patients, pushNotification, pushAudit]);

  const rescheduleAppointment = useCallback((appointmentId: string, newDate: string, newTime: string) => {
    const apt = appointments.find(a => a.id === appointmentId);
    if (!apt) return { ok: false, message: 'Appointment not found.', fee: 0 };
    if (apt.rescheduleCount >= 2) return { ok: false, message: 'Maximum 2 reschedules per appointment already used.', fee: 0 };
    const doctor = doctors.find(d => d.id === apt.doctorId)!;
    const { slots, reason } = getSlotsForDoctor(doctor, newDate);
    if (reason) return { ok: false, message: reason, fee: 0 };
    const slot = slots.find(s => s.time === newTime);
    if (!slot || !slot.available) return { ok: false, message: 'Selected slot is not available.', fee: 0 };
    const { fee } = getCancellationPolicy(apt);
    const patient = patients.find(p => p.uhid === apt.patientUhid);
    setAppointments(prev => prev.map(a => a.id === appointmentId ? { ...a, date: newDate, time: newTime, rescheduleCount: a.rescheduleCount + 1, status: a.status === 'Token Generated' || a.status === 'Checked-in' ? 'Appointment Confirmed' : a.status, token: null } : a));
    pushNotification({ recipient: patient?.name || 'Patient', channel: 'Portal', event: `Appointment ${appointmentId} rescheduled to ${newDate} ${newTime}`, status: 'Delivered' });
    pushAudit({ user: patient?.name || 'Patient', role: 'Patient', action: `Appointment Rescheduled${fee > 0 ? ` — Fee ₹${fee} applied (within 4hr window)` : ' — No fee (free window)'}`, previousState: `${apt.date} ${apt.time}`, newState: `${newDate} ${newTime}`, reference: appointmentId });
    notifyWaitlistForOpening(apt.doctorId, apt.date); // the old slot is now free
    return { ok: true, message: fee > 0 ? `Rescheduled. A ₹${fee} rescheduling fee applies as this was within the 4-hour window.` : 'Rescheduled successfully — no fee (outside the 4-hour window).', fee };
  }, [appointments, doctors, patients, pushNotification, pushAudit, notifyWaitlistForOpening]);

  const cancelAppointment = useCallback((appointmentId: string) => {
    const apt = appointments.find(a => a.id === appointmentId);
    if (!apt) return { ok: false, message: 'Appointment not found.', fee: 0 };
    const { fee } = getCancellationPolicy(apt);
    const patient = patients.find(p => p.uhid === apt.patientUhid);
    setAppointments(prev => prev.map(a => a.id === appointmentId ? { ...a, status: 'Cancelled' } : a));
    pushNotification({ recipient: patient?.name || 'Patient', channel: 'Portal', event: `Appointment ${appointmentId} cancelled`, status: 'Delivered' });
    pushAudit({ user: patient?.name || 'Patient', role: 'Patient', action: `Appointment Cancelled${fee > 0 ? ` — Cancellation fee ₹${fee} applies` : ' — No fee'}`, previousState: apt.status, newState: 'Cancelled', reference: appointmentId });
    notifyWaitlistForOpening(apt.doctorId, apt.date);
    return { ok: true, message: fee > 0 ? `Cancelled. A ₹${fee} cancellation fee applies as this was within the 4-hour window.` : 'Cancelled successfully — no fee.', fee };
  }, [appointments, patients, pushNotification, pushAudit, notifyWaitlistForOpening]);

  const requestRefund = useCallback((txnId: string, reason: string) => {
    const txn = payments.find(p => p.id === txnId)!;
    const eligible = txn.status === 'Success' || txn.status === 'Paid at Counter';
    const refund: RefundRequest = {
      id: `RFD-${Math.floor(1000 + Math.random() * 9000)}`,
      transactionId: txnId, patientUhid: txn.patientUhid, amount: txn.amount, reason,
      eligibility: eligible ? 'Eligible' : 'Not Eligible',
      authorized: false,
      status: eligible ? 'Requested' : 'Rejected',
      requestedAt: nowIso(),
    };
    setRefunds(prev => [refund, ...prev]);
    pushAudit({ user: 'Patient', role: 'Patient', action: `Refund Requested (${refund.eligibility})`, reference: refund.id });
    return refund;
  }, [payments, pushAudit]);

  const authorizeRefund = useCallback((refundId: string, method: 'Patient OTP' | 'Patient Portal Approval' | 'Authorised Staff') => {
    setRefunds(prev => prev.map(r => r.id === refundId ? { ...r, authMethod: method, authorized: true, status: 'Staff Verification' } : r));
    pushAudit({ user: 'Patient', role: 'Patient', action: `Refund Authorized via ${method}`, reference: refundId });
  }, [pushAudit]);

  const staffApproveRefund = useCallback((refundId: string) => {
    setRefunds(prev => prev.map(r => {
      if (r.id !== refundId) return r;
      setPayments(pp => pp.map(p => p.id === r.transactionId ? { ...p, status: 'Refunded' } : p));
      pushAudit({ user: 'Billing Staff', role: 'Authorised Staff', action: 'Refund Approved & Processed', previousState: 'Staff Verification', newState: 'Processed', reference: refundId });
      return { ...r, status: 'Processed', processedAt: nowIso() };
    }));
  }, [pushAudit]);

  const payInvestigation = useCallback((id: string, result: 'success' | 'failed') => {
    setInvestigations(prev => prev.map(i => i.id === id ? { ...i, status: result === 'success' ? 'Paid' : 'Failed' } : i));
    pushAudit({ user: 'Patient', role: 'Patient', action: `Investigation Payment ${result === 'success' ? 'Success' : 'Failed'}`, reference: id });
  }, [pushAudit]);

  const payMedicine = useCallback((id: string, result: 'success' | 'failed') => {
    setMedicines(prev => prev.map(m => m.id === id ? { ...m, status: result === 'success' ? 'Paid' : 'Pending Payment' } : m));
    pushAudit({ user: 'Patient', role: 'Patient', action: `Medicine Payment ${result === 'success' ? 'Success' : 'Failed'}`, reference: id });
  }, [pushAudit]);

  const toggleDoseTaken = useCallback((patientUhid: string, medicineOrderId: string, doseLabel: string, date: string) => {
    const patient = patients.find(p => p.uhid === patientUhid);
    const med = medicines.find(m => m.id === medicineOrderId);
    let nowTaken = false;
    setDoseLog(prev => {
      const existing = prev.find(d => d.patientUhid === patientUhid && d.medicineOrderId === medicineOrderId && d.doseLabel === doseLabel && d.date === date);
      if (existing) return prev.filter(d => d.id !== existing.id);
      nowTaken = true;
      return [{ id: genId('DOSE'), patientUhid, medicineOrderId, doseLabel, date, takenAt: nowIso() }, ...prev];
    });
    pushAudit({ user: patient?.name || 'Patient', role: 'Patient', action: `Dose ${nowTaken ? 'Marked Taken' : 'Unmarked'} — ${med?.medicine || medicineOrderId} (${doseLabel}, ${date})`, reference: medicineOrderId });
  }, [patients, medicines, pushAudit]);

  const toggleRecoveryChecklistItem = useCallback((patientUhid: string, ipVisitId: string, itemId: string) => {
    const patient = patients.find(p => p.uhid === patientUhid);
    let nowDone = false;
    setRecoveryChecklistLog(prev => {
      const existing = prev.find(e => e.ipVisitId === ipVisitId && e.itemId === itemId);
      if (existing) return prev.filter(e => e.id !== existing.id);
      nowDone = true;
      return [{ id: genId('RCL'), patientUhid, ipVisitId, itemId, completedAt: nowIso() }, ...prev];
    });
    pushAudit({ user: patient?.name || 'Patient', role: 'Patient', action: `Recovery Checklist Item ${nowDone ? 'Completed' : 'Unmarked'} (${itemId})`, reference: ipVisitId });
  }, [patients, pushAudit]);

  const joinWaitlist = useCallback((patientUhid: string, doctorId: string, date: string) => {
    const patient = patients.find(p => p.uhid === patientUhid);
    const doctor = doctors.find(d => d.id === doctorId);
    if (waitlist.some(w => w.patientUhid === patientUhid && w.doctorId === doctorId && w.date === date)) {
      return { ok: false, message: 'You are already on the waitlist for this doctor and date.' };
    }
    const entry: WaitlistEntry = { id: genId('WL'), patientUhid, doctorId, date, createdAt: nowIso() };
    setWaitlist(prev => [entry, ...prev]);
    pushNotification({ recipient: patient?.name || patientUhid, channel: 'Portal', event: `Added to waitlist for ${doctor?.name || doctorId} on ${date}`, status: 'Delivered' });
    pushAudit({ user: patient?.name || 'Patient', role: 'Patient', action: `Joined Waitlist — ${doctor?.name || doctorId} on ${date}`, reference: entry.id });
    return { ok: true, message: `You'll be notified if a slot opens with ${doctor?.name || 'this doctor'} on ${date}.` };
  }, [patients, doctors, waitlist, pushNotification, pushAudit]);

  const cancelWaitlistEntry = useCallback((id: string) => {
    const entry = waitlist.find(w => w.id === id);
    setWaitlist(prev => prev.filter(w => w.id !== id));
    if (entry) {
      const patient = patients.find(p => p.uhid === entry.patientUhid);
      pushAudit({ user: patient?.name || 'Patient', role: 'Patient', action: 'Waitlist Entry Cancelled', reference: id });
    }
  }, [waitlist, patients, pushAudit]);

  const getWaitlistForPatient = useCallback((patientUhid: string) => waitlist.filter(w => w.patientUhid === patientUhid), [waitlist]);

  const submitDietRequest = useCallback((mealType: DietSelfRequest['mealType'], menuItems: string[], adhocRequest: string) => {
    const patient = patients.find(p => p.uhid === currentPatientUhid);
    // Clinical conflict check: block anything that conflicts with an active prescribed diet order
    // (e.g. a Diabetic Diet patient requesting sugary/fried items — keyword match across menu selections and ad-hoc text).
    const activeDiet = seed.seedDietOrders.find(d => d.patientUhid === currentPatientUhid && d.status === 'Active');
    const restrictedKeywords: Record<string, string[]> = {
      'Diabetic Diet': ['sugar', 'sweet', 'dessert', 'fried', 'sugary'],
    };
    const keywords = activeDiet ? (restrictedKeywords[activeDiet.dietType] || []) : [];
    const combinedText = [...menuItems, adhocRequest].join(' ').toLowerCase();
    const blocked = keywords.length > 0 && keywords.some(k => combinedText.includes(k));
    const req: DietSelfRequest = {
      id: genId('DREQ'), patientUhid: currentPatientUhid || '', mealType, menuItems, adhocRequest,
      status: blocked ? 'Blocked' : 'Submitted',
      blockedReason: blocked ? `Conflicts with prescribed ${activeDiet?.dietType} — clinical restriction.` : undefined,
      createdAt: nowIso(),
    };
    setDietRequests(prev => [req, ...prev]);
    pushAudit({ user: patient?.name || 'Patient', role: 'Patient', action: `Diet Self-Request (${req.status})`, reference: req.id });
    return req;
  }, [currentPatientUhid, patients, pushAudit]);

  const submitFeedback = useCallback((service: string, department: string, rating: number, comment: string, appointmentId?: string) => {
    const patient = patients.find(p => p.uhid === currentPatientUhid);
    const escalate = rating <= 2;
    const fb: Feedback = { id: genId('FB'), patientUhid: currentPatientUhid || '', service, rating, comment, department, status: escalate ? 'Escalated to Service Request' : 'Recorded', createdAt: nowIso(), appointmentId };
    setFeedback(prev => [fb, ...prev]);
    if (escalate) {
      setServiceRequests(prev => [{ id: `REQ-2026-${Math.floor(10000 + Math.random() * 9000)}`, patientUhid: currentPatientUhid || '', category: service, description: `Auto-escalated from low feedback rating: ${comment}`, department, status: 'Submitted', createdAt: nowIso(), slaMinutes: seed.slaMaster[department]?.l1 || 30 }, ...prev]);
    }
    pushAudit({ user: patient?.name || 'Patient', role: 'Patient', action: `Feedback Submitted (${service}, ${rating}/5)${escalate ? ' — Escalated' : ''}`, reference: fb.id });
    return fb;
  }, [currentPatientUhid, patients, pushAudit]);

  const submitServiceRequest = useCallback((category: string, department: string, description: string) => {
    const patient = patients.find(p => p.uhid === currentPatientUhid);
    const req: ServiceRequest = { id: `REQ-2026-${Math.floor(10000 + Math.random() * 9000)}`, patientUhid: currentPatientUhid || '', category, description, department, status: 'Submitted', createdAt: nowIso(), slaMinutes: seed.slaMaster[department]?.l1 || 30 };
    setServiceRequests(prev => [req, ...prev]);
    pushNotification({ recipient: `${department} Dept (Staff)`, channel: 'Staff Portal', event: `New Service Request ${req.id}`, status: 'Delivered' });
    pushAudit({ user: patient?.name || 'Patient', role: 'Patient', action: `Service Request Submitted (${category})`, reference: req.id });
    return req;
  }, [currentPatientUhid, patients, pushNotification, pushAudit]);

  const submitComplaint = useCallback((category: string, department: string, description: string) => {
    const patient = patients.find(p => p.uhid === currentPatientUhid);
    const mapping = seed.departmentMapping[department] || seed.departmentMapping.Housekeeping;
    const sla = seed.slaMaster[department]?.l1 || 30;
    const deadline = new Date(Date.now() + sla * 60000).toISOString();
    const cmp: Complaint = {
      id: `CMP-2026-${Math.floor(10000 + Math.random() * 9000)}`, patientUhid: currentPatientUhid || '', category, description, department,
      level: 'L1', status: 'Submitted', slaMinutes: sla, slaDeadline: deadline, responsiblePerson: mapping.l1, createdAt: nowIso(),
      timeline: [{ label: 'Submitted', timestamp: nowIso() }, { label: `Assigned to ${mapping.l1} (L1)`, timestamp: nowIso() }],
    };
    setComplaints(prev => [cmp, ...prev]);
    pushNotification({ recipient: mapping.l1, channel: 'Staff Portal', event: `Complaint ${cmp.id} assigned to you (L1)`, status: 'Delivered' });
    pushNotification({ recipient: patient?.name || 'Patient', channel: 'Portal', event: `Complaint ${cmp.id} submitted`, status: 'Delivered' });
    pushAudit({ user: patient?.name || 'Patient', role: 'Patient', action: `Complaint Submitted (${category})`, reference: cmp.id });
    return cmp;
  }, [currentPatientUhid, patients, pushNotification, pushAudit]);

  const escalateOverdueComplaints = useCallback(() => {
    const now = Date.now();
    setComplaints(prev => prev.map(c => {
      if (['Resolved', 'Closed', 'Rejected'].includes(c.status)) return c;
      if (new Date(c.slaDeadline).getTime() > now) return c;
      if (c.status === 'SLA Breached' && c.level === 'L3') return c; // already at final level
      const mapping = seed.departmentMapping[c.department] || seed.departmentMapping.Housekeeping;
      const slaCfg = seed.slaMaster[c.department] || seed.slaMaster.Housekeeping;
      let nextLevel: ComplaintLevel = c.level;
      let nextPerson = c.responsiblePerson;
      let nextSlaMin = c.slaMinutes;
      if (c.level === 'L1') { nextLevel = 'L2'; nextPerson = mapping.l2; nextSlaMin = slaCfg.l2; }
      else if (c.level === 'L2') { nextLevel = 'L3'; nextPerson = mapping.l3; nextSlaMin = slaCfg.l3; }
      else return { ...c, status: 'SLA Breached' as const };
      const newDeadline = new Date(Date.now() + nextSlaMin * 60000).toISOString();
      pushNotification({ recipient: nextPerson, channel: 'Staff Portal', event: `Complaint ${c.id} escalated to you (${nextLevel})`, status: 'Delivered' });
      pushAudit({ user: 'System', role: 'System', action: 'SLA Breach Auto-Escalation', previousState: c.level, newState: nextLevel, reference: c.id });
      return { ...c, level: nextLevel, status: 'Escalated' as const, responsiblePerson: nextPerson, slaMinutes: nextSlaMin, slaDeadline: newDeadline, timeline: [...c.timeline, { label: `SLA Breached at ${c.level}`, timestamp: nowIso(), meta: 'auto-escalation' }, { label: `Escalated to ${nextPerson} (${nextLevel})`, timestamp: nowIso() }] };
    }));
  }, [pushNotification, pushAudit]);

  const patientConfirmComplaint = useCallback((id: string, satisfied: boolean) => {
    setComplaints(prev => prev.map(c => {
      if (c.id !== id) return c;
      const status = satisfied ? 'Closed' : 'Reopened';
      pushAudit({ user: 'Patient', role: 'Patient', action: `Patient Confirmation — ${satisfied ? 'Satisfied' : 'Not Satisfied'}`, previousState: c.status, newState: status, reference: id });
      return { ...c, status, timeline: [...c.timeline, { label: `Patient: ${satisfied ? 'Satisfied' : 'Not Satisfied'}`, timestamp: nowIso() }, { label: satisfied ? 'Closed' : 'Reopened & Escalated', timestamp: nowIso() }] };
    }));
  }, [pushAudit]);

  const staffRespondComplaint = useCallback((id: string, response: string) => {
    setComplaints(prev => prev.map(c => c.id === id ? { ...c, status: 'Response Provided', response, timeline: [...c.timeline, { label: 'Response Provided', timestamp: nowIso() }] } : c));
    pushAudit({ user: 'Staff', role: 'Staff', action: 'Response Provided', reference: id });
  }, [pushAudit]);

  const staffCloseComplaint = useCallback((id: string) => {
    setComplaints(prev => prev.map(c => c.id === id ? { ...c, status: 'Resolved', timeline: [...c.timeline, { label: 'Marked Resolved by Staff', timestamp: nowIso() }] } : c));
    pushAudit({ user: 'Staff', role: 'Staff', action: 'Marked Resolved', reference: id });
  }, [pushAudit]);

  const submitChiefComplaint = useCallback((appointmentId: string, data: { predefinedItems: string[]; freeText: string }) => {
    const apt = appointments.find(a => a.id === appointmentId);
    const patient = patients.find(p => p.uhid === apt?.patientUhid);
    let result!: ChiefComplaint;
    setChiefComplaints(prev => {
      const existing = prev.find(c => c.appointmentId === appointmentId);
      if (existing) {
        result = { ...existing, predefinedItems: data.predefinedItems, freeText: data.freeText, updatedAt: nowIso() };
        return prev.map(c => c.id === existing.id ? result : c);
      }
      result = {
        id: genId('CC'), appointmentId, patientUhid: apt?.patientUhid || '',
        predefinedItems: data.predefinedItems, freeText: data.freeText,
        createdAt: nowIso(), updatedAt: nowIso(),
      };
      return [result, ...prev];
    });
    pushNotification({ recipient: patient?.name || 'Patient', channel: 'Portal', event: 'Chief complaint saved for your upcoming visit', status: 'Delivered' });
    pushAudit({ user: patient?.name || 'Patient', role: 'Patient', action: 'Chief Complaint submitted', reference: appointmentId });
    return result;
  }, [appointments, patients, pushNotification, pushAudit]);

  const getChiefComplaint = useCallback((appointmentId: string) => chiefComplaints.find(c => c.appointmentId === appointmentId), [chiefComplaints]);

  const staffLogin = useCallback((username: string, password: string) => {
    if (!password) return { ok: false, message: 'Please enter a password.' };
    const staff = seed.seedStaff.find(s => s.username === username);
    if (!staff) return { ok: false, message: 'No staff account found for this username.' };
    setCurrentStaffId(staff.id);
    pushAudit({ user: staff.name, role: staff.role, action: 'Staff Login', reference: staff.id });
    return { ok: true, message: 'Login successful.' };
  }, [pushAudit]);

  const staffLogout = useCallback(() => { setCurrentStaffId(null); }, []);

  const staffRespondServiceRequest = useCallback((id: string, response: string) => {
    setServiceRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'In Progress', description: `${r.description}\n\nStaff response: ${response}` } : r));
    pushAudit({ user: 'Staff', role: 'Staff', action: 'Service Request — Response Added', reference: id });
  }, [pushAudit]);

  const staffCloseServiceRequest = useCallback((id: string) => {
    setServiceRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'Completed' } : r));
    pushAudit({ user: 'Staff', role: 'Staff', action: 'Service Request — Marked Completed', reference: id });
  }, [pushAudit]);

  const staffEscalateServiceRequest = useCallback((id: string) => {
    setServiceRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'SLA Breached' } : r));
    pushAudit({ user: 'Staff', role: 'Staff', action: 'Service Request — Manually Escalated', reference: id });
  }, [pushAudit]);

  const updateServiceMasterEntry = useCallback((id: string, patch: Partial<ServiceMasterEntry>) => {
    setServiceMaster(prev => prev.map(e => e.id === id ? { ...e, ...patch } : e));
  }, []);
  const updateDepartmentMappingEntry = useCallback((id: string, patch: Partial<DepartmentMappingEntry>) => {
    setDepartmentMappingMaster(prev => prev.map(e => e.id === id ? { ...e, ...patch } : e));
  }, []);
  const updateSLAMasterEntry = useCallback((id: string, patch: Partial<SLAMasterEntry>) => {
    setSlaMasterConfig(prev => prev.map(e => e.id === id ? { ...e, ...patch } : e));
  }, []);
  const updateNotificationMasterEntry = useCallback((id: string, patch: Partial<NotificationMasterEntry>) => {
    setNotificationMaster(prev => prev.map(e => e.id === id ? { ...e, ...patch } : e));
  }, []);
  const updatePayerMasterEntry = useCallback((id: string, patch: Partial<PayerMasterEntry>) => {
    setPayerMaster(prev => prev.map(e => e.id === id ? { ...e, ...patch } : e));
  }, []);
  const updateTariffMasterEntry = useCallback((id: string, patch: Partial<TariffMasterEntry>) => {
    setTariffMaster(prev => prev.map(e => e.id === id ? { ...e, ...patch } : e));
  }, []);
  const updateFeedbackMasterEntry = useCallback((id: string, patch: Partial<FeedbackMasterEntry>) => {
    setFeedbackMaster(prev => prev.map(e => e.id === id ? { ...e, ...patch } : e));
  }, []);
  const updateComplaintCategoryMasterEntry = useCallback((id: string, patch: Partial<ComplaintCategoryMasterEntry>) => {
    setComplaintCategoryMaster(prev => prev.map(e => e.id === id ? { ...e, ...patch } : e));
  }, []);

  // M14 — Health Camps, Offers & Advertisements (BRD §18)
  const getTargetedContent = useCallback((patient: Patient) => {
    const age = getAge(patient.dob);
    return contentItems
      .filter(c => c.active && c.approvalStatus === 'Approved')
      .filter(c => {
        const t = c.targeting;
        if (t.patientType !== 'All' && t.patientType !== patient.patientType) return false;
        if (t.gender && t.gender !== 'All' && t.gender !== patient.gender) return false;
        if (t.ageMin !== undefined && age < t.ageMin) return false;
        if (t.ageMax !== undefined && age > t.ageMax) return false;
        return true;
      })
      .sort((a, b) => a.startDate.localeCompare(b.startDate));
  }, [contentItems]);

  const getVisibleContent = useCallback((patient: Patient) => {
    const now = Date.now();
    const targeted = getTargetedContent(patient).filter(c => {
      const start = new Date(c.startDate + 'T00:00:00').getTime();
      const end = new Date(c.endDate + 'T23:59:59').getTime();
      return now >= start && now <= end;
    });
    const prioRank: Record<string, number> = { High: 0, Medium: 1, Low: 2 };
    return [...targeted].sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      if (prioRank[a.priority] !== prioRank[b.priority]) return prioRank[a.priority] - prioRank[b.priority];
      return a.displaySequence - b.displaySequence;
    });
  }, [getTargetedContent]);

  const getCampRegistrationCount = useCallback((contentId: string) => campRegistrations.filter(r => r.contentId === contentId).length, [campRegistrations]);

  const registerForCamp = useCallback((contentId: string, patientUhid: string) => {
    const content = contentItems.find(c => c.id === contentId);
    const patient = patients.find(p => p.uhid === patientUhid);
    if (!content) return { ok: false, message: 'This item could not be found.' };
    const existingCount = campRegistrations.filter(r => r.contentId === contentId).length;
    if (content.capacity !== undefined && existingCount >= content.capacity) {
      return { ok: false, message: 'Registrations are full — capacity reached for this camp.' };
    }
    if (campRegistrations.some(r => r.contentId === contentId && r.patientUhid === patientUhid)) {
      return { ok: false, message: 'You are already registered for this camp.' };
    }
    const reg: CampRegistration = { id: genId('CAMPREG'), contentId, patientUhid, registeredAt: nowIso() };
    setCampRegistrations(prev => [reg, ...prev]);
    pushNotification({ recipient: patient?.name || 'Patient', channel: 'Portal', event: `Registered for ${content.title}`, status: 'Delivered' });
    pushAudit({ user: patient?.name || 'Patient', role: 'Patient', action: `Camp Registration — ${content.title}`, reference: reg.id });
    return { ok: true, message: `You're registered for ${content.title}.` };
  }, [contentItems, campRegistrations, patients, pushNotification, pushAudit]);

  const bookmarkContent = useCallback((id: string) => setBookmarkedContentIds(prev => prev.includes(id) ? prev : [...prev, id]), []);
  const unbookmarkContent = useCallback((id: string) => setBookmarkedContentIds(prev => prev.filter(x => x !== id)), []);

  const recordImpression = useCallback((id: string) => {
    setContentAnalytics(prev => ({ ...prev, [id]: { impressions: (prev[id]?.impressions || 0) + 1, taps: prev[id]?.taps || 0 } }));
  }, []);
  const recordTap = useCallback((id: string) => {
    setContentAnalytics(prev => ({ ...prev, [id]: { impressions: prev[id]?.impressions || 0, taps: (prev[id]?.taps || 0) + 1 } }));
  }, []);

  const createContentItem = useCallback((data: Omit<Announcement, 'id' | 'approvalStatus' | 'displaySequence'> & { displaySequence?: number }) => {
    const maxSeq = contentItems.reduce((m, c) => Math.max(m, c.displaySequence), 0);
    const item: Announcement = { ...data, id: genId('CNT'), approvalStatus: 'Pending Approval', displaySequence: data.displaySequence ?? maxSeq + 1 };
    setContentItems(prev => [item, ...prev]);
    pushNotification({ recipient: 'Content Console (Admin/Management)', channel: 'Staff Portal', event: `New content item pending approval — ${item.title}`, status: 'Delivered' });
    pushAudit({ user: item.createdBy, role: 'Staff', action: `Content Item Created — ${item.title} (${item.category})`, newState: 'Pending Approval', reference: item.id });
    return item;
  }, [contentItems, pushNotification, pushAudit]);

  const updateContentItem = useCallback((id: string, patch: Partial<Announcement>) => {
    setContentItems(prev => prev.map(c => c.id === id ? { ...c, ...patch } : c));
    pushAudit({ user: 'Staff', role: 'Staff', action: 'Content Item Updated', reference: id });
  }, [pushAudit]);

  const setContentApproval = useCallback((id: string, status: 'Approved' | 'Rejected') => {
    setContentItems(prev => prev.map(c => c.id === id ? { ...c, approvalStatus: status } : c));
    pushAudit({ user: 'Admin/Management', role: 'Staff', action: `Content Item ${status}`, newState: status, reference: id });
  }, [pushAudit]);

  const toggleContentActive = useCallback((id: string) => {
    setContentItems(prev => prev.map(c => c.id === id ? { ...c, active: !c.active } : c));
    pushAudit({ user: 'Staff', role: 'Staff', action: 'Content Item Active Toggled', reference: id });
  }, [pushAudit]);

  const reorderContent = useCallback((id: string, direction: 'up' | 'down') => {
    setContentItems(prev => {
      const sorted = [...prev].sort((a, b) => a.displaySequence - b.displaySequence);
      const idx = sorted.findIndex(c => c.id === id);
      const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (idx < 0 || swapIdx < 0 || swapIdx >= sorted.length) return prev;
      const a = sorted[idx], b = sorted[swapIdx];
      const aSeq = a.displaySequence, bSeq = b.displaySequence;
      return prev.map(c => c.id === a.id ? { ...c, displaySequence: bSeq } : c.id === b.id ? { ...c, displaySequence: aSeq } : c);
    });
  }, []);

  const value = useMemo<StoreShape>(() => ({
    patients, doctors, appointments, payments, refunds, investigations, medicines, dietRequests,
    feedback, serviceRequests, complaints, notifications, audit,
    chiefComplaints, serviceMaster, departmentMappingMaster, slaMasterConfig, notificationMaster,
    ipVisits, vitals, ipBills, correctionRequests, accessGrants,
    contentItems, campRegistrations, bookmarkedContentIds, contentAnalytics,
    payerMaster, tariffMaster, feedbackMaster, complaintCategoryMaster,
    doseLog, recoveryChecklistLog, waitlist,
    currentPatientUhid, authedAsFamilyHead, currentStaffId, selfRegistrationMode, setSelfRegistrationMode,
    enablePayLater, setEnablePayLater, enableLiveQueue, setEnableLiveQueue,
    emrVisibilityWindowDays, setEmrVisibilityWindowDays, emrDownloadLimitPerDoc, setEmrDownloadLimitPerDoc,
    mandatoryFeedbackGateOpPost, setMandatoryFeedbackGateOpPost, mandatoryFeedbackGateIpPreDischarge, setMandatoryFeedbackGateIpPreDischarge,
    allowInappCorrectionRequest, setAllowInappCorrectionRequest, autoAuthorizeLinkedUhids, setAutoAuthorizeLinkedUhids,
    loginWithOtp, selectPatientProfile, logout, registerPatient, addFamilyMember, switchActivePatient,
    bookAppointment, payNow, counterCollectPayLater, reconcileAtCounter, rescheduleAppointment, cancelAppointment,
    requestRefund, authorizeRefund, staffApproveRefund,
    payInvestigation, payMedicine, toggleDoseTaken, toggleRecoveryChecklistItem,
    joinWaitlist, cancelWaitlistEntry, getWaitlistForPatient,
    submitDietRequest, submitFeedback, submitServiceRequest, submitComplaint, escalateOverdueComplaints, patientConfirmComplaint,
    staffRespondComplaint, staffCloseComplaint,
    submitChiefComplaint, getChiefComplaint,
    submitCorrectionRequest, staffResolveCorrectionRequest,
    grantAccess, revokeAccessGrant, getGrantsForPatient, getGrantsByUser, isGrantExpiringSoon, logRecordAccess,
    staffLogin, staffLogout, staffRespondServiceRequest, staffCloseServiceRequest, staffEscalateServiceRequest,
    updateServiceMasterEntry, updateDepartmentMappingEntry, updateSLAMasterEntry, updateNotificationMasterEntry,
    updatePayerMasterEntry, updateTariffMasterEntry, updateFeedbackMasterEntry, updateComplaintCategoryMasterEntry,
    getVisibleContent, getTargetedContent, registerForCamp, getCampRegistrationCount, bookmarkContent, unbookmarkContent,
    recordImpression, recordTap, createContentItem, updateContentItem, setContentApproval, toggleContentActive, reorderContent,
    pushNotification, pushAudit,
    consents, dataRequests, nominees, getConsentState, setConsent, recordLoginConsent, submitDataRequest, setNominee,
  }), [consents, dataRequests, nominees, patients, doctors, appointments, payments, refunds, investigations, medicines, dietRequests, feedback, serviceRequests, complaints, notifications, audit, chiefComplaints, serviceMaster, departmentMappingMaster, slaMasterConfig, notificationMaster, ipVisits, vitals, ipBills, correctionRequests, accessGrants, contentItems, campRegistrations, bookmarkedContentIds, contentAnalytics, payerMaster, tariffMaster, feedbackMaster, complaintCategoryMaster, doseLog, recoveryChecklistLog, waitlist, currentPatientUhid, authedAsFamilyHead, currentStaffId, selfRegistrationMode, enablePayLater, enableLiveQueue, emrVisibilityWindowDays, emrDownloadLimitPerDoc, mandatoryFeedbackGateOpPost, mandatoryFeedbackGateIpPreDischarge, allowInappCorrectionRequest, autoAuthorizeLinkedUhids, loginWithOtp, selectPatientProfile, logout, registerPatient, addFamilyMember, switchActivePatient, bookAppointment, payNow, counterCollectPayLater, reconcileAtCounter, rescheduleAppointment, cancelAppointment, requestRefund, authorizeRefund, staffApproveRefund, payInvestigation, payMedicine, toggleDoseTaken, toggleRecoveryChecklistItem, joinWaitlist, cancelWaitlistEntry, getWaitlistForPatient, submitDietRequest, submitFeedback, submitServiceRequest, submitComplaint, escalateOverdueComplaints, patientConfirmComplaint, staffRespondComplaint, staffCloseComplaint, submitChiefComplaint, getChiefComplaint, submitCorrectionRequest, staffResolveCorrectionRequest, grantAccess, revokeAccessGrant, getGrantsForPatient, getGrantsByUser, isGrantExpiringSoon, logRecordAccess, staffLogin, staffLogout, staffRespondServiceRequest, staffCloseServiceRequest, staffEscalateServiceRequest, updateServiceMasterEntry, updateDepartmentMappingEntry, updateSLAMasterEntry, updateNotificationMasterEntry, updatePayerMasterEntry, updateTariffMasterEntry, updateFeedbackMasterEntry, updateComplaintCategoryMasterEntry, getVisibleContent, getTargetedContent, registerForCamp, getCampRegistrationCount, bookmarkContent, unbookmarkContent, recordImpression, recordTap, createContentItem, updateContentItem, setContentApproval, toggleContentActive, reorderContent, pushNotification, pushAudit]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
};

export function getScopedComplaints(complaints: Complaint[], staff: { role: string; department: string }) {
  if (staff.role === 'Admin' || staff.role === 'Management') return complaints;
  return complaints.filter(c => c.department === staff.department);
}

export function getScopedServiceRequests(serviceRequests: ServiceRequest[], staff: { role: string; department: string }) {
  if (staff.role === 'Admin' || staff.role === 'Management') return serviceRequests;
  return serviceRequests.filter(r => r.department === staff.department);
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}
