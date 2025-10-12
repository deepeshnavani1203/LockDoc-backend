const express = require("express");
const supabase = require("./src/connection/connect");
const router = require("./src/routes/router");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin: ["http://localhost:8080", "http://localhost:5000"],
    methods: "GET,POST,PATCH,PUT,DELETE",
    credentials: true,
  })
);

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.use("/api", router);

if (supabase) {
  console.log("Connection is created");
} else {
  console.log("Error in supabase");
}

app.listen(PORT, () => {
  console.log(`Server running on port: ${PORT}`);
});
