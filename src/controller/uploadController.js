const s3 = require('../connection/aws');
const db = require('../connection/db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Temporary upload destination
const upload = multer({ dest: 'uploads/' });

exports.uploadFile = [
  upload.single('file'),

  async (req, res) => {
    try {
      const file = req.file;
      const fileContent = fs.readFileSync(file.path);

      // Upload to S3
      const params = {
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: `uploads/${Date.now()}_${file.originalname}`,
        Body: fileContent,
        ContentType: file.mimetype,
      };

      const data = await s3.upload(params).promise();

      // Store metadata in RDS
      const { originalname, mimetype, size } = file;
      const s3Url = data.Location;

      const sql = `INSERT INTO documents (name, type, size, url) VALUES (?, ?, ?, ?)`;
      db.query(sql, [originalname, mimetype, size, s3Url], (err) => {
        if (err) {
          console.error('DB Insert Error:', err);
          return res.status(500).json({ message: 'DB insert failed' });
        }

        // Delete local file after upload
        fs.unlinkSync(file.path);

        res.status(200).json({
          message: 'File uploaded successfully',
          s3Url,
        });
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'File upload failed', error });
    }
  },
];
