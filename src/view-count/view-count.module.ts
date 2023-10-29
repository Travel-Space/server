import { Module } from '@nestjs/common';
import { ViewCountService } from './view-count.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  providers: [ViewCountService, PrismaService],
  exports: [ViewCountService],
})
export class ViewCountModule {}
