import { io, Socket } from "socket.io-client";
import { WS_URL } from "../config/api";
import type {
  Task,
  SocketTaskEvent,
  SocketTaskUpdatedEvent,
  SocketTaskDeletedEvent,
  SocketTaskMovedEvent,
  BoardInvitedEvent,
  BoardInvitationAcceptedEvent,
  BoardInvitationDeclinedEvent,
  ColumnAddedEvent,
  ColumnRenamedEvent,
  ColumnDeletedEvent,
} from "../types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type EventCallback = (...args: any[]) => void;

class SocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, Array<EventCallback>> = new Map();

  connect() {
    if (this.socket?.connected) {
      return;
    }

    this.socket = io(WS_URL, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.socket.on("connect", () => {});

    this.socket.on("disconnect", () => {});

    this.socket.on("connect_error", (error) => {
      console.error("Error de conexión WebSocket:", error);
    });

    // Re-registrar listeners después de reconectar
    this.socket.on("reconnect", () => {
      this.reattachListeners();
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Métodos para manejar rooms de tableros
  joinBoard(boardId: string) {
    if (this.socket?.connected) {
      this.socket.emit("join-board", { boardId });
    }
  }

  leaveBoard(boardId: string) {
    if (this.socket?.connected) {
      this.socket.emit("leave-board", { boardId });
    }
  }

  // Eventos emitidos desde el cliente
  emitTaskCreated(task: Task) {
    this.socket?.emit("task-created", { task });
  }

  emitTaskUpdated(taskId: string, boardId: string, updates: Partial<Task>) {
    this.socket?.emit("task-updated", { taskId, boardId, updates });
  }

  emitTaskDeleted(taskId: string, boardId: string) {
    this.socket?.emit("task-deleted", { taskId, boardId });
  }

  emitTaskMoved(data: SocketTaskMovedEvent) {
    this.socket?.emit("task-moved", data);
  }

  // Eventos de columnas emitidos desde el cliente
  emitColumnAdded(boardId: string, columnName: string, columns: string[]) {
    this.socket?.emit("column-added", { boardId, columnName, columns });
  }

  emitColumnRenamed(
    boardId: string,
    oldName: string,
    newName: string,
    columns: string[]
  ) {
    this.socket?.emit("column-renamed", { boardId, oldName, newName, columns });
  }

  emitColumnDeleted(boardId: string, columnName: string, columns: string[]) {
    this.socket?.emit("column-deleted", { boardId, columnName, columns });
  }

  // Eventos de tableros emitidos desde el cliente
  emitBoardUpdated(boardId: string, name: string) {
    this.socket?.emit("board-updated", { boardId, name });
  }

  emitBoardDeleted(boardId: string) {
    this.socket?.emit("board-deleted", { boardId });
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
    callback: (data: ColumnAddedEvent) => void
  ) {
    this.socket?.on("column-added", callback);
    this.addListener("column-added", callback);
  }

  onColumnRenamed(
    callback: (data: ColumnRenamedEvent) => void
  ) {
    this.socket?.on("column-renamed", callback);
    this.addListener("column-renamed", callback);
  }

  onColumnDeleted(
    callback: (data: ColumnDeletedEvent) => void
  ) {
    this.socket?.on("column-deleted", callback);
    this.addListener("column-deleted", callback);
  }

  onUserConnected(
    callback: (data: {
      userId: string;
      count: number;
      timestamp: string;
    }) => void
  ) {
    this.socket?.on("user-connected", callback);
    this.addListener("user-connected", callback);
  }

  onUserDisconnected(
    callback: (data: {
      userId: string;
      count: number;
      timestamp: string;
    }) => void
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

  // Escuchar eventos de tableros del servidor
  onBoardUpdated(
    callback: (data: {
      boardId: string;
      name: string;
      userId: string;
      timestamp: string;
    }) => void
  ) {
    this.socket?.on("board-updated", callback);
    this.addListener("board-updated", callback);
  }

  onBoardDeleted(
    callback: (data: {
      boardId: string;
      userId: string;
      timestamp: string;
    }) => void
  ) {
    this.socket?.on("board-deleted", callback);
    this.addListener("board-deleted", callback);
  }

  // Invitation events
  onBoardInvited(
    callback: (data: {
      boardId: string;
      boardName: string;
      invitedBy: string;
      timestamp: string;
    }) => void
  ) {
    this.socket?.on("board-invited", callback);
    this.addListener("board-invited", callback);
  }

  onBoardInvitationAccepted(
    callback: (data: {
      boardId: string;
      boardName: string;
      acceptedBy: string;
      timestamp: string;
    }) => void
  ) {
    this.socket?.on("board-invitation-accepted", callback);
    this.addListener("board-invitation-accepted", callback);
  }

  onBoardInvitationDeclined(
    callback: (data: {
      boardId: string;
      boardName: string;
      declinedBy: string;
      timestamp: string;
    }) => void
  ) {
    this.socket?.on("board-invitation-declined", callback);
    this.addListener("board-invitation-declined", callback);
  }

  // Emit invitation events
  emitBoardInvited(data: BoardInvitedEvent) {
    this.socket?.emit("board-invited", data);
  }

  emitBoardInvitationAccepted(data: BoardInvitationAcceptedEvent) {
    this.socket?.emit("board-invitation-accepted", data);
  }

  emitBoardInvitationDeclined(data: BoardInvitationDeclinedEvent) {
    this.socket?.emit("board-invitation-declined", data);
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

  getSocketId(): string | undefined {
    return this.socket?.id;
  }
}

// Exportar instancia única
export const socketService = new SocketService();
