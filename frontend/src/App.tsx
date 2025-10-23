import { KanbanBoard } from "./components/KanbanBoard";
import { Toaster } from "./components/ui/sonner";
import { AuthProvider } from "./contexts/AuthContext";
import { BoardsProvider } from "./contexts/BoardsContext";

function App() {
  return (
    <AuthProvider>
      <BoardsProvider>
        <KanbanBoard />
        <Toaster />
      </BoardsProvider>
    </AuthProvider>
  );
}

export default App;
