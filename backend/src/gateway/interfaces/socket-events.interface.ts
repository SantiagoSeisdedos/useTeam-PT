export interface TaskCreatedEvent {
  task: {
    title: string;
    description: string;
    column: string;
    boardId: string;
    [key: string]: any;
  };
}

export interface TaskUpdatedEvent {
  taskId: string;
  boardId: string;
  updates: Record<string, any>;
}

export interface TaskDeletedEvent {
  taskId: string;
  boardId: string;
}

export interface TaskMovedEvent {
  taskId: string;
  boardId: string;
  sourceColumn: string;
  destinationColumn: string;
  sourceIndex: number;
  destinationIndex: number;
}

// Column Events
export interface ColumnAddedEvent {
  boardId: string;
  columnName: string;
  columns: string[];
}

export interface ColumnRenamedEvent {
  boardId: string;
  oldName: string;
  newName: string;
  columns: string[];
}

export interface ColumnDeletedEvent {
  boardId: string;
  columnName: string;
  columns: string[];
}

// Board Events
export interface BoardUpdatedEvent {
  boardId: string;
  name: string;
}

export interface BoardDeletedEvent {
  boardId: string;
}

// Invitation Events
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
