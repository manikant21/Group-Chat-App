import { Request, Response } from "express";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { s3, S3_BUCKET } from "../config/s3.config.js";
import {AWS_REGION} from "../config/server.config.js"


interface AuthenticatedRequest extends Request {
    user?: any
}



export const uploadFiles = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
      return res.status(400).json({ message: "No files uploaded" });
    }

    const uploadedFiles: any[] = [];

    for (const file of req.files as Express.Multer.File[]) {
      const key = `uploads/${Date.now()}-${file.originalname}`;

      // Upload to S3
      await s3.send(
        new PutObjectCommand({
          Bucket: S3_BUCKET,
          Key: key,
          Body: file.buffer,
          ContentType: file.mimetype
        })
      );

      const fileUrl = `https://${S3_BUCKET}.s3.${AWS_REGION}.amazonaws.com/${key}`;

      uploadedFiles.push({
        fileUrl,
        fileName: file.originalname,
        fileType: file.mimetype,
        size: file.size,
      });
    }

    return res.status(200).json({ attachments: uploadedFiles });
  } catch (err: any) {
    console.error("Upload error:", err);
    return res.status(500).json({ message: "Upload failed" });
  }
};
