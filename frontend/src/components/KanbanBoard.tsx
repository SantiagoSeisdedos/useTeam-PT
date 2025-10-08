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
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Input } from "./ui/input";
import { Loader2, RefreshCw, Users, Plus, Check, X } from "lucide-react";
import { tasksApi, boardsApi } from "../services/api";
import { socketService } from "../services/socket";
import { audioService } from "../services/audio";
import { toast } from "sonner";
import type { Task } from "../types";

export function KanbanBoard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [selectedColumn, setSelectedColumn] = useState<string>("");
  const [connectedUsers, setConnectedUsers] = useState(0);
  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [newColumnName, setNewColumnName] = useState("");
  const [boardId, setBoardId] = useState<string>("");

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

  // Configurar WebSocket
  useEffect(() => {
    socketService.connect();

    // Listeners de WebSocket
    socketService.onTaskCreated(({ task }) => {
      toast.info("Nueva tarea creada", {
        description: `${task.title} fue creada por otro usuario`,
      });
      audioService.play('notification'); // Sonido de notificación
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

    socketService.onTaskMoved(() => {
      // Recargar tareas cuando otro usuario mueve una tarea
      loadTasks();
    });

    // Nuevo evento: recibir el total de usuarios al conectarse
    socketService.onConnectedUsersCount((data) => {
      setConnectedUsers(data.count);
    });

    socketService.onUserConnected((data) => {
      setConnectedUsers(data.count);
      toast.info("Nuevo usuario conectado", {
        description: `Ahora hay ${data.count} usuario(s) conectado(s)`,
        duration: 2000,
      });
    });

    socketService.onUserDisconnected((data) => {
      setConnectedUsers(data.count);
    });

    // Listeners de columnas
    socketService.onColumnAdded((data) => {
      setColumns(data.columns);
      toast.info("Nueva columna agregada", {
        description: `"${data.columnName}" fue creada por otro usuario`,
      });
      audioService.play('notification'); // Sonido de notificación
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

    return () => {
      socketService.disconnect();
    };
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [boardsData, tasksData] = await Promise.all([
        boardsApi.getAll(),
        tasksApi.getAll(),
      ]);

      if (boardsData.length > 0) {
        setBoardId(boardsData[0]._id);
        setColumns(boardsData[0].columns);
      } else {
        // Columnas por defecto si no hay tableros
        setColumns(["Por Hacer", "En Progreso", "Completado"]);
      }

      setTasks(tasksData);
    } catch (error) {
      console.error("Error cargando datos:", error);
      toast.error("Error al cargar el tablero");
    } finally {
      setLoading(false);
    }
  };

  const loadTasks = async () => {
    try {
      const tasksData = await tasksApi.getAll();
      setTasks(tasksData);
    } catch (error) {
      console.error("Error cargando tareas:", error);
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
    try {
      if (editingTask) {
        // Actualizar tarea existente
        const updatedTask = await tasksApi.update(editingTask._id, data);
        setTasks((prev) =>
          prev.map((task) =>
            task._id === editingTask._id ? updatedTask : task
          )
        );
        socketService.emitTaskUpdated(editingTask._id, data);
        toast.success("Tarea actualizada");
      } else {
        // Crear nueva tarea
        const newTask = await tasksApi.create({
          ...data,
          column: selectedColumn,
        });
        setTasks((prev) => [...prev, newTask]);
        socketService.emitTaskCreated(newTask);
        audioService.play('task'); // Sonido al crear tarea
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

    try {
      await tasksApi.delete(taskId);
      setTasks((prev) => prev.filter((task) => task._id !== taskId));
      socketService.emitTaskDeleted(taskId);
      audioService.play('delete'); // Sonido al eliminar
      toast.success("Tarea eliminada");
    } catch (error) {
      console.error("Error eliminando tarea:", error);
      toast.error("Error al eliminar la tarea");
    }
  };

  const handleColorChange = async (taskId: string, color: string | null) => {
    try {
      const updatedTask = await tasksApi.update(taskId, { color });
      setTasks((prev) =>
        prev.map((task) => (task._id === taskId ? updatedTask : task))
      );
      socketService.emitTaskUpdated(taskId, { color });
      toast.success("Color actualizado");
    } catch (error) {
      console.error("Error actualizando color:", error);
      toast.error("Error al cambiar el color");
    }
  };

  const handleAddColumn = async () => {
    if (!newColumnName.trim()) {
      toast.error("El nombre de la columna no puede estar vacío");
      return;
    }

    if (columns.includes(newColumnName.trim())) {
      toast.error("Ya existe una columna con ese nombre");
      return;
    }

    try {
      const updatedBoard = await boardsApi.addColumn(boardId, newColumnName.trim());
      setColumns(updatedBoard.columns);
      setNewColumnName("");
      setIsAddingColumn(false);
      socketService.emitColumnAdded(newColumnName.trim(), updatedBoard.columns);
      audioService.play('column'); // Sonido al crear columna
      toast.success("Columna creada exitosamente");
    } catch (error) {
      console.error("Error agregando columna:", error);
      toast.error("Error al crear la columna");
    }
  };

  const handleRenameColumn = async (oldName: string, newName: string) => {
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
      const updatedBoard = await boardsApi.renameColumn(boardId, oldName, newName.trim());
      setColumns(updatedBoard.columns);
      
      // Actualizar tareas localmente
      setTasks((prev) =>
        prev.map((task) =>
          task.column === oldName ? { ...task, column: newName.trim() } : task
        )
      );

      socketService.emitColumnRenamed(oldName, newName.trim(), updatedBoard.columns);
      toast.success(`Columna renombrada: "${oldName}" → "${newName}"`);
    } catch (error) {
      console.error("Error renombrando columna:", error);
      toast.error("Error al renombrar la columna");
    }
  };

  const handleDeleteColumn = async (columnName: string) => {
    const tasksInColumn = getTasksByColumn(columnName).length;
    
    const confirmMessage =
      tasksInColumn > 0
        ? `¿Eliminar la columna "${columnName}" y sus ${tasksInColumn} tarea(s)?`
        : `¿Eliminar la columna "${columnName}"?`;

    if (!confirm(confirmMessage)) return;

    try {
      const updatedBoard = await boardsApi.deleteColumn(boardId, columnName);
      setColumns(updatedBoard.columns);
      
      // Eliminar tareas de esta columna localmente
      setTasks((prev) => prev.filter((task) => task.column !== columnName));

      socketService.emitColumnDeleted(columnName, updatedBoard.columns);
      audioService.play('delete'); // Sonido al eliminar
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
            <div className="flex items-center gap-2">
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
            </div>
            <div className="flex items-center gap-3">
              {socketService.isConnected() && connectedUsers > 0 && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>{connectedUsers} conectado(s)</span>
                </div>
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
      </div>

      {/* Task Dialog */}
      <TaskDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleSubmitTask}
        task={editingTask || undefined}
        column={selectedColumn}
      />
    </div>
  );
}
