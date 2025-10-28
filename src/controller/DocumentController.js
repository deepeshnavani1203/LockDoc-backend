// controllers/uploadDoc.js

const multer = require("multer");
const { v2: cloudinary } = require("cloudinary");
const supabase = require("../connection/connect");
const fs = require("fs");
require("dotenv").config();

// TEMPORARY storage before Cloudinary upload
const upload = multer({ dest: "uploads/" });

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

// Function to generate random text ID (e.g., DOC-8f3ab2x7)
function generateDocId() {
  const randomPart = Math.random().toString(36).substring(2, 10); // random 8 chars
  return `DOC-${randomPart}`;
}

const uploadDocument = async (req, res) => {
  try {
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const { originalname, mimetype, path } = file;

    // 🟩 Upload the file to Cloudinary
    const result = await cloudinary.uploader.upload(path, {
      resource_type: "auto", // supports PDF, DOCX, PNG, etc.
      folder: "documents",
    });

    // 🟩 Generate random doc_id
    const docId = generateDocId();

    // 🟩 Get the secure URL
    const cloudLink = result.secure_url;

    // 🟩 Store metadata in Supabase table
    const { error } = await supabase.from("documents").insert([
      {
        doc_id: docId,
        doc_name: originalname,
        doc_type: mimetype,
        doc_link: cloudLink,
      },
    ]);

    fs.unlinkSync(path);

    if (error) {
      console.error("Database error:", error);
      return res.status(500).json({ error: "Failed to insert into database" });
    }

    res.status(200).json({
      message: "Document uploaded successfully!",
      doc_id: docId,
      cloud_link: cloudLink,
    });
  } catch (err) {
    console.error("Upload Error:", err);
    res.status(500).json({ error: "File upload failed" });
  }
};

module.exports = { uploadDocument, upload };
