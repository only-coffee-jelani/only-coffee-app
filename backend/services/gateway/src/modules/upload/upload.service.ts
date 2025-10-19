import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';

@Injectable()
export class UploadService {
  private s3Client: S3Client;
  private bucketName: string;

  constructor(private configService: ConfigService) {
    this.bucketName = this.configService.get<string>('AWS_S3_BUCKET') || 'only-coffee-assets';

    this.s3Client = new S3Client({
      region: this.configService.get<string>('AWS_REGION') || 'us-east-1',
      credentials: {
        accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID') || '',
        secretAccessKey: this.configService.get<string>('AWS_SECRET_ACCESS_KEY') || '',
      },
    });
  }

  async uploadImage(
    file: Express.Multer.File,
    folder: string,
  ): Promise<string> {
    try {
      // Generate unique filename
      const fileExtension = file.originalname.split('.').pop();
      const fileName = `${folder}/${uuidv4()}.${fileExtension}`;

      // Optimize image using sharp
      let processedBuffer: Buffer;

      if (folder === 'menu-items') {
        // Menu items: resize to 800x800, optimize quality
        processedBuffer = await sharp(file.buffer)
          .resize(800, 800, {
            fit: 'cover',
            position: 'center',
          })
          .webp({ quality: 85 })
          .toBuffer();
      } else if (folder === 'stores') {
        // Store images: resize to 1200x800, optimize quality
        processedBuffer = await sharp(file.buffer)
          .resize(1200, 800, {
            fit: 'cover',
            position: 'center',
          })
          .webp({ quality: 90 })
          .toBuffer();
      } else if (folder === 'profiles') {
        // Profile images: resize to 400x400, circular crop
        processedBuffer = await sharp(file.buffer)
          .resize(400, 400, {
            fit: 'cover',
            position: 'center',
          })
          .webp({ quality: 80 })
          .toBuffer();
      } else {
        // Default processing
        processedBuffer = await sharp(file.buffer)
          .webp({ quality: 85 })
          .toBuffer();
      }

      // Upload to S3
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: fileName,
        Body: processedBuffer,
        ContentType: 'image/webp',
        CacheControl: 'max-age=31536000', // 1 year
      });

      await this.s3Client.send(command);

      // Return public URL
      const region = this.configService.get<string>('AWS_REGION') || 'us-east-1';
      return `https://${this.bucketName}.s3.${region}.amazonaws.com/${fileName}`;
    } catch (error) {
      console.error('Error uploading image to S3:', error);
      throw new InternalServerErrorException('Failed to upload image');
    }
  }

  async deleteImage(imageUrl: string): Promise<void> {
    try {
      // Extract key from URL
      const url = new URL(imageUrl);
      const key = url.pathname.substring(1); // Remove leading slash

      const { DeleteObjectCommand } = await import('@aws-sdk/client-s3');
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      await this.s3Client.send(command);
    } catch (error) {
      console.error('Error deleting image from S3:', error);
      throw new InternalServerErrorException('Failed to delete image');
    }
  }
}
