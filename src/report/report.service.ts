import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Article, Planet, Report, ReportStatus, User } from '@prisma/client';
import { CreateReportDto, SearchReportsDto } from './dto';

type ReportDetails = Report & {
  reporter: User;
  article?: Article & { planet: Planet | null };
  comment?: Comment & { article: Article & { planet: Planet | null } };
};
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

  async getReportDetails(reportId: number): Promise<ReportDetails> {
    const report = await this.prisma.report.findUnique({
      where: { id: reportId },
      include: {
        reporter: true,
      },
    });

    if (!report) {
      throw new NotFoundException('신고를 찾을 수 없습니다.');
    }

    let article;
    let comment;

    // targetType에 따라 추가 정보를 쿼리합니다.
    if (report.targetType === 'ARTICLE') {
      article = await this.prisma.article.findUnique({
        where: { id: report.targetId },
        include: { planet: true },
      });
    } else if (report.targetType === 'COMMENT') {
      comment = await this.prisma.comment.findUnique({
        where: { id: report.targetId },
        include: {
          article: {
            include: {
              planet: true,
            },
          },
        },
      });
    }

    return {
      ...report,
      article: article || undefined,
      comment: comment || undefined,
    };
  }

  async approveReport(reportId: number, approvalReason: string) {
    const report = await this.prisma.report.update({
      where: { id: reportId },
      data: {
        status: ReportStatus.APPROVED,
        approvalReason: approvalReason,
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

  async createReport(userId: number, createReportDto: CreateReportDto) {
    const createdReport = await this.prisma.report.create({
      data: {
        reporterId: userId,
        reason: createReportDto.reason,
        targetId: createReportDto.targetId,
        targetType: createReportDto.targetType,
        imageUrl: createReportDto.imageUrl,
        status: 'RECEIVED',
      },
      include: {
        reporter: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    return createdReport;
  }
}
