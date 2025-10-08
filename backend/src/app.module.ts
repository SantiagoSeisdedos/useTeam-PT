import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TasksModule } from './tasks/tasks.module';
import { BoardsModule } from './boards/boards.module';
import { ExportModule } from './export/export.module';
import { GatewayModule } from './gateway/gateway.module';

@Module({
  imports: [
    // Configuración de variables de entorno
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Conexión a MongoDB
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
      }),
      inject: [ConfigService],
    }),

    // Módulos de la aplicación
    TasksModule,
    BoardsModule,
    ExportModule,
    GatewayModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
