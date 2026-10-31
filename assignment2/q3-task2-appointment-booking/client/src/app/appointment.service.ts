import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Slot {
  _id: string;
  date: string;
  time: string;
}

export interface Doctor {
  _id: string;
  name: string;
  specialization: string;
  slots: Slot[];
}

export interface Patient {
  _id: string;
  name: string;
  age: number;
  gender: string;
  phone: string;
  email: string;
}

export interface Appointment {
  _id: string;
  doctor: { _id: string; name: string; specialization: string };
  date: string;
  time: string;
  reason: string;
  status: 'Booked' | 'Cancelled';
}

const API = 'http://localhost:5000/api';

@Injectable({ providedIn: 'root' })
export class AppointmentService {
  private http = inject(HttpClient);

  getDoctors(): Observable<Doctor[]> {
    return this.http.get<Doctor[]>(`${API}/doctors`);
  }

  registerPatient(p: Omit<Patient, '_id'>): Observable<Patient> {
    return this.http.post<Patient>(`${API}/patients`, p);
  }

  getAppointments(patientId: string): Observable<Appointment[]> {
    return this.http.get<Appointment[]>(`${API}/appointments`, { params: { patientId } });
  }

  book(patientId: string, doctorId: string, slotId: string, reason: string): Observable<Appointment> {
    return this.http.post<Appointment>(`${API}/appointments`, { patientId, doctorId, slotId, reason });
  }

  cancel(id: string): Observable<Appointment> {
    return this.http.put<Appointment>(`${API}/appointments/${id}/cancel`, {});
  }
}
