import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import {
  TaskCreatedEvent,
  TaskUpdatedEvent,
  TaskDeletedEvent,
  TaskMovedEvent,
  ColumnAddedEvent,
  ColumnRenamedEvent,
  ColumnDeletedEvent,
} from './interfaces/socket-events.interface';

/**
 * WebSocket Gateway para colaboración en tiempo real
 * Maneja eventos de creación, actualización, eliminación y movimiento de tareas
 */
@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  },
})
export class KanbanGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger: Logger = new Logger('KanbanGateway');

  handleConnection(client: Socket) {
    this.logger.log(`Cliente conectado: ${client.id}`);

    // Obtener total de usuarios conectados
    const connectedUsers = this.server.sockets.sockets.size;
    this.logger.log(`Total usuarios conectados: ${connectedUsers}`);

    // Enviar al cliente recién conectado el total de usuarios
    client.emit('connected-users-count', {
      count: connectedUsers,
      timestamp: new Date().toISOString(),
    });

    // Notificar a TODOS los demás clientes que alguien se conectó
    client.broadcast.emit('user-connected', {
      userId: client.id,
      count: connectedUsers,
      timestamp: new Date().toISOString(),
    });
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Cliente desconectado: ${client.id}`);

    // Obtener total de usuarios conectados después de la desconexión
    const connectedUsers = this.server.sockets.sockets.size;
    this.logger.log(`Total usuarios conectados: ${connectedUsers}`);

    // Notificar a todos los clientes el nuevo total
    this.server.emit('user-disconnected', {
      userId: client.id,
      count: connectedUsers,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Evento cuando se crea una nueva tarea
   */
  @SubscribeMessage('task-created')
  handleTaskCreated(
    @MessageBody() data: TaskCreatedEvent,
    @ConnectedSocket() client: Socket,
  ) {
    this.logger.log(`Tarea creada por ${client.id}: ${data.task?.title}`);
    // Broadcast a todos los clientes excepto el que envió
    client.broadcast.emit('task-created', {
      task: data.task,
      userId: client.id,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Evento cuando se actualiza una tarea
   */
  @SubscribeMessage('task-updated')
  handleTaskUpdated(
    @MessageBody() data: TaskUpdatedEvent,
    @ConnectedSocket() client: Socket,
  ) {
    this.logger.log(`Tarea actualizada por ${client.id}: ${data.taskId}`);
    client.broadcast.emit('task-updated', {
      taskId: data.taskId,
      updates: data.updates,
      userId: client.id,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Evento cuando se elimina una tarea
   */
  @SubscribeMessage('task-deleted')
  handleTaskDeleted(
    @MessageBody() data: TaskDeletedEvent,
    @ConnectedSocket() client: Socket,
  ) {
    this.logger.log(`Tarea eliminada por ${client.id}: ${data.taskId}`);
    client.broadcast.emit('task-deleted', {
      taskId: data.taskId,
      userId: client.id,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Evento cuando se mueve una tarea (drag & drop)
   */
  @SubscribeMessage('task-moved')
  handleTaskMoved(
    @MessageBody() data: TaskMovedEvent,
    @ConnectedSocket() client: Socket,
  ) {
    this.logger.log(
      `Tarea movida por ${client.id}: ${data.taskId} → ${data.destinationColumn}`,
    );
    client.broadcast.emit('task-moved', {
      taskId: data.taskId,
      sourceColumn: data.sourceColumn,
      destinationColumn: data.destinationColumn,
      sourceIndex: data.sourceIndex,
      destinationIndex: data.destinationIndex,
      userId: client.id,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Evento cuando se agrega una nueva columna
   */
  @SubscribeMessage('column-added')
  handleColumnAdded(
    @MessageBody() data: ColumnAddedEvent,
    @ConnectedSocket() client: Socket,
  ) {
    this.logger.log(`Columna agregada por ${client.id}: ${data.columnName}`);
    client.broadcast.emit('column-added', {
      columnName: data.columnName,
      columns: data.columns,
      userId: client.id,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Evento cuando se renombra una columna
   */
  @SubscribeMessage('column-renamed')
  handleColumnRenamed(
    @MessageBody() data: ColumnRenamedEvent,
    @ConnectedSocket() client: Socket,
  ) {
    this.logger.log(
      `Columna renombrada por ${client.id}: "${data.oldName}" → "${data.newName}"`,
    );
    client.broadcast.emit('column-renamed', {
      oldName: data.oldName,
      newName: data.newName,
      columns: data.columns,
      userId: client.id,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Evento cuando se elimina una columna
   */
  @SubscribeMessage('column-deleted')
  handleColumnDeleted(
    @MessageBody() data: ColumnDeletedEvent,
    @ConnectedSocket() client: Socket,
  ) {
    this.logger.log(`Columna eliminada por ${client.id}: ${data.columnName}`);
    client.broadcast.emit('column-deleted', {
      columnName: data.columnName,
      columns: data.columns,
      userId: client.id,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Método helper para emitir eventos desde servicios
   */
  emitTaskChange(event: string, data: any) {
    this.server.emit(event, data);
  }
}
