import { io, Socket } from "socket.io-client";
import { WS_URL } from "../config/api";
import type {
  Task,
  SocketTaskEvent,
  SocketTaskUpdatedEvent,
  SocketTaskDeletedEvent,
  SocketTaskMovedEvent,
} from "../types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type EventCallback = (...args: any[]) => void;

class SocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, Array<EventCallback>> = new Map();

  connect() {
    if (this.socket?.connected) {
      console.log("Socket already connected");
      return;
    }

    this.socket = io(WS_URL, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.socket.on("connect", () => {
      console.log("WebSocket conectado:", this.socket?.id);
    });

    this.socket.on("disconnect", () => {
      console.log("WebSocket desconectado");
    });

    this.socket.on("connect_error", (error) => {
      console.error("Error de conexión WebSocket:", error);
    });

    // Re-registrar listeners después de reconectar
    this.socket.on("reconnect", () => {
      console.log("🔄 WebSocket reconectado");
      this.reattachListeners();
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Eventos emitidos desde el cliente
  emitTaskCreated(task: Task) {
    this.socket?.emit("task-created", { task });
  }

  emitTaskUpdated(taskId: string, updates: Partial<Task>) {
    this.socket?.emit("task-updated", { taskId, updates });
  }

  emitTaskDeleted(taskId: string) {
    this.socket?.emit("task-deleted", { taskId });
  }

  emitTaskMoved(data: SocketTaskMovedEvent) {
    this.socket?.emit("task-moved", data);
  }

  // Eventos de columnas emitidos desde el cliente
  emitColumnAdded(columnName: string, columns: string[]) {
    this.socket?.emit("column-added", { columnName, columns });
  }

  emitColumnRenamed(oldName: string, newName: string, columns: string[]) {
    this.socket?.emit("column-renamed", { oldName, newName, columns });
  }

  emitColumnDeleted(columnName: string, columns: string[]) {
    this.socket?.emit("column-deleted", { columnName, columns });
  }

  // Escuchar eventos del servidor
  onTaskCreated(callback: (data: SocketTaskEvent) => void) {
    this.socket?.on("task-created", callback);
    this.addListener("task-created", callback);
  }

  onTaskUpdated(callback: (data: SocketTaskUpdatedEvent) => void) {
    this.socket?.on("task-updated", callback);
    this.addListener("task-updated", callback);
  }

  onTaskDeleted(callback: (data: SocketTaskDeletedEvent) => void) {
    this.socket?.on("task-deleted", callback);
    this.addListener("task-deleted", callback);
  }

  onTaskMoved(callback: (data: SocketTaskMovedEvent) => void) {
    this.socket?.on("task-moved", callback);
    this.addListener("task-moved", callback);
  }

  // Escuchar eventos de columnas del servidor
  onColumnAdded(
    callback: (data: { columnName: string; columns: string[]; userId: string; timestamp: string }) => void
  ) {
    this.socket?.on("column-added", callback);
    this.addListener("column-added", callback);
  }

  onColumnRenamed(
    callback: (data: { oldName: string; newName: string; columns: string[]; userId: string; timestamp: string }) => void
  ) {
    this.socket?.on("column-renamed", callback);
    this.addListener("column-renamed", callback);
  }

  onColumnDeleted(
    callback: (data: { columnName: string; columns: string[]; userId: string; timestamp: string }) => void
  ) {
    this.socket?.on("column-deleted", callback);
    this.addListener("column-deleted", callback);
  }

  onUserConnected(
    callback: (data: { userId: string; count: number; timestamp: string }) => void
  ) {
    this.socket?.on("user-connected", callback);
    this.addListener("user-connected", callback);
  }

  onUserDisconnected(
    callback: (data: { userId: string; count: number; timestamp: string }) => void
  ) {
    this.socket?.on("user-disconnected", callback);
    this.addListener("user-disconnected", callback);
  }

  onConnectedUsersCount(
    callback: (data: { count: number; timestamp: string }) => void
  ) {
    this.socket?.on("connected-users-count", callback);
    this.addListener("connected-users-count", callback);
  }

  // Remover listeners
  off(event: string, callback?: EventCallback) {
    this.socket?.off(event, callback);
    if (callback) {
      const listeners = this.listeners.get(event);
      if (listeners) {
        const index = listeners.indexOf(callback);
        if (index > -1) {
          listeners.splice(index, 1);
        }
      }
    }
  }

  // Helpers privados
  private addListener(event: string, callback: EventCallback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)?.push(callback);
  }

  private reattachListeners() {
    this.listeners.forEach((callbacks, event) => {
      callbacks.forEach((callback) => {
        this.socket?.on(event, callback);
      });
    });
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

// Exportar instancia única
export const socketService = new SocketService();
