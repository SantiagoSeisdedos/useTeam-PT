import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { boardsApi, tasksApi } from "../services/api";
import { socketService } from "../services/socket";
import { useAuth } from "./AuthContext";
import { toast } from "sonner";

import type { Board, Task } from "../types";

interface BoardsContextType {
  // Estado
  boards: Board[];
  activeBoard: Board | null;
  tasks: Task[];
  loading: boolean;
  error: string | null;

  // Acciones de tableros
  loadBoards: () => Promise<void>;
  setActiveBoard: (board: Board | null) => void;
  createBoard: (data: { name: string; columns: string[] }) => Promise<void>;
  updateBoard: (
    id: string,
    data: { name?: string; isPublic?: boolean }
  ) => Promise<void>;
  deleteBoard: (id: string) => Promise<void>;
  addColumn: (boardId: string, columnName: string) => Promise<void>;
  renameColumn: (
    boardId: string,
    oldName: string,
    newName: string
  ) => Promise<void>;
  deleteColumn: (boardId: string, columnName: string) => Promise<void>;

  // Acciones de tareas
  loadTasks: (boardId?: string) => Promise<void>;
  createTask: (data: {
    title: string;
    description: string;
    column: string;
    boardId: string;
  }) => Promise<void>;
  updateTask: (
    id: string,
    data: { title?: string; description?: string }
  ) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  moveTask: (
    id: string,
    data: {
      column: string;
      position: number;
      sourceColumn: string;
      sourceIndex: number;
    }
  ) => Promise<void>;

  // Utilidades
  getTasksByColumn: (column: string) => Task[];
  refreshData: () => Promise<void>;
}

const BoardsContext = createContext<BoardsContextType | undefined>(undefined);

interface BoardsProviderProps {
  children: ReactNode;
}

