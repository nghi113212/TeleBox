import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import path from "path";
import crypto from "crypto";

const s3Client = new S3Client({
  region: process.env.BUCKET_REGION,
  credentials: {
    accessKeyId: process.env.ACCESS_KEY,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
  },
});

const ensureBucketConfig = () => {
  if (!process.env.BUCKET_NAME || !process.env.BUCKET_REGION) {
    throw new Error("S3 bucket configuration is missing (BUCKET_NAME/BUCKET_REGION)");
  }
};

const buildObjectUrl = (key) => {
  ensureBucketConfig();
  return `https://${process.env.BUCKET_NAME}.s3.${process.env.BUCKET_REGION}.amazonaws.com/${key}`;
};

const sanitizeFolder = (folder = "") => {
  if (!folder) return "";
  return folder.replace(/^\/+/, "").replace(/\/+$/, "");
};

const generateObjectKey = (originalName, { folder = "uploads" } = {}) => {
  const ext = path.extname(originalName || "").toLowerCase();
  const safeExt = ext && ext.length <= 10 ? ext : "";
  const unique = crypto.randomUUID();
  const sanitized = sanitizeFolder(folder);
  const prefix = sanitized ? `${sanitized}/` : "";
  return `${prefix}${unique}${safeExt}`;
};

export const uploadFile = async (file, { key, folder, acl } = {}) => {
  if (!file) throw new Error("File is required for upload");

  ensureBucketConfig();

  const objectKey = key || generateObjectKey(file.originalname, { folder });
  const params = {
    Bucket: process.env.BUCKET_NAME,
    Key: objectKey,
    Body: file.buffer,
    ContentType: file.mimetype,
  };

  // Only set ACL if explicitly provided (many buckets block public ACLs)
  if (acl) params.ACL = acl;

  const response = await s3Client.send(new PutObjectCommand(params));
  return { key: objectKey, url: buildObjectUrl(objectKey), response };
};

export const deleteFile = async (fileKey) => {
  const response = await s3Client.send(
    new DeleteObjectCommand({
      Bucket: process.env.BUCKET_NAME,
      Key: fileKey,
    })
  );
  return response;
};

export const getFile = async (fileKey) => {
  const response = await s3Client.send(
    new GetObjectCommand({
      Bucket: process.env.BUCKET_NAME,
      Key: fileKey,
    })
  );
  return response;
};
