import * as AWS from 'aws-sdk';

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_S3_KEY_ID,
  secretAccessKey: process.env.AWS_S3_ACCESS_KEY,
  region: process.env.AWS_S3_BUCKET_NAME,
});
export async function uploadImageToS3(image) {
  const params = {
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: `YOUR_IMAGE_KEY/${image.originalname}`,
    Body: image.buffer,
    ContentType: image.mimetype,
  };

  const uploadResult = await s3.upload(params).promise();

  return uploadResult.Location;
}
