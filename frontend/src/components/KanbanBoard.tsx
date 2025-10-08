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
import { Button } from "./ui/button";
import { Loader2, RefreshCw, Users } from "lucide-react";
import { tasksApi, boardsApi } from "../services/api";
import { socketService } from "../services/socket";
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
      toast.success("Tarea eliminada");
    } catch (error) {
      console.error("Error eliminando tarea:", error);
      toast.error("Error al eliminar la tarea");
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
              />
            ))}
          </div>

          <DragOverlay>
            {activeTask ? (
              <TaskCard
                task={activeTask}
                onEdit={() => {}}
                onDelete={() => {}}
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
