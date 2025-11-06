// src/connection/aws.js
const AWS = require("aws-sdk");
require("dotenv").config();

// ✅ COMPLETE + CORRECT for VocLabs temporary AWS credentials
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  sessionToken: process.env.AWS_SESSION_TOKEN,
  region: process.env.AWS_REGION,
});

const s3 = new AWS.S3();

module.exports = s3;
