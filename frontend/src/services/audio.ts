/**
 * Servicio de Audio para feedback sonoro
 * Genera sonidos sintéticos usando Web Audio API
 */

import { toast } from "sonner";

type SoundType = "success" | "notification" | "column" | "task" | "delete";

interface AudioSettings {
  enabled: boolean;
  volume: number; // 0 a 1
}

const AUDIO_SETTINGS_KEY = "kanban-audio-settings";

class AudioService {
  private audioContext: AudioContext | null = null;
  private settings: AudioSettings = {
    enabled: true,
    volume: 0.01,
  };

  constructor() {
    this.loadSettings();
  }

  /**
   * Inicializa el AudioContext (se debe llamar después de una interacción del usuario)
   */
  private ensureAudioContext() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext ||
        (window as unknown as { webkitAudioContext: AudioContext })
          .webkitAudioContext)();
    }

    // Resume si está suspendido (por políticas del navegador)
    if (this.audioContext.state === "suspended") {
      this.audioContext.resume();
    }
  }

  /**
   * Reproduce un sonido según el tipo
   */
  play(type: SoundType) {
    if (!this.settings.enabled) {
      return;
    }

    try {
      this.ensureAudioContext();

      switch (type) {
        case "success":
          this.playSuccess();
          break;
        case "notification":
          this.playNotification();
          break;
        case "column":
          this.playColumnCreated();
          break;
        case "task":
          this.playTaskCreated();
          break;
        case "delete":
          this.playDelete();
          break;
      }
    } catch {
      toast.error("Error al reproducir el sonido");
    }
  }

  /**
   * Sonido de éxito (chord: Do-Mi-Sol) - para exportación exitosa
   */
  private playSuccess() {
    if (!this.audioContext) return;

    const now = this.audioContext.currentTime;
    const gainNode = this.audioContext.createGain();
    gainNode.connect(this.audioContext.destination);
    gainNode.gain.value = this.settings.volume;

    // Acorde de Do Mayor (C-E-G)
    const frequencies = [523.25, 659.25, 783.99, 1023.25]; // Do, Mi, Sol

    frequencies.forEach((freq, index) => {
      const oscillator = this.audioContext!.createOscillator();
      oscillator.type = "sine";
      oscillator.frequency.value = freq;
      oscillator.connect(gainNode);

      const startTime = now + index * 0.1;
      oscillator.start(startTime);
      oscillator.stop(startTime + 0.15);
    });

    // Fade out
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
  }

  /**
   * Sonido de notificación (beep corto) - para tareas creadas por otros usuarios
   */
  private playNotification() {
    if (!this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.type = "sine";
    oscillator.frequency.value = 800; // La agudo
    gainNode.gain.value = this.settings.volume * 0.5; // Más suave

    const now = this.audioContext.currentTime;
    oscillator.start(now);
    oscillator.stop(now + 0.1);

    // Fade out rápido
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
  }

  /**
   * Sonido al crear columna (tono ascendente)
   */
  private playColumnCreated() {
    if (!this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.type = "triangle";

    const now = this.audioContext.currentTime;

    // Sweep ascendente
    oscillator.frequency.setValueAtTime(300, now);
    oscillator.frequency.exponentialRampToValueAtTime(600, now + 0.2);

    gainNode.gain.value = this.settings.volume;
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

    oscillator.start(now);
    oscillator.stop(now + 0.25);
  }

  /**
   * Sonido al crear tarea (pop suave)
   */
  private playTaskCreated() {
    if (!this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.type = "sine";
    oscillator.frequency.value = 400; // Sol

    const now = this.audioContext.currentTime;
    gainNode.gain.value = this.settings.volume * 0.6;
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

    oscillator.start(now);
    oscillator.stop(now + 0.15);
  }

  /**
   * Sonido al eliminar (tono descendente) - para eliminar tasks y columnas
   */
  private playDelete() {
    if (!this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.type = "sine";

    const now = this.audioContext.currentTime;

    // Sweep descendente (más dramático)
    oscillator.frequency.setValueAtTime(500, now);
    oscillator.frequency.exponentialRampToValueAtTime(200, now + 0.2);

    gainNode.gain.value = this.settings.volume * 0.7;
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

    oscillator.start(now);
    oscillator.stop(now + 0.25);
  }

  /**
   * Configuración
   */
  setEnabled(enabled: boolean) {
    this.settings.enabled = enabled;
    this.saveSettings();
  }

  setVolume(volume: number) {
    this.settings.volume = Math.max(0, Math.min(1, volume));
    this.saveSettings();
  }

  getSettings(): AudioSettings {
    return { ...this.settings };
  }

  isEnabled(): boolean {
    return this.settings.enabled;
  }

  getVolume(): number {
    return this.settings.volume;
  }

  /**
   * Persistencia de configuración
   */
  private loadSettings() {
    try {
      const saved = localStorage.getItem(AUDIO_SETTINGS_KEY);
      if (saved) {
        this.settings = JSON.parse(saved);
      }
    } catch {
      toast.error("Error al cargar la configuración de audio");
    }
  }

  private saveSettings() {
    try {
      localStorage.setItem(AUDIO_SETTINGS_KEY, JSON.stringify(this.settings));
    } catch {
      toast.error("Error al guardar la configuración de audio");
    }
  }
}

// Exportar instancia única
export const audioService = new AudioService();
