import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Task, TaskDocument } from '../schemas/task.schema';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { MoveTaskDto } from './dto/move-task.dto';

@Injectable()
export class TasksService {
  constructor(@InjectModel(Task.name) private taskModel: Model<TaskDocument>) {}

  async create(createTaskDto: CreateTaskDto): Promise<Task> {
    // Si no se especifica posición, obtener la última posición de la columna EN EL BOARD
    if (createTaskDto.position === undefined) {
      const tasksInColumn = await this.taskModel
        .find({
          column: createTaskDto.column,
          boardId: createTaskDto.boardId,
        })
        .sort({ position: -1 })
        .limit(1);

      createTaskDto.position =
        tasksInColumn.length > 0 ? tasksInColumn[0].position + 1 : 0;
    }

    const createdTask = new this.taskModel(createTaskDto);
    return createdTask.save();
  }

  async findAll(): Promise<Task[]> {
    return this.taskModel.find().sort({ column: 1, position: 1 }).exec();
  }

  async findByBoard(boardId: string, column?: string): Promise<Task[]> {
    const filter: { boardId: string; column?: string } = { boardId };
    if (column) {
      filter.column = column;
    }
    return this.taskModel.find(filter).sort({ position: 1 }).exec();
  }

  async findByColumn(column: string): Promise<Task[]> {
    return this.taskModel.find({ column }).sort({ position: 1 }).exec();
  }

  async findOne(id: string): Promise<Task> {
    const task = await this.taskModel.findById(id).exec();
    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }
    return task;
  }

  async update(id: string, updateTaskDto: UpdateTaskDto): Promise<Task> {
    const updatedTask = await this.taskModel
      .findByIdAndUpdate(id, updateTaskDto, { new: true })
      .exec();

    if (!updatedTask) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }
    return updatedTask;
  }

  async remove(id: string): Promise<Task> {
    const deletedTask = await this.taskModel.findByIdAndDelete(id).exec();
    if (!deletedTask) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }
    return deletedTask;
  }

  /**
   * Mueve una tarea entre columnas o dentro de la misma columna
   * Actualiza las posiciones de todas las tareas afectadas
   * Ahora considera el boardId para evitar conflictos entre tableros
   */
  async moveTask(id: string, moveTaskDto: MoveTaskDto): Promise<Task> {
    const { sourceColumn, destinationColumn, sourceIndex, destinationIndex } =
      moveTaskDto;

    // Obtener la tarea para saber su boardId
    const task = await this.findOne(id);
    const boardId = task.boardId;

    // Si se mueve dentro de la misma columna
    if (sourceColumn === destinationColumn) {
      // Obtener todas las tareas de la columna EN ESTE BOARD
      const tasksInColumn = await this.taskModel
        .find({ column: sourceColumn, boardId })
        .sort({ position: 1 })
        .exec();

      // Reordenar posiciones
      const reorderedTasks = tasksInColumn.filter((t) => String(t._id) !== id);
      const taskDoc = await this.taskModel.findById(id).exec();
      if (taskDoc) {
        reorderedTasks.splice(destinationIndex, 0, taskDoc);
      }

      // Actualizar posiciones
      await Promise.all(
        reorderedTasks.map((t, index) =>
          this.taskModel.findByIdAndUpdate(t._id, { position: index }).exec(),
        ),
      );
    } else {
      // Mover entre columnas diferentes (del mismo board)

      // Actualizar posiciones en la columna origen
      await this.taskModel.updateMany(
        { column: sourceColumn, boardId, position: { $gt: sourceIndex } },
        { $inc: { position: -1 } },
      );

      // Actualizar posiciones en la columna destino
      await this.taskModel.updateMany(
        {
          column: destinationColumn,
          boardId,
          position: { $gte: destinationIndex },
        },
        { $inc: { position: 1 } },
      );

      // Actualizar la tarea movida
      await this.taskModel.findByIdAndUpdate(id, {
        column: destinationColumn,
        position: destinationIndex,
      });
    }

    return this.findOne(id);
  }
}
