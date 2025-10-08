import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Board, BoardDocument } from '../schemas/board.schema';
import { Task, TaskDocument } from '../schemas/task.schema';
import { CreateBoardDto } from './dto/create-board.dto';
import { UpdateBoardDto } from './dto/update-board.dto';

@Injectable()
export class BoardsService {
  constructor(
    @InjectModel(Board.name) private boardModel: Model<BoardDocument>,
    @InjectModel(Task.name) private taskModel: Model<TaskDocument>,
  ) {}

  async create(createBoardDto: CreateBoardDto): Promise<Board> {
    const createdBoard = new this.boardModel(createBoardDto);
    return createdBoard.save();
  }

  async findAll(): Promise<Board[]> {
    return this.boardModel.find().exec();
  }

  async findOne(id: string): Promise<Board> {
    const board = await this.boardModel.findById(id).exec();
    if (!board) {
      throw new NotFoundException(`Board with ID ${id} not found`);
    }
    return board;
  }

  async update(id: string, updateBoardDto: UpdateBoardDto): Promise<Board> {
    const updatedBoard = await this.boardModel
      .findByIdAndUpdate(id, updateBoardDto, { new: true })
      .exec();

    if (!updatedBoard) {
      throw new NotFoundException(`Board with ID ${id} not found`);
    }
    return updatedBoard;
  }

  async remove(id: string): Promise<Board> {
    const deletedBoard = await this.boardModel.findByIdAndDelete(id).exec();
    if (!deletedBoard) {
      throw new NotFoundException(`Board with ID ${id} not found`);
    }
    return deletedBoard;
  }

  async addColumn(id: string, columnName: string): Promise<Board> {
    const board = await this.boardModel.findById(id).exec();
    if (!board) {
      throw new NotFoundException(`Board with ID ${id} not found`);
    }

    // Verificar que la columna no exista ya
    if (board.columns.includes(columnName)) {
      throw new Error(`Column "${columnName}" already exists`);
    }

    board.columns.push(columnName);
    return board.save();
  }

  async renameColumn(
    id: string,
    oldName: string,
    newName: string,
  ): Promise<Board> {
    const board = await this.boardModel.findById(id).exec();
    if (!board) {
      throw new NotFoundException(`Board with ID ${id} not found`);
    }

    const columnIndex = board.columns.indexOf(oldName);
    if (columnIndex === -1) {
      throw new NotFoundException(`Column "${oldName}" not found`);
    }

    // Verificar que el nuevo nombre no exista ya
    if (board.columns.includes(newName)) {
      throw new Error(`Column "${newName}" already exists`);
    }

    board.columns[columnIndex] = newName;

    // Actualizar todas las tareas que están en la columna antigua
    await this.taskModel
      .updateMany({ column: oldName }, { $set: { column: newName } })
      .exec();

    return board.save();
  }

  async deleteColumn(id: string, columnName: string): Promise<Board> {
    const board = await this.boardModel.findById(id).exec();
    if (!board) {
      throw new NotFoundException(`Board with ID ${id} not found`);
    }

    const columnIndex = board.columns.indexOf(columnName);
    if (columnIndex === -1) {
      throw new NotFoundException(`Column "${columnName}" not found`);
    }

    board.columns.splice(columnIndex, 1);

    // Eliminar todas las tareas que están en esta columna
    await this.taskModel.deleteMany({ column: columnName }).exec();

    return board.save();
  }
}
