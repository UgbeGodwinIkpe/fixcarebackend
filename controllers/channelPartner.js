const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");
const auth = require("../middleware/auth");
const nodemailer = require("nodemailer");
const bcrypt = require('bcryptjs');
const express = require("express");
const ref = require("./ref");
const cookieParser = require("cookie-parser");
const smtpTransport = require("nodemailer-smtp-transport");
const User = require("../models/user");
const services_request = require("../models/services_request");
const referral = require("../models/referral");
const cloudinary = require("../config/cloudinary");
const upload = require("../middleware/formMulter");
const message = require("../models/message");

const app = express();

app.use(express.json());
app.use(cookieParser());
dotenv.config();
const { TOKEN_KEY, EMAIL_USERNAME, SMTP_EMAIL, SMTP_PASS, EMAIL_PASSWORD, EMAIL_HOST } = process.env;

let transporter = nodemailer.createTransport(smtpTransport({
    service: 'gmail',
    host: process.env.EMAIL_HOST,
    secure: false, // 465,
    port: 587,
    auth: {
        user: EMAIL_USERNAME,
        pass: EMAIL_PASSWORD
    }
}))

app.post("/register", async(req, res) => {
    try {
        const {
            region,
            country,
            password,
            emailAddress,
            firstname,
            middlename,
            lastname,
            premisesType,
            distanceFromCenter,
            contact,
            houseNumber,
            streetName,
            city,
            state,
            landmark,
            pincode,
            yearlyFee,
        } = req.body;
        console.log(req.body);

        if (!country ||
            !premisesType ||
            !emailAddress ||
            !firstname ||
            !lastname ||
            !password ||
            !distanceFromCenter ||
            !contact ||
            !city ||
            !state ||
            !pincode ||
            !yearlyFee
        ) {
            // return res
            //     .status(400)
            //     .json({ msg: "Please fill the form completely", status: false });
            // Create an error message 
            let errorMessage = JSON.stringify({
                "message": "Please fill the form completely.",
                "status": "error",
                "statusCode": 400,
            });

            // Sending the error message 
            return res.send(errorMessage);
        }

        const chkuser = await User.findOne({ emailAddress });
        if (chkuser) {
            // return res
            //     .status(400)
            //     .json({ msg: "Email already registered with us", status: false });
            // Create an error message 
            let errorMessage = JSON.stringify({
                "message": "Email already registered with us.",
                "status": "error",
                "statusCode": 409,
            });

            // Sending the error message 
            return res.send(errorMessage);
        }

        const refcode = await ref.gencode();

        const mailOptions = {
            from: EMAIL_USERNAME,
            to: emailAddress,
            subject: "Hello there",
            html: `<body>
            <body style="font-family: Arial, sans-serif margin: 0 padding: 0 background-color: #ffffb3">
            <table role="presentation" cellspacing="0" cellpadding="0"  width="600"
            style="margin: 0 auto background-color: #fff padding: 20px border-radius: 5px box-shadow: 0px 5px 15px rgba(0, 0, 0, 0.3)">
            <tr>
            <td>
            <h3 style="color: #0838bc font-size: 24px text-align: center margin-bottom: 10px">Welcome To FixTech Care</h3>
            <hr style="border: 1px solid #ccc margin: 20px 0">
            <h4 style="font-size: 20px color: #333">Your Referral ID has been activated now</h4>
            <p style="font-size: 16px color: #333 margin: 20px 0">[When you refer the client dont forget to mention your Referral ID while filling 
                the subscription form]
                </p>
                <p style="font-size: 16px color: #333">Here is your referral code ${refcode}</p>
                <div style="font-size: 16px color: #333 margin-top: 20px text-align: center">
                <h5>You can now <a href="https://fixcare-ten.vercel.app/login>Login here</a> or copy https://fixcare-ten.vercel.app/login to you browser to continue to your dashboard.</h5>
                <h5 style="font-size: 18px">Best Regards</h5>
                <h5 style="font-size: 18px">FixTech Care</h5> 
                </div>
                </td>
                </tr>
                </table>
                </body>
                </body>`,
        };
        // Encrypt the password and create a salt hash 
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = bcrypt.hashSync(password, salt);
        await transporter.sendMail(mailOptions);
        console.log("mail sent");

        const newUser = await User.create({
            region,
            country,
            password: hashedPassword,
            emailAddress,
            firstname,
            middlename,
            lastname,
            premisesType,
            distanceFromCenter,
            contact,
            houseNumber,
            streetName,
            city,
            state,
            landmark,
            zip: pincode,
            yearlyFee,
            refcount: 0,
            refid: refcode,
        });
        console.log(newUser);
        // res.status(200).json({
        //     status: true,
        //     msg: "User registered successfully check mail for further instruction and unique refer code!",
        // });
        // Generating the success message 
        let successMessage = JSON.stringify({
            "message": "User registered successfully check mail for further instruction and unique refer code!",
            "status": "success",
            "statusCode": 200
        });

        // Return the success message 
        return res.send(successMessage);
    } catch (error) {
        console.error("Error registering user:", error);
        // res.status(500).json({ status: false, msg: "Internal server error" });
        // Creating the error message 
        let errorMessage = JSON.stringify({
            "message": error.toString().trim(),
            "status": "error",
            "statusCode": 500,
        });

        // Sending back the error message 
        return res.send(errorMessage);
    }
});

