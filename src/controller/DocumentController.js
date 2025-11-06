// controllers/uploadDoc.js

const multer = require("multer");
const { v2: cloudinary } = require("cloudinary");
const supabase = require("../connection/connect");
const fs = require("fs");
require("dotenv").config();

// 🟩 AWS SDK imports
const AWS = require("aws-sdk");
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand } = require("@aws-sdk/lib-dynamodb");

// TEMP storage before Cloudinary + S3 upload
const upload = multer({ dest: "uploads/" });

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

// ✅ CLEANED S3 CONFIG (no duplicates)
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  sessionToken: process.env.AWS_SESSION_TOKEN, // ✅ Needed for VocLabs temporary credentials
  region: process.env.AWS_REGION,
});

const s3 = new AWS.S3();

// ✅ FIXED DYNAMODB — now includes sessionToken
const dynamoClient = new DynamoDBClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    sessionToken: process.env.AWS_SESSION_TOKEN, // ✅ CRITICAL FIX
  },
});

const dynamo = DynamoDBDocumentClient.from(dynamoClient);

// Function to generate random text ID (e.g., DOC-8f3ab2x7)
function generateDocId() {
  const randomPart = Math.random().toString(36).substring(2, 10);
  return `DOC-${randomPart}`;
}

const uploadDocument = async (req, res) => {
  try {
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const { originalname, mimetype, path } = file;

    // 🟩 Upload file to Cloudinary
    const cloudResult = await cloudinary.uploader.upload(path, {
      resource_type: "auto",
      folder: "documents",
    });

    // 🟩 Upload file to AWS S3
    const fileContent = fs.readFileSync(path);
    const s3Params = {
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: `documents/${Date.now()}_${originalname}`,
      Body: fileContent,
      ContentType: mimetype,
    };

    const s3Upload = await s3.upload(s3Params).promise();

    // 🟩 Generate random doc_id
    const docId = generateDocId();

    // 🟩 Get URLs
    const cloudLink = cloudResult.secure_url;
    const s3Link = s3Upload.Location;

    // 🟩 Store metadata in Supabase
    const { error } = await supabase.from("documents").insert([
      {
        doc_id: docId,
        doc_name: originalname,
        doc_type: mimetype,
        doc_link: cloudLink,
      },
    ]);

    if (error) {
      console.error("Supabase error:", error);
    }

    // ✅ Store metadata in DynamoDB
    const item = {
      "c-id": docId, // ✅ Partition Key
      id: docId, // ✅ Sort Key
      name: originalname,
      type: mimetype,
      size: file.size,
      cloud_link: cloudLink,
      s3_link: s3Link,
      uploaded_at: new Date().toISOString(),
    };

    const command = new PutCommand({
      TableName: process.env.AWS_DYNAMO_TABLE,
      Item: item,
    });

    await dynamo.send(command);
    console.log("✅ Saved metadata in DynamoDB");

    // Delete local temp file
    fs.unlinkSync(path);

    res.status(200).json({
      message: "Document uploaded successfully!",
      doc_id: docId,
      cloud_link: cloudLink,
      s3_link: s3Link,
    });
  } catch (err) {
    console.error("Upload Error:", err);
    res.status(500).json({ error: "File upload failed" });
  }
};

module.exports = { uploadDocument, upload };
