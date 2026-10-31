require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const app = express();
app.use(cors());
app.use(express.json());

// ---------- Model ----------
const taskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: "" },
    priority: { type: String, enum: ["Low", "Medium", "High"], default: "Medium" },
    completed: { type: Boolean, default: false },
    dueDate: { type: Date },
  },
  { timestamps: true }
);
const Task = mongoose.model("Task", taskSchema);

// ---------- APIs ----------
// List tasks (optional ?status=completed|pending and ?priority=High|Medium|Low)
app.get("/api/tasks", async (req, res) => {
  try {
    const filter = {};
    if (req.query.status === "completed") filter.completed = true;
    if (req.query.status === "pending") filter.completed = false;
    if (["Low", "Medium", "High"].includes(req.query.priority)) filter.priority = req.query.priority;
    res.json(await Task.find(filter).sort({ completed: 1, createdAt: -1 }));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post("/api/tasks", async (req, res) => {
  try {
    res.status(201).json(await Task.create(req.body));
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.put("/api/tasks/:id", async (req, res) => {
  try {
    const task = await Task.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!task) return res.status(404).json({ message: "Task not found" });
    res.json(task);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.delete("/api/tasks/:id", async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });
    res.json({ message: "Task deleted" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ---------- Start ----------
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/task_manager";

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
    app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error("MongoDB connection failed:", err.message);
    process.exit(1);
  });
