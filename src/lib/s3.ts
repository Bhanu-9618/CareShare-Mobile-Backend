import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3Client = new S3Client({ region: process.env.AWS_REGION || "ap-southeast-1" });
const BUCKET_NAME = process.env.IMAGES_BUCKET || "careshare-donation-images-dev";

export const getSignedUploadUrl = async (key: string) => {
    const command = new PutObjectCommand({ Bucket: BUCKET_NAME, Key: key });
    return await getSignedUrl(s3Client, command, { expiresIn: 300 });
};

export const getSignedDownloadUrl = async (key: string) => {
    const command = new GetObjectCommand({ Bucket: BUCKET_NAME, Key: key });
    return await getSignedUrl(s3Client, command, { expiresIn: 3600 });
};