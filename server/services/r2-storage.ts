import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const ACCOUNT_ID = process.env.CLOUDFLARE_R2_ACCOUNT_ID!;
const BUCKET = process.env.CLOUDFLARE_R2_BUCKET_NAME || "carenincidents";
const ENDPOINT = `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`;

function getClient(): S3Client {
  return new S3Client({
    region: "auto",
    endpoint: ENDPOINT,
    credentials: {
      accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!,
    },
  });
}

/** Generate a presigned URL for direct browser → R2 upload */
export async function getUploadUrl(key: string, contentType: string, expiresIn = 300): Promise<string> {
  const client = getClient();
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: contentType,
  });
  return getSignedUrl(client, command, { expiresIn });
}

/** Generate a presigned URL for secure playback/download */
export async function getDownloadUrl(key: string, expiresIn = 3600): Promise<string> {
  const client = getClient();
  const command = new GetObjectCommand({ Bucket: BUCKET, Key: key });
  return getSignedUrl(client, command, { expiresIn });
}

/** Delete a specific object */
export async function deleteObject(key: string): Promise<void> {
  const client = getClient();
  await client.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
}

/** List all chunks for a given incident */
export async function listIncidentChunks(incidentId: string): Promise<string[]> {
  const client = getClient();
  const result = await client.send(new ListObjectsV2Command({
    Bucket: BUCKET,
    Prefix: `incidents/${incidentId}/`,
  }));
  return (result.Contents || []).map(obj => obj.Key!).filter(Boolean);
}

/** Build the storage key for a chunk */
export function chunkKey(userId: string, incidentId: string, chunkIndex: number): string {
  return `incidents/${incidentId}/chunks/${String(chunkIndex).padStart(4, "0")}.webm`;
}

/** Build the storage key for incident metadata */
export function metaKey(userId: string, incidentId: string): string {
  return `incidents/${incidentId}/meta.json`;
}

/** Upload JSON metadata directly from server */
export async function uploadMetadata(key: string, data: object): Promise<void> {
  const client = getClient();
  await client.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: JSON.stringify(data),
    ContentType: "application/json",
  }));
}

export { BUCKET, ENDPOINT };
