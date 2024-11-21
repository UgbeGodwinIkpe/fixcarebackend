const nodemailer = require("nodemailer");

const { SMTP_EMAIL, SMTP_PASS } = process.env;

let transporter = nodemailer.createTransport({
  host: "fixtechcare.com",
  port: 465,
  secure: true,
  auth: {
    user: SMTP_EMAIL,
    pass: SMTP_PASS,
  },
});

// to submit career form and send the details via mail
exports.postCareerForm = async (req, res, next) => {
  try {
    const {
      name,
      gender,
      dob,
      email,
      contact,
      ctc,
      experience,
      country,
      province,
      city,
      positionExperience,
      position,
      positionType,
    } = req.body;

    // console.log(req.body);

    const file = req.file;

    let mailOptions = {
      from: SMTP_EMAIL,
      to: "career@fixtechcare.com",
      subject: "New Career Form Submission",
      text: `
        Name: ${name}
        Gender: ${gender}
        Date of Birth: ${dob}
        Email: ${email}
        Contact: ${contact}
        CTC: ${ctc}
        Experience: ${experience}
        Country: ${country}
        Province: ${province}
        City: ${city}
        Position Experience: ${positionExperience}
        Position: ${position}
        Position Type: ${positionType}
      `,
      attachments: [
        {
          filename: file.originalname,
          content: file.buffer,
        },
      ],
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: "Form submitted successfully" });
  } catch (err) {
    console.error("Error submitting form:", err);
    res
      .status(500)
      .json({ error: "An error occurred while processing the form", err: err });
  }
};

// to send the subscription form via mail for the enterprise version
exports.postEnterpriseSubscriptionForm = async (req, res, next) => {
  try {
    const {
      country,
      password,
      email,
      firstName,
      middleName,
      lastName,
      contact,
      address,
      propertyNo,
      streetName,
      city,
      state,
      landmark,
      zipCode,
      businessName,
      categoryType,
      activationDate,
      solution,
      timings,
      referralCode,
    } = req.body;

    let mailOptions = {
      from: SMTP_EMAIL,
      to: "corporatesales@fixtechcare.com",
      subject: "New Subscription Form Submission",
      text: `
        Country: ${country}
        Password: ${password}
        Email: ${email}
        First Name: ${firstName}
        Middle Name: ${middleName}
        Last Name: ${lastName}
        Contact: ${contact}
        Address: ${address}
        Property No: ${propertyNo}
        Street Name: ${streetName}
        City: ${city}
        State: ${state}
        Landmark: ${landmark}
        Zip Code: ${zipCode}
        Business Name: ${businessName}
        Category Type: ${categoryType}
        Activation Date: ${activationDate}
        Solution: ${JSON.stringify(solution)}
        Timings: ${timings}
        Referral Code: ${referralCode}
      `,
    };

    await transporter.sendMail(mailOptions);

    res
      .status(200)
      .json({ message: "Subscription form submitted successfully" });
  } catch (err) {
    console.error("Error submitting subscription form:", err);
    res.status(500).json({
      error: "An error occurred while processing the subscription form",
    });
  }
};

exports.postContactUs = async (req, res, next) => {
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
};
