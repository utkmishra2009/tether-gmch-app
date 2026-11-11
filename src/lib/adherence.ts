import type { MedicineOrder, DoseLogEntry } from '../data/types';
import { getDoseLabelsForMedicine } from '../data/store';

// Dose-adherence maths shared by Home and Health. Derived purely from the dose log — nothing is
// stored separately, so the ring, the streak and the checklist can never disagree.
const eligible = (meds: MedicineOrder[], uhid: string) =>
  meds.filter(m => m.patientUhid === uhid && (m.status === 'Paid' || m.status === 'Dispensed'));

export function doseStatsForDay(meds: MedicineOrder[], log: DoseLogEntry[], uhid: string, iso: string) {
  const list = eligible(meds, uhid);
  let total = 0, taken = 0;
  for (const m of list) {
    for (const label of getDoseLabelsForMedicine(m.medicine)) {
      total++;
      if (log.some(d => d.patientUhid === uhid && d.medicineOrderId === m.id && d.doseLabel === label && d.date === iso)) taken++;
    }
  }
  return { total, taken };
}

const isoMinus = (iso: string, days: number) => new Date(new Date(iso + 'T00:00:00Z').getTime() - days * 86400000).toISOString().slice(0, 10);

// Consecutive fully-completed days. Today only counts once complete, but an unfinished today never
// breaks a streak that is still alive — the day isn't over yet.
export function doseStreak(meds: MedicineOrder[], log: DoseLogEntry[], uhid: string, todayIso: string) {
  let streak = 0;
  for (let i = 0; i < 90; i++) {
    const iso = isoMinus(todayIso, i);
    const { total, taken } = doseStatsForDay(meds, log, uhid, iso);
    const complete = total > 0 && taken === total;
    if (complete) streak++;
    else if (i === 0) continue;
    else break;
  }
  return streak;
}
