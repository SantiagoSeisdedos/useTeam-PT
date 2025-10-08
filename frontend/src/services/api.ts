import axios from "axios";
import type {
  Task,
  Board,
  CreateTaskDto,
  UpdateTaskDto,
  MoveTaskDto,
  ExportBacklogDto,
} from "../types";
import { API_URL } from "../config/api";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Tasks API
export const tasksApi = {
  // Obtener todas las tareas
  getAll: async (): Promise<Task[]> => {
    const response = await api.get<Task[]>("/tasks");
    return response.data;
  },

  // Obtener tareas por columna
  getByColumn: async (column: string): Promise<Task[]> => {
    const response = await api.get<Task[]>(
      `/tasks?column=${encodeURIComponent(column)}`
    );
    return response.data;
  },

  // Obtener una tarea por ID
  getById: async (id: string): Promise<Task> => {
    const response = await api.get<Task>(`/tasks/${id}`);
    return response.data;
  },

  // Crear una nueva tarea
  create: async (data: CreateTaskDto): Promise<Task> => {
    const response = await api.post<Task>("/tasks", data);
    return response.data;
  },

  // Actualizar una tarea
  update: async (id: string, data: UpdateTaskDto): Promise<Task> => {
    const response = await api.patch<Task>(`/tasks/${id}`, data);
    return response.data;
  },

  // Mover una tarea (drag & drop)
  move: async (id: string, data: MoveTaskDto): Promise<Task> => {
    const response = await api.patch<Task>(`/tasks/${id}/move`, data);
    return response.data;
  },

  // Eliminar una tarea
  delete: async (id: string): Promise<Task> => {
    const response = await api.delete<Task>(`/tasks/${id}`);
    return response.data;
  },
};

// Boards API
export const boardsApi = {
  // Obtener todos los tableros
  getAll: async (): Promise<Board[]> => {
    const response = await api.get<Board[]>("/boards");
    return response.data;
  },

  // Obtener un tablero por ID
  getById: async (id: string): Promise<Board> => {
    const response = await api.get<Board>(`/boards/${id}`);
    return response.data;
  },

  // Agregar una columna
  addColumn: async (id: string, columnName: string): Promise<Board> => {
    const response = await api.post<Board>(`/boards/${id}/columns`, { columnName });
    return response.data;
  },

  // Renombrar una columna
  renameColumn: async (id: string, oldName: string, newName: string): Promise<Board> => {
    const response = await api.patch<Board>(`/boards/${id}/columns/rename`, { oldName, newName });
    return response.data;
  },

  // Eliminar una columna
  deleteColumn: async (id: string, columnName: string): Promise<Board> => {
    const response = await api.delete<Board>(`/boards/${id}/columns/${encodeURIComponent(columnName)}`);
    return response.data;
  },
};

// Export API (⭐ CRÍTICO para el challenge)
export const exportApi = {
  // Exportar backlog vía email
  exportBacklog: async (
    data: ExportBacklogDto = {}
  ): Promise<{ success: boolean; message: string; tasksExported: number }> => {
    console.log("1 exportBacklog", data);
    const response = await api.post("/export/backlog", data);
    console.log("2 response", response);
    return response.data;
  },
};

// AI API (Mejora de descripciones con IA)
export const aiApi = {
  // Mejorar descripción de tarea
  improveDescription: async (data: {
    currentDescription: string;
    taskTitle: string;
    mode: 'simple' | 'context';
    model?: 'gpt-3.5-turbo' | 'gpt-4o-mini' | 'gpt-4o';
    contextTasks?: Array<{ title: string; description: string; column: string }>;
  }): Promise<{
    success: boolean;
    original: string;
    improved: string;
    mode: string;
    model: string;
  }> => {
    const response = await api.post("/ai/improve-description", data);
    return response.data;
  },
};
