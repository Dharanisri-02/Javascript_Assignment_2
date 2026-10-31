import { useEffect, useState } from "react";

const API = "/api/students";
const emptyForm = { name: "", rollNo: "", email: "", department: "", year: "1", phone: "" };

export default function App() {
  const [students, setStudents] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const loadStudents = async () => {
    try {
      const res = await fetch(API);
      setStudents(await res.json());
    } catch {
      setError("Could not reach the server");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const res = await fetch(editingId ? `${API}/${editingId}` : API, {
      method: editingId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, year: Number(form.year) }),
    });
    const data = await res.json();
    if (!res.ok) return setError(data.message || "Something went wrong");
    setForm(emptyForm);
    setEditingId(null);
    loadStudents();
  };

  const handleEdit = (s) => {
    setEditingId(s._id);
    setForm({
      name: s.name,
      rollNo: s.rollNo,
      email: s.email,
      department: s.department,
      year: String(s.year),
      phone: s.phone || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this student?")) return;
    await fetch(`${API}/${id}`, { method: "DELETE" });
    loadStudents();
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(emptyForm);
    setError("");
  };

  return (
    <div className="container">
      <h1>Student Management System</h1>

      <form className="card" onSubmit={handleSubmit}>
        <h2>{editingId ? "Update Student" : "Add Student"}</h2>
        <div className="grid">
          <input name="name" placeholder="Full name" value={form.name} onChange={handleChange} required />
          <input name="rollNo" placeholder="Roll number" value={form.rollNo} onChange={handleChange} required />
          <input name="email" type="email" placeholder="Email" value={form.email} onChange={handleChange} required />
          <input name="department" placeholder="Department" value={form.department} onChange={handleChange} required />
          <select name="year" value={form.year} onChange={handleChange}>
            {[1, 2, 3, 4].map((y) => (
              <option key={y} value={y}>Year {y}</option>
            ))}
          </select>
          <input name="phone" placeholder="Phone (optional)" value={form.phone} onChange={handleChange} />
        </div>
        {error && <p className="error">{error}</p>}
        <div className="actions">
          <button type="submit" className="primary">{editingId ? "Update" : "Add"}</button>
          {editingId && (
            <button type="button" onClick={cancelEdit}>Cancel</button>
          )}
        </div>
      </form>

      <div className="card">
        <h2>Students ({students.length})</h2>
        {loading ? (
          <p>Loading...</p>
        ) : students.length === 0 ? (
          <p className="muted">No students yet. Add one above.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th><th>Roll No</th><th>Email</th><th>Dept</th><th>Year</th><th>Phone</th><th></th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s._id}>
                    <td>{s.name}</td>
                    <td>{s.rollNo}</td>
                    <td>{s.email}</td>
                    <td>{s.department}</td>
                    <td>{s.year}</td>
                    <td>{s.phone}</td>
                    <td className="row-actions">
                      <button onClick={() => handleEdit(s)}>Edit</button>
                      <button className="danger" onClick={() => handleDelete(s._id)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
