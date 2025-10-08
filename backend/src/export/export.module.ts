import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { MongooseModule } from '@nestjs/mongoose';
import { ExportService } from './export.service';
import { ExportController } from './export.controller';
import { Task, TaskSchema } from '../schemas/task.schema';

@Module({
  imports: [
    HttpModule,
    MongooseModule.forFeature([{ name: Task.name, schema: TaskSchema }]),
  ],
  controllers: [ExportController],
  providers: [ExportService],
})
export class ExportModule {}