app.post("/login", async(req, res) => {
    try {
        const { emailAddress, password } = req.body;
        if (!emailAddress || !password) {
            return res.json({
                msg: "Please fill the login details completely",
                status: false,
            });
        }

        const user = await User.findOne({ emailAddress: emailAddress });

        if (!user) {
            // Create the error message 
            let errorMessage = JSON.stringify({
                "message": "Invalid email or password",
                "status": "error",
                "statusCode": 401,
            });

            // Sending the error message 
            return res.send(errorMessage);
        }
        // Get the user password, and hash the password
        const hashedPassword = user.password;

        // checking if the password hashed value is correct 
        const isMatch = bcrypt.compareSync(password, hashedPassword);
        if (isMatch) {
            let rememberMe = true;
            const expiresIn = rememberMe ? "7d" : "2h";
            const token = jwt.sign({ id: user._id, refid: user.refid }, TOKEN_KEY, { expiresIn });
            return res
                .status(200)
                .cookie("jwt", token, {
                    httpOnly: false,
                    maxAge: expiresIn === "7d" ? 7 * 24 * 60 * 60 * 1000 : 2 * 60 * 60 * 1000,
                    secure: true,
                    sameSite: "None",
                })
                .cookie("refid", user.refid, {
                    maxAge: expiresIn === "7d" ? 7 * 24 * 60 * 60 * 1000 : 2 * 60 * 60 * 1000,
                    httpOnly: false,
                    // secure: false,
                    secure: true,
                    sameSite: "None",
                })
                .json({

                    "message": "Logged in successfully",
                    "status": "success",
                    "xAuthToken": token,
                    "statusCode": 200,
                    "refid": user.refid,
                    "username": user.firstname + ' ' + user.lastname
                });
        } else {
            // Create the error message 
            let errorMessage = JSON.stringify({
                "message": "Invalid email or password",
                "status": "error",
                "statusCode": 401,
            });

            // Sending the error message 
            return res.send(errorMessage);
        }
    } catch (err) {
        console.log(err);
        // res.status(500).json({ msg: "Server error", status: false });
        // Creating the error message 
        let errorMessage = JSON.stringify({
            "message": err.toString().trim(),
            "status": "error",
            "statusCode": 500
        })

        // Sending back the error message 
        return res.send(errorMessage);
    }
});
app.get("/logout", async(req, res) => {
    try {
        res.clearCookie("jwt");
        res.clearCookie("refid");
        return res.status(200).json({ msg: "User Logged out and session ended" });
    } catch (ex) {
        next(ex);
    }
});
app.get("/home", auth, (req, res) => {
    res.status(200).send("User Logged in and Session is Active");
});
app.get("/landing", (req, res) => {
    res.status(200).send("Landing Page");
});

app.post("/upload", auth, async(req, res) =>
    upload.single("image")(req, res, function(err) {
        if (err) {
            console.log(err);
            return res.status(400).send("Error occured while uploading");
        }
        cloudinary.uploader.upload(req.file.path, function(err, result) {
            if (err) {
                console.log(err);
                return res.status(500).send("Error occured with cloudinary");
            }
            return res
                .status(200)
                .json({ msg: "Uploaded successfully", imageUrl: result.url });
        });
    })
);

app.post("/icon", auth, async(req, res) => {
    try {
        const existing = await User.findOneAndUpdate({ refid: req.cookies.refid }, { icon: req.body.icon }, { new: true });
        return res.status(200).send("Updated Successfully");
    } catch (error) {
        return res.status(400).send("failed to update");
    }
});
// fetch user details controller
app.post("/user", auth, async(req, res) => {
    try {
        const { refid } = req.body;
        const user = await User.findOne({ refid: refid });
        return res.status(200).json(user);
    } catch (error) {
        return res.status(400).send("failed to fetch");
    }
});
// update user details controller
app.patch("/user", auth, async(req, res) => {
    try {
        const {
            refid,
            category,
            bname,
            email,
            fname,
            lname,
            contact,
            city,
            state,
            zip,
        } = req.body;
        const user = await User.findOneAndUpdate({ refid: refid }, {
            $set: {
                category,
                bname,
                email,
                fname,
                lname,
                contact,
                city,
                state,
                zip,
            },
        }, { new: true, runValidators: true });
        if (!user) {
            return res.status(404).send("User not found");
        }
        return res.status(200).json(user);
    } catch (error) {
        console.error(error);
        return res.status(400).send("Failed to update");
    }
});
// change user password controller
app.patch("/changeuserpassword", auth, async(req, res) => {
    try {
        const {
            refid,
            oldpass,
            newpass
        } = req.body;
        console.log(req.body)
            // if (!refid || oldpass === null || newpass === null || newpass == '') {
            //     return res.status(403).send("All fields required!");
            // }
        const salt = await bcrypt.genSalt(10);
        const hashedNPassword = bcrypt.hashSync(newpass, salt);
        const user = await User.findOneAndUpdate({ refid: refid }, {
            $set: {
                password: hashedNPassword
            },
        }, { new: true, runValidators: true });
        if (!user) {
            return res.status(404).send("Session expired!");
        }
        return res.status(200).json(user);
    } catch (error) {
        console.error(error);
        return res.status(400).send("Failed to change password");
    }
});
// change user password controller
app.patch("/editUser", auth, async(req, res) => {
    try {
        const {
            refid,
            // email,
            fname,
            lname,
            mname,
            address,
            phone,
            street,
            city,
            landmark
        } = req.body;
        console.log(req.body)
            // if (!refid || oldpass === null || newpass === null || newpass == '') {
            //     return res.status(403).send("All fields required!");
            // }
        const user = await User.findOneAndUpdate({ refid: refid }, {
            $set: {
                firstname: fname,
                lastname: lname,
                middlename: mname,
                houseNumber: address,
                contact: phone,
                streetName: street,
                city: city,
                landmark: landmark
            },
        }, { new: true, runValidators: true });
        if (!user) {
            return res.status(404).send("Session expired!");
        }
        return res.status(200).json(user);
    } catch (error) {
        console.error(error);
        return res.status(400).send("Failed to change details. Try again later.");
    }
});

app.post("/referral", auth, async(req, res) => {
    try {
        const { refid } = req.body;
        const chk = await referral.find({ refid: refid });
        if (chk.length == 0) return res.status(400).json({ msg: "No data found" });
        return res.status(200).json(chk);
    } catch (err) {
        console.log(err);
        res.status(500).json({ msg: "Can't find appropriate data", status: false });
    }
});
app.post("/commission", auth, async(req, res) => {
    try {
        const { refid } = req.body;
        const chk = await referral.find({ refid: refid });
        if (chk.length == 0) return res.status(400).json({ msg: "No data found" });
        return res.status(200).json(chk);
    } catch (err) {
        console.log(err);
        res.status(500).json({ msg: "Can't find appropriate data", status: false });
    }
});

app.post("/payout", auth, async(req, res) => {
    const {
        refid,
        paymenttype,
        accountName,
        accountNum,
        bankName,
        bankAddress,
        swiftCode,
        ifsc,
        mobileNum,
        address,
        paypalDetail,
        paymentLink,
    } = req.body;
    console.log(refid);
    try {
        const user = await User.findOneAndUpdate({ refid: refid }, {
            $set: {
                paymenttype: paymenttype,
                accountName: accountName,
                accountNum: accountNum,
                bankName: bankName,
                bankAddress: bankAddress,
                swiftCode: swiftCode,
                ifsc: ifsc,
                mobileNum: mobileNum,
                address: address,
                paypalDetail: paypalDetail,
                paymentLink: paymentLink,
            },
        }, { new: true, runValidators: true });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({
            message: "Error updating payment info",
            error: error.toString(),
        });
    }
});

app.get("/notify", auth, async(req, res) => {
    try {
        const refid = req.cookies.refid;
        const msg = await message.find({ refid });
        return res.status(200).json(msg);
    } catch (err) {
        console.log(err);
        res.status(500).json({ msg: "Can't find appropriate data", status: false });
    }
});

app.post("/mail", upload.single("file"), async(req, res) => {
    const { subject, type, description, email } = req.body;
    const file = req.file;
    if (!subject || !type || !description) {
        return res.status(403).json({ status: "error", message: "All fields are required!" });
    }
    let mailOptions = {
        from: SMTP_EMAIL,
        to: "cidusface@gmail.com",
        subject: subject,
        text: `Type: ${type}\nDescription: ${description}`,
        attachments: [{
            filename: file.originalname,
            path: file.path,
        }, ],
    };

    try {
        let info = await transporter.sendMail(mailOptions);
        console.log("Email sent: " + info.response);
        return res.status(200).json({
            status: "success",
            message: "Mail sent "
        });
    } catch (error) {
        console.log(error);
    }

});
app.post("/maintenance", upload.single("file"), async(req, res) => {
    const requestid = ref.gencode();
    const { serviceid, address, service, servicetype, customer, problem, timeslot, message, refid } = req.body;
    // const file = req.file;
    if (!service || !servicetype || !customer || !timeslot, !address) {
        return res.status(403).json({ status: "error", message: "All fields are required!" });
    }
    let mailOptions = {
        from: SMTP_EMAIL,
        to: "cidusface@gmail.com",
        subject: "Maintenace Request From: " + customer,
        text: `Hey,\n You have a new maintenance request to attend to.`
    };

    try {
        const newService = await services_request.create({
            address,
            requestid,
            customer,
            serviceid,
            service,
            servicetype,
            problem,
            timeslot,
            message,
            refid
        });
        console.log(newService);

        // Generating the success message 
        let successMessage = JSON.stringify({
            "message": "Ticket has been submitted!",
            "status": "success",
            "statusCode": 200
        });

        let info = await transporter.sendMail(mailOptions);
        console.log("Email sent: " + info.response);
        // Return the success message 
        return res.send(successMessage);
        // return res.status(200).json({
        //     status: "success",
        //     message: "Mail sent "
        // });
    } catch (error) {
        console.log(error);
        let errorMessage = JSON.stringify({
            "message": error.message,
            "status": "error",
            "statusCode": 501
        });
        return res.send(errorMessage);
    }

});

// payment module starts here
const { PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET, PORT = 8080 } = process.env;
const base = "https://api-m.sandbox.paypal.com";
// pay with paypal option controller
/**
 * Generate an OAuth 2.0 access token for authenticating with PayPal REST APIs.
 * @see https://developer.paypal.com/api/rest/authentication/
 */
