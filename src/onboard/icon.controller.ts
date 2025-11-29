import { Controller, Param, Sse } from '@nestjs/common';
import { IconService } from './icon.service';

@Controller('icon')
export class IconController {
  constructor(private readonly iconService: IconService) {}

  @Sse('progress/:iconId')
  iconProgress(@Param('iconId') iconId: string) {
    return this.iconService.getProgressStream(iconId);
  }
}
