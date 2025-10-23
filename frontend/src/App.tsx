import { KanbanBoard } from "./components/KanbanBoard";
import { Toaster } from "./components/ui/sonner";
import { AuthProvider } from "./contexts/AuthContext";

function App() {
  return (
    <AuthProvider>
      <KanbanBoard />
      <Toaster />
    </AuthProvider>
  );
}

export default App;
