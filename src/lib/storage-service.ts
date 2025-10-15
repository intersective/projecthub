/**
 * Storage Service
 * 
 * Provides a unified interface for file storage that works across different hosting environments.
 * Currently supports local filesystem storage (for development and self-hosted deployments).
 * Can be extended to support cloud storage providers (S3, Azure Blob, etc.) in the future.
 */

import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

export interface UploadResult {
  url: string;
  filename: string;
  storage: 'local' | 's3' | 'azure' | 'vercel';
}

export class StorageService {
  private uploadDir: string;
  private publicPath: string;

  constructor() {
    // Use public/uploads for local filesystem storage
    this.uploadDir = join(process.cwd(), 'public', 'uploads');
    this.publicPath = '/uploads';
  }

  /**
   * Upload a file to storage
   * @param file - File to upload
   * @param path - Storage path (e.g., 'applications/userId/filename')
   * @returns Upload result with URL and metadata
   */
  async uploadFile(file: File, path: string): Promise<UploadResult> {
    // For now, use local filesystem storage
    // This works in development and on AWS instances with persistent storage
    return this.uploadToLocalFileSystem(file, path);
  }

  /**
   * Upload to local filesystem
   * Works in development and on self-hosted servers (AWS EC2, etc.)
   */
  private async uploadToLocalFileSystem(file: File, path: string): Promise<UploadResult> {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create directory structure
    const fullPath = join(this.uploadDir, path);
    const dir = join(fullPath, '..');
    await mkdir(dir, { recursive: true });

    // Write file
    await writeFile(fullPath, buffer);

    // Return public URL
    const publicUrl = `${this.publicPath}/${path}`;

    return {
      url: publicUrl,
      filename: path,
      storage: 'local'
    };
  }

  /**
   * Future: Upload to AWS S3
   * Uncomment and implement when migrating to AWS
   */
  // private async uploadToS3(file: File, path: string): Promise<UploadResult> {
  //   const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');
  //   
  //   const s3 = new S3Client({
  //     region: process.env.AWS_REGION!,
  //     credentials: {
  //       accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
  //       secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  //     }
  //   });
  //
  //   const bytes = await file.arrayBuffer();
  //   const buffer = Buffer.from(bytes);
  //
  //   await s3.send(new PutObjectCommand({
  //     Bucket: process.env.AWS_S3_BUCKET!,
  //     Key: path,
  //     Body: buffer,
  //     ContentType: file.type,
  //   }));
  //
  //   const url = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${path}`;
  //
  //   return {
  //     url,
  //     filename: path,
  //     storage: 's3'
  //   };
  // }
}

// Export singleton instance
export const storageService = new StorageService();
