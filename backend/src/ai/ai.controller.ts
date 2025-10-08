import { Controller, Post, Body } from '@nestjs/common';
import { AiService } from './ai.service';
import { ImproveDescriptionDto } from './dto/improve-description.dto';

@Controller('api/ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('improve-description')
  async improveDescription(@Body() dto: ImproveDescriptionDto) {
    const improvedDescription = await this.aiService.improveDescription({
      currentDescription: dto.currentDescription,
      taskTitle: dto.taskTitle,
      mode: dto.mode,
      model: dto.model,
      contextTasks: dto.contextTasks,
    });

    return {
      success: true,
      original: dto.currentDescription,
      improved: improvedDescription,
      mode: dto.mode,
      model: dto.model || 'gpt-4o-mini',
    };
  }
}
