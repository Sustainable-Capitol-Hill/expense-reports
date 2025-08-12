"use server";
import "dotenv/config";

import dayjs from "dayjs";
import { JWT } from "google-auth-library";
import { GoogleSpreadsheet } from "google-spreadsheet";
import { google } from "googleapis";
import { humanId } from "human-id";
import * as nodemailer from "nodemailer";
import { Readable } from "stream";
import z from "zod";

import {
  BasicInfoValidator,
  ReimbursementMethodValidator,
} from "./forms/types";

const transport = nodemailer.createTransport({
  host: "smtp.mailgun.org",
  port: 587,
  auth: {
    user: process.env.MAILGUN_SMTP_USERNAME,
    pass: process.env.MAILGUN_SMTP_PASSWORD,
  },
});

const serviceAccountAuth = new JWT({
  email: process.env.GCLOUD_CLIENT_EMAIL,
  key: process.env.GCLOUD_PRIVATE_KEY,
  scopes: [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive",
  ],
  subject: process.env.GCLOUD_IMPERSONATE_EMAIL,
});

if (!process.env.GOOGLE_SPREADSHEET_ID) {
  throw new Error("Missing GOOGLE_SPREADSHEET_ID");
}

const folderId = process.env.GOOGLE_DRIVE_RECEIPTS_FOLDER_ID;
if (!folderId) {
  throw new Error("Missing GOOGLE_DRIVE_RECEIPTS_FOLDER_ID");
}

const doc = new GoogleSpreadsheet(
  process.env.GOOGLE_SPREADSHEET_ID,
  serviceAccountAuth
);

// Configure Google Drive API with the same service account
const drive = google.drive({ version: "v3", auth: serviceAccountAuth });

function formatReimbursementInfo(
  reimbursement: z.infer<typeof ReimbursementMethodValidator>
): Record<string, string> {
  if (reimbursement.reimbursementMethod === "paypal") {
    return {
      "PayPal Email": reimbursement.paypalEmail,
    };
  } else {
    return {
      "Check Address": reimbursement.checkAddress,
      "Check Phone": reimbursement.checkPhone,
    };
  }
}

function createSpreadsheetRow(
  basicInfo: z.infer<typeof BasicInfoValidator>,
  reimbursement: z.infer<typeof ReimbursementMethodValidator>
): Record<string, string> {
  const reimbursementInfo = formatReimbursementInfo(reimbursement);

  return {
    Name: basicInfo.name,
    Email: basicInfo.email,
    "Item Description": basicInfo.itemDescription,
    "Item Price": basicInfo.itemPrice.toString(),
    "Purchase Date": dayjs(basicInfo.purchaseDate).format("YYYY-MM-DD"),
    "Reimbursement Method": reimbursement.reimbursementMethod,
    ...reimbursementInfo,
  };
}

function generateUniqueFileIds(receipts: File[]) {
  return receipts.map((receipt) => ({
    id: humanId({
      separator: "-",
      capitalize: false,
    }),
    file: receipt,
  }));
}

async function uploadReceiptsToDrive(
  uniqueIdFiles: Array<{ id: string; file: File }>
): Promise<string[]> {
  const uploadResults = await Promise.all(
    uniqueIdFiles.map(async ({ id, file }) => {
      const fileExtension = file.name.split(".").pop();
      const fileMetadata = {
        name: `${id}.${fileExtension}`,
        parents: [folderId!],
      };
      const media = {
        mimeType: file.type,
        body: Readable.from(Buffer.from(await file.arrayBuffer())),
      };
      const response = await drive.files.create({
        requestBody: fileMetadata,
        media,
        supportsAllDrives: true,
        fields: "id",
      });
      return response.data.id!;
    })
  );

  // Generate Google Drive links from file IDs
  return uploadResults.map(
    (fileId) => `https://drive.google.com/file/d/${fileId}/view`
  );
}

async function sendConfirmationEmail(
  basicInfo: z.infer<typeof BasicInfoValidator>,
  row: Record<string, string>,
  uniqueIdFiles: Array<{ id: string; file: File }>
) {
  const emailBody = `Thanks for submitting your expense report!

${Object.entries(row)
  .map(([key, value]) => `${key}: ${value}`)
  .join("\n")}`;

  const attachments = await Promise.all(
    uniqueIdFiles.map(async (file) => ({
      filename: file.id + "." + file.file.name.split(".").pop(),
      content: Buffer.from(await file.file.arrayBuffer()),
    }))
  );

  await transport.sendMail({
    from: "expenses@sustainablecapitolhill.org",
    to: basicInfo.email, // TODO: add ccs
    subject: "Your Expense Report Submission",
    text: emailBody,
    attachments,
  });
}

export async function submitExpense(
  basicInfo: z.infer<typeof BasicInfoValidator>,
  reimbursement: z.infer<typeof ReimbursementMethodValidator>
) {
  // Load spreadsheet and get the first sheet
  await doc.loadInfo();
  const sheet = doc.sheetsByIndex[0];

  // Generate unique IDs for receipt files
  const uniqueIdFiles = generateUniqueFileIds(basicInfo.receipts);

  // Upload receipts to Google Drive and get links
  const receiptLinks = await uploadReceiptsToDrive(uniqueIdFiles);

  const row = createSpreadsheetRow(basicInfo, reimbursement);

  // Create row with receipt links and add to spreadsheet
  const rowWithLinks = {
    ...row,
    Files: receiptLinks.join(" "),
  };

  await sheet.addRow(rowWithLinks);

  // Send confirmation email (without receipt links)
  await sendConfirmationEmail(basicInfo, row, uniqueIdFiles);
}
