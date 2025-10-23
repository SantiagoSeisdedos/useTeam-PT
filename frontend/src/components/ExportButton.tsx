import { useState } from "react";
import { Button } from "./ui/button";
import { Download, Loader2, Mail } from "lucide-react";
import { exportApi } from "../services/api";
import { audioService } from "../services/audio";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { ChevronDown } from "lucide-react";
import type { Board } from "../types";

interface ExportButtonProps {
  boards: Board[];
}

export function ExportButton({ boards }: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [email, setEmail] = useState("");
  const [selectedBoardId, setSelectedBoardId] = useState<string>("");

  const handleExport = async (emailAddress?: string) => {
    setIsExporting(true);
    toast.loading("Iniciando exportación del backlog...");

    try {
      const exportData: { email?: string; boardId?: string } = {};
      if (emailAddress) exportData.email = emailAddress;
      if (selectedBoardId) exportData.boardId = selectedBoardId;

      const result = await exportApi.exportBacklog(exportData);

      toast.dismiss();
      
      const boardName = selectedBoardId 
        ? boards.find(b => b._id === selectedBoardId)?.name 
        : null;
      
      toast.success("¡Exportación exitosa!", {
        description: `${result.tasksExported} tareas exportadas${boardName ? ` del tablero "${boardName}"` : ' de todos los tableros'}. ${
          emailAddress
            ? `El archivo CSV será enviado a ${emailAddress}`
            : "El archivo CSV está siendo procesado"
        }`,
        duration: 5000,
      });

      // Reproducir sonido de éxito
      audioService.play('success');

      setShowDialog(false);
      setEmail("");
      setSelectedBoardId("");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      toast.dismiss();
      toast.error("Error al exportar backlog", {
        description:
          error.response?.data?.message ||
          "No se pudo completar la exportación. Verifica que n8n esté configurado.",
        duration: 5000,
      });
      console.error("Error exportando backlog:", error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <>
      <Button
        onClick={() => setShowDialog(true)}
        disabled={isExporting}
        size="lg"
        className="gap-2"
      >
        {isExporting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Exportando...
          </>
        ) : (
          <>
            <Download className="h-4 w-4" />
            Exportar Backlog
          </>
        )}
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Exportar Backlog
            </DialogTitle>
            <DialogDescription>
              Selecciona un tablero específico o exporta todos los tableros.
              El backlog se exportará en formato CSV y se enviará por email.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Board Selection */}
            <div className="space-y-2">
              <Label htmlFor="board">Tablero (opcional)</Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    {selectedBoardId 
                      ? boards.find(b => b._id === selectedBoardId)?.name 
                      : 'Todos los tableros'
                    }
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-full">
                  <DropdownMenuItem
                    onClick={() => setSelectedBoardId("")}
                    className={!selectedBoardId ? "bg-accent" : ""}
                  >
                    Todos los tableros
                  </DropdownMenuItem>
                  {boards.map((board) => (
                    <DropdownMenuItem
                      key={board._id}
                      onClick={() => setSelectedBoardId(board._id)}
                      className={selectedBoardId === board._id ? "bg-accent" : ""}
                    >
                      {board.name} {board.isPublic ? "(Público)" : "(Privado)"}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <p className="text-xs text-muted-foreground">
                Selecciona un tablero específico o deja en blanco para exportar todos los tableros.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email (opcional)</Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Si no especificas un email, el CSV será enviado a la dirección
                configurada en el servidor.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowDialog(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={() => handleExport(email || undefined)}
              disabled={isExporting}
            >
              {isExporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Exportando...
                </>
              ) : (
                "Exportar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
