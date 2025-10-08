import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { TaskCard } from "./TaskCard";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Plus, MoreVertical, Trash2 } from "lucide-react";
import type { Task } from "../types";
import { useState } from "react";

interface KanbanColumnProps {
  column: string;
  tasks: Task[];
  onAddTask: (column: string) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onColorChange: (taskId: string, color: string | null) => void;
  onRenameColumn: (oldName: string, newName: string) => void;
  onDeleteColumn: (columnName: string) => void;
}

export function KanbanColumn({
  column,
  tasks,
  onAddTask,
  onEditTask,
  onDeleteTask,
  onColorChange,
  onRenameColumn,
  onDeleteColumn,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: column });
  const [isRenaming, setIsRenaming] = useState(false);
  const [newColumnName, setNewColumnName] = useState(column);

  return (
    <Card
      className={`flex-1 min-w-[280px] max-w-[350px] flex flex-col transition-all ${
        isOver ? "ring-2 ring-primary bg-primary/5 scale-[1.02]" : ""
      }`}
    >
      <CardHeader className="p-4">
        <div className="flex items-center justify-between gap-2">
          {isRenaming ? (
            <div className="flex items-center gap-2 flex-1">
              <Input
                autoFocus
                value={newColumnName}
                onChange={(e) => setNewColumnName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    onRenameColumn(column, newColumnName);
                    setIsRenaming(false);
                  }
                  if (e.key === "Escape") {
                    setNewColumnName(column);
                    setIsRenaming(false);
                  }
                }}
                onBlur={() => {
                  setNewColumnName(column);
                  setIsRenaming(false);
                }}
                className="h-8 text-base font-semibold"
              />
            </div>
          ) : (
            <button
              onClick={() => setIsRenaming(true)}
              className="flex-1 text-left group"
            >
              <CardTitle className="text-base font-semibold group-hover:text-primary transition-colors">
                {column}
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  ({tasks.length})
                </span>
              </CardTitle>
            </button>
          )}

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onAddTask(column)}
            >
              <Plus className="h-4 w-4" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive cursor-pointer"
                  onClick={() => onDeleteColumn(column)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Eliminar columna
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0 flex-1 overflow-y-auto">
        <SortableContext
          id={column}
          items={tasks.map((t) => t._id)}
          strategy={verticalListSortingStrategy}
        >
          <div
            ref={setNodeRef}
            className={`min-h-[200px] pb-12 rounded-lg transition-colors ${
              isOver ? "bg-primary/10" : ""
            }`}
          >
            {tasks.map((task) => (
              <TaskCard
                key={task._id}
                task={task}
                onEdit={onEditTask}
                onDelete={onDeleteTask}
                onColorChange={onColorChange}
              />
            ))}
            {tasks.length === 0 && (
              <button
                onClick={() => onAddTask(column)}
                className={`w-full text-center text-sm py-12 rounded-lg border-2 border-dashed transition-all cursor-pointer ${
                  isOver
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-muted-foreground/25 text-muted-foreground hover:border-primary/50 hover:bg-primary/5 hover:text-primary"
                }`}
              >
                {isOver ? (
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-2xl">⬇</span>
                    <span>Suelta aquí</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Plus className="h-8 w-8 opacity-50" />
                    <span>Nueva tarea</span>
                  </div>
                )}
              </button>
            )}
            {tasks.length > 0 && isOver && (
              <div className="h-16 border-2 border-dashed border-primary bg-primary/5 rounded-lg flex items-center justify-center text-sm text-primary mt-2">
                ⬇ Suelta al final
              </div>
            )}
          </div>
        </SortableContext>
      </CardContent>
    </Card>
  );
}
