import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { GoogleGenAI } from '@google/genai';

export type AIModel = 'gpt-3.5-turbo' | 'gpt-4o-mini' | 'gpt-4o';
export type GeminiModel = 'gemini-2.5-flash' | 'gemini-2.5-pro';
export type AllAIModels = AIModel | GeminiModel;
export type ImprovementMode = 'simple' | 'context';

interface ImproveDescriptionParams {
  currentDescription: string;
  taskTitle: string;
  mode: ImprovementMode;
  model?: AllAIModels;
  contextTasks?: Array<{ title: string; description: string; column: string }>;
}

@Injectable()
export class AiService {
  private openaiApiKey: string;
  private geminiApiKey: string;
  private genAI: GoogleGenAI | null = null;
  private readonly defaultModel: AIModel = 'gpt-4o-mini';
  private readonly defaultGeminiModel: GeminiModel = 'gemini-2.5-flash';
  private logger: Logger = new Logger('AiService');

  constructor(private configService: ConfigService) {
    this.openaiApiKey = this.configService.get<string>('OPENAI_API_KEY') || '';
    this.geminiApiKey = this.configService.get<string>('GEMINI_API_KEY') || '';
    // Inicializar cliente de Gemini si hay API key
    if (this.geminiApiKey) {
      this.genAI = new GoogleGenAI({ apiKey: this.geminiApiKey });
    }
  }

  /**
   * Retorna el estado de disponibilidad de los proveedores de IA
   */
  getProvidersStatus() {
    return {
      openai: {
        available: !!this.openaiApiKey,
        models: ['gpt-3.5-turbo', 'gpt-4o-mini', 'gpt-4o'],
      },
      gemini: {
        available: !!this.geminiApiKey,
        models: ['gemini-2.5-flash', 'gemini-2.5-pro'],
      },
    };
  }

  /**
   * Determina si un modelo es de OpenAI o Gemini
   */
  private isOpenAIModel(model: string): model is AIModel {
    return ['gpt-3.5-turbo', 'gpt-4o-mini', 'gpt-4o'].includes(model);
  }

  private isGeminiModel(model: string): model is GeminiModel {
    return ['gemini-2.5-flash', 'gemini-2.5-pro'].includes(model);
  }

  async improveDescription(params: ImproveDescriptionParams): Promise<string> {
    const selectedModel = params.model;

    // Determinar qué proveedor usar basado en el modelo seleccionado
    let useOpenAI = false;
    let useGemini = false;

    if (selectedModel) {
      // Usuario eligió un modelo específico
      if (this.isOpenAIModel(selectedModel)) {
        useOpenAI = this.openaiApiKey ? true : false;
      } else if (this.isGeminiModel(selectedModel)) {
        useGemini = this.geminiApiKey ? true : false;
      }
    } else {
      // Sin modelo específico, usar por defecto
      // Prioridad: OpenAI > Gemini
      useOpenAI = !!this.openaiApiKey;
      useGemini = !useOpenAI && !!this.geminiApiKey;
    }

    // Construir el prompt centralizado
    const prompt =
      params.mode === 'simple'
        ? this.buildSimplePrompt(params.currentDescription, params.taskTitle)
        : this.buildContextPrompt(
            params.currentDescription,
            params.taskTitle,
            params.contextTasks || [],
          );

    // Ejecutar con el proveedor correspondiente
    if (useOpenAI && this.openaiApiKey) {
      const model = (selectedModel as AIModel) || this.defaultModel;
      const maxTokens = params.mode === 'simple' ? 3000 : 5000;
      return this.callOpenAI(prompt, model, maxTokens);
    } else if (useGemini && this.geminiApiKey) {
      const model = (selectedModel as GeminiModel) || this.defaultGeminiModel;
      const maxTokens = params.mode === 'simple' ? 3000 : 5000;
      return this.callGemini(prompt, model, maxTokens);
    } else {
      throw new Error(
        'AI provider not available for the selected model. Please check your API keys.',
      );
    }
  }

  /**
   * Construye el prompt para mejora simple (centralizado)
   */
  private buildSimplePrompt(description: string, title: string): string {
    return `Eres un asistente experto en mejorar descripciones de tareas de un tablero Kanban.

Tu tarea: Mejorar SOLO la gramática, ortografía y redacción de la siguiente descripción de tarea, manteniendo el mismo significado y longitud similar.

TAREA: "${title}"
DESCRIPCIÓN ACTUAL: "${description}"

REGLAS:
- Mantén el mismo significado
- Corrige errores gramaticales y ortográficos
- Mejora la claridad y profesionalismo
- NO agregues información nueva
- NO cambies el propósito de la tarea
- Responde SOLO con la descripción mejorada, sin explicaciones adicionales

DESCRIPCIÓN MEJORADA:`;
  }

