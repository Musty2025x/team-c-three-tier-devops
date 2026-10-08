import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import "./style.css";

function App() {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState("Checking API...");

  async function loadTasks() {
    try {
      const health = await fetch("/api/health");

      if (!health.ok) {
        throw new Error("API unavailable");
      }

      const response = await fetch("/api/tasks");

      if (!response.ok) {
        throw new Error("Failed to load tasks");
      }

      const data = await response.json();

      setTasks(data);
      setStatus("API healthy");
    } catch {
      setStatus("API unavailable");
    }
  }

  useEffect(() => {
    loadTasks();
  }, []);

  async function addTask(event) {
    event.preventDefault();

    if (!title.trim()) {
      return;
    }

    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ title })
      });

      if (!response.ok) {
        throw new Error("Failed to add task");
      }

      setTitle("");
      await loadTasks();
    } catch {
      setStatus("API unavailable");
    }
  }

  async function toggleTask(id) {
    try {
      const response = await fetch(`/api/tasks/${id}`, {
        method: "PATCH"
      });

      if (!response.ok) {
        throw new Error("Failed to update task");
      }

      await loadTasks();
    } catch {
      setStatus("API unavailable");
    }
  }

  async function deleteTask(id) {
    try {
      const response = await fetch(`/api/tasks/${id}`, {
        method: "DELETE"
      });

      if (!response.ok) {
        throw new Error("Failed to delete task");
      }

      await loadTasks();
    } catch {
      setStatus("API unavailable");
    }
  }

  return (
    <main className="container">
      <section className="hero">
        <p className="eyebrow">TEAM C · DEVOPS DEMO</p>

        <h1>TaskFlow</h1>

        <p>
          React → Node.js → PostgreSQL, deployed through an automated AWS
          pipeline.
        </p>

        <span
          className={
            status === "API healthy" ? "badge healthy" : "badge"
          }
        >
          {status}
        </span>
      </section>

      <form onSubmit={addTask} className="form">
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Add a deployment task..."
        />

        <button type="submit">Add task</button>
      </form>

      <section className="card">
        {tasks.map((task) => (
          <article className="task" key={task.id}>
            <button
              className="check"
              onClick={() => toggleTask(task.id)}
            >
              {task.completed ? "✓" : "○"}
            </button>

            <span className={task.completed ? "done" : ""}>
              {task.title}
            </span>

            <button
              className="delete"
              onClick={() => deleteTask(task.id)}
            >
              Delete
            </button>
          </article>
        ))}
      </section>
    </main>
  );
}

createRoot(document.getElementById("root")).render(<App />);