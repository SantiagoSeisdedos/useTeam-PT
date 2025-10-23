import axios from "axios";
import type {
  Task,
  Board,
  CreateTaskDto,
  UpdateTaskDto,
  MoveTaskDto,
  ExportBacklogDto,
  User,
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
  // Obtener todas las tareas (opcionalmente filtradas por board)
  getAll: async (boardId?: string): Promise<Task[]> => {
    const url = boardId ? `/api/tasks?boardId=${boardId}` : "/api/tasks";
    const response = await api.get<Task[]>(url);
    return response.data;
  },

  // Obtener tareas por columna y board
  getByColumn: async (column: string, boardId?: string): Promise<Task[]> => {
    let url = `/api/tasks?column=${encodeURIComponent(column)}`;
    if (boardId) {
      url += `&boardId=${boardId}`;
    }
    const response = await api.get<Task[]>(url);
    return response.data;
  },

  // Obtener una tarea por ID
  getById: async (id: string): Promise<Task> => {
    const response = await api.get<Task>(`/api/tasks/${id}`);
    return response.data;
  },

  // Crear una nueva tarea
  create: async (data: CreateTaskDto): Promise<Task> => {
    const response = await api.post<Task>("/api/tasks", data);
    return response.data;
  },

  // Actualizar una tarea
  update: async (id: string, data: UpdateTaskDto): Promise<Task> => {
    const response = await api.patch<Task>(`/api/tasks/${id}`, data);
    return response.data;
  },

  // Mover una tarea (drag & drop)
  move: async (id: string, data: MoveTaskDto): Promise<Task> => {
    const response = await api.patch<Task>(`/api/tasks/${id}/move`, data);
    return response.data;
  },

  // Eliminar una tarea
  delete: async (id: string): Promise<Task> => {
    const response = await api.delete<Task>(`/api/tasks/${id}`);
    return response.data;
  },
};

// Boards API
export const boardsApi = {
  // Obtener todos los tableros
  getAll: async (userId?: string): Promise<Board[]> => {
    const url = userId ? `/api/boards?userId=${userId}` : "/api/boards";
    const response = await api.get<Board[]>(url);
    return response.data;
  },

  // Obtener un tablero por ID
  getById: async (id: string): Promise<Board> => {
    const response = await api.get<Board>(`/api/boards/${id}`);
    return response.data;
  },

  // Crear un tablero
  create: async (data: { name: string; columns: string[] }): Promise<Board> => {
    const response = await api.post<Board>("/api/boards", data);
    return response.data;
  },

  // Actualizar un tablero
  update: async (id: string, data: { name?: string }): Promise<Board> => {
    const response = await api.patch<Board>(`/api/boards/${id}`, data);
    return response.data;
  },

  // Eliminar un tablero
  delete: async (id: string): Promise<Board> => {
    const response = await api.delete<Board>(`/api/boards/${id}`);
    return response.data;
  },

  // Agregar una columna
  addColumn: async (id: string, columnName: string): Promise<Board> => {
    const response = await api.post<Board>(`/api/boards/${id}/columns`, { columnName });
    return response.data;
  },

  // Renombrar una columna
  renameColumn: async (id: string, oldName: string, newName: string): Promise<Board> => {
    const response = await api.patch<Board>(`/api/boards/${id}/columns/rename`, { oldName, newName });
    return response.data;
  },

  // Eliminar una columna
  deleteColumn: async (id: string, columnName: string): Promise<Board> => {
    const response = await api.delete<Board>(`/api/boards/${id}/columns/${encodeURIComponent(columnName)}`);
    return response.data;
  },

  // Compartir tablero con otro usuario
  shareBoard: async (id: string, targetUserId: string): Promise<Board> => {
    const response = await api.post<Board>(`/api/boards/${id}/share`, { targetUserId });
    return response.data;
  },

  // Remover acceso compartido
  unshareBoard: async (id: string, targetUserId: string): Promise<Board> => {
    const response = await api.post<Board>(`/api/boards/${id}/unshare`, { targetUserId });
    return response.data;
  },
};

// Export API (⭐ CRÍTICO para el challenge)
export const exportApi = {
  // Exportar backlog vía email
  exportBacklog: async (
    data: ExportBacklogDto = {}
  ): Promise<{ success: boolean; message: string; tasksExported: number }> => {
    const response = await api.post("/api/export/backlog", data);
    return response.data;
  },
};

// AI API (Mejora de descripciones con IA)
export const aiApi = {
  // Obtener estado de proveedores de IA
  getStatus: async (): Promise<{
    openai: { available: boolean; models: string[] };
    gemini: { available: boolean; models: string[] };
  }> => {
    const response = await api.get("/api/ai/status");
    return response.data;
  },

  // Mejorar descripción de tarea
  improveDescription: async (data: {
    currentDescription: string;
    taskTitle: string;
    mode: 'simple' | 'context';
    model?:
      | 'gpt-3.5-turbo'
      | 'gpt-4o-mini'
      | 'gpt-4o'
      | 'gemini-2.5-flash'
      | 'gemini-2.5-pro';
    contextTasks?: Array<{ title: string; description: string; column: string }>;
  }): Promise<{
    success: boolean;
    original: string;
    improved: string;
    mode: string;
    model: string;
  }> => {
    const response = await api.post("/api/ai/improve-description", data);
    return response.data;
  },
};




// Invitations API
export const invitationsApi = {
  createInvitation: async (boardId: string, invitedUserId: string) => {
    const response = await api.post("/api/invitations", { boardId, invitedUserId });
    return response.data;
  },

  getPendingInvitations: async () => {
    const response = await api.get("/api/invitations/pending");
    return response.data;
  },

  getSentInvitations: async () => {
    const response = await api.get("/api/invitations/sent");
    return response.data;
  },

  acceptInvitation: async (invitationId: string) => {
    const response = await api.patch(`/api/invitations/${invitationId}/accept`);
    return response.data;
  },

  rejectInvitation: async (invitationId: string) => {
    const response = await api.patch(`/api/invitations/${invitationId}/reject`);
    return response.data;
  },

  leaveBoard: async (boardId: string) => {
    const response = await api.post(`/api/invitations/${boardId}/leave`);
    return response.data;
  },
};

// Auth API
export const authApi = {
  getNonce: async (walletAddress: string): Promise<{ nonce: string }> => {
    const response = await api.post("/auth/nonce", { walletAddress });
    return response.data;
  },

  verify: async (
    walletAddress: string,
    signature: string,
    message: string
  ): Promise<{ token: string; user: User }> => {
    const response = await api.post("/auth/verify", {
      walletAddress,
      signature,
      message,
    });
    return response.data;
  },

  getProfile: async (): Promise<User> => {
    const response = await api.get("/auth/profile");
    return response.data;
  },

  // Buscar usuario por wallet address
  getUserByWallet: async (walletAddress: string): Promise<{ userId: string; walletAddress: string }> => {
    const response = await api.get(`/auth/user-by-wallet/${walletAddress}`);
    return response.data;
  },
};

// Interceptor para agregar token JWT a todas las peticiones
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("auth_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
