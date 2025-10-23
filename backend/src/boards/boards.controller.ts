import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { BoardsService } from './boards.service';
import { CreateBoardDto } from './dto/create-board.dto';
import { UpdateBoardDto } from './dto/update-board.dto';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { OptionalUser } from '../auth/decorators/optional-auth.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BoardAccessGuard } from './guards/board-access.guard';

@Controller('api/boards')
@UseGuards(OptionalJwtAuthGuard) // Auth opcional por defecto
export class BoardsController {
  constructor(private readonly boardsService: BoardsService) {}

  @Post()
  @UseGuards(JwtAuthGuard) // Requiere autenticación para crear tableros
  create(@Body() createBoardDto: CreateBoardDto, @Request() req) {
    return this.boardsService.create(createBoardDto, req.user.userId);
  }

  @Get()
  findAll(@OptionalUser() userId?: string) {
    return this.boardsService.findAll(userId);
  }

  @Get(':id')
  @UseGuards(BoardAccessGuard)
  findOne(@Param('id') id: string) {
    return this.boardsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(BoardAccessGuard)
  update(@Param('id') id: string, @Body() updateBoardDto: UpdateBoardDto) {
    return this.boardsService.update(id, updateBoardDto);
  }

  @Delete(':id')
  @UseGuards(BoardAccessGuard)
  remove(@Param('id') id: string) {
    return this.boardsService.remove(id);
  }

  @Post(':id/columns')
  @UseGuards(BoardAccessGuard)
  addColumn(@Param('id') id: string, @Body() body: { columnName: string }) {
    return this.boardsService.addColumn(id, body.columnName);
  }

  @Patch(':id/columns/rename')
  @UseGuards(BoardAccessGuard)
  renameColumn(
    @Param('id') id: string,
    @Body() body: { oldName: string; newName: string },
  ) {
    return this.boardsService.renameColumn(id, body.oldName, body.newName);
  }

  @Delete(':id/columns/:columnName')
  @UseGuards(BoardAccessGuard)
  deleteColumn(
    @Param('id') id: string,
    @Param('columnName') columnName: string,
  ) {
    return this.boardsService.deleteColumn(id, columnName);
  }

  @Post(':id/share')
  @UseGuards(JwtAuthGuard) // Requiere autenticación
  shareBoard(
    @Param('id') id: string,
    @Body() body: { targetUserId: string },
    @Request() req,
  ) {
    return this.boardsService.shareBoard(
      id,
      body.targetUserId,
      req.user.userId,
    );
  }

  @Post(':id/unshare')
  @UseGuards(JwtAuthGuard) // Requiere autenticación
  unshareBoard(
    @Param('id') id: string,
    @Body() body: { targetUserId: string },
    @Request() req,
  ) {
    return this.boardsService.unshareBoard(
      id,
      body.targetUserId,
      req.user.userId,
    );
  }

  @Post(':id/toggle-public')
  @UseGuards(JwtAuthGuard) // Requiere autenticación
  togglePublic(@Param('id') id: string, @Request() req) {
    return this.boardsService.togglePublic(id, req.user.userId);
  }
}
