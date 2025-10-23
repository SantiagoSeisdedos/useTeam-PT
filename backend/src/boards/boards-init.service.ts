import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { BoardsService } from './boards.service';

@Injectable()
export class BoardsInitService implements OnModuleInit {
  private readonly logger = new Logger(BoardsInitService.name);

  constructor(private readonly boardsService: BoardsService) {}

  async onModuleInit() {
    await this.ensurePublicBoardExists();
  }

  private async ensurePublicBoardExists() {
    try {
      this.logger.log('🔍 Verificando si existe un tablero público...');

      // Buscar tableros públicos
      const publicBoards = await this.boardsService.findAll();

      if (publicBoards.length === 0) {
        this.logger.log(
          '📝 No se encontraron tableros públicos, creando uno por defecto...',
        );

        // Crear tablero público por defecto
        const defaultBoard = await this.boardsService.create({
          name: 'Tablero Público',
          columns: ['Por Hacer', 'En Progreso', 'Completado'],
        });

        // Marcar como público (sin owner = público por defecto)
        const boardId = (defaultBoard as any)._id?.toString();
        if (boardId) {
          await this.boardsService.update(boardId, {
            name: 'Tablero Público',
            isPublic: true,
          });
        }

        this.logger.log(`✅ Tablero público creado: ${defaultBoard.name}`);
      } else {
        this.logger.log(
          `✅ Se encontraron ${publicBoards.length} tableros públicos`,
        );
      }
    } catch (error) {
      this.logger.error('❌ Error al verificar/crear tablero público:', error);
    }
  }
}
