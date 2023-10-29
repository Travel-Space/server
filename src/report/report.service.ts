import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Report, ReportStatus, User } from '@prisma/client';
import { SearchReportsDto } from './dto';

@Injectable()
export class ReportService {
  constructor(private readonly prisma: PrismaService) {}

  async getAllReports(paginationDto: { page: number; pageSize: number }) {
    const { page, pageSize } = paginationDto;
    const skip = (page - 1) * pageSize;
    const reports = await this.prisma.report.findMany({
      take: pageSize,
      skip: skip,
    });
    const totalCount = await this.prisma.report.count();

    return {
      totalCount,
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

  async searchReports(searchDto: SearchReportsDto) {
    const { name, email, status, page, pageSize } = searchDto;
    const reportsQuery = this.prisma.report.findMany({
      where: {
        reporter: {
          name: { contains: name },
          email: { equals: email },
        },
        status: status,
      },
      take: pageSize,
      skip: (page - 1) * pageSize,
    });

    const totalCount = await this.prisma.report.count({
      where: {
        reporter: {
          name: { contains: name },
          email: { equals: email },
        },
        status: status,
      },
    });

    const reports = await reportsQuery;

    return {
      totalCount,
      reports,
    };
  }
}
