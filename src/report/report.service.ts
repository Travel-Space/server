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

  async getArticleReportDetails(articleId: number) {
    const article = await this.prisma.article.findUnique({
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

    if (!article) {
      throw new NotFoundException('해당 게시글을 찾을 수 없습니다.');
    }

    return {
      planetId: article.planetId,
      articleId: article.id,
      authorId: article.authorId,
      authorDetails: article.author,
    };
  }

  async getCommentReportDetails(commentId: number) {
    const comment = await this.prisma.comment.findUnique({
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

    if (!comment) {
      throw new NotFoundException('해당 댓글을 찾을 수 없습니다.');
    }

    return {
      articleId: comment.articleId,
      authorId: comment.authorId,
      authorDetails: comment.author,
    };
  }

  async findBasicReportDetails(reportId: number): Promise<Report> {
    const report = await this.prisma.report.findUnique({
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
