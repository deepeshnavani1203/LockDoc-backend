const express = require("express");
const router = express.Router();
const usercontroller = require("../controller/UserController");
const { uploadDocument, upload } = require("../controller/DocumentController");

router.post("/signup", usercontroller.signup);
router.post("/login", usercontroller.login);
router.post("/upload", upload.single("document"), uploadDocument);

module.exports = router;
