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
router.get("/landing", (req, res) => {
    res.send("Welcome to Fixtech care")
});
module.exports = router;