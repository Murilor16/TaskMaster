import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(
  cors({
    origin: "http://localhost:5173",
  })
);
app.use(express.json());

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/taskmaster";
const PORT = process.env.PORT || 4000;

// Schemas
const taskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    status: {
      type: String,
      enum: ["todo", "in-progress", "done"],
      default: "todo",
    },
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
    position: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const columnSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    status: {
      type: String,
      enum: ["todo", "in-progress", "done"],
      required: true,
      unique: false,
    },
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
    position: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const projectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String },
  },
  { timestamps: true }
);

const Project = mongoose.model("Project", projectSchema);
const Column = mongoose.model("Column", columnSchema);
const Task = mongoose.model("Task", taskSchema);

// Routes
app.get("/api/projects", async (_req, res) => {
  let projects = await Project.find().sort({ createdAt: -1 });

  // Seed automático de um projeto inicial para facilitar o uso local
  if (projects.length === 0) {
    const defaultProject = await Project.create({
      name: "Meu primeiro quadro",
      description: "Projeto criado automaticamente para você começar.",
    });
    await Column.insertMany([
      { title: "A Fazer", status: "todo", projectId: defaultProject._id, position: 0 },
      { title: "Em Progresso", status: "in-progress", projectId: defaultProject._id, position: 1 },
      { title: "Concluído", status: "done", projectId: defaultProject._id, position: 2 },
    ]);
    projects = [defaultProject];
  }

  res.json(projects);
});

app.post("/api/projects", async (req, res) => {
  const project = await Project.create(req.body);
  // Create default columns
  await Column.insertMany([
    { title: "A Fazer", status: "todo", projectId: project._id, position: 0 },
    { title: "Em Progresso", status: "in-progress", projectId: project._id, position: 1 },
    { title: "Concluído", status: "done", projectId: project._id, position: 2 },
  ]);
  res.status(201).json(project);
});

app.delete("/api/projects/:projectId", async (req, res) => {
  const { projectId } = req.params;

  const project = await Project.findById(projectId);
  if (!project) {
    return res.status(404).json({ message: "Projeto não encontrado." });
  }

  await Promise.all([
    Task.deleteMany({ projectId }),
    Column.deleteMany({ projectId }),
    Project.findByIdAndDelete(projectId),
  ]);

  return res.status(204).send();
});

app.get("/api/projects/:projectId/board", async (req, res) => {
  const { projectId } = req.params;
  const [project, columns, tasks] = await Promise.all([
    Project.findById(projectId),
    Column.find({ projectId }).sort({ position: 1 }),
    Task.find({ projectId }).sort({ position: 1 }),
  ]);

  if (!project) {
    return res.status(404).json({ message: "Projeto não encontrado" });
  }

  res.json({ project, columns, tasks });
});

app.post("/api/projects/:projectId/tasks", async (req, res) => {
  const { projectId } = req.params;
  const title = typeof req.body?.title === "string" ? req.body.title.trim() : "";
  const description = typeof req.body?.description === "string" ? req.body.description : "";
  const status = ["todo", "in-progress", "done"].includes(req.body?.status)
    ? req.body.status
    : "todo";

  if (!title) {
    return res.status(400).json({ message: "Título da tarefa é obrigatório." });
  }

  const project = await Project.findById(projectId);
  if (!project) {
    return res.status(404).json({ message: "Projeto não encontrado." });
  }

  const lastTask = await Task.findOne({ projectId, status }).sort({ position: -1 });
  const position = lastTask ? lastTask.position + 1 : 0;

  const task = await Task.create({ title, description, status, projectId, position });
  res.status(201).json(task);
});

app.patch("/api/tasks/:taskId", async (req, res) => {
  const { taskId } = req.params;
  const { title, description, status, position } = req.body;

  const task = await Task.findByIdAndUpdate(
    taskId,
    { title, description, status, position },
    { new: true }
  );

  if (!task) {
    return res.status(404).json({ message: "Tarefa não encontrada" });
  }

  res.json(task);
});

app.delete("/api/tasks/:taskId", async (req, res) => {
  const { taskId } = req.params;
  await Task.findByIdAndDelete(taskId);
  res.status(204).send();
});

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("Conectado ao MongoDB");
    app.listen(PORT, () => {
      console.log(`Servidor rodando em http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Erro ao conectar ao MongoDB", err);
    process.exit(1);
  });

