import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';

interface CreateBoardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: { name: string; columns: string[] }) => void;
}

export function CreateBoardDialog({
  open,
  onOpenChange,
  onSubmit,
}: CreateBoardDialogProps) {
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    onSubmit({
      name: name.trim() || 'Nuevo Tablero',
      columns: ['Por Hacer', 'En Progreso', 'Completado'], // Columnas por defecto
    });

    // Reset form
    setName('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Crear Nuevo Tablero</DialogTitle>
            <DialogDescription>
              Se creará un tablero con las columnas estándar: Por Hacer, En Progreso y Completado
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Nombre del tablero */}
            <div className="space-y-2">
              <Label htmlFor="board-name">Nombre del tablero *</Label>
              <Input
                id="board-name"
                placeholder="Ej: Proyecto Frontend, Sprint 1, Ideas..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
              <p className="text-xs text-muted-foreground">
                Podrás agregar más columnas después de crear el tablero
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit">
              Crear Tablero
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

