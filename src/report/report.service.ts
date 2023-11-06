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
      include: {
        reporter: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    const totalCount = await this.prisma.report.count();

    return {
      totalCount,
      reports,
    };
  }

  async getReportDetails(reportId: number) {
    const basicReportDetails = await this.findBasicReportDetails(reportId);
    if (!basicReportDetails) {
      throw new NotFoundException('신고를 찾을 수 없습니다.');
    }

    const reporter = await this.getReporterDetails(
      basicReportDetails.reporterId,
    );
    if (!reporter) {
      throw new NotFoundException('신고자 정보를 찾을 수 없습니다.');
    }

    let targetDetails;
    if (basicReportDetails.targetType === 'ARTICLE') {
      targetDetails = await this.getArticleReportDetails(
        basicReportDetails.targetId,
      );
    } else if (basicReportDetails.targetType === 'COMMENT') {
      targetDetails = await this.getCommentReportDetails(
        basicReportDetails.targetId,
      );
    } else {
      throw new NotFoundException('알 수 없는 신고 타입입니다.');
    }

    return {
      reportDetails: {
        ...basicReportDetails,
        reporterName: reporter.name,
        reporterEmail: reporter.email,
      },
      targetDetails,
    };
  }

  async findBasicReportDetails(reportId: number): Promise<Report> {
    return this.prisma.report.findUnique({
      where: { id: reportId },
      select: {
        id: true,
        reason: true,
        approvalReason: true,
        reporterId: true,
        targetId: true,
        targetType: true,
        imageUrl: true,
        createdAt: true,
        deletedAt: true,
        status: true,
        processingDate: true,
      },
    });
  }

  async getReporterDetails(reporterId: number) {
    return this.prisma.user.findUnique({
      where: { id: reporterId },
      select: {
        name: true,
        email: true,
      },
    });
  }

  async getArticleReportDetails(articleId: number) {
    return this.prisma.article.findUnique({
      where: { id: articleId },
      include: {
        planet: true,
        author: {
          select: {
            nickName: true,
            email: true,
            reportCount: true,
          },
        },
      },
    });
  }

  async getCommentReportDetails(commentId: number) {
    return this.prisma.comment.findUnique({
      where: { id: commentId },
      include: {
        author: {
          select: {
            nickName: true,
            email: true,
            reportCount: true,
          },
        },
        article: true,
      },
    });
  }

  async approveReport(
    reportId: number,
    approvalReason: string,
    suspensionEndDate?: string, // Make it optional
  ) {
    let suspensionDate;
    if (suspensionEndDate) {
      suspensionDate = new Date(suspensionEndDate);
      if (isNaN(suspensionDate.getTime())) {
        throw new Error('Invalid suspensionEndDate provided');
      }
    }

    const now = new Date();

    const transaction = await this.prisma.$transaction(async (prisma) => {
      const report = await prisma.report.findUnique({
        where: { id: reportId },
      });

      if (!report) {
        throw new Error('Report not found');
      }

      await prisma.report.update({
        where: { id: reportId },
        data: {
          status: 'APPROVED',
          approvalReason: approvalReason,
          processingDate: now,
        },
      });

      let userIdToUpdate = null;

      if (report.targetType === 'ARTICLE') {
        const article = await prisma.article.findUnique({
          where: { id: report.targetId },
        });
        if (article && article.authorId) {
          userIdToUpdate = article.authorId;
        }
      } else if (report.targetType === 'COMMENT') {
        const comment = await prisma.comment.findUnique({
          where: { id: report.targetId },
        });
        if (comment && comment.authorId) {
          userIdToUpdate = comment.authorId;
        }
      } else if (report.targetType === 'USER') {
        userIdToUpdate = report.targetId;
      }

      if (userIdToUpdate) {
        const userDataToUpdate: any = {
          reportCount: {
            increment: 1,
          },
        };

        if (suspensionDate) {
          userDataToUpdate.userSuspensionDate = suspensionDate;
        }

        await prisma.user.update({
          where: { id: userIdToUpdate },
          data: userDataToUpdate,
        });
      }

      return report;
    });

    return transaction;
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
      include: {
        reporter: {
          select: {
            name: true,
            email: true,
          },
        },
      },
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
      reports: reports.map((report) => ({
        ...report,
        reporterName: report.reporter.name,
        reporterEmail: report.reporter.email,
      })),
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
