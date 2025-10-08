export interface TaskCreatedEvent {
  task: {
    title: string;
    description: string;
    column: string;
    [key: string]: any;
  };
}

export interface TaskUpdatedEvent {
  taskId: string;
  updates: Record<string, any>;
}

export interface TaskDeletedEvent {
  taskId: string;
}

export interface TaskMovedEvent {
  taskId: string;
  sourceColumn: string;
  destinationColumn: string;
  sourceIndex: number;
  destinationIndex: number;
}

// Column Events
export interface ColumnAddedEvent {
  columnName: string;
  columns: string[];
}

export interface ColumnRenamedEvent {
  oldName: string;
  newName: string;
  columns: string[];
}

export interface ColumnDeletedEvent {
  columnName: string;
  columns: string[];
}
