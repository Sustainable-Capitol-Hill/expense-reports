import { JWT } from "google-auth-library";
import { google } from "googleapis";
import * as nodemailer from "nodemailer";
import { z } from "zod";

const settingsSchema = z.object({
  GCLOUD_PRIVATE_KEY: z.string(),
  GCLOUD_CLIENT_EMAIL: z.email(),
  GCLOUD_IMPERSONATE_EMAIL: z.email(),
  GOOGLE_SPREADSHEET_ID: z.string(),
  MAILGUN_SMTP_USERNAME: z.string(),
  MAILGUN_SMTP_PASSWORD: z.string(),
  GOOGLE_DRIVE_RECEIPTS_FOLDER_ID: z.string(),
});

const settings = settingsSchema.parse(process.env);

const mailTransport = nodemailer.createTransport({
  host: "smtp.mailgun.org",
  port: 587,
  auth: {
    user: settings.MAILGUN_SMTP_USERNAME,
    pass: settings.MAILGUN_SMTP_PASSWORD,
  },
});

const googleSearchAccountAuth = new JWT({
  email: settings.GCLOUD_CLIENT_EMAIL,
  key: settings.GCLOUD_PRIVATE_KEY,
  scopes: [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive",
  ],
  subject: settings.GCLOUD_IMPERSONATE_EMAIL,
});

const gdriveClient = google.drive({
  version: "v3",
  auth: googleSearchAccountAuth,
});

export { gdriveClient, googleSearchAccountAuth, mailTransport };

export default settings;
