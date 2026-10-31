export default function TaskItem({ task, onToggle, onEdit, onDelete }) {
  const overdue =
    task.dueDate && !task.completed && new Date(task.dueDate) < new Date(new Date().toDateString());

  return (
    <li className={`task ${task.completed ? "done" : ""}`}>
      <input type="checkbox" checked={task.completed} onChange={() => onToggle(task)} />
      <div className="task-body">
        <div className="task-title">
          {task.title}
          <span className={`badge p-${task.priority.toLowerCase()}`}>{task.priority}</span>
          {overdue && <span className="badge overdue">Overdue</span>}
        </div>
        {task.description && <div className="muted">{task.description}</div>}
        {task.dueDate && <div className="muted small">Due {new Date(task.dueDate).toLocaleDateString()}</div>}
      </div>
      <div className="row-actions">
        <button onClick={() => onEdit(task)}>Edit</button>
        <button className="danger" onClick={() => onDelete(task._id)}>Delete</button>
      </div>
    </li>
  );
}
