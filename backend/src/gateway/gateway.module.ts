import { Module } from '@nestjs/common';
import { KanbanGateway } from './kanban.gateway';

@Module({
  providers: [KanbanGateway],
  exports: [KanbanGateway],
})
export class GatewayModule {}
