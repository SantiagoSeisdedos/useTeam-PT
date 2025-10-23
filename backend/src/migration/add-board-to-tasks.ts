/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-floating-promises */

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { BoardsService } from '../boards/boards.service';
import { Logger } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Task } from '../schemas/task.schema';

/**
 * Script de migración para agregar boardId a tareas existentes
 * Ejecutar: npm run migrate
 */

async function migrate() {
  const logger = new Logger('Migration');

  try {
    logger.log('🔄 Iniciando migración: Agregando boardId a tareas...');

    const app = await NestFactory.createApplicationContext(AppModule);

    const boardsService = app.get(BoardsService);
    const taskModel = app.get(getModelToken(Task.name));

    // Contar tareas sin boardId
    const tasksWithoutBoard = await taskModel
      .find({ boardId: { $exists: false } })
      .countDocuments();

    if (tasksWithoutBoard === 0) {
      logger.log('✅ No hay tareas para migrar. Todas tienen boardId.');
      await app.close();
      process.exit(0);
      return;
    }

    logger.log(`📊 Tareas sin boardId encontradas: ${tasksWithoutBoard}`);

    // Obtener o crear el tablero por defecto
    const boards = await boardsService.findAll();
    let defaultBoard;

    if (boards.length === 0) {
      logger.log('📋 No hay boards. Creando board por defecto...');
      defaultBoard = await boardsService.create({
        name: 'Mi Tablero Kanban',
        columns: ['Por Hacer', 'En Progreso', 'Completado'],
      });
      logger.log(`✅ Board creado: "${defaultBoard.name}"`);
    } else {
      defaultBoard = boards[0];
      logger.log(
        `✅ Usando board existente: "${defaultBoard.name}" (${defaultBoard._id})`,
      );
    }

    // Migrar todas las tareas
    const result = await taskModel.updateMany(
      { boardId: { $exists: false } },
      { $set: { boardId: defaultBoard._id } },
    );

    logger.log(
      `✅ Migración completada: ${result.modifiedCount} tareas actualizadas`,
    );
    logger.log(
      `📊 Todas las tareas ahora están vinculadas al board: ${defaultBoard.name}`,
    );

    logger.log('🎉 Migración completada exitosamente');

    await app.close();
    process.exit(0);
  } catch (error) {
    logger.error('❌ Error durante la migración:', (error as Error).message);
    logger.error((error as Error).stack);
    process.exit(1);
  }
}

migrate();
