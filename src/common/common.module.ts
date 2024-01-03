import { Module } from '@nestjs/common';
import { UploadController } from './controller/upload.controller';

@Module({
  controllers: [UploadController],
})
export class CommonModule {}
