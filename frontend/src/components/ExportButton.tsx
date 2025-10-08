import { useState } from "react";
import { Button } from "./ui/button";
import { Download, Loader2, Mail } from "lucide-react";
import { exportApi } from "../services/api";
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

export function ExportButton() {
  const [isExporting, setIsExporting] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [email, setEmail] = useState("");

  const handleExport = async (emailAddress?: string) => {
    setIsExporting(true);
    toast.loading("Iniciando exportación del backlog...");

    try {
      const result = await exportApi.exportBacklog(
        emailAddress ? { email: emailAddress } : {}
      );

      toast.dismiss();
      toast.success("¡Exportación exitosa!", {
        description: `${result.tasksExported} tareas exportadas. ${
          emailAddress
            ? `El archivo CSV será enviado a ${emailAddress}`
            : "El archivo CSV está siendo procesado"
        }`,
        duration: 5000,
      });

      setShowDialog(false);
      setEmail("");
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
              El backlog se exportará en formato CSV y se enviará por email.
              Opcionalmente puedes especificar una dirección de correo.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
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
