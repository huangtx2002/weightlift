import "dotenv/config";
import express from "express";
import cors from "cors";
import workoutsRouter from "./routes/workouts";

const app = express();

app.use(cors({ origin: true }));
app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req, res) => res.json({ ok: true }));
app.use("/api/workouts", workoutsRouter);

const port = Number(process.env.PORT ?? 3001);
app.listen(port, () => console.log(`API on http://localhost:${port}`));
