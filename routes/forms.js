const express = require("express");
const router = express.Router();

const upload = require("../middleware/formMulter");
const formController = require("../controllers/formController");

router.post("/career", upload.single("resume"), formController.postCareerForm);

router.post(
  "/enterprise-subscription",
  formController.postEnterpriseSubscriptionForm
);

router.post("/contact-us", formController.postContactUs);

module.exports = router;
