import {AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION, AWS_S3_BUCKET} from "./server.config.js";
import { S3Client } from "@aws-sdk/client-s3";

export const S3_BUCKET = AWS_S3_BUCKET;

export const s3 = new S3Client({
  region: AWS_REGION,
  credentials: {
    accessKeyId: AWS_ACCESS_KEY_ID ,
    secretAccessKey: AWS_SECRET_ACCESS_KEY ,
  },
});
