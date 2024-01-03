import { Injectable } from '@nestjs/common';
import { CronJob } from 'cron';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UserSuspensionService {
  constructor(private prisma: PrismaService) {
    this.startSuspensionCheckJob();
  }

  startSuspensionCheckJob() {
    const job = new CronJob(
      '0 15 * * *',
      async () => {
        const now = new Date();
        const usersToUpdate = await this.prisma.user.findMany({
          where: {
            userSuspensionDate: {
              lt: now,
            },
            isSuspended: true,
          },
        });

        await Promise.all(
          usersToUpdate.map((user) =>
            this.prisma.user.update({
              where: { id: user.id },
              data: {
                isSuspended: false,
                suspensionReason: null,
              },
            }),
          ),
        );
      },
      null,
      true,
      'Asia/Seoul',
    );
    job.start();
  }
}
