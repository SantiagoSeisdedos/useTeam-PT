import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { MoveTaskDto } from './dto/move-task.dto';
import { TaskAccessGuard } from './guards/task-access.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';

@Controller('api/tasks')
@UseGuards(OptionalJwtAuthGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  create(@Body() createTaskDto: CreateTaskDto) {
    return this.tasksService.create(createTaskDto);
  }

  @Get()
  findAll(
    @Query('boardId') boardId?: string,
    @Query('column') column?: string,
  ) {
    if (boardId) {
      return this.tasksService.findByBoard(boardId, column);
    }
    if (column) {
      return this.tasksService.findByColumn(column);
    }
    return this.tasksService.findAll();
  }

  @Get(':id')
  @UseGuards(TaskAccessGuard)
  findOne(@Param('id') id: string) {
    return this.tasksService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(TaskAccessGuard)
  update(@Param('id') id: string, @Body() updateTaskDto: UpdateTaskDto) {
    return this.tasksService.update(id, updateTaskDto);
  }

  @Delete(':id')
  @UseGuards(TaskAccessGuard)
  remove(@Param('id') id: string) {
    return this.tasksService.remove(id);
  }

  @Patch(':id/move')
  @UseGuards(TaskAccessGuard)
  moveTask(@Param('id') id: string, @Body() moveTaskDto: MoveTaskDto) {
    return this.tasksService.moveTask(id, moveTaskDto);
  }
}
