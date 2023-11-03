import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  NotFoundException,
  HttpCode,
  UseGuards,
  Patch,
  Query,
  DefaultValuePipe,
  ParseIntPipe,
  Req,
} from '@nestjs/common';
import { ReportService } from './report.service';
import { ApproveReportDto, CreateReportDto, SearchReportsDto } from './dto';
import { ApiOperation, ApiResponse, ApiTags, ApiQuery } from '@nestjs/swagger';
import { AdminGuard, JwtAuthGuard, LoggedInGuard } from 'src/auth/guard';
import { ReportStatus } from '@prisma/client';

@ApiTags('신고 관리')
@Controller('reports')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get()
  @ApiOperation({ summary: '전체 신고 목록 가져오기' })
  @ApiResponse({ status: 200, description: '전체 신고 목록' })
  async getAllReports(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('pageSize', new DefaultValuePipe(10), ParseIntPipe) pageSize: number,
  ) {
    return await this.reportService.getAllReports({ page, pageSize });
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get('search')
  @ApiOperation({ summary: '신고 검색 및 필터링' })
  @ApiQuery({ name: 'name', required: false, description: '신고자의 이름' })
  @ApiQuery({ name: 'email', required: false, description: '신고자의 이메일' })
  @ApiQuery({
    name: 'status',
    required: false,
    description: '신고의 상태',
    enum: ReportStatus,
  })
  @ApiQuery({ name: 'page', required: false, description: '페이지 번호' })
  @ApiQuery({
    name: 'pageSize',
    required: false,
    description: '페이지당 항목 수',
  })
  @ApiResponse({ status: 200, description: '필터링된 신고 목록' })
  async searchReports(@Query() searchDto: SearchReportsDto) {
    return await this.reportService.searchReports(searchDto);
  }

  @Get(':reportId')
  @ApiOperation({ summary: '특정 신고 상세 정보 가져오기' })
  @ApiResponse({ status: 200, description: '신고 상세 정보' })
  async getReportDetails(@Param('reportId') reportId: number) {
    return this.reportService.getReportDetails(reportId);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Patch(':reportId/approve')
  @HttpCode(200)
  @ApiOperation({ summary: '신고 승인' })
  @ApiResponse({ status: 200, description: '신고 승인 성공' })
  async approveReport(
    @Param('reportId') reportId: number,
    @Body() approveReportDto: ApproveReportDto,
  ) {
    return await this.reportService.approveReport(
      reportId,
      approveReportDto.approvalReason,
    );
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Patch(':reportId/reject')
  @HttpCode(200)
  @ApiOperation({ summary: '신고 거절' })
  @ApiResponse({ status: 200, description: '신고 거절 성공' })
  async rejectReport(@Param('reportId') reportId: number) {
    return await this.reportService.rejectReport(reportId);
  }

  @UseGuards(JwtAuthGuard, LoggedInGuard)
  @Post()
  @ApiOperation({ summary: '신고 생성 API', description: '신고를 생성합니다.' })
  async createReport(
    @Req() req: any,
    @Body() createReportDto: CreateReportDto,
  ) {
    const userId = req.user.userId;
    return this.reportService.createReport(userId, createReportDto);
  }
}
