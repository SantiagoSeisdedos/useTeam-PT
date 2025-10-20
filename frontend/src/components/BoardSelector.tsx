import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Button } from './ui/button';
import { ChevronDown, LayoutDashboard, Plus } from 'lucide-react';
import type { Board } from '../types';

interface BoardSelectorProps {
  boards: Board[];
  activeBoard: Board | null;
  onBoardChange: (board: Board) => void;
  onCreateBoard: () => void;
  taskCounts?: Record<string, number>; // { boardId: taskCount }
}

export function BoardSelector({
  boards,
  activeBoard,
  onBoardChange,
  onCreateBoard,
  taskCounts = {},
}: BoardSelectorProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2">
          <LayoutDashboard className="h-4 w-4" />
          {activeBoard ? activeBoard.name : 'Seleccionar tablero'}
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel>Mis Tableros</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {boards.length === 0 ? (
          <div className="px-2 py-6 text-center">
            <p className="text-sm text-muted-foreground">
              No hay tableros disponibles
            </p>
          </div>
        ) : (
          boards.map((board) => (
            <DropdownMenuItem
              key={board._id}
              onClick={() => onBoardChange(board)}
              className="flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-2">
                {activeBoard?._id === board._id && (
                  <div className="h-2 w-2 rounded-full bg-primary" />
                )}
                <span className={activeBoard?._id === board._id ? 'font-semibold' : ''}>
                  {board.name}
                </span>
              </div>
              {taskCounts[board._id] !== undefined && (
                <span className="text-xs text-muted-foreground">
                  {taskCounts[board._id]} {taskCounts[board._id] === 1 ? 'tarea' : 'tareas'}
                </span>
              )}
            </DropdownMenuItem>
          ))
        )}
        
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={onCreateBoard}
          className="gap-2 cursor-pointer text-primary"
        >
          <Plus className="h-4 w-4" />
          Crear Nuevo Tablero
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

