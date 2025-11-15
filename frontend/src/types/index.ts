export interface Task {
  _id: string;
  title: string;
  description: string;
  column: string;
  position: number;
  boardId: string;
  color?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Board {
  _id: string;
  name: string;
  columns: string[];
  createdAt: string;
  updatedAt: string;
  isPublic: boolean;
  owner: User | null;
  sharedWith?: User[];
}

export interface CreateTaskDto {
  title: string;
  description: string;
  column: string;
  boardId: string;
  position?: number;
  color?: string | null;
  userId?: string;
}

export interface UpdateTaskDto {
  title?: string;
  description?: string;
  column?: string;
  position?: number;
  color?: string | null;
  userId?: string;
}

export interface MoveTaskDto {
  sourceColumn: string;
  destinationColumn: string;
  sourceIndex: number;
  destinationIndex: number;
}

export interface ExportBacklogDto {
  email?: string;
}

// WebSocket Events
export interface SocketTaskEvent {
  task: Task;
  userId: string;
  timestamp: string;
}

export interface SocketTaskUpdatedEvent {
  taskId: string;
  boardId: string;
  updates: Partial<Task>;
  userId: string;
  timestamp: string;
}

export interface SocketTaskDeletedEvent {
  taskId: string;
  boardId: string;
  userId: string;
  timestamp: string;
}

export interface SocketTaskMovedEvent {
  taskId: string;
  boardId: string;
  sourceColumn: string;
  destinationColumn: string;
  sourceIndex: number;
  destinationIndex: number;
  userId: string;
  timestamp: string;
}

export interface User {
  _id: string;
  walletAddress: string;
  username?: string;
  email?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface SocketBoardUpdatedEvent {
  boardId: string;
  name: string;
  userId: string;
  timestamp: string;
}

export interface SocketBoardDeletedEvent {
  boardId: string;
  userId: string;
  timestamp: string;
}

// Eventos de columnas
export interface ColumnAddedEvent {
  boardId: string;
  columnName: string;
  columns: string[];
  userId: string;
  timestamp: string;
}

export interface ColumnRenamedEvent {
  boardId: string;
  oldName: string;
  newName: string;
  columns: string[];
  userId: string;
  timestamp: string;
}

export interface ColumnDeletedEvent {
  boardId: string;
  columnName: string;
  columns: string[];
  userId: string;
  timestamp: string;
}

// Eventos de invitaciones
export interface BoardInvitedEvent {
  boardId: string;
  boardName: string;
  invitedBy: string;
  invitedUser: string;
}

export interface BoardInvitationAcceptedEvent {
  boardId: string;
  boardName: string;
  acceptedBy: string;
  ownerId: string;
}

export interface BoardInvitationDeclinedEvent {
  boardId: string;
  boardName: string;
  declinedBy: string;
  ownerId: string;
}