const express = require("express");
const router = express.Router();
const logout = require("../controllers/channelPartner");
const login = require("../controllers/channelPartner");
const upload = require("../controllers/channelPartner");
const referral = require("../controllers/channelPartner");
const commission = require("../controllers/channelPartner");
const notify = require("../controllers/channelPartner");
const user = require("../controllers/channelPartner");
const maintenance = require("../controllers/channelPartner");
const changeuserpassword = require("../controllers/channelPartner");
const payout = require("../controllers/channelPartner");
const icon = require("../controllers/channelPartner");
const register = require("../controllers/channelPartner");
const mail = require("../controllers/channelPartner");
const editUser = require("../controllers/channelPartner");
const landing = require("../controllers/channelPartner");
// payment options controllers
const createPaypalOrder = require("../controllers/channelPartner")
const confirmPaypalOrder = require("../controllers/channelPartner")
const payWithStripe = require("../controllers/channelPartner")
const sessionMiddleware = require("../middleware/session");

router.post("/register", sessionMiddleware, register);
router.post("/login", sessionMiddleware, login);
router.get("/logout", sessionMiddleware, logout);
router.post("/upload", sessionMiddleware, upload);
router.post("/referral", sessionMiddleware, referral);
router.post("/commission", sessionMiddleware, commission);
router.get("/notify", sessionMiddleware, notify);
router.post("/icon", sessionMiddleware, icon);
router.post("/payout", sessionMiddleware, payout);
router.post("/user", sessionMiddleware, user);
router.patch("/changeuserpassword", sessionMiddleware, changeuserpassword)
router.patch("/user", sessionMiddleware, user);
router.post("/mail", sessionMiddleware, mail);
router.post("/maintenance", sessionMiddleware, maintenance)
router.patch("/editUser", sessionMiddleware, editUser);
router.post("/createPaypalOrder", sessionMiddleware, createPaypalOrder);
router.post("/confirmPaypalOrder", sessionMiddleware, confirmPaypalOrder)
router.post("/payment-stripe", sessionMiddleware, payWithStripe)
router.get("/landing", landing)
module.exports = router;