// controllers/DocumentController.js

const multer = require("multer");
const { v2: cloudinary } = require("cloudinary");
const supabase = require("../connection/connect");
const fs = require("fs");
require("dotenv").config();

const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand } = require("@aws-sdk/lib-dynamodb");

// Multer temp upload
const upload = multer({ dest: "uploads/" });

// Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

// AWS Clients
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    sessionToken: process.env.AWS_SESSION_TOKEN,
  },
});

const dynamoClient = new DynamoDBClient({
  region: process.env.AWS_REGION,
});
const dynamo = DynamoDBDocumentClient.from(dynamoClient);

// Generate ID
function generateDocId() {
  const random = Math.random().toString(36).substring(2, 10);
  return `DOC-${random}`;
}

const uploadDocument = async (req, res) => {
  try {
    const file = req.file;
    const userEmail = req.body.userEmail;

    if (!file) return res.status(400).json({ error: "No file uploaded" });

    const { originalname, mimetype, path } = file;
    const docId = generateDocId();

    // ✅ Upload to Cloudinary
    const cloudResult = await cloudinary.uploader.upload(path, {
      resource_type: "auto",
      folder: "documents",
    });

    const cloudLink = cloudResult.secure_url;

    // ✅ Upload to AWS S3
    const fileBuffer = fs.readFileSync(path);
    const s3Key = `documents/${Date.now()}_${originalname}`;

    await s3.send(
      new PutObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: s3Key,
        Body: fileBuffer,
        ContentType: mimetype,
      })
    );

    // ✅ Generate Signed URL for preview (1 hour)
    const signedUrl = await getSignedUrl(
      s3,
      new GetObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: s3Key,
      }),
      { expiresIn: 3600 }
    );

    // ✅ Insert into Supabase
    await supabase.from("documents").insert([
      {
        doc_id: docId,
        doc_name: originalname,
        doc_type: mimetype,
        doc_link: cloudLink,
        user_email: userEmail,
      },
    ]);

    // ✅ Insert into DynamoDB
    await dynamo.send(
      new PutCommand({
        TableName: process.env.AWS_DYNAMO_TABLE,
        Item: {
          "c-id": docId, // Partition key
          id: originalname, // Sort key
          type: mimetype,
          size: file.size,
          cloud_link: cloudLink,
          s3_link: signedUrl,
          uploaded_at: new Date().toISOString(),
          user_email: userEmail,
        },
      })
    );

    fs.unlinkSync(path);

    return res.json({
      message: "Upload success",
      doc_id: docId,
      cloud_link: cloudLink,
      s3_link: signedUrl,
    });
  } catch (err) {
    console.error("Upload Error:", err);
    return res.status(500).json({ error: "Upload failed" });
  }
};

module.exports = { uploadDocument, upload };
