import { useState, useEffect } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { KanbanColumn } from "./KanbanColumn";
import { TaskCard } from "./TaskCard";
import { TaskDialog } from "./TaskDialog";
import { ExportButton } from "./ExportButton";
import { AudioSettings } from "./AudioSettings";
import { BoardSelector } from "./BoardSelector";
import { CreateBoardDialog } from "./CreateBoardDialog";
import { EditBoardDialog } from "./EditBoardDialog";
import { WalletConnect } from "./WalletConnect";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Input } from "./ui/input";
import { Loader2, RefreshCw, Users, Plus, Check, X } from "lucide-react";
import { tasksApi, boardsApi } from "../services/api";
import { socketService } from "../services/socket";
import { audioService } from "../services/audio";
import { toast } from "sonner";
import { useAuth } from "../contexts/AuthContext";
import { useAccount } from "wagmi";
import type { Task, Board } from "../types";

export function KanbanBoard() {
  const { isAuthenticated, login, logout, user, isLoading: authLoading } = useAuth();
  const { isConnected } = useAccount();
  // Estado de tableros
  const [boards, setBoards] = useState<Board[]>([]);
  const [activeBoard, setActiveBoard] = useState<Board | null>(null);
  const [createBoardDialogOpen, setCreateBoardDialogOpen] = useState(false);
  const [editBoardDialogOpen, setEditBoardDialogOpen] = useState(false);
  const [boardToEdit, setBoardToEdit] = useState<Board | null>(null);

  // Estado de tareas
  const [tasks, setTasks] = useState<Task[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [selectedColumn, setSelectedColumn] = useState<string>("");

  // Estado de UI
  const [connectedUsers, setConnectedUsers] = useState(0);
  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [newColumnName, setNewColumnName] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Cargar datos iniciales
  useEffect(() => {
    loadInitialData();
  }, []);

  // Unirse al room del tablero activo cuando cambie
  useEffect(() => {
    if (activeBoard && socketService.isConnected()) {
      socketService.joinBoard(activeBoard._id);
    }
  }, [activeBoard]);

  // Configurar WebSocket
  useEffect(() => {
    socketService.connect();

    // Listeners de WebSocket
    socketService.onTaskCreated(({ task }) => {
      toast.info("Nueva tarea creada", {
        description: `${task.title} fue creada por otro usuario`,
      });
      audioService.play("notification"); // Sonido de notificación
      setTasks((prev) => [...prev, task]);
    });

    socketService.onTaskUpdated((data) => {
      setTasks((prev) =>
        prev.map((task) =>
          task._id === data.taskId ? { ...task, ...data.updates } : task
        )
      );
    });

    socketService.onTaskDeleted((data) => {
      setTasks((prev) => prev.filter((task) => task._id !== data.taskId));
      toast.info("Tarea eliminada por otro usuario");
    });

    socketService.onTaskMoved((data) => {
      // Actualizar tarea movida localmente (sin recargar)
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

      // Opcional: mostrar toast
      // toast.info("Tarea movida por otro usuario");
    });

    // Nuevo evento: recibir el total de usuarios al conectarse
    socketService.onConnectedUsersCount((data) => {
      setConnectedUsers(data.count);
    });

    // socketService.onUserConnected((data) => {
    //   setConnectedUsers(data.count);
    //   toast.info("Nuevo usuario conectado", {
    //     description: `Ahora hay ${data.count} usuario(s) conectado(s)`,
    //     duration: 2000,
    //   });
    // });

    socketService.onUserDisconnected((data) => {
      setConnectedUsers(data.count);
    });

    // Listeners de columnas
    socketService.onColumnAdded((data) => {
      setColumns(data.columns);
      toast.info("Nueva columna agregada", {
        description: `"${data.columnName}" fue creada por otro usuario`,
      });
      audioService.play("notification"); // Sonido de notificación
    });

    socketService.onColumnRenamed((data) => {
      setColumns(data.columns);
      toast.info("Columna renombrada", {
        description: `"${data.oldName}" → "${data.newName}"`,
      });
    });

    socketService.onColumnDeleted((data) => {
      setColumns(data.columns);
      toast.info("Columna eliminada", {
        description: `"${data.columnName}" fue eliminada por otro usuario`,
      });
    });

    // Listeners de tableros
    socketService.onBoardUpdated((data) => {
      // Actualizar nombre del tablero en la lista
      setBoards((prev) =>
        prev.map((b) =>
          b._id === data.boardId ? { ...b, name: data.name } : b
        )
      );

      // Si es el tablero activo, actualizarlo también
      if (activeBoard?._id === data.boardId) {
        setActiveBoard((prev) => (prev ? { ...prev, name: data.name } : prev));
      }

      toast.info("Tablero actualizado", {
        description: `"${data.name}" fue renombrado por otro usuario`,
      });
    });

    socketService.onBoardDeleted((data) => {
      // Remover tablero de la lista
      setBoards((prev) => {
        const remaining = prev.filter((b) => b._id !== data.boardId);

        // Si se eliminó el tablero activo, cambiar al primero
        if (activeBoard?._id === data.boardId && remaining.length > 0) {
          const firstBoard = remaining[0];
          setActiveBoard(firstBoard);
          setColumns(firstBoard.columns);
          // Recargar tareas del nuevo tablero activo
          tasksApi.getAll(firstBoard._id).then(setTasks);
        }

        return remaining;
      });

      toast.warning("Tablero eliminado", {
        description: "Un tablero fue eliminado por otro usuario",
      });
    });

    return () => {
      socketService.disconnect();
    };
  }, [activeBoard]);

  // Auto-login cuando la wallet se conecta
  useEffect(() => {
    if (isConnected && !isAuthenticated && !authLoading) {
      // Mostrar toast sugiriendo autenticación
      const handleAuth = async () => {
        await login();
      };

      toast.info("Wallet conectada", {
        description: "Haz clic en 'Autenticar' para guardar tus tableros",
        action: {
          label: "Autenticar",
          onClick: handleAuth,
        },
        duration: 10000,
      });
    }
  }, [isConnected, isAuthenticated, authLoading, login]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const boardsData = await boardsApi.getAll();

      if (boardsData.length > 0) {
        // Establecer boards y board activo
        setBoards(boardsData);
        setActiveBoard(boardsData[0]);
        setColumns(boardsData[0].columns);

        // Cargar tareas del board activo
        const tasksData = await tasksApi.getAll(boardsData[0]._id);
        setTasks(tasksData);
      } else {
        // Si no hay boards, mostrar mensaje y permitir crear uno manualmente
        setBoards([]);
        setActiveBoard(null);
        setColumns([]);
        setTasks([]);
        toast.info("No hay tableros disponibles", {
          description: "Conecta tu wallet para crear un tablero privado o espera a que se cree uno público",
        });
      }
    } catch (error) {
      console.error("Error cargando datos:", error);
      toast.error("Error al cargar el tablero");
    } finally {
      setLoading(false);
    }
  };

  const loadTasks = async () => {
    if (!activeBoard) return;

    try {
      const tasksData = await tasksApi.getAll(activeBoard._id);
      setTasks(tasksData);
    } catch (error) {
      console.error("Error cargando tareas:", error);
    }
  };

  // Cambiar de tablero
  const handleBoardChange = async (board: Board) => {
    try {
      setLoading(true);
      
      // Salir del room del tablero anterior si existe
      if (activeBoard) {
        socketService.leaveBoard(activeBoard._id);
      }
      
      setActiveBoard(board);
      setColumns(board.columns);

      // Unirse al room del nuevo tablero
      socketService.joinBoard(board._id);

      // Cargar tareas del nuevo board
      const tasksData = await tasksApi.getAll(board._id);
      setTasks(tasksData);

      toast.success(`Tablero cambiado: ${board.name}`);
    } catch (error) {
      console.error("Error cambiando de tablero:", error);
      toast.error("Error al cambiar de tablero");
    } finally {
      setLoading(false);
    }
  };


  // TODO: Add a centralized error handling for API calls with proper error messages response from the backend.
  // Error al crear tablero: AxiosError: Request failed with status code 401
  // Crear nuevo tablero
  const handleCreateBoard = async (data: {
    name: string;
    columns: string[];
  }) => {
    try {
      const newBoard = await boardsApi.create(data);
      setBoards([...boards, newBoard]);
      setActiveBoard(newBoard);
      setColumns(newBoard.columns);
      setTasks([]); // Nuevo tablero no tiene tareas
      setCreateBoardDialogOpen(false);
      toast.success(`Tablero "${newBoard.name}" creado`);
    } catch (error) {
      console.error("Error creando tablero:", error);
      toast.error("Error al crear tablero: " + error);
    }
  };

  // Editar tablero
  const handleEditBoard = (board: Board) => {
    setBoardToEdit(board);
    setEditBoardDialogOpen(true);
  };

  const handleSubmitEditBoard = async (newName: string) => {
    if (!boardToEdit) return;

    try {
      const updatedBoard = await boardsApi.update(boardToEdit._id, {
        name: newName,
      });

      // Actualizar en la lista de boards
      setBoards((prev) =>
        prev.map((b) => (b._id === boardToEdit._id ? updatedBoard : b))
      );

      // Si es el tablero activo, actualizarlo también
      if (activeBoard?._id === boardToEdit._id) {
        setActiveBoard(updatedBoard);
      }

      // Emitir evento WebSocket para sincronizar otros clientes
      socketService.emitBoardUpdated(boardToEdit._id, newName);

      setEditBoardDialogOpen(false);
      setBoardToEdit(null);
      toast.success(`Tablero renombrado a "${newName}"`);
    } catch (error) {
      console.error("Error actualizando tablero:", error);
      toast.error("Error al actualizar tablero");
    }
  };

  // Eliminar tablero
  const handleDeleteBoard = async (board: Board) => {
    const taskCount = tasks.filter((t) => t.boardId === board._id).length;

    const confirmMessage =
      taskCount > 0
        ? `¿Eliminar el tablero "${board.name}" y sus ${taskCount} tarea(s)?`
        : `¿Eliminar el tablero "${board.name}"?`;

    if (!confirm(confirmMessage)) return;

    try {
      await boardsApi.delete(board._id);

      // Emitir evento WebSocket para sincronizar otros clientes
      socketService.emitBoardDeleted(board._id);

      // Remover de la lista
      const remainingBoards = boards.filter((b) => b._id !== board._id);
      setBoards(remainingBoards);

      // Si es el tablero activo, cambiar al primero disponible
      if (activeBoard?._id === board._id) {
        if (remainingBoards.length > 0) {
          const firstBoard = remainingBoards[0];
          setActiveBoard(firstBoard);
          setColumns(firstBoard.columns);
          const tasksData = await tasksApi.getAll(firstBoard._id);
          setTasks(tasksData);
        } else {
          // No hay más tableros, crear uno nuevo automáticamente
          const defaultBoard = await boardsApi.create({
            name: "Mi Tablero Kanban",
            columns: ["Por Hacer", "En Progreso", "Completado"],
          });
          setBoards([defaultBoard]);
          setActiveBoard(defaultBoard);
          setColumns(defaultBoard.columns);
          setTasks([]);
          toast.success("Tablero por defecto creado");
        }
      }

      toast.success(`Tablero "${board.name}" eliminado`);
    } catch (error) {
      console.error("Error eliminando tablero:", error);
      toast.error("Error al eliminar tablero");
    }
  };

  const getTasksByColumn = (column: string) => {
    return tasks
      .filter((task) => task.column === column)
      .sort((a, b) => a.position - b.position);
  };

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find((t) => t._id === event.active.id);
    if (task) {
      setActiveTask(task);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const activeTask = tasks.find((t) => t._id === active.id);
    if (!activeTask) return;

    const sourceColumn = activeTask.column;
    const destinationColumn = columns.find((col) =>
      over.id === col
        ? true
        : getTasksByColumn(col).some((t) => t._id === over.id)
    );

    if (!destinationColumn) return;

    const sourceColumnTasks = getTasksByColumn(sourceColumn);
    const destinationColumnTasks =
      sourceColumn === destinationColumn
        ? sourceColumnTasks
        : getTasksByColumn(destinationColumn);

    const sourceIndex = sourceColumnTasks.findIndex((t) => t._id === active.id);
    const destinationIndex =
      over.id === destinationColumn
        ? destinationColumnTasks.length
        : destinationColumnTasks.findIndex((t) => t._id === over.id);

    if (sourceColumn === destinationColumn) {
      // Mover dentro de la misma columna
      const newTasks = arrayMove(
        sourceColumnTasks,
        sourceIndex,
        destinationIndex
      );
      const updatedTasks = tasks.map((task) => {
        if (task.column === sourceColumn) {
          const newPosition = newTasks.findIndex((t) => t._id === task._id);
          return newPosition >= 0 ? { ...task, position: newPosition } : task;
        }
        return task;
      });
      setTasks(updatedTasks);
    } else {
      // Mover entre columnas
      const updatedTasks = tasks.map((task) => {
        if (task._id === active.id) {
          return {
            ...task,
            column: destinationColumn,
            position: destinationIndex,
          };
        }
        return task;
      });
      setTasks(updatedTasks);
    }

    // Llamar a la API
    try {
      await tasksApi.move(active.id as string, {
        sourceColumn,
        destinationColumn,
        sourceIndex,
        destinationIndex,
      });

      // Emitir evento WebSocket
      socketService.emitTaskMoved({
        taskId: active.id as string,
        sourceColumn,
        destinationColumn,
        sourceIndex,
        destinationIndex,
        userId: socketService.isConnected() ? "me" : "unknown",
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error moviendo tarea:", error);
      toast.error("Error al mover la tarea");
      loadTasks(); // Recargar en caso de error
    }
  };

  const handleAddTask = (column: string) => {
    setSelectedColumn(column);
    setEditingTask(null);
    setDialogOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setSelectedColumn(task.column);
    setDialogOpen(true);
  };

  const handleSubmitTask = async (data: {
    title: string;
    description: string;
  }) => {
    if (!activeBoard) {
      toast.error("No hay tablero activo");
      return;
    }

    try {
      if (editingTask) {
        // Actualizar tarea existente
        const updatedTask = await tasksApi.update(editingTask._id, data);
        setTasks((prev) =>
          prev.map((task) =>
            task._id === editingTask._id ? updatedTask : task
          )
        );
        socketService.emitTaskUpdated(editingTask._id, activeBoard._id, data);
        toast.success("Tarea actualizada");
      } else {
        // Crear nueva tarea
        const newTask = await tasksApi.create({
          ...data,
          column: selectedColumn,
          boardId: activeBoard._id,
        });
        setTasks((prev) => [...prev, newTask]);
        socketService.emitTaskCreated(newTask);
        audioService.play("task"); // Sonido al crear tarea
        toast.success("Tarea creada");
      }
      setDialogOpen(false);
    } catch (error) {
      console.error("Error guardando tarea:", error);
      toast.error("Error al guardar la tarea");
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm("¿Estás seguro de eliminar esta tarea?")) return;

    if (!activeBoard) {
      toast.error("No hay tablero activo");
      return;
    }

    try {
      await tasksApi.delete(taskId);
      setTasks((prev) => prev.filter((task) => task._id !== taskId));
      socketService.emitTaskDeleted(taskId, activeBoard._id);
      audioService.play("delete"); // Sonido al eliminar
      toast.success("Tarea eliminada");
    } catch (error) {
      console.error("Error eliminando tarea:", error);
      toast.error("Error al eliminar la tarea");
    }
  };

  const handleColorChange = async (taskId: string, color: string | null) => {
    if (!activeBoard) {
      toast.error("No hay tablero activo");
      return;
    }

    try {
      const updatedTask = await tasksApi.update(taskId, { color });
      setTasks((prev) =>
        prev.map((task) => (task._id === taskId ? updatedTask : task))
      );
      socketService.emitTaskUpdated(taskId, activeBoard._id, { color });
      toast.success("Color actualizado");
    } catch (error) {
      console.error("Error actualizando color:", error);
      toast.error("Error al cambiar el color");
    }
  };

  const handleAddColumn = async () => {
    if (!activeBoard) {
      toast.error("No hay tablero activo");
      return;
    }

    if (!newColumnName.trim()) {
      toast.error("El nombre de la columna no puede estar vacío");
      return;
    }

    if (columns.includes(newColumnName.trim())) {
      toast.error("Ya existe una columna con ese nombre");
      return;
    }

    try {
      const updatedBoard = await boardsApi.addColumn(
        activeBoard._id,
        newColumnName.trim()
      );
      setColumns(updatedBoard.columns);
      setActiveBoard(updatedBoard);
      setNewColumnName("");
      setIsAddingColumn(false);
      socketService.emitColumnAdded(activeBoard._id, newColumnName.trim(), updatedBoard.columns);
      audioService.play("column"); // Sonido al crear columna
      toast.success("Columna creada exitosamente");
    } catch (error) {
      console.error("Error agregando columna:", error);
      toast.error("Error al crear la columna");
    }
  };

  const handleRenameColumn = async (oldName: string, newName: string) => {
    if (!activeBoard) {
      toast.error("No hay tablero activo");
      return;
    }

    if (!newName.trim()) {
      toast.error("El nombre de la columna no puede estar vacío");
      return;
    }

    if (oldName === newName.trim()) {
      return; // No cambió nada
    }

    if (columns.includes(newName.trim())) {
      toast.error("Ya existe una columna con ese nombre");
      return;
    }

    try {
      const updatedBoard = await boardsApi.renameColumn(
        activeBoard._id,
        oldName,
        newName.trim()
      );
      setColumns(updatedBoard.columns);
      setActiveBoard(updatedBoard);

      // Actualizar tareas localmente
      setTasks((prev) =>
        prev.map((task) =>
          task.column === oldName ? { ...task, column: newName.trim() } : task
        )
      );

      socketService.emitColumnRenamed(
        activeBoard._id,
        oldName,
        newName.trim(),
        updatedBoard.columns
      );
      toast.success(`Columna renombrada: "${oldName}" → "${newName}"`);
    } catch (error) {
      console.error("Error renombrando columna:", error);
      toast.error("Error al renombrar la columna");
    }
  };

  const handleDeleteColumn = async (columnName: string) => {
    if (!activeBoard) {
      toast.error("No hay tablero activo");
      return;
    }

    const tasksInColumn = getTasksByColumn(columnName).length;

    const confirmMessage =
      tasksInColumn > 0
        ? `¿Eliminar la columna "${columnName}" y sus ${tasksInColumn} tarea(s)?`
        : `¿Eliminar la columna "${columnName}"?`;

    if (!confirm(confirmMessage)) return;

    try {
      const updatedBoard = await boardsApi.deleteColumn(
        activeBoard._id,
        columnName
      );
      setColumns(updatedBoard.columns);
      setActiveBoard(updatedBoard);

      // Eliminar tareas de esta columna localmente
      setTasks((prev) => prev.filter((task) => task.column !== columnName));

      socketService.emitColumnDeleted(activeBoard._id, columnName, updatedBoard.columns);
      audioService.play("delete"); // Sonido al eliminar
      toast.success(`Columna "${columnName}" eliminada`);
    } catch (error) {
      console.error("Error eliminando columna:", error);
      toast.error("Error al eliminar la columna");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img
                src="/useteam_logo.svg"
                alt="useTeam"
                className="h-10 w-10"
              />
              <div>
                <h1 className="text-2xl font-bold">Tablero Kanban</h1>
                <p className="text-sm text-muted-foreground">
                  Colaboración en tiempo real
                </p>
              </div>

              {/* Selector de tableros */}
              {boards.length > 0 && (
                <BoardSelector
                  boards={boards}
                  activeBoard={activeBoard}
                  onBoardChange={handleBoardChange}
                  onCreateBoard={() => setCreateBoardDialogOpen(true)}
                  onEditBoard={handleEditBoard}
                  onDeleteBoard={handleDeleteBoard}
                  taskCounts={
                    activeBoard ? { [activeBoard._id]: tasks.length } : {}
                  }
                />
              )}
            </div>
            <div className="flex items-center gap-3">
              {socketService.isConnected() && connectedUsers > 0 && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>{connectedUsers} conectado(s)</span>
                </div>
              )}

              {/* Status de autenticación */}
              {isAuthenticated && user && (
                <div className="flex items-center gap-2">
                  <div className="text-sm text-muted-foreground">
                    {user.walletAddress.slice(0, 6)}...
                    {user.walletAddress.slice(-4)}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={logout}
                    className="text-xs"
                  >
                    Logout
                  </Button>
                </div>
              )}

              {/* Wallet Connect */}
              <WalletConnect
                onConnect={(address) => {
                  console.log('Wallet conectada:', address);
                  // No hacer auto-login automático, dejar que el usuario decida
                }}
                onDisconnect={() => {
                  console.log('Wallet desconectada');
                  // Logout se maneja automáticamente en AuthContext
                }}
              />

              {/* Botón de Autenticación */}
              {isConnected && !isAuthenticated && (
                <Button
                  onClick={login}
                  disabled={authLoading}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {authLoading ? "Autenticando..." : "Autenticar"}
                </Button>
              )}

              <AudioSettings />
              <Button variant="outline" size="icon" onClick={loadTasks}>
                <RefreshCw className="h-4 w-4" />
              </Button>
              <ExportButton />
            </div>
          </div>
        </div>
      </div>

      {/* Board */}
      <div className="container mx-auto px-4 py-6">
        {activeBoard ? (
          <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="flex gap-4 overflow-x-auto pb-4">
            {columns.map((column) => (
              <KanbanColumn
                key={column}
                column={column}
                tasks={getTasksByColumn(column)}
                onAddTask={handleAddTask}
                onEditTask={handleEditTask}
                onDeleteTask={handleDeleteTask}
                onColorChange={handleColorChange}
                onRenameColumn={handleRenameColumn}
                onDeleteColumn={handleDeleteColumn}
              />
            ))}

            {/* Botón para agregar columna */}
            {isAddingColumn ? (
              <Card className="flex-shrink-0 w-[280px]">
                <CardContent className="p-4">
                  <Input
                    autoFocus
                    placeholder="Nombre de la columna..."
                    value={newColumnName}
                    onChange={(e) => setNewColumnName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddColumn();
                      if (e.key === "Escape") {
                        setIsAddingColumn(false);
                        setNewColumnName("");
                      }
                    }}
                    className="mb-2"
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={handleAddColumn}
                      className="flex-1"
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Crear
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setIsAddingColumn(false);
                        setNewColumnName("");
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Button
                variant="outline"
                className="flex-shrink-0 h-auto min-h-[100px] w-[280px] border-dashed hover:border-primary hover:bg-primary/5"
                onClick={() => setIsAddingColumn(true)}
              >
                <div className="flex flex-col items-center gap-2 py-4">
                  <Plus className="h-8 w-8" />
                  <span className="font-medium">Nueva Columna</span>
                </div>
              </Button>
            )}
          </div>

          <DragOverlay>
            {activeTask ? (
              <TaskCard
                task={activeTask}
                onEdit={() => {}}
                onDelete={() => {}}
                onColorChange={() => {}}
              />
            ) : null}
          </DragOverlay>
        </DndContext>
        ) : (
          <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
            <div className="mb-4">
              <h2 className="text-2xl font-bold text-muted-foreground mb-2">
                No hay tableros disponibles
              </h2>
              <p className="text-muted-foreground mb-6">
                Conecta tu wallet para crear un tablero privado o espera a que se cree uno público
              </p>
            </div>
            {isAuthenticated && (
              <Button
                onClick={() => setCreateBoardDialogOpen(true)}
                className="bg-primary hover:bg-primary/90"
              >
                <Plus className="h-4 w-4 mr-2" />
                Crear Tablero
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Task Dialog */}
      <TaskDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleSubmitTask}
        task={editingTask || undefined}
        column={selectedColumn}
        allTasks={tasks}
      />

      <CreateBoardDialog
        open={createBoardDialogOpen}
        onOpenChange={setCreateBoardDialogOpen}
        onSubmit={handleCreateBoard}
      />

      <EditBoardDialog
        open={editBoardDialogOpen}
        onOpenChange={setEditBoardDialogOpen}
        onSubmit={handleSubmitEditBoard}
        board={boardToEdit}
      />
    </div>
  );
}