export const BoardsProvider: React.FC<BoardsProviderProps> = ({ children }) => {
  const { isAuthenticated, user, isInitializing } = useAuth();
  const [boards, setBoards] = useState<Board[]>([]);
  const [activeBoard, setActiveBoardState] = useState<Board | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar tableros
  const loadBoards = async () => {
    try {
      setLoading(true);
      setError(null);
      const boardsData = await boardsApi.getAll(user?._id);
      setBoards(boardsData);

      // Si no hay tablero activo y hay tableros disponibles, seleccionar el primero
      if (!activeBoard && boardsData.length > 0) {
        const firstBoard = boardsData[0];
        setActiveBoardState(firstBoard);
        // Cargar tareas del primer tablero
        loadTasks(firstBoard._id);
      }
    } catch (err) {
      console.error("Error loading boards:", err);
      setError("Error al cargar los tableros");
      toast.error("Error al cargar los tableros");
    } finally {
      setLoading(false);
    }
  };

  // Cargar tareas
  const loadTasks = async (boardId?: string) => {
    const targetBoardId = boardId || activeBoard?._id;
    if (!targetBoardId) return;

    try {
      setLoading(true);
      const tasksData = await tasksApi.getAll(targetBoardId);
      setTasks(tasksData);
    } catch (err) {
      console.error("Error loading tasks:", err);
      setError("Error al cargar las tareas");
      toast.error("Error al cargar las tareas");
    } finally {
      setLoading(false);
    }
  };

  // Establecer tablero activo
  const setActiveBoard = (board: Board | null) => {
    setActiveBoardState(board);
    if (board) {
      // Salir del room anterior y unirse al nuevo
      socketService.leaveBoard(activeBoard?._id || "");
      socketService.joinBoard(board._id);
      loadTasks(board._id);
    }
  };

  // Crear tablero
  const createBoard = async (data: { name: string; columns: string[] }) => {
    try {
      const newBoard = await boardsApi.create(data);
      setBoards((prev) => [...prev, newBoard]);
      toast.success("Tablero creado exitosamente");
    } catch (err) {
      console.error("Error creating board:", err);
      toast.error("Error al crear el tablero");
    }
  };

  // Actualizar tablero
  const updateBoard = async (
    id: string,
    data: { name?: string; isPublic?: boolean }
  ) => {
    try {
      const updatedBoard = await boardsApi.update(id, data);
      setBoards((prev) =>
        prev.map((board) => (board._id === id ? updatedBoard : board))
      );
      if (activeBoard?._id === id) {
        setActiveBoardState(updatedBoard);
      }
      toast.success("Tablero actualizado exitosamente");
    } catch (err) {
      console.error("Error updating board:", err);
      toast.error("Error al actualizar el tablero");
    }
  };

  // Eliminar tablero
  const deleteBoard = async (id: string) => {
    try {
      await boardsApi.delete(id);
      setBoards((prev) => prev.filter((board) => board._id !== id));

      // Si el tablero eliminado era el activo, seleccionar otro
      if (activeBoard?._id === id) {
        const remainingBoards = boards.filter((board) => board._id !== id);
        setActiveBoardState(
          remainingBoards.length > 0 ? remainingBoards[0] : null
        );
      }

      toast.success("Tablero eliminado exitosamente");
    } catch (err) {
      console.error("Error deleting board:", err);
      toast.error("Error al eliminar el tablero");
    }
  };

  // Agregar columna
  const addColumn = async (boardId: string, columnName: string) => {
    try {
      const updatedBoard = await boardsApi.addColumn(boardId, columnName);
      setBoards((prev) =>
        prev.map((board) => (board._id === boardId ? updatedBoard : board))
      );
      if (activeBoard?._id === boardId) {
        setActiveBoardState(updatedBoard);
      }
      toast.success("Columna creada exitosamente");
    } catch (err) {
      console.error("Error adding column:", err);
      toast.error("Error al crear la columna");
    }
  };

  // Renombrar columna
  const renameColumn = async (
    boardId: string,
    oldName: string,
    newName: string
  ) => {
    try {
      const updatedBoard = await boardsApi.renameColumn(
        boardId,
        oldName,
        newName
      );
      setBoards((prev) =>
        prev.map((board) => (board._id === boardId ? updatedBoard : board))
      );
      if (activeBoard?._id === boardId) {
        setActiveBoardState(updatedBoard);
      }
      toast.success("Columna renombrada exitosamente");
    } catch (err) {
      console.error("Error renaming column:", err);
      toast.error("Error al renombrar la columna");
    }
  };

  // Eliminar columna
  const deleteColumn = async (boardId: string, columnName: string) => {
    try {
      const updatedBoard = await boardsApi.deleteColumn(boardId, columnName);
      setBoards((prev) =>
        prev.map((board) => (board._id === boardId ? updatedBoard : board))
      );
      if (activeBoard?._id === boardId) {
        setActiveBoardState(updatedBoard);
      }
      toast.success("Columna eliminada exitosamente");
    } catch (err) {
      console.error("Error deleting column:", err);
      toast.error("Error al eliminar la columna");
    }
  };

  // Crear tarea
  const createTask = async (data: {
    title: string;
    description: string;
    column: string;
    boardId: string;
  }) => {
    try {
      const newTask = await tasksApi.create(data);
      setTasks((prev) => [...prev, newTask]);
      toast.success("Tarea creada exitosamente");
    } catch (err) {
      console.error("Error creating task:", err);
      toast.error("Error al crear la tarea");
    }
  };

  // Actualizar tarea
  const updateTask = async (
    id: string,
    data: { title?: string; description?: string }
  ) => {
    try {
      const updatedTask = await tasksApi.update(id, data);
      setTasks((prev) =>
        prev.map((task) => (task._id === id ? updatedTask : task))
      );
      toast.success("Tarea actualizada exitosamente");
    } catch (err) {
      console.error("Error updating task:", err);
      toast.error("Error al actualizar la tarea");
    }
  };

  // Eliminar tarea
  const deleteTask = async (id: string) => {
    try {
      await tasksApi.delete(id);
      setTasks((prev) => prev.filter((task) => task._id !== id));
      toast.success("Tarea eliminada exitosamente");
    } catch (err) {
      console.error("Error deleting task:", err);
      toast.error("Error al eliminar la tarea");
    }
  };

  // Mover tarea
  const moveTask = async (
    id: string,
    data: {
      column: string;
      position: number;
      sourceColumn: string;
      sourceIndex: number;
    }
  ) => {
    try {
      await tasksApi.move(id, {
        sourceColumn: data.sourceColumn,
        destinationColumn: data.column,
        sourceIndex: data.sourceIndex,
        destinationIndex: data.position,
      });
      // La actualización local se maneja en el componente para mejor UX
      toast.success("Tarea movida exitosamente");
    } catch (err) {
      console.error("Error moving task:", err);
      toast.error("Error al mover la tarea");
    }
  };

  // Obtener tareas por columna
  const getTasksByColumn = (column: string): Task[] => {
    return tasks
      .filter((task) => task.column === column)
      .sort((a, b) => a.position - b.position);
  };

  // Refrescar todos los datos
  const refreshData = async () => {
    await Promise.all([loadBoards(), loadTasks()]);
  };

  // Efectos
  useEffect(() => {
    // No cargar datos mientras se está inicializando
    if (isInitializing) return;

    if (isAuthenticated && user) {
      loadBoards();
    } else if (!isAuthenticated) {
      // Cargar tableros públicos cuando no está autenticado
      loadBoards();
    } else {
      // Limpiar datos cuando no hay usuario
      setBoards([]);
      setActiveBoardState(null);
      setTasks([]);
    }
  }, [isAuthenticated, user, isInitializing]);

  // WebSocket listeners
  useEffect(() => {
    // Configurar listeners de WebSocket
    const handleTaskCreated = (data: any) => {
      if (data.task && data.task.boardId === activeBoard?._id) {
        setTasks((prev) => [...prev, data.task]);
      }
    };

    const handleTaskUpdated = (data: any) => {
      if (data.boardId === activeBoard?._id) {
        setTasks((prev) =>
          prev.map((task) =>
            task._id === data.taskId ? { ...task, ...data.updates } : task
          )
        );
      }
    };

    const handleTaskDeleted = (data: any) => {
      if (data.boardId === activeBoard?._id) {
        setTasks((prev) => prev.filter((task) => task._id !== data.taskId));
      }
    };

    const handleTaskMoved = (data: any) => {
      if (data.boardId === activeBoard?._id) {
        setTasks((prev) =>
          prev.map((task) =>
            task._id === data.taskId
              ? {
                  ...task,
                  column: data.destinationColumn,
                  position: data.destinationIndex,
                }
              : task
          )
        );
      }
    };

    const handleBoardUpdated = (data: any) => {
      setBoards((prev) =>
        prev.map((board) =>
          board._id === data.boardId ? { ...board, name: data.name } : board
        )
      );
    };

    const handleBoardDeleted = (data: any) => {
      setBoards((prev) => prev.filter((board) => board._id !== data.boardId));
      if (activeBoard?._id === data.boardId) {
        const remainingBoards = boards.filter(
          (board) => board._id !== data.boardId
        );
        setActiveBoardState(
          remainingBoards.length > 0 ? remainingBoards[0] : null
        );
      }
    };

    // Registrar listeners
    socketService.onTaskCreated(handleTaskCreated);
    socketService.onTaskUpdated(handleTaskUpdated);
    socketService.onTaskDeleted(handleTaskDeleted);
    socketService.onTaskMoved(handleTaskMoved);
    socketService.onBoardUpdated(handleBoardUpdated);
    socketService.onBoardDeleted(handleBoardDeleted);

    // Cleanup
    return () => {
      // Los listeners se limpian automáticamente en socketService
    };
  }, [activeBoard, boards]);

  const value: BoardsContextType = {
    boards,
    activeBoard,
    tasks,
    loading,
    error,
    loadBoards,
    setActiveBoard,
    createBoard,
    updateBoard,
    deleteBoard,
    addColumn,
    renameColumn,
    deleteColumn,
    loadTasks,
    createTask,
    updateTask,
    deleteTask,
    moveTask,
    getTasksByColumn,
    refreshData,
  };

  return (
    <BoardsContext.Provider value={value}>{children}</BoardsContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useBoards = (): BoardsContextType => {
  const context = useContext(BoardsContext);
  if (context === undefined) {
    throw new Error("useBoards debe usarse dentro de BoardsProvider");
  }
  return context;
};
