import { useContext } from "react";
import { BoardsContext } from "../contexts/BoardsContext";

export const useLoadingStates = (taskId?: string, columnName?: string) => {
  const context = useContext(BoardsContext);

  if (!context) {
    throw new Error("useLoadingStates must be used within a BoardsProvider");
  }

  const { loadingStates } = context;

  // Si se proporciona un taskId, verificar si esa tarea específica está en loading
  const isDeletingThisTask = taskId ? loadingStates.deletingTask === taskId : !!loadingStates.deletingTask;
  const isMovingThisTask = taskId ? loadingStates.movingTask === taskId : !!loadingStates.movingTask;
  // Si se proporciona un columnName, verificar si esa columna específica está en loading
  const isRenamingThisColumn = columnName ? loadingStates.renamingColumn === columnName : !!loadingStates.renamingColumn;
  const isDeletingThisColumn = columnName ? loadingStates.deletingColumn === columnName : !!loadingStates.deletingColumn;

  return {
    // Estados individuales
    isCreatingTask: loadingStates.creatingTask,
    isUpdatingTask: loadingStates.updatingTask,
    isDeletingTask: isDeletingThisTask,
    isMovingTask: isMovingThisTask,
    isCreatingBoard: loadingStates.creatingBoard,
    isUpdatingBoard: loadingStates.updatingBoard,
    isDeletingBoard: loadingStates.deletingBoard,
    isAddingColumn: loadingStates.addingColumn,
    isRenamingColumn: isRenamingThisColumn,
    isDeletingColumn: isDeletingThisColumn,

    // Estados combinados útiles
    isAnyTaskLoading:
      loadingStates.creatingTask ||
      loadingStates.updatingTask ||
      !!loadingStates.deletingTask ||
      !!loadingStates.movingTask,
    isAnyColumnLoading:
      loadingStates.addingColumn ||
      !!loadingStates.renamingColumn ||
      !!loadingStates.deletingColumn,
    isAnyBoardLoading:
      loadingStates.creatingBoard ||
      loadingStates.updatingBoard ||
      loadingStates.deletingBoard,
    isAnyLoading:
      loadingStates.creatingTask ||
      loadingStates.updatingTask ||
      !!loadingStates.deletingTask ||
      !!loadingStates.movingTask ||
      loadingStates.creatingBoard ||
      loadingStates.updatingBoard ||
      loadingStates.deletingBoard ||
      loadingStates.addingColumn ||
      !!loadingStates.renamingColumn ||
      !!loadingStates.deletingColumn,
  };
};

export default useLoadingStates;
