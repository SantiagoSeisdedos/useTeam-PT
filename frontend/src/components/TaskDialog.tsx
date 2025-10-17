import { useState, useEffect } from 'react';
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
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Separator } from './ui/separator';
import { Sparkles, Loader2, Check, X } from 'lucide-react';
import { aiApi } from '../services/api';
import { toast } from 'sonner';
import type { Task } from '../types';

interface TaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: { title: string; description: string }) => void;
  task?: Task;
  column?: string;
  allTasks?: Task[]; // Para contexto de IA
}

type AIMode = 'simple' | 'context';
type AIModel =
  | 'gpt-3.5-turbo'
  | 'gpt-4o-mini'
  | 'gpt-4o'
  | 'gemini-2.5-flash'
  | 'gemini-2.5-pro';

interface AIProviderStatus {
  openai: { available: boolean; models: string[] };
  gemini: { available: boolean; models: string[] };
}

export function TaskDialog({
  open,
  onOpenChange,
  onSubmit,
  task,
  column,
  allTasks = [],
}: TaskDialogProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isImproving, setIsImproving] = useState(false);
  const [improvedDescription, setImprovedDescription] = useState<string | null>(null);
  const [aiMode, setAiMode] = useState<AIMode>('simple');
  const [aiModel, setAiModel] = useState<AIModel>('gpt-4o-mini');
  const [aiStatus, setAiStatus] = useState<AIProviderStatus | null>(null);

  // Consultar estado de proveedores de IA al montar // TODO: Move to a reducer/context
  useEffect(() => {
    const fetchAIStatus = async () => {
      try {
        const status = await aiApi.getStatus();
        setAiStatus(status);

        // Si el modelo actual no está disponible, cambiar a uno disponible
        const currentModelProvider = aiModel.startsWith('gpt') ? 'openai' : 'gemini';
        const isCurrentAvailable =
          currentModelProvider === 'openai'
            ? status.openai.available
            : status.gemini.available;

        if (!isCurrentAvailable) {
          // Buscar el primer modelo disponible
          if (status.openai.available && status.openai.models.length > 0) {
            setAiModel(status.openai.models[0] as AIModel);
          } else if (status.gemini.available && status.gemini.models.length > 0) {
            setAiModel(status.gemini.models[0] as AIModel);
          }
        }
      } catch (error) {
        console.error('Error fetching AI status:', error);
      }
    };

    fetchAIStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description);
    } else {
      setTitle('');
      setDescription('');
    }
    setImprovedDescription(null); // Reset preview al abrir/cambiar
  }, [task, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSubmit({ title: title.trim(), description: description.trim() });
    setTitle('');
    setDescription('');
    setImprovedDescription(null);
  };

  const handleImproveWithAI = async () => {
    if (!description.trim()) {
      toast.error('Escribe una descripción primero');
      return;
    }

    if (!title.trim()) {
      toast.error('La tarea necesita un título');
      return;
    }

    if (description.trim().length < 30) {
      toast.error('La descripción debe tener al menos 30 caracteres');
      return;
    }

    setIsImproving(true);
    toast.loading('Mejorando descripción con IA...');

    try {
      const contextTasks = aiMode === 'context'
        ? allTasks.map(t => ({
            title: t.title,
            description: t.description,
            column: t.column,
          }))
        : undefined;

      const result = await aiApi.improveDescription({
        currentDescription: description,
        taskTitle: title,
        mode: aiMode,
        model: aiModel,
        contextTasks,
      });

      setImprovedDescription(result.improved);
      toast.dismiss();
      toast.success('Descripción mejorada con IA', {
        description: `Modelo: ${result.model} (${result.mode === 'simple' ? 'Simple' : 'Con contexto'})`,
      });
    } catch (error) {
      console.error('Error mejorando con IA:', error);
      toast.dismiss();
      
      // Mensaje de error más específico
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      const selectedProvider = aiModel.startsWith('gpt') ? 'OpenAI' : 'Gemini';
      
      toast.error('Error al mejorar con IA', {
        description: errorMessage.includes('not available')
          ? `${selectedProvider} no está disponible. Verifica tu API Key.`
          : errorMessage,
      });
    } finally {
      setIsImproving(false);
    }
  };

  const handleAcceptImproved = () => {
    if (improvedDescription) {
      setDescription(improvedDescription);
      setImprovedDescription(null);
      toast.success('Descripción actualizada');
    }
  };

  const handleRejectImproved = () => {
    setImprovedDescription(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {task ? 'Editar Tarea' : `Nueva Tarea${column ? ` en "${column}"` : ''}`}
            </DialogTitle>
            <DialogDescription>
              {task
                ? 'Modifica los detalles de la tarea'
                : 'Crea una nueva tarea para el tablero'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                placeholder="Ej: Implementar nueva funcionalidad"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                autoFocus
                required
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="description">Descripción</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleImproveWithAI}
                  disabled={
                    isImproving ||
                    !description.trim() ||
                    !title.trim() ||
                    (aiStatus
                      ? !aiStatus.openai.available && !aiStatus.gemini.available
                      : false)
                  }
                  className="h-8 gap-1"
                  title={
                    aiStatus && !aiStatus.openai.available && !aiStatus.gemini.available
                      ? 'No hay proveedores de IA disponibles'
                      : ''
                  }
                >
                  {isImproving ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Mejorando...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3 w-3" />
                      Mejorar con IA
                    </>
                  )}
                </Button>
              </div>
              <Textarea
                id="description"
                placeholder="Describe los detalles de la tarea..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
              />
              
              {/* Opciones de IA */}
              {description.trim() && (
                <div className="space-y-3 pt-2">
                  <Separator />
                  
                  {/* Aviso si no hay proveedores disponibles */}
                  {aiStatus && !aiStatus.openai.available && !aiStatus.gemini.available && (
                    <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                      <p className="text-xs text-yellow-800 dark:text-yellow-200">
                        ⚠️ No hay proveedores de IA configurados. Configura OPENAI_API_KEY o GEMINI_API_KEY en el backend.
                      </p>
                    </div>
                  )}
                  
                  {/* Modo de mejora */}
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Modo de mejora:</Label>
                    <RadioGroup value={aiMode} onValueChange={(v) => setAiMode(v as AIMode)}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="simple" id="mode-simple" />
                        <Label htmlFor="mode-simple" className="cursor-pointer font-normal">
                          Simple (solo gramática y redacción)
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="context" id="mode-context" />
                        <Label htmlFor="mode-context" className="cursor-pointer font-normal">
                          Contextual (análisis con otras tareas)
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Modelo */}
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Modelo de IA:</Label>
                    <RadioGroup value={aiModel} onValueChange={(v) => setAiModel(v as AIModel)}>
                      {/* OpenAI Models */}
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold text-muted-foreground">
                          OpenAI {!aiStatus?.openai.available && '(No disponible)'}
                        </Label>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem
                            value="gpt-4o-mini"
                            id="model-mini"
                            disabled={!aiStatus?.openai.available}
                          />
                          <Label
                            htmlFor="model-mini"
                            className={`cursor-pointer font-normal ${!aiStatus?.openai.available ? 'text-muted-foreground/50' : ''}`}
                          >
                            GPT-4o Mini (rápido) ⚡
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem
                            value="gpt-3.5-turbo"
                            id="model-35"
                            disabled={!aiStatus?.openai.available}
                          />
                          <Label
                            htmlFor="model-35"
                            className={`cursor-pointer font-normal ${!aiStatus?.openai.available ? 'text-muted-foreground/50' : ''}`}
                          >
                            GPT-3.5 Turbo (económico)
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem
                            value="gpt-4o"
                            id="model-4o"
                            disabled={!aiStatus?.openai.available}
                          />
                          <Label
                            htmlFor="model-4o"
                            className={`cursor-pointer font-normal ${!aiStatus?.openai.available ? 'text-muted-foreground/50' : ''}`}
                          >
                            GPT-4o (máxima calidad) 🚀
                          </Label>
                        </div>
                      </div>

                      {/* Gemini Models */}
                      <div className="space-y-2 pt-2">
                        <Label className="text-xs font-semibold text-muted-foreground">
                          Google Gemini {!aiStatus?.gemini.available && '(No disponible)'}
                        </Label>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem
                            value="gemini-2.5-flash"
                            id="model-gemini-flash"
                            disabled={!aiStatus?.gemini.available}
                          />
                          <Label
                            htmlFor="model-gemini-flash"
                            className={`cursor-pointer font-normal ${!aiStatus?.gemini.available ? 'text-muted-foreground/50' : ''}`}
                          >
                            Gemini 2.5 Flash (rápido y gratis) 🆓
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem
                            value="gemini-2.5-pro"
                            id="model-gemini-pro"
                            disabled={!aiStatus?.gemini.available}
                          />
                          <Label
                            htmlFor="model-gemini-pro"
                            className={`cursor-pointer font-normal ${!aiStatus?.gemini.available ? 'text-muted-foreground/50' : ''}`}
                          >
                            Gemini 2.5 Pro (avanzado y gratis) 🎯
                          </Label>
                        </div>
                      </div>
                    </RadioGroup>
                  </div>
                </div>
              )}

              {/* Preview de descripción mejorada */}
              {improvedDescription && (
                <div className="mt-4 space-y-2 p-3 bg-primary/5 border border-primary/20 rounded-lg">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-semibold flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-primary" />
                      Descripción mejorada
                    </Label>
                  </div>
                  <p className="text-sm whitespace-pre-wrap bg-background p-3 rounded border">
                    {improvedDescription}
                  </p>
                  <div className="flex gap-2 pt-2">
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleAcceptImproved}
                      className="flex-1"
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Usar esta versión
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={handleRejectImproved}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Descartar
                    </Button>
                  </div>
                </div>
              )}
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
            <Button type="submit" disabled={!title.trim()}>
              {task ? 'Guardar' : 'Crear'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

