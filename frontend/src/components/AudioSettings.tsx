import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Switch } from "./ui/switch";
import { Slider } from "./ui/slider";
import { Label } from "./ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./ui/popover";
import { Volume2, VolumeX } from "lucide-react";
import { audioService } from "../services/audio";

export function AudioSettings() {
  const [enabled, setEnabled] = useState(audioService.isEnabled());
  const [volume, setVolume] = useState(audioService.getVolume() * 100);

  useEffect(() => {
    // Sincronizar con el servicio al montar
    setEnabled(audioService.isEnabled());
    setVolume(audioService.getVolume() * 100);
  }, []);

  const handleToggle = (checked: boolean) => {
    setEnabled(checked);
    audioService.setEnabled(checked);
    
    // Reproducir sonido de prueba al activar
    if (checked) {
      setTimeout(() => audioService.play('notification'), 100);
    }
  };

  const handleVolumeChange = (values: number[]) => {
    const newVolume = values[0];
    setVolume(newVolume);
    audioService.setVolume(newVolume / 100);
  };

  const handleVolumeChangeComplete = () => {
    // Reproducir sonido de prueba al cambiar volumen
    if (enabled) {
      audioService.play('task');
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" title="Configuración de Audio">
          {enabled ? (
            <Volume2 className="h-4 w-4" />
          ) : (
            <VolumeX className="h-4 w-4 text-muted-foreground" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72" align="end">
        <div className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">Configuración de Audio</h4>
            <p className="text-sm text-muted-foreground">
              Controla los sonidos de notificación
            </p>
          </div>

          {/* Toggle On/Off */}
          <div className="flex items-center justify-between">
            <Label htmlFor="audio-toggle" className="cursor-pointer">
              Activar sonidos
            </Label>
            <Switch
              id="audio-toggle"
              checked={enabled}
              onCheckedChange={handleToggle}
            />
          </div>

          {/* Slider de Volumen */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="volume-slider">Volumen</Label>
              <span className="text-sm text-muted-foreground">
                {Math.round(volume)}%
              </span>
            </div>
            <Slider
              id="volume-slider"
              min={0}
              max={100}
              step={1}
              value={[volume]}
              onValueChange={handleVolumeChange}
              onValueCommit={handleVolumeChangeComplete}
              disabled={!enabled}
              className="cursor-pointer"
            />
          </div>

          {/* Botones de prueba */}
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground mb-2">
              Probar sonidos:
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => audioService.play('task')}
                disabled={!enabled}
              >
                Tarea
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => audioService.play('column')}
                disabled={!enabled}
              >
                Columna
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => audioService.play('delete')}
                disabled={!enabled}
              >
                Eliminar
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => audioService.play('success')}
                disabled={!enabled}
              >
                Éxito
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

