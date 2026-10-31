import { useCallback, useEffect, useMemo, useState } from "react";
import TaskItem from "./TaskItem.jsx";

const API = "/api/tasks";
const emptyForm = { title: "", description: "", priority: "Medium", dueDate: "" };

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [error, setError] = useState("");

  const loadTasks = useCallback(async () => {
    try {
      const res = await fetch(API);
      setTasks(await res.json());
    } catch {
      setError("Could not reach the server");
    }
  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const visible = useMemo(
    () =>
      tasks.filter(
        (t) =>
          (statusFilter === "all" || (statusFilter === "done" ? t.completed : !t.completed)) &&
          (priorityFilter === "all" || t.priority === priorityFilter)
      ),
    [tasks, statusFilter, priorityFilter]
  );

  const doneCount = tasks.filter((t) => t.completed).length;

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const body = { ...form, dueDate: form.dueDate || null };
    const res = await fetch(editingId ? `${API}/${editingId}` : API, {
      method: editingId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) return setError(data.message || "Something went wrong");
    setForm(emptyForm);
    setEditingId(null);
    loadTasks();
  };

  const handleEdit = (t) => {
    setEditingId(t._id);
    setForm({
      title: t.title,
      description: t.description || "",
      priority: t.priority,
      dueDate: t.dueDate ? t.dueDate.slice(0, 10) : "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleToggle = async (t) => {
    await fetch(`${API}/${t._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed: !t.completed }),
    });
    loadTasks();
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this task?")) return;
    await fetch(`${API}/${id}`, { method: "DELETE" });
    loadTasks();
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(emptyForm);
    setError("");
  };

  return (
    <div className="container">
      <h1>Student Task Manager</h1>

      <form className="card" onSubmit={handleSubmit}>
        <h2>{editingId ? "Edit Task" : "Add Task"}</h2>
        <div className="grid">
          <input name="title" placeholder="Task title" value={form.title} onChange={handleChange} required />
          <select name="priority" value={form.priority} onChange={handleChange}>
            <option>Low</option>
            <option>Medium</option>
            <option>High</option>
          </select>
          <input name="dueDate" type="date" value={form.dueDate} onChange={handleChange} />
        </div>
        <textarea
          name="description"
          placeholder="Description (optional)"
          rows="2"
          value={form.description}
          onChange={handleChange}
        />
        {error && <p className="error">{error}</p>}
        <div className="actions">
          <button type="submit" className="primary">{editingId ? "Save" : "Add"}</button>
          {editingId && <button type="button" onClick={cancelEdit}>Cancel</button>}
        </div>
      </form>

      <div className="card">
        <div className="toolbar">
          <h2>Tasks ({doneCount}/{tasks.length} done)</h2>
          <div className="filters">
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">All status</option>
              <option value="pending">Pending</option>
              <option value="done">Completed</option>
            </select>
            <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
              <option value="all">All priorities</option>
              <option>High</option>
              <option>Medium</option>
              <option>Low</option>
            </select>
          </div>
        </div>

        {visible.length === 0 ? (
          <p className="muted">No tasks to show.</p>
        ) : (
          <ul className="tasks">
            {visible.map((t) => (
              <TaskItem key={t._id} task={t} onToggle={handleToggle} onEdit={handleEdit} onDelete={handleDelete} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
