import z from "zod";

export const BasicInfoValidator = z.object({
  name: z.string("Name is required").min(2).max(100),
  email: z.email("A valid email is required"),
  phone: z.string("Phone number is required"),
  itemDescription: z.string("Item description is required").min(2).max(500),
  itemPrice: z.number("Item price is required").min(1),
  purchaseDate: z.date("Purchase date is required"),
  receipts: z
    .array(
      z
        .file()
        .mime(["image/jpeg", "image/png", "image/gif", "application/pdf"]),
      "At least one receipt is required"
    )
    .min(1, "At least one receipt is required"),
});

export const ReimbursementMethodValidator = z.discriminatedUnion(
  "reimbursementMethod",
  [
    z.object({
      reimbursementMethod: z.literal("paypal"),
      paypalEmail: z.email("A valid PayPal email is required"),
    }),
    z.object({
      reimbursementMethod: z.literal("check"),
      checkAddress: z.string("Check address is required"),
    }),
    z.object({
      reimbursementMethod: z.literal("direct_deposit"),
      routingNumber: z.string("Routing number is required"),
      accountNumber: z.string("Account number is required").min(4),
    }),
    z.object({
      reimbursementMethod: z.literal("already_known"),
    }),
  ]
);

export type PartialReimbursementMethod = Partial<
  z.infer<typeof ReimbursementMethodValidator>
>;
export type PartialBasicInfo = Partial<z.infer<typeof BasicInfoValidator>>;
