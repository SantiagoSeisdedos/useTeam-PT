import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { BoardsService } from './boards.service';
import { CreateBoardDto } from './dto/create-board.dto';
import { UpdateBoardDto } from './dto/update-board.dto';

@Controller('api/boards')
export class BoardsController {
  constructor(private readonly boardsService: BoardsService) {}

  @Post()
  create(@Body() createBoardDto: CreateBoardDto) {
    return this.boardsService.create(createBoardDto);
  }

  @Get()
  findAll() {
    return this.boardsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.boardsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateBoardDto: UpdateBoardDto) {
    return this.boardsService.update(id, updateBoardDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.boardsService.remove(id);
  }

  @Post(':id/columns')
  addColumn(@Param('id') id: string, @Body() body: { columnName: string }) {
    return this.boardsService.addColumn(id, body.columnName);
  }

  @Patch(':id/columns/rename')
  renameColumn(
    @Param('id') id: string,
    @Body() body: { oldName: string; newName: string },
  ) {
    return this.boardsService.renameColumn(id, body.oldName, body.newName);
  }

  @Delete(':id/columns/:columnName')
  deleteColumn(
    @Param('id') id: string,
    @Param('columnName') columnName: string,
  ) {
    return this.boardsService.deleteColumn(id, columnName);
  }
}