  /**
   * Construye el prompt para mejora con contexto (centralizado)
   */
  private buildContextPrompt(
    description: string,
    title: string,
    contextTasks: Array<{ title: string; description: string; column: string }>,
  ): string {
    const contextSummary = this.buildContextSummary(contextTasks);

    return `Eres un asistente experto en gestión de proyectos y tableros Kanban.

CONTEXTO DEL PROYECTO:
${contextSummary}

TAREA ACTUAL A MEJORAR:
Título: "${title}"
Descripción actual: "${description}"

Tu tarea: Mejorar la descripción considerando:
1. Gramática, ortografía y redacción profesional
2. Relación con otras tareas del proyecto
3. Claridad de objetivos y criterios de aceptación
4. Dependencias o conexiones con otras tareas (si aplica)
5. Contexto del proyecto para hacer la descripción más útil

REGLAS:
- Mantén el significado original
- Mejora claridad y profesionalismo
- Si hay relación con otras tareas, menciónalo brevemente
- Mantén la descripción concisa (máximo 2-3 líneas más que la original)
- Responde SOLO con la descripción mejorada, sin explicaciones adicionales

DESCRIPCIÓN MEJORADA:`;
  }

  /**
   * Construye un resumen del contexto de tareas
   */
  private buildContextSummary(
    tasks: Array<{ title: string; description: string; column: string }>,
  ): string {
    const tasksByColumn = tasks.reduce(
      (acc, task) => {
        if (!acc[task.column]) {
          acc[task.column] = [];
        }
        acc[task.column].push(task);
        return acc;
      },
      {} as Record<string, typeof tasks>,
    );

    let summary = '';
    Object.entries(tasksByColumn).forEach(([column, columnTasks]) => {
      summary += `\n${column} (${columnTasks.length} tareas):\n`;
      columnTasks.slice(0, 5).forEach((task) => {
        summary += `  - ${task.title}\n`;
      });
      if (columnTasks.length > 5) {
        summary += `  ... y ${columnTasks.length - 5} más\n`;
      }
    });

    return summary;
  }

  /**
   * Llamada a la API de OpenAI
   */
  private async callOpenAI(
    prompt: string,
    model: AIModel,
    maxTokens: number,
  ): Promise<string> {
    try {
      const response = await axios.post<{
        choices: Array<{ message: { content: string } }>;
      }>(
        'https://api.openai.com/v1/chat/completions',
        {
          model,
          messages: [
            {
              role: 'system',
              content:
                'Eres un asistente experto en gestión de proyectos y mejora de descripciones de tareas.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          max_tokens: maxTokens,
          temperature: 0.7,
        },
        {
          headers: {
            Authorization: `Bearer ${this.openaiApiKey}`,
            'Content-Type': 'application/json',
          },
        },
      );

      return response.data.choices[0].message.content.trim();
    } catch (error) {
      console.error('Error calling OpenAI API:', error);
      throw new Error('Failed to improve description with AI');
    }
  }

  /**
   * Llamada a la API de Gemini (Google) usando SDK oficial
   */
  private async callGemini(
    prompt: string,
    model: GeminiModel,
    maxOutputTokens: number = 3000,
  ): Promise<string> {
    try {
      if (!this.genAI) {
        throw new Error('Gemini client not initialized');
      }

      // Generar contenido con la nueva sintaxis
      const response = await this.genAI.models.generateContent({
        model: model,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          temperature: 0.7,
          maxOutputTokens: maxOutputTokens,
        },
      });

      // Verificar si la respuesta fue bloqueada por filtros de seguridad
      if (response.promptFeedback?.blockReason) {
        this.logger.warn(
          'Gemini API Blocked Response:',
          response.promptFeedback.blockReason,
        );
        throw new Error(
          'La solicitud fue bloqueada por filtros de seguridad del modelo (Gemini).',
        );
      }

      const text = response.text;

      if (!text) {
        this.logger.error('Empty response from Gemini:', response);
        throw new Error('Respuesta inválida o vacía de la API de Gemini');
      }

      return text.trim();
    } catch (error) {
      this.logger.error('Error calling Gemini API:', error);

      // Manejar errores específicos
      if (error instanceof Error) {
        if (error.message.includes('quota') || error.message.includes('429')) {
          throw new Error(
            'Gemini rate limit exceeded. Please try again in a moment.',
          );
        }
        if (error.message.includes('API_KEY')) {
          throw new Error('Invalid Gemini API key');
        }
      }

      throw new Error('Failed to improve description with AI (Gemini)');
    }
  }
}
