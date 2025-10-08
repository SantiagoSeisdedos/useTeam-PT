import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { TaskCard } from './TaskCard';
import { Button } from './ui/button';
import { Plus } from 'lucide-react';
import type { Task } from '../types';

interface KanbanColumnProps {
  column: string;
  tasks: Task[];
  onAddTask: (column: string) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onColorChange: (taskId: string, color: string | null) => void;
}

export function KanbanColumn({
  column,
  tasks,
  onAddTask,
  onEditTask,
  onDeleteTask,
  onColorChange,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: column });

  return (
    <Card
      className={`flex-1 min-w-[280px] max-w-[350px] flex flex-col ${
        isOver ? 'ring-2 ring-primary' : ''
      }`}
    >
      <CardHeader className="p-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">
            {column}
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              ({tasks.length})
            </span>
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onAddTask(column)}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0 flex-1 overflow-y-auto">
        <SortableContext
          id={column}
          items={tasks.map((t) => t._id)}
          strategy={verticalListSortingStrategy}
        >
          <div ref={setNodeRef} className="min-h-[100px]">
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
              <div className="text-center text-sm text-muted-foreground py-8">
                No hay tareas aquí
              </div>
            )}
          </div>
        </SortableContext>
      </CardContent>
    </Card>
  );
}

