import z from "zod";

export const BasicInfoValidator = z.object({
  name: z.string().min(2).max(100),
  email: z.email(),
  itemDescription: z.string().min(2).max(500),
  itemPrice: z.number().min(1),
  purchaseDate: z.date(),
  receipts: z
    .array(
      z.file().mime(["image/jpeg", "image/png", "image/gif", "application/pdf"])
    )
    .min(1),
});

export const ReimbursementMethodValidator = z.discriminatedUnion(
  "reimbursementMethod",
  [
    z.object({
      reimbursementMethod: z.literal("paypal"),
      paypalEmail: z.email(),
    }),
    z.object({
      reimbursementMethod: z.literal("check"),
      checkAddress: z.string(),
      checkPhone: z.string(),
    }),
    z.object({
      reimbursementMethod: z.literal("direct_deposit"),
      routingNumber: z.string(),
      accountNumber: z.string().min(4),
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
