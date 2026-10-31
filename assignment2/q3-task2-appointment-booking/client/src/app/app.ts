import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Appointment, AppointmentService, Doctor, Patient, Slot } from './appointment.service';

@Component({
  imports: [ReactiveFormsModule],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App implements OnInit {
  private fb = inject(FormBuilder);
  private api = inject(AppointmentService);

  doctors = signal<Doctor[]>([]);
  patient = signal<Patient | null>(null);
  appointments = signal<Appointment[]>([]);
  message = signal<{ text: string; type: 'ok' | 'err' } | null>(null);

  // Patient registration form
  form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    age: [null as number | null, [Validators.required, Validators.min(0), Validators.max(120)]],
    gender: ['', Validators.required],
    phone: ['', [Validators.required, Validators.pattern(/^[6-9]\d{9}$/)]],
    email: ['', [Validators.required, Validators.email]],
  });

  // Reason is collected per booking
  reason = this.fb.nonNullable.control('');

  ngOnInit() {
    this.loadDoctors();
  }

  get f() {
    return this.form.controls;
  }

  private notify(text: string, type: 'ok' | 'err' = 'ok') {
    this.message.set({ text, type });
    setTimeout(() => this.message.set(null), 3500);
  }

  loadDoctors() {
    this.api.getDoctors().subscribe({
      next: (d) => this.doctors.set(d),
      error: () => this.notify('Could not load doctors. Is the server running?', 'err'),
    });
  }

  loadAppointments() {
    const p = this.patient();
    if (!p) return;
    this.api.getAppointments(p._id).subscribe((a) => this.appointments.set(a));
  }

  register() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    this.api.registerPatient({ ...v, age: Number(v.age) }).subscribe({
      next: (p) => {
        this.patient.set(p);
        this.loadAppointments();
        this.notify(`Registered ${p.name}`);
      },
      error: (e) => this.notify(e.error?.message ?? 'Registration failed', 'err'),
    });
  }

  newPatient() {
    this.patient.set(null);
    this.appointments.set([]);
    this.form.reset();
  }

  book(doctor: Doctor, slot: Slot) {
    const p = this.patient();
    if (!p) return;
    this.api.book(p._id, doctor._id, slot._id, this.reason.value).subscribe({
      next: () => {
        this.notify(`Booked ${doctor.name} on ${slot.date} at ${slot.time}`);
        this.loadAppointments();
        this.loadDoctors();
      },
      error: (e) => {
        this.notify(e.error?.message ?? 'Booking failed', 'err');
        this.loadDoctors();
      },
    });
  }

  cancel(a: Appointment) {
    this.api.cancel(a._id).subscribe({
      next: () => {
        this.notify('Appointment cancelled');
        this.loadAppointments();
        this.loadDoctors();
      },
      error: (e) => this.notify(e.error?.message ?? 'Could not cancel', 'err'),
    });
  }
}
