import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Button } from "./ui/button";
import {
  ChevronDown,
  LayoutDashboard,
  Plus,
  Settings,
  Trash2,
  LogOut,
} from "lucide-react";
import type { Board } from "../types";
import { useAuth } from "@/contexts/AuthContext";
import { invitationsApi } from "../services/api";
import { toast } from "sonner";

interface BoardSelectorProps {
  boards: Board[];
  activeBoard: Board | null;
  onBoardChange: (board: Board) => void;
  onCreateBoard: () => void;
  onEditBoard?: (board: Board) => void;
  onDeleteBoard?: (boardId: string) => void;
  taskCounts?: Record<string, number>; // { boardId: taskCount }
}

export function BoardSelector({
  boards,
  activeBoard,
  onBoardChange,
  onCreateBoard,
  onEditBoard,
  onDeleteBoard,
  taskCounts = {},
}: BoardSelectorProps) {
  const { isAuthenticated, user } = useAuth();

  const handleLeaveBoard = async (boardId: string) => {
    try {
      await invitationsApi.leaveBoard(boardId);
      toast.success("Has abandonado el tablero");
      // Recargar la página para actualizar los tableros disponibles
      window.location.reload();
    } catch {
      toast.error("Error al abandonar el tablero");
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2">
          <LayoutDashboard className="h-4 w-4" />
          {activeBoard ? activeBoard.name : "Seleccionar tablero"}
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-72">
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
            <div key={board._id} className="group relative">
              <DropdownMenuItem
                onClick={() => onBoardChange(board)}
                className="flex items-center justify-between cursor-pointer pr-8"
              >
                <div className="flex items-center gap-2 flex-1">
                  {activeBoard?._id === board._id && (
                    <div className="h-2 w-2 rounded-full bg-primary" />
                  )}
                  <span
                    className={
                      activeBoard?._id === board._id ? "font-semibold" : ""
                    }
                  >
                    {board.name}
                  </span>
                </div>
                {taskCounts[board._id] !== undefined && (
                  <span className="text-xs text-muted-foreground mr-2">
                    {taskCounts[board._id]}{" "}
                    {taskCounts[board._id] === 1 ? "tarea" : "tareas"}
                  </span>
                )}
              </DropdownMenuItem>

              {/* Acciones del tablero (solo tablero activo) */}
              {activeBoard?._id === board._id && (
                <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 z-10">
                  {/* Acciones para tableros propios */}
                  {user &&
                    board.owner?._id === user._id &&
                    onEditBoard &&
                    onDeleteBoard &&
                    !board.isPublic && (
                      <>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditBoard(board);
                          }}
                        >
                          <Settings className="h-3 w-3" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6 text-destructive hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteBoard(board._id);
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </>
                    )}

                  {/* Acción para abandonar tableros compartidos */}
                  {user && board.owner?._id !== user._id && !board.isPublic && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 text-orange-600 hover:text-orange-700"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLeaveBoard(board._id);
                      }}
                      title="Abandonar tablero"
                    >
                      <LogOut className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              )}
            </div>
          ))
        )}

        {isAuthenticated && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={onCreateBoard}
              className="gap-2 cursor-pointer text-primary"
            >
              <Plus className="h-4 w-4" />
              Crear Nuevo Tablero
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
