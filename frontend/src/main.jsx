import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import "./style.css";

const stack = [
  { label: "Frontend", value: "React", tone: "purple" },
  { label: "API", value: "Node.js", tone: "blue" },
  { label: "Database", value: "PostgreSQL", tone: "green" }
];

function App() {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState("Checking API...");
  const [loading, setLoading] = useState(true);

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
      setStatus("Operational");
    } catch {
      setStatus("API unavailable");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTasks();
  }, []);

  async function addTask(event) {
    event.preventDefault();

    if (!title.trim()) return;

    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          title: title.trim()
        })
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

  const completed = useMemo(
    () => tasks.filter((task) => task.completed).length,
    [tasks]
  );

  const progress = tasks.length
    ? Math.round((completed / tasks.length) * 100)
    : 0;

  return (
    <div className="app-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">T</div>

          <div>
            <strong>TaskFlow</strong>
            <span>Team C · DevOps Demo</span>
          </div>
        </div>

        <div className="topbar-meta">
          <span className="live-dot" />
          <span>STAGING</span>

          <span className="divider" />

          <span>AWS · us-east-1</span>
        </div>
      </header>

      <main className="container">
        <section className="hero">
          <div className="hero-copy">
            <div className="eyebrow">
              <span className="eyebrow-line" />
              FULL-STACK DELIVERY DEMO
            </div>

            <h1>
              Ship work.
              <br />
              <span>Ship it reliably.</span>
            </h1>

            <p className="hero-description">
              A lightweight task manager demonstrating a containerized
              React → Node.js → PostgreSQL application deployed through an
              automated AWS CI/CD pipeline.
            </p>

            <div className="hero-actions">
              <a className="primary-link" href="#tasks">
                Manage tasks <span>↓</span>
              </a>

              <div
                className={`status-pill ${
                  status === "Operational" ? "is-ok" : ""
                }`}
              >
                <span className="status-dot" />
                {loading ? "Checking services..." : status}
              </div>
            </div>
          </div>

          <div className="hero-card">
            <div className="hero-card-top">
              <span>DEPLOYMENT STATUS</span>

              <span className="check-icon">✓</span>
            </div>

            <div className="deploy-status">Healthy</div>

            <p>
              Current staging release is serving traffic.
            </p>

            <div className="release-row">
              <span>Environment</span>
              <strong>STAGING</strong>
            </div>

            <div className="release-row">
              <span>Pipeline</span>
              <strong>CI → Deploy</strong>
            </div>
          </div>
        </section>

        <section className="stack-grid">
          {stack.map((item) => (
            <div className="stack-card" key={item.label}>
              <div className={`stack-icon ${item.tone}`}>
                {item.label === "Frontend"
                  ? "◈"
                  : item.label === "API"
                    ? "⌘"
                    : "◉"}
              </div>

              <div>
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </div>

              <span className="mini-check">✓</span>
            </div>
          ))}
        </section>

        <section className="workspace" id="tasks">
          <div className="section-heading">
            <div>
              <span className="section-kicker">WORKSPACE</span>
              <h2>Tasks</h2>
            </div>

            <div className="task-summary">
              <strong>
                {completed}/{tasks.length}
              </strong>

              <span>completed</span>
            </div>
          </div>

          <div className="progress-track">
            <div
              className="progress-bar"
              style={{ width: `${progress}%` }}
            />
          </div>

          <form onSubmit={addTask} className="task-form">
            <div className="input-wrap">
              <span>+</span>

              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="What needs to be shipped?"
                aria-label="New task"
              />
            </div>

            <button type="submit">
              Add task <span>↗</span>
            </button>
          </form>

          <div className="task-list">
            {loading ? (
              <div className="empty-state">
                <div className="loader" />
                <p>Connecting to the API...</p>
              </div>
            ) : tasks.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">✓</div>

                <h3>Nothing on the board yet</h3>

                <p>
                  Add your first task and watch it persist in PostgreSQL.
                </p>
              </div>
            ) : (
              tasks.map((task, index) => (
                <article
                  className={`task-row ${
                    task.completed ? "completed" : ""
                  }`}
                  key={task.id}
                >
                  <button
                    className="task-check"
                    onClick={() => toggleTask(task.id)}
                    aria-label={
                      task.completed
                        ? "Mark task incomplete"
                        : "Mark task complete"
                    }
                  >
                    {task.completed ? "✓" : ""}
                  </button>

                  <div className="task-content">
                    <span className="task-number">
                      {String(index + 1).padStart(2, "0")}
                    </span>

                    <span className="task-title">
                      {task.title}
                    </span>
                  </div>

                  <span
                    className={`task-status ${
                      task.completed ? "done" : ""
                    }`}
                  >
                    {task.completed ? "Completed" : "In progress"}
                  </span>

                  <button
                    className="delete-button"
                    onClick={() => deleteTask(task.id)}
                    aria-label={`Delete ${task.title}`}
                  >
                    ×
                  </button>
                </article>
              ))
            )}
          </div>
        </section>

        <section className="ops-strip">
          <div>
            <span className="section-kicker">OPERATIONS</span>

            <strong>
              Built to demonstrate the full delivery lifecycle.
            </strong>
          </div>

          <div className="ops-items">
            <span>
              <i /> GitHub Actions
            </span>

            <span>
              <i /> Docker
            </span>

            <span>
              <i /> AWS EC2
            </span>

            <span>
              <i /> Prometheus
            </span>

            <span>
              <i /> Grafana
            </span>
          </div>
        </section>
      </main>

      <footer>
        <span>TEAM C · TASKFLOW</span>

        <span>
          Containerized application · Automated delivery · AWS staging
        </span>
      </footer>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);