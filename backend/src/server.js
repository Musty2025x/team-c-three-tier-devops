import express from "express";
import pg from "pg";
import client from "prom-client";

const { Pool } = pg;
const app = express();
const port = Number(process.env.PORT || 5000);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

client.collectDefaultMetrics();

const requestCounter = new client.Counter({
  name: "http_requests_total",
  help: "Total HTTP requests",
  labelNames: ["method", "route", "status_code"]
});

const requestDuration = new client.Histogram({
  name: "http_request_duration_seconds",
  help: "HTTP request duration in seconds",
  labelNames: ["method", "route", "status_code"],
  buckets: [0.05, 0.1, 0.25, 0.5, 1, 2]
});

app.use(express.json());

app.use((req, res, next) => {
  const start = process.hrtime.bigint();
  res.on("finish", () => {
    const seconds = Number(process.hrtime.bigint() - start) / 1e9;
    const route = req.route?.path || req.path;
    requestCounter.inc({
      method: req.method,
      route,
      status_code: String(res.statusCode)
    });
    requestDuration.observe(
      { method: req.method, route, status_code: String(res.statusCode) },
      seconds
    );
  });
  next();
});

app.get("/api/health", async (_req, res) => {
  try {
    await pool.query("SELECT 1");
    res.status(200).json({
      status: "ok",
      service: "team-c-api",
      database: "connected"
    });
  } catch {
    res.status(503).json({
      status: "error",
      database: "unavailable"
    });
  }
});

app.get("/api/metrics", async (_req, res) => {
  res.set("Content-Type", client.register.contentType);
  res.end(await client.register.metrics());
});

app.get("/api/tasks", async (_req, res) => {
  const result = await pool.query(
    "SELECT id, title, completed, created_at FROM tasks ORDER BY id DESC"
  );
  res.json(result.rows);
});

app.post("/api/tasks", async (req, res) => {
  const { title } = req.body;
  if (!title || !title.trim()) {
    return res.status(400).json({ error: "title is required" });
  }

  const result = await pool.query(
    "INSERT INTO tasks (title) VALUES ($1) RETURNING id, title, completed, created_at",
    [title.trim()]
  );

  return res.status(201).json(result.rows[0]);
});

app.patch("/api/tasks/:id", async (req, res) => {
  const result = await pool.query(
    "UPDATE tasks SET completed = NOT completed WHERE id = $1 RETURNING id, title, completed, created_at",
    [req.params.id]
  );

  if (!result.rowCount) {
    return res.status(404).json({ error: "task not found" });
  }

  return res.json(result.rows[0]);
});

app.delete("/api/tasks/:id", async (req, res) => {
  const result = await pool.query(
    "DELETE FROM tasks WHERE id = $1 RETURNING id",
    [req.params.id]
  );

  if (!result.rowCount) {
    return res.status(404).json({ error: "task not found" });
  }

  return res.status(204).send();
});

app.listen(port, () => {
  console.log(`API listening on port ${port}`);
});

export { app };
