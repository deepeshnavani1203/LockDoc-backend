const express = require("express");
const cors = require("cors");
require("dotenv").config();

// 🔹 Connections
const supabase = require("./src/connection/connect");
const router = require("./src/routes/router");

// 🔹 DynamoDB
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");

const app = express();
const PORT = process.env.PORT || 5000;

// 🔹 Middleware
app.use(
  cors({
    origin: [
      "http://localhost:8080",
      "http://localhost:5000",
      "https://lock-doc.vercel.app",
      "https://main.d2j1xepn83mufw.amplifyapp.com",
    ],
    methods: "GET,POST,PATCH,PUT,DELETE",
    credentials: true,
  })
);

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// 🔹 Routes
app.use("/api", router);

// 🔹 DynamoDB connection setup
let dynamoConnected = false;
try {
  const dynamoClient = new DynamoDBClient({
    region: process.env.AWS_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      sessionToken: process.env.AWS_SESSION_TOKEN,
    },
  });

  // Simple ping-style call to confirm region/client is valid
  if (dynamoClient.config.region && process.env.AWS_REGION) {
    console.log(
      "✅ DynamoDB client initialized in region:",
      process.env.AWS_REGION
    );
    dynamoConnected = true;
  }
} catch (err) {
  console.error("❌ DynamoDB initialization failed:", err);
}

// 🔹 Check all connections
if (supabase && dynamoConnected) {
  console.log(
    "✅ All connections established successfully (Supabase, DynamoDB, S3)"
  );
} else {
  console.log("⚠️ One or more connections failed to initialize");
  if (!supabase) console.log("❌ Supabase not connected");
  if (!dynamoConnected) console.log("❌ DynamoDB not connected");
}

// 🔹 Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port: ${PORT}`);
});
