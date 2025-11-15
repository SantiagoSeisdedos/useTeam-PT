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
import { KanbanColumn } from "./KanbanColumn";
import { TaskCard } from "./TaskCard";
import { TaskDialog } from "./TaskDialog";
import { BoardSelector } from "./BoardSelector";
import { CreateBoardDialog } from "./CreateBoardDialog";
import { EditBoardDialog } from "./EditBoardDialog";
import UserProfile from "./UserProfile";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Input } from "./ui/input";
import { useLoadingStates } from "../hooks/useLoadingStates";
import LoadingButton from "./LoadingButton";
import { Loader2, RefreshCw, Plus, Check, X } from "lucide-react";
import { socketService } from "../services/socket";
import { audioService } from "../services/audio";
import { toast } from "sonner";
import { useAuth } from "../contexts/AuthContext";
import { useBoards } from "../contexts/BoardsContext";
import type { Task, Board, UpdateTaskDto } from "../types";

export function KanbanBoard() {
  const { isAuthenticated } = useAuth();
  const { isAddingColumn: isAddingColumnLoading } = useLoadingStates();

  // Usar el contexto de boards
  const {
    boards,
    activeBoard,
    tasks,
    loading,
    setActiveBoard,
    createBoard,
    updateBoard,
    deleteBoard,
    addColumn,
    renameColumn,
    deleteColumn,
    createTask,
    updateTask,
    deleteTask,
    moveTask,
    getTasksByColumn,
    refreshData,
  } = useBoards();

  // Estado de UI
  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [newColumnName, setNewColumnName] = useState("");
  const [createBoardDialogOpen, setCreateBoardDialogOpen] = useState(false);
  const [editBoardDialogOpen, setEditBoardDialogOpen] = useState(false);
  const [boardToEdit, setBoardToEdit] = useState<Board | null>(null);

  // Estados para drag and drop
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [isEditingTask, setIsEditingTask] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [selectedColumn, setSelectedColumn] = useState<string>("");

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Unirse al room del tablero activo cuando cambie
  useEffect(() => {
    if (activeBoard && socketService.isConnected()) {
      socketService.joinBoard(activeBoard._id);
    }
    return () => {
      if (activeBoard) {
        socketService.leaveBoard(activeBoard._id);
      }
    };
  }, [activeBoard]);

  // Handlers para drag and drop
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = tasks.find((t) => t._id === active.id);
    setActiveTask(task || null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over || !activeBoard) return;

    const taskId = active.id as string;
    const sourceColumn = active.data.current?.sortable?.containerId;

    // Obtener la columna de destino correcta
    let destinationColumn = over.id as string;

    // Si over.id es el ID de una tarea, obtener la columna de esa tarea
    if (over.data.current?.type === "task") {
      const overTask = tasks.find((t) => t._id === over.id);
      if (overTask) {
        destinationColumn = overTask.column;
      }
    }

    // Si aún no tenemos una columna válida, intentar obtenerla del data.current
    if (
      !destinationColumn ||
      !activeBoard.columns.includes(destinationColumn)
    ) {
      destinationColumn = over.data.current?.column || sourceColumn;
    }

    if (sourceColumn === destinationColumn) return;

    const task = tasks.find((t) => t._id === taskId);
    if (!task) return;

    try {
      // Actualizar localmente primero para mejor UX
      const sourceTasks = getTasksByColumn(sourceColumn);
      const destinationTasks = getTasksByColumn(destinationColumn);
      const sourceIndex = sourceTasks.findIndex((t) => t._id === taskId);

      // Enviar al servidor
      await moveTask(taskId, {
        column: destinationColumn,
        position: destinationTasks.length,
        sourceColumn,
        sourceIndex,
      });

      audioService.play("task"); // Sonido al mover tarea
    } catch {
      toast.error("Error al mover la tarea");
    }
  };

  // Handlers para tareas
  const handleAddTask = (column: string) => {
    setEditingTask(null);
    setIsEditingTask(true);
    setSelectedColumn(column);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsEditingTask(true);
    setSelectedColumn(task.column);
  };

  const handleSubmitTask = async (taskData: {
    title: string;
    description: string;
  }) => {
    if (!activeBoard) return;

    try {
      if (editingTask) {
        await updateTask(editingTask._id, taskData);
      } else {
        await createTask({
          ...taskData,
          column: selectedColumn,
          boardId: activeBoard._id,
        });
      }

      // Cerrar el diálogo solo después de que termine la operación
      setIsEditingTask(false);
      setEditingTask(null);
      audioService.play("task");
    } catch {
      toast.error("Error al guardar la tarea");
      // No cerrar el diálogo si hay error para que el usuario pueda intentar de nuevo
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!activeBoard) return;

    try {
      await deleteTask(taskId);
      audioService.play("delete");
    } catch {
      toast.error("Error al eliminar la tarea");
    }
  };

  const handleColorChange = async (taskId: string, color: string | null) => {
    if (!activeBoard) return;

    try {
      await updateTask(taskId, { color: color || undefined } as UpdateTaskDto);
    } catch {
      toast.error("Error al actualizar el color");
    }
  };

  // Handlers para columnas
  const handleAddColumn = async () => {
    if (!activeBoard || !newColumnName.trim()) return;

    try {
      await addColumn(activeBoard._id, newColumnName.trim());
      setNewColumnName("");
      setIsAddingColumn(false);
      audioService.play("column");
    } catch {
      toast.error("Error al crear la columna");
    }
  };

  const handleRenameColumn = async (oldName: string, newName: string) => {
    if (!activeBoard) return;

    try {
      await renameColumn(activeBoard._id, oldName, newName);
    } catch {
      toast.error("Error al renombrar la columna");
    }
  };

  const handleDeleteColumn = async (columnName: string) => {
    if (!activeBoard) return;

    try {
      await deleteColumn(activeBoard._id, columnName);
      audioService.play("delete");
    } catch {
      toast.error("Error al eliminar la columna");
    }
  };

  // Handlers para tableros
  const handleCreateBoard = async (data: {
    name: string;
    columns: string[];
  }) => {
    try {
      await createBoard(data);
      setCreateBoardDialogOpen(false);
    } catch {
      toast.error("Error al crear el tablero");
    }
  };

  const handleEditBoard = (board: Board) => {
    setBoardToEdit(board);
    setEditBoardDialogOpen(true);
  };

  const handleUpdateBoard = async (name: string) => {
    if (!boardToEdit) return;

    try {
      await updateBoard(boardToEdit._id, { name });
      setEditBoardDialogOpen(false);
      setBoardToEdit(null);
    } catch {
      toast.error("Error al actualizar el tablero");
    }
  };

  const handleDeleteBoard = async (board: Board) => {
    try {
      await deleteBoard(board._id);
      setEditBoardDialogOpen(false);
      setBoardToEdit(null);
    } catch {
      toast.error("Error al eliminar el tablero");
    }
  };

  const handleBoardChange = (board: Board | null) => {
    setActiveBoard(board);
  };

  if (loading && !boards.length) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Cargando tableros...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-4">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold">Kanban Colaborativo</h1>
            </div>

            <div className="flex items-center gap-2">
              {/* User Profile - Unifica wallet, auth, audio y export */}
              <UserProfile />

              <Button variant="outline" size="icon" onClick={refreshData}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Board Selector */}
          <div className="flex items-center gap-4">
            <BoardSelector
              boards={boards}
              activeBoard={activeBoard}
              onBoardChange={handleBoardChange}
              onEditBoard={handleEditBoard}
              onDeleteBoard={(boardId) =>
                handleDeleteBoard(boards.find((b) => b._id === boardId)!)
              }
              onCreateBoard={() => setCreateBoardDialogOpen(true)}
            />
            {isAuthenticated && (
              <Button onClick={() => setCreateBoardDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Tablero
              </Button>
            )}
          </div>
        </div>

        {/* Board Content */}
        {activeBoard ? (
          <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="flex gap-4 overflow-x-auto pb-4">
              {activeBoard.columns.map((column) => (
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
                      <LoadingButton
                        size="sm"
                        onClick={handleAddColumn}
                        className="flex-1"
                        loading={isAddingColumnLoading}
                        loadingText="Creando..."
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Crear
                      </LoadingButton>
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
                <div className="relative">
                  <TaskCard
                    task={activeTask}
                    onEdit={() => {}}
                    onDelete={() => {}}
                    onColorChange={() => {}}
                  />
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        ) : (
          <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-2">
                No hay tableros disponibles
              </h2>
              <p className="text-muted-foreground mb-6">
                Conecta tu wallet para crear un tablero privado o espera a que
                se cree uno público
              </p>
            </div>
          </div>
        )}

        {/* Dialogs */}
        <TaskDialog
          open={isEditingTask}
          onOpenChange={setIsEditingTask}
          task={editingTask || undefined}
          onSubmit={handleSubmitTask}
        />

        <CreateBoardDialog
          open={createBoardDialogOpen}
          onOpenChange={setCreateBoardDialogOpen}
          onSubmit={handleCreateBoard}
        />

        <EditBoardDialog
          open={editBoardDialogOpen}
          onOpenChange={setEditBoardDialogOpen}
          board={boardToEdit}
          onSubmit={handleUpdateBoard}
        />
      </div>
    </div>
  );
}
