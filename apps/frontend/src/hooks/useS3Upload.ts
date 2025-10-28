import { useState, useCallback } from 'react';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5176';

export interface S3UploadProgress {
  fileName: string;
  progress: number; // 0-100
  status: 'idle' | 'requesting-url' | 'uploading' | 'completed' | 'error';
  error?: string;
}

export interface S3UploadResponse {
  s3Url: string;
  s3Key: string;
  s3Bucket: string;
}

/**
 * Hook for uploading files directly to S3 using pre-signed URLs
 * Flow:
 * 1. Request pre-signed URL from backend
 * 2. Upload file directly to S3 using the pre-signed URL
 * 3. Return the S3 URL for the uploaded file
 */
export const useS3Upload = () => {
  const [uploadProgress, setUploadProgress] = useState<S3UploadProgress>({
    fileName: '',
    progress: 0,
    status: 'idle',
  });

  const uploadFileToS3 = useCallback(
    async (file: File): Promise<S3UploadResponse | null> => {
      try {
        // Step 1: Request pre-signed URL from backend
        setUploadProgress({
          fileName: file.name,
          progress: 0,
          status: 'requesting-url',
        });

        const signedUrlResponse = await axios.post(
          `${API_BASE_URL}/api/ImageUpload/get-signed-url`,
          {
            fileName: file.name,
            contentType: file.type,
            fileSize: file.size,
          }
        );

        const { presignedUrl, s3Key, s3Bucket } = signedUrlResponse.data;

        // Step 2: Upload file directly to S3 using the pre-signed URL
        setUploadProgress({
          fileName: file.name,
          progress: 10,
          status: 'uploading',
        });

        await axios.put(presignedUrl, file, {
          headers: {
            'Content-Type': file.type,
          },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / (progressEvent.total || file.size)
            );
            setUploadProgress({
              fileName: file.name,
              progress: Math.min(percentCompleted, 99), // Cap at 99 until confirmed
              status: 'uploading',
            });
          },
        });

        // Step 3: Construct the S3 URL (S3 returns 200 on successful PUT)
        const s3Url = `https://${s3Bucket}.s3.ap-south-1.amazonaws.com/${s3Key}`;

        setUploadProgress({
          fileName: file.name,
          progress: 100,
          status: 'completed',
        });

        return {
          s3Url,
          s3Key,
          s3Bucket,
        };
      } catch (error) {
        let errorMessage = 'Upload failed';
        if (error instanceof Error) {
          errorMessage = error.message;
        } else if (axios.isAxiosError(error)) {
          errorMessage = error.response?.statusText || error.message || 'Upload failed';
          console.error('S3 upload error details:', {
            status: error.response?.status,
            data: error.response?.data,
            message: error.message,
          });
        }

        setUploadProgress({
          fileName: file.name,
          progress: 0,
          status: 'error',
          error: errorMessage,
        });

        console.error('S3 upload error:', error);
        return null;
      }
    },
    []
  );

  const uploadMultipleFiles = useCallback(
    async (files: File[]): Promise<S3UploadResponse[]> => {
      const uploadedUrls: S3UploadResponse[] = [];

      for (const file of files) {
        const result = await uploadFileToS3(file);
        if (result) {
          uploadedUrls.push(result);
        }
      }

      return uploadedUrls;
    },
    [uploadFileToS3]
  );

  const resetProgress = useCallback(() => {
    setUploadProgress({
      fileName: '',
      progress: 0,
      status: 'idle',
    });
  }, []);

  return {
    uploadFileToS3,
    uploadMultipleFiles,
    uploadProgress,
    resetProgress,
  };
};
