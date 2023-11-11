import {
  Controller,
  Delete,
  Param,
  ParseIntPipe,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard, LoggedInGuard } from 'src/auth/guard';
import { NotificationService } from './notification.service';

@ApiTags('알림 API')
@Controller('notification')
export class NotificationController {
  constructor(private notificationService: NotificationService) {}
  @UseGuards(JwtAuthGuard, LoggedInGuard)
  @Delete(':notificationId')
  @ApiOperation({
    summary: '알림 삭제 API',
    description: '사용자가 특정 알림을 삭제합니다.',
  })
  @ApiParam({ name: 'notificationId', description: '삭제할 알림의 고유 ID' })
  async deleteNotification(
    @Param('notificationId', ParseIntPipe) notificationId: number,
    @Req() req: any,
  ): Promise<any> {
    await this.notificationService.deleteNotification(
      notificationId,
      req.user.userId,
    );
    return { message: '알림이 성공적으로 삭제되었습니다.' };
  }
}
