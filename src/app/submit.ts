"use server";
import "dotenv/config";

import dayjs from "dayjs";
import { GoogleSpreadsheet } from "google-spreadsheet";
import { Readable } from "stream";
import z from "zod";

import {
  BasicInfoValidator,
  ReimbursementMethodValidator,
} from "./forms/types";
import settings, {
  gdriveClient,
  googleSearchAccountAuth,
  mailTransport,
} from "./settings";

const doc = new GoogleSpreadsheet(
  settings.GOOGLE_SPREADSHEET_ID,
  googleSearchAccountAuth
);

const accountNumberTitle = "Account Number";

function formatReimbursementInfo(
  reimbursement: z.infer<typeof ReimbursementMethodValidator>
): Record<string, string> {
  switch (reimbursement.reimbursementMethod) {
    case "paypal":
      return {
        "PayPal Email": reimbursement.paypalEmail,
      };
    case "check":
      return {
        "Check Address": reimbursement.checkAddress,
        "Check Phone": reimbursement.checkPhone,
      };
    case "direct_deposit":
      return {
        "Routing Number": reimbursement.routingNumber,
        [accountNumberTitle]: reimbursement.accountNumber,
      };
    case "already_known":
      return {};
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

function generateUniqueFileIds(receipts: File[], userName: string) {
  const submissionId: string = generateUniqueSubmissionId(userName);

  return receipts.map((receipt: File, i: number) => ({
    id: `${submissionId}_${i.toString()}`,
    file: receipt,
  }));
}

function generateUniqueSubmissionId(username: string): string {
  const cleanedName = username.replaceAll(/[^\w\d]/, "_");
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, "0");

  const year = now.getUTCFullYear();
  const month = pad(now.getUTCMonth() + 1); // months are 0-based
  const day = pad(now.getUTCDate());
  const hours = pad(now.getUTCHours());
  const minutes = pad(now.getUTCMinutes());
  const seconds = pad(now.getUTCSeconds());

  // username_YYYY-MM-DD_HH:MM:SS
  return `${cleanedName}_${year}-${month}-${day}_${hours}:${minutes}:${seconds}`;
}

async function uploadReceiptsToDrive(
  uniqueIdFiles: Array<{ id: string; file: File }>
): Promise<string[]> {
  const uploadResults = await Promise.all(
    uniqueIdFiles.map(async ({ id, file }) => {
      const fileExtension = file.name.split(".").pop();
      const fileMetadata = {
        name: `${id}.${fileExtension}`,
        parents: [settings.GOOGLE_DRIVE_RECEIPTS_FOLDER_ID],
      };
      const media = {
        mimeType: file.type,
        body: Readable.from(Buffer.from(await file.arrayBuffer())),
      };
      const response = await gdriveClient.files.create({
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
  .map(([key, value]) =>
    key === accountNumberTitle
      ? [key, `********${value.substring(value.length - 4, value.length)}`]
      : [key, value]
  )
  .map(([key, value]) => `${key}: ${value}`)
  .join("\n")}`;

  const attachments = await Promise.all(
    uniqueIdFiles.map(async (file) => ({
      filename: file.id + "." + file.file.name.split(".").pop(),
      content: Buffer.from(await file.file.arrayBuffer()),
    }))
  );

  await mailTransport.sendMail({
    from: "expense-reports@sustainablecapitolhill.org",
    to: basicInfo.email,
    cc: ["expense-reports@sustainablecapitolhill.org"],
    subject: "Your Expense Report Submission",
    text: emailBody,
    attachments,
  });
}

export async function submitExpense(
  basicInfo: z.infer<typeof BasicInfoValidator>,
  reimbursement: z.infer<typeof ReimbursementMethodValidator>
) {
  await BasicInfoValidator.parseAsync(basicInfo);
  await ReimbursementMethodValidator.parseAsync(reimbursement);

  // Load spreadsheet and get the first sheet
  await doc.loadInfo();
  const sheet = doc.sheetsByIndex[0];

  // Generate unique IDs for receipt files
  const uniqueIdFiles = generateUniqueFileIds(
    basicInfo.receipts,
    basicInfo.name
  );

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
