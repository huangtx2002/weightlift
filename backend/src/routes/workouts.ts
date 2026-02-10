import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma";

const router = Router();

const SetSchema = z.object({
  weight: z.number().nullable(),
  reps: z.number().int().nullable(),
});

const ExerciseSchema = z.object({
  name: z.string().min(1).max(80),
  sets: z.array(SetSchema).min(1),
});

const SaveWorkoutSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), 
  exercises: z.array(ExerciseSchema).min(1),
});

router.post("/", async (req, res) => {
  const parsed = SaveWorkoutSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: parsed.error.flatten() });
  }

  const { date, exercises } = parsed.data;

  try {
    const created = await prisma.workout.create({
      data: {
        date: new Date(date), 
        exercises: {
          create: exercises.map((ex, i) => ({
            name: ex.name,
            order: i,
            sets: {
              create: ex.sets.map((s, j) => ({
                order: j,
                weight: s.weight,
                reps: s.reps,
              })),
            },
          })),
        },
      },
      select: { id: true },
    });

    return res.json({ ok: true, workoutId: created.id.toString() });
  } catch (e: any) {
    return res.status(500).json({ ok: false, error: e?.message ?? "server_error" });
  }
});

const SaveRestDaySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

router.post("/rest", async (req, res) => {
  const parsed = SaveRestDaySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: parsed.error.flatten() });
  }

  const { date } = parsed.data;

  try {
    const created = await prisma.workout.create({
      data: {
        date: new Date(date + "T00:00:00.000Z"),
        restDay: true,
      },
      select: { id: true },
    });

    return res.json({ ok: true, workoutId: created.id.toString() });
  } catch (e: any) {
    return res.status(500).json({ ok: false, error: e?.message ?? "server_error" });
  }
});

router.get("/range", async (req, res) => {
  const start = String(req.query.start ?? "");
  const end = String(req.query.end ?? "");

  if (!/^\d{4}-\d{2}-\d{2}$/.test(start) || !/^\d{4}-\d{2}-\d{2}$/.test(end)) {
    return res.status(400).json({ ok: false, error: "start_end_required_YYYY-MM-DD" });
  }

  const startDt = new Date(start + "T00:00:00.000Z");
  const endDt = new Date(end + "T23:59:59.999Z");

  const workouts = await prisma.workout.findMany({
    where: { date: { gte: startDt, lte: endDt } },
    orderBy: [{ date: "asc" }, { createdAt: "asc" }],
    include: {
      exercises: {
        orderBy: { order: "asc" },
        include: { sets: { orderBy: { order: "asc" } } },
      },
    },
  });

  return res.json({
    ok: true,
    workouts: workouts.map((w) => ({
      id: w.id.toString(),
      date: w.date.toISOString().slice(0, 10),
      createdAt: w.createdAt,
      restDay: (w as any).restDay ?? false,
      exercises: w.exercises.map((ex) => ({
        id: ex.id.toString(),
        name: ex.name,
        sets: ex.sets.map((s) => ({
          id: s.id.toString(),
          weight: s.weight === null ? null : Number(s.weight),
          reps: s.reps === null ? null : s.reps,
        })),
      })),
    })),
  });
});

router.get("/", async (req, res) => {
  const date = String(req.query.date ?? "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ ok: false, error: "date_required_YYYY-MM-DD" });
  }

  // Date range for that day (local-safe)
  const start = new Date(date + "T00:00:00.000Z");
  const end = new Date(date + "T23:59:59.999Z");

  const workouts = await prisma.workout.findMany({
    where: { date: { gte: start, lte: end } },
    orderBy: { createdAt: "asc" }, // or "desc" if you want newest first
    include: {
      exercises: {
        orderBy: { order: "asc" },
        include: { sets: { orderBy: { order: "asc" } } },
      },
    },
  });

  return res.json({
    ok: true,
    date,
    workouts: workouts.map((w) => ({
      id: w.id.toString(),
      date,
      createdAt: w.createdAt,
      restDay: (w as any).restDay ?? false, // keep even if you haven't added field yet
      exercises: w.exercises.map((ex) => ({
        id: ex.id.toString(),
        name: ex.name,
        sets: ex.sets.map((s) => ({
          id: s.id.toString(),
          weight: s.weight === null ? null : Number(s.weight),
          reps: s.reps === null ? null : s.reps,
        })),
      })),
    })),
  });
});

export default router;