const paymentNotification = async(subj, desc) => {
    try {
        let mailOptions = {
            from: SMTP_EMAIL,
            to: "cidusface@gmail.com",
            subject: subj,
            text: desc,
        };

        await transporter.sendMail(mailOptions);
        console.log("Payment notification has been sent to admin!")
            // res.status(200).json({ message: "Contact form submitted successfully" });
    } catch (err) {
        console.error("Error submitting contact formtification:", err);
        // res.status(500).json({
        //     error: "An error occurred while processing the contact form",
        // });
    }
};
const generateAccessToken = async() => {
    try {
        if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
            throw new Error("MISSING_API_CREDENTIALS");
        }
        const auth = Buffer.from(
            PAYPAL_CLIENT_ID + ":" + PAYPAL_CLIENT_SECRET,
        ).toString("base64");
        const response = await fetch(`${base}/v1/oauth2/token`, {
            method: "POST",
            body: "grant_type=client_credentials",
            headers: {
                Authorization: `Basic ${auth}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
        });

        const data = await response.json();
        return data.access_token;
    } catch (error) {
        console.error("Failed to generate Access Token:", error);
    }
};

/**
 * Create an order to start the transaction.
 * @see https://developer.paypal.com/docs/api/orders/v2/#orders_create
 */
const createOrder = async(cart) => {
    // use the cart information passed from the front-end to calculate the purchase unit details
    console.log(
        "shopping cart information passed from the frontend createOrder() callback:",
        cart,
    );

    const accessToken = await generateAccessToken();
    const url = `${base}/v2/checkout/orders`;
    const payload = {
        intent: "CAPTURE",
        purchase_units: [{
            amount: {
                currency_code: "USD",
                value: "100.00",
            },
        }, ],
    };

    const response = await fetch(url, {
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
            // Uncomment one of these to force an error for negative testing (in sandbox mode only). Documentation:
            // https://developer.paypal.com/tools/sandbox/negative-testing/request-headers/
            // "PayPal-Mock-Response": '{"mock_application_codes": "MISSING_REQUIRED_PARAMETER"}'
            // "PayPal-Mock-Response": '{"mock_application_codes": "PERMISSION_DENIED"}'
            // "PayPal-Mock-Response": '{"mock_application_codes": "INTERNAL_SERVER_ERROR"}'
        },
        method: "POST",
        body: JSON.stringify(payload),
    });

    return handleResponse(response);
};
/**
 * Capture payment for the created order to complete the transaction.
 * @see https://developer.paypal.com/docs/api/orders/v2/#orders_capture
 */
const captureOrder = async(orderID) => {
    const accessToken = await generateAccessToken();
    const url = `${base}/v2/checkout/orders/${orderID}/capture`;

    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
            // Uncomment one of these to force an error for negative testing (in sandbox mode only). Documentation:
            // https://developer.paypal.com/tools/sandbox/negative-testing/request-headers/
            // "PayPal-Mock-Response": '{"mock_application_codes": "INSTRUMENT_DECLINED"}'
            // "PayPal-Mock-Response": '{"mock_application_codes": "TRANSACTION_REFUSED"}'
            // "PayPal-Mock-Response": '{"mock_application_codes": "INTERNAL_SERVER_ERROR"}'
        },
    });

    return handleResponse(response);
};

async function handleResponse(response) {
    try {
        const jsonResponse = await response.json();
        let subj = "New Payment via Paypal",
            desc = "Hi Admin, this is to notifies you, there is a new initiated payment from our client. Kindly check to see if it was successfulled, and process the payment invoice for the client.";
        await paymentNotification(subj, desc)
        console.log("jsonResponse: ", jsonResponse)
        return {
            jsonResponse,
            statusCode: response.status,
        };
    } catch (err) {
        const errorMessage = await response.text();
        throw new Error(errorMessage);
    }
}

app.post("/createPaypalOrder", async(req, res, next) => {
    try {
        // use the cart information passed from the front-end to calculate the order amount detals
        const { cart } = req.body;
        let orderId = cart[0].id;
        console.log("ID: ", orderId);
        const { jsonResponse, statusCode } = await createOrder(orderId);
        res.status(statusCode).json(jsonResponse);
    } catch (error) {
        console.error("Failed to create order:", error);
        res.status(500).json({ error: "Failed to create order." });
    }
});
app.post("/confirmPaypalOrder", async(req, res) => {
        try {
            const { orderId } = req.body;
            const { jsonResponse, httpStatusCode } = await captureOrder(orderId);
            res.status(httpStatusCode).json(jsonResponse);
        } catch (error) {
            console.error("Failed to create order:", error);
            res.status(500).json({ error: "Failed to capture order." });
        }
    })
    //pay with stripe option controller
app.post("/payWithStripe", async(req, res, next) => {
    try {
        const { subject, queryType, name, email, city, contact, description } =
        req.body;
        let mailOptions = {
            from: SMTP_EMAIL,
            to: "info@fixtechcare.com",
            subject: `${subject} - ${queryType}`,
            text: `
          Name: ${name}
          Email: ${email}
          Subject: ${subject}
          Query type: ${queryType}
          City: ${city}
          Contact: ${contact}
          Description: ${description}
        `,
        };

        await transporter.sendMail(mailOptions);
        res.status(200).json({ message: "Contact form submitted successfully" });
    } catch (err) {
        console.error("Error submitting contact form:", err);
        res.status(500).json({
            error: "An error occurred while processing the contact form",
        });
    }
})

module.exports = app;
module.exports = app;
module.exports = app;
module.exports = app;