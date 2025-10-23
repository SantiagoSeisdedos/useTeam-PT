import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BoardsService } from './boards.service';
import { BoardsController } from './boards.controller';
import { BoardsInitService } from './boards-init.service';
import { Board, BoardSchema } from '../schemas/board.schema';
import { Task, TaskSchema } from '../schemas/task.schema';
import { InvitationsModule } from '../invitations/invitations.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Board.name, schema: BoardSchema },
      { name: Task.name, schema: TaskSchema },
    ]),
    InvitationsModule,
  ],
  controllers: [BoardsController],
  providers: [BoardsService, BoardsInitService],
  exports: [BoardsService],
})
export class BoardsModule {}
