import {
  Controller,
  Post,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { S3 } from '@aws-sdk/client-s3';
import * as multerS3 from 'multer-s3';
import {
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

const s3 = new S3({
  region: process.env.AWS_S3_REGION,
  credentials: {
    accessKeyId: process.env.AWS_S3_KEY_ID,
    secretAccessKey: process.env.AWS_S3_ACCESS_KEY,
  },
});

@ApiTags('업로드 API')
@Controller('upload')
export class UploadController {
  @Post()
  @ApiOperation({
    summary: '이미지 업로드 API',
    description:
      '여러 이미지를 업로드하고, 업로드된 이미지의 URL들을 반환한다.',
  })
  @ApiResponse({
    status: 201,
    description: '이미지 업로드가 완료되었습니다.',
    type: String,
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
      },
    },
  })
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      storage: multerS3({
        s3: s3,
        bucket: process.env.AWS_S3_BUCKET_NAME,
        key: function (req, file, cb) {
          cb(null, `YOUR_IMAGE_KEY/${file.originalname}`);
        },
      }),
    }),
  )
  async uploadFile(@UploadedFiles() files) {
    const uploadResults = files.map((file) => file.location);
    return uploadResults;
  }
}
