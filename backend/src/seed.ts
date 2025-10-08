import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { TasksService } from './tasks/tasks.service';
import { BoardsService } from './boards/boards.service';
import { Logger } from '@nestjs/common';

/**
 * Script de seed para poblar la base de datos con datos de ejemplo
 * Ejecutar: npm run seed
 */
async function seed() {
  const logger = new Logger('Seed');

  try {
    const app = await NestFactory.createApplicationContext(AppModule);

    const tasksService = app.get(TasksService);
    const boardsService = app.get(BoardsService);

    logger.log('🌱 Iniciando seed de base de datos...');

    // Crear tablero por defecto
    const board = await boardsService.create({
      name: 'Tablero Principal',
      columns: ['Por Hacer', 'En Progreso', 'Completado'],
    });

    logger.log(`✅ Tablero creado: ${board.name}`);

    // Crear tareas de ejemplo
    const sampleTasks = [
      {
        title: 'Configurar proyecto React',
        description:
          'Inicializar proyecto con Create React App y configurar dependencias',
        column: 'Completado',
        position: 0,
      },
      {
        title: 'Implementar tablero Kanban',
        description: 'Crear componentes del tablero con drag & drop',
        column: 'En Progreso',
        position: 0,
      },
      {
        title: 'Integrar WebSocket',
        description:
          'Conectar cliente Socket.io para colaboración en tiempo real',
        column: 'En Progreso',
        position: 1,
      },
      {
        title: 'Diseñar interfaz de usuario',
        description: 'Crear diseño moderno y responsive del tablero',
        column: 'Por Hacer',
        position: 0,
      },
      {
        title: 'Agregar botón de exportación',
        description: 'Implementar botón para exportar backlog vía n8n',
        column: 'Por Hacer',
        position: 1,
      },
      {
        title: 'Configurar notificaciones',
        description: 'Mostrar toast notifications para eventos en tiempo real',
        column: 'Por Hacer',
        position: 2,
      },
      {
        title: 'Testing E2E',
        description: 'Escribir tests de integración para el flujo completo',
        column: 'Por Hacer',
        position: 3,
      },
    ];

    for (const taskData of sampleTasks) {
      const task = await tasksService.create(taskData);
      logger.log(`  ✅ Tarea creada: "${task.title}" (${task.column})`);
    }

    logger.log('🎉 Seed completado exitosamente');
    logger.log(`📊 Total: ${sampleTasks.length} tareas creadas`);

    await app.close();
  } catch (error) {
    logger.error('❌ Error durante el seed:', error.message);
    process.exit(1);
  }
}

seed();
