require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const app = express();
app.use(cors());
app.use(express.json());

// ---------- Models ----------
const slotSchema = new mongoose.Schema({
  date: { type: String, required: true }, // YYYY-MM-DD
  time: { type: String, required: true }, // e.g. "10:00"
  booked: { type: Boolean, default: false },
});

const doctorSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  specialization: { type: String, required: true, trim: true },
  slots: [slotSchema],
});
const Doctor = mongoose.model("Doctor", doctorSchema);

const patientSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    age: { type: Number, required: true, min: 0, max: 120 },
    gender: { type: String, enum: ["Male", "Female", "Other"], required: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
  },
  { timestamps: true }
);
const Patient = mongoose.model("Patient", patientSchema);

const appointmentSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true },
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor", required: true },
    slotId: { type: mongoose.Schema.Types.ObjectId, required: true },
    date: { type: String, required: true },
    time: { type: String, required: true },
    reason: { type: String, trim: true, default: "" },
    status: { type: String, enum: ["Booked", "Cancelled"], default: "Booked" },
  },
  { timestamps: true }
);
const Appointment = mongoose.model("Appointment", appointmentSchema);

// ---------- Doctors ----------
// Doctors with only their free slots
app.get("/api/doctors", async (_req, res) => {
  try {
    const doctors = await Doctor.find().lean();
    res.json(
      doctors.map((d) => ({
        ...d,
        slots: d.slots
          .filter((s) => !s.booked)
          .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time)),
      }))
    );
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post("/api/doctors", async (req, res) => {
  try {
    res.status(201).json(await Doctor.create(req.body));
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ---------- Patients ----------
app.post("/api/patients", async (req, res) => {
  try {
    res.status(201).json(await Patient.create(req.body));
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.get("/api/patients/:id", async (req, res) => {
  try {
    const p = await Patient.findById(req.params.id);
    if (!p) return res.status(404).json({ message: "Patient not found" });
    res.json(p);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ---------- Appointments ----------
app.get("/api/appointments", async (req, res) => {
  try {
    const filter = req.query.patientId ? { patient: req.query.patientId } : {};
    res.json(
      await Appointment.find(filter)
        .populate("doctor", "name specialization")
        .populate("patient", "name")
        .sort({ date: 1, time: 1 })
    );
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Book: atomically flips the slot to booked so two people can't take the same slot
app.post("/api/appointments", async (req, res) => {
  try {
    const { patientId, doctorId, slotId, reason } = req.body;
    const patient = await Patient.findById(patientId);
    if (!patient) return res.status(404).json({ message: "Patient not found" });

    const doctor = await Doctor.findOneAndUpdate(
      { _id: doctorId, slots: { $elemMatch: { _id: slotId, booked: false } } },
      { $set: { "slots.$.booked": true } },
      { new: true }
    );
    if (!doctor) return res.status(409).json({ message: "Slot is no longer available" });

    const slot = doctor.slots.id(slotId);
    const appt = await Appointment.create({
      patient: patientId,
      doctor: doctorId,
      slotId,
      date: slot.date,
      time: slot.time,
      reason,
    });
    res.status(201).json(await appt.populate("doctor", "name specialization"));
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Cancel: marks the appointment cancelled and frees the slot
app.put("/api/appointments/:id/cancel", async (req, res) => {
  try {
    const appt = await Appointment.findById(req.params.id);
    if (!appt) return res.status(404).json({ message: "Appointment not found" });
    if (appt.status === "Cancelled") return res.status(400).json({ message: "Already cancelled" });

    appt.status = "Cancelled";
    await appt.save();
    await Doctor.updateOne(
      { _id: appt.doctor, "slots._id": appt.slotId },
      { $set: { "slots.$.booked": false } }
    );
    res.json(appt);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.delete("/api/appointments/:id", async (req, res) => {
  try {
    const appt = await Appointment.findByIdAndDelete(req.params.id);
    if (!appt) return res.status(404).json({ message: "Appointment not found" });
    if (appt.status === "Booked") {
      await Doctor.updateOne(
        { _id: appt.doctor, "slots._id": appt.slotId },
        { $set: { "slots.$.booked": false } }
      );
    }
    res.json({ message: "Appointment deleted" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ---------- Start (seeds doctors with slots for the next 3 days) ----------
function makeSlots() {
  const times = ["10:00", "11:00", "14:00", "15:30"];
  const slots = [];
  for (let d = 1; d <= 3; d++) {
    const date = new Date(Date.now() + d * 86400000).toISOString().slice(0, 10);
    times.forEach((time) => slots.push({ date, time }));
  }
  return slots;
}

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/appointment_booking";

mongoose
  .connect(MONGO_URI)
  .then(async () => {
    console.log("MongoDB connected");
    if ((await Doctor.countDocuments()) === 0) {
      await Doctor.insertMany([
        { name: "Dr. Anitha Rao", specialization: "General Physician", slots: makeSlots() },
        { name: "Dr. Vikram Shah", specialization: "Cardiologist", slots: makeSlots() },
        { name: "Dr. Sneha Nair", specialization: "Dermatologist", slots: makeSlots() },
      ]);
      console.log("Seeded sample doctors");
    }
    app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error("MongoDB connection failed:", err.message);
    process.exit(1);
  });
