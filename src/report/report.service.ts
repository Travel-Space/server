import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Report, ReportStatus, User } from '@prisma/client';

@Injectable()
export class ReportService {
  constructor(private readonly prisma: PrismaService) {}

  async getAllReports() {
    const reports = await this.prisma.report.findMany({
      include: {
        reporter: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    return {
      totalCount: reports.length,
      reports,
    };
  }

  async getReportDetails(reportId: number) {
    const report = await this.prisma.report.findUnique({
      where: { id: reportId },
      include: {
        reporter: true,
      },
    });

    if (!report) {
      throw new NotFoundException('신고를 찾을 수 없습니다.');
    }

    return report;
  }

  async approveReport(reportId: number, approvalReason: string) {
    const report = await this.prisma.report.update({
      where: { id: reportId },
      data: {
        status: ReportStatus.APPROVED,
      },
    });
    await this.prisma.user.update({
      where: { id: report.targetId },
      data: {
        reportCount: {
          increment: 1,
        },
      },
    });

    return report;
  }

  async rejectReport(reportId: number) {
    const report = await this.prisma.report.update({
      where: { id: reportId },
      data: {
        status: ReportStatus.REJECTED,
      },
    });
    return report;
  }
}
