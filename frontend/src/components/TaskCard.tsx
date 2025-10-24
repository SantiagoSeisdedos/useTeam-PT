import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Trash2, Edit, GripVertical, Palette } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import type { Task } from '../types';
import { useState } from 'react';

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onColorChange: (taskId: string, color: string | null) => void;
}

// Paleta de colores predefinida (similar a Trello)
const TASK_COLORS = [
  { name: 'Sin color', value: null, bg: 'transparent', border: 'border-2 border-dashed border-gray-300' },
  { name: 'Rojo', value: '#ef4444', bg: 'bg-red-500', hover: 'hover:bg-red-600' },
  { name: 'Naranja', value: '#f97316', bg: 'bg-orange-500', hover: 'hover:bg-orange-600' },
  { name: 'Amarillo', value: '#eab308', bg: 'bg-yellow-500', hover: 'hover:bg-yellow-600' },
  { name: 'Verde', value: '#22c55e', bg: 'bg-green-500', hover: 'hover:bg-green-600' },
  { name: 'Azul', value: '#3b82f6', bg: 'bg-blue-500', hover: 'hover:bg-blue-600' },
  { name: 'Índigo', value: '#6366f1', bg: 'bg-indigo-500', hover: 'hover:bg-indigo-600' },
  { name: 'Morado', value: '#a855f7', bg: 'bg-purple-500', hover: 'hover:bg-purple-600' },
  { name: 'Rosa', value: '#ec4899', bg: 'bg-pink-500', hover: 'hover:bg-pink-600' },
];

// Función para calcular si un color es claro u oscuro
// Usa la fórmula de luminosidad relativa (WCAG)
const getContrastColor = (hexColor: string | null): 'dark' | 'light' => {
  if (!hexColor) return 'dark'; // Sin color = texto oscuro (default)
  
  // Convertir hex a RGB
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  // Calcular luminosidad relativa (fórmula WCAG)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  // Si la luminosidad es > 0.5, el color es claro → texto oscuro
  // Si la luminosidad es <= 0.5, el color es oscuro → texto claro
  return luminance > 0.65 ? 'dark' : 'light';
};

export function TaskCard({ task, onEdit, onDelete, onColorChange }: TaskCardProps) {
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: task._id,
    data: {
      type: 'task',
      column: task.column,
      task: task
    }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleColorSelect = (color: string | null) => {
    onColorChange(task._id, color);
    setIsColorPickerOpen(false);
  };

  // Calcular si el texto debe ser claro u oscuro basado en el color de fondo
  const textContrast = getContrastColor(task.color || null);
  const textColorClass = textContrast === 'light' ? 'text-white' : 'text-gray-700';
  const mutedTextClass = textContrast === 'light' ? 'text-gray-100' : 'text-muted-foreground';

  return (
    <Card
      ref={setNodeRef}
      style={{
        ...style,
        backgroundColor: task.color || undefined,
        borderLeft: task.color ? `4px solid ${task.color}` : undefined,
      }}
      className={`mb-2 cursor-grab active:cursor-grabbing hover:shadow-md transition-all ${
        isDragging ? 'shadow-2xl ring-2 ring-primary scale-105 opacity-80 rotate-2' : ''
      } ${task.color ? 'bg-opacity-10' : ''}`}
      {...attributes}
      {...listeners}
    >
      <CardHeader className="p-3 pb-2">
        <div className="flex items-start gap-2">
          <div className="mt-1">
            <GripVertical className={`h-4 w-4 ${mutedTextClass}`} />
          </div>
          <CardTitle className={`text-sm font-medium flex-1 ${textColorClass}`}>
            {task.title}
          </CardTitle>
          <div className="flex gap-1" onPointerDown={(e) => e.stopPropagation()}>
            <Popover open={isColorPickerOpen} onOpenChange={setIsColorPickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-7 w-7 ${textContrast === 'light' ? 'hover:bg-white/20' : ''}`}
                >
                  <Palette className={`h-3 w-3 ${textColorClass}`} />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-48 p-3" align="end">
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">
                    Seleccionar color
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {TASK_COLORS.map((color) => (
                      <button
                        key={color.value || 'none'}
                        onClick={() => handleColorSelect(color.value)}
                        className={`h-8 w-full rounded-md transition-all ${
                          color.bg
                        } ${color.hover || ''} ${
                          color.border || ''
                        } ${
                          task.color === color.value
                            ? 'ring-2 ring-primary ring-offset-2'
                            : ''
                        }`}
                        title={color.name}
                      />
                    ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
            <Button
              variant="ghost"
              size="icon"
              className={`h-7 w-7 ${textContrast === 'light' ? 'hover:bg-white/20' : ''}`}
              onClick={() => onEdit(task)}
            >
              <Edit className={`h-3 w-3 ${textColorClass}`} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={`h-7 w-7 ${textContrast === 'light' ? 'text-red-200 hover:text-red-100 hover:bg-white/20' : 'text-destructive'}`}
              onClick={() => onDelete(task._id)}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardHeader>
      {task.description && (
        <CardContent className="p-3 pt-0">
          <p className={`text-xs line-clamp-2 ${mutedTextClass}`}>
            {task.description}
          </p>
        </CardContent>
      )}
    </Card>
  );
}

