import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

export type AIModel = 'gpt-3.5-turbo' | 'gpt-4o-mini' | 'gpt-4o';
export type ImprovementMode = 'simple' | 'context';

interface ImproveDescriptionParams {
  currentDescription: string;
  taskTitle: string;
  mode: ImprovementMode;
  model?: AIModel;
  contextTasks?: Array<{ title: string; description: string; column: string }>;
}

@Injectable()
export class AiService {
  private openaiApiKey: string;
  private readonly defaultModel: AIModel = 'gpt-4o-mini';

  constructor(private configService: ConfigService) {
    this.openaiApiKey = this.configService.get<string>('OPENAI_API_KEY') || '';
  }

  async improveDescription(params: ImproveDescriptionParams): Promise<string> {
    if (!this.openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const model = params.model || this.defaultModel;

    if (params.mode === 'simple') {
      return this.improveSimple(
        params.currentDescription,
        params.taskTitle,
        model,
      );
    } else {
      return this.improveWithContext(
        params.currentDescription,
        params.taskTitle,
        params.contextTasks || [],
        model,
      );
    }
  }

  /**
   * Mejora simple: solo gramática y redacción
   */
  private async improveSimple(
    description: string,
    title: string,
    model: AIModel,
  ): Promise<string> {
    const prompt = `Eres un asistente experto en mejorar descripciones de tareas de un tablero Kanban.

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

    return this.callOpenAI(prompt, model, 500);
  }

  /**
   * Mejora con contexto: análisis de tareas relacionadas
   */
  private async improveWithContext(
    description: string,
    title: string,
    contextTasks: Array<{ title: string; description: string; column: string }>,
    model: AIModel,
  ): Promise<string> {
    const contextSummary = this.buildContextSummary(contextTasks);

    const prompt = `Eres un asistente experto en gestión de proyectos y tableros Kanban.

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

    return this.callOpenAI(prompt, model, 1000);
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
      const response = await axios.post(
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
}
