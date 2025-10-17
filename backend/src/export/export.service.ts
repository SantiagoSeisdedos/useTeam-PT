import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Task, TaskDocument } from '../schemas/task.schema';
import { firstValueFrom } from 'rxjs';
import { ExportBacklogDto } from './dto/export-backlog.dto';

@Injectable()
export class ExportService {
  private readonly logger = new Logger(ExportService.name);
  private readonly n8nWebhookUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    @InjectModel(Task.name) private taskModel: Model<TaskDocument>,
  ) {
    this.n8nWebhookUrl =
      this.configService.get<string>('N8N_WEBHOOK_URL') ||
      'http://localhost:5678/webhook/kanban-export';
  }

  /**
   * Exporta el backlog completo disparando el webhook de n8n
   * El webhook recibe las tareas y genera el CSV + resumen IA + envía email
   */
  async exportBacklog(exportDto: ExportBacklogDto) {
    this.logger.log('Iniciando exportación de backlog...');

    try {
      // Obtener todas las tareas de la base de datos
      const tasks = await this.taskModel
        .find()
        .sort({ column: 1, position: 1 })
        .exec();

      this.logger.log(`Se encontraron ${tasks.length} tareas para exportar`);
      // Formatear las tareas para el CSV
      const formattedTasks = tasks.map((task) => ({
        id: String(task._id),
        title: task.title,
        description: task.description,
        column: task.column,
        fecha_creacion: task.createdAt,
      }));
      // Preparar payload para n8n
      const payload = {
        tasks: formattedTasks,
        email: exportDto.email || null,
        timestamp: new Date().toISOString(),
        totalTasks: tasks.length,
      };
      // Disparar webhook de n8n
      this.logger.log(`Disparando webhook n8n: ${this.n8nWebhookUrl}`);
      const response = await firstValueFrom(
        this.httpService.post(this.n8nWebhookUrl, payload),
      );
      this.logger.log('Webhook n8n ejecutado exitosamente');

      return {
        success: true,
        message: 'Exportación iniciada exitosamente',
        tasksExported: tasks.length,
        webhookResponse: response.data as unknown,
      };
    } catch (error) {
      this.logger.error('Error al exportar backlog:', (error as Error).message);
      throw error;
    }
  }
}
