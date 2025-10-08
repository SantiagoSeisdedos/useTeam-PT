import { Controller, Post, Body, Logger } from '@nestjs/common';
import { ExportService } from './export.service';
import { ExportBacklogDto } from './dto/export-backlog.dto';

@Controller('api/export')
export class ExportController {
  private readonly logger = new Logger(ExportController.name);

  constructor(private readonly exportService: ExportService) {}

  /**
   * Endpoint crítico del challenge: /api/export/backlog
   * Dispara el flujo n8n para exportar el backlog vía email en CSV
   */
  @Post('backlog')
  async exportBacklog(@Body() exportDto: ExportBacklogDto) {
    this.logger.log('Solicitud de exportación de backlog recibida');
    return this.exportService.exportBacklog(exportDto);
  }
}
