import * as AWS from 'aws-sdk';
import { ConfigService } from '@nestjs/config';

export const getS3Config = (configService: ConfigService) => {
  AWS.config.update({
    accessKeyId: configService.get('AWS_ACCESS_KEY_ID'),
    secretAccessKey: configService.get('AWS_SECRET_ACCESS_KEY'),
    region: configService.get('AWS_REGION'),
  });

  return new AWS.S3();
};
