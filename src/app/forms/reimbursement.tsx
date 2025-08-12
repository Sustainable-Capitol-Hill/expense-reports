import { Stack, TextInput } from "@mantine/core";

import { PartialReimbursementMethod } from "./types";

export function ReimbursementMethodForm({
  reimbursement,
  setReimbursement,
}: {
  reimbursement: PartialReimbursementMethod;
  setReimbursement: React.Dispatch<
    React.SetStateAction<PartialReimbursementMethod>
  >;
}) {
  return (
    <Stack mt="md">
      {reimbursement.reimbursementMethod === "paypal" && (
        <TextInput
          label="PayPal Email"
          value={reimbursement.paypalEmail ?? ""}
          onChange={(e) =>
            setReimbursement({ ...reimbursement, paypalEmail: e.target.value })
          }
        />
      )}
      {reimbursement.reimbursementMethod === "check" && (
        <>
          <TextInput
            label="Your Address"
            placeholder="So we know where to send the check"
            value={reimbursement.checkAddress ?? ""}
            onChange={(e) =>
              setReimbursement({
                ...reimbursement,
                checkAddress: e.target.value,
              })
            }
          />
          <TextInput
            label="Phone Number"
            value={reimbursement.checkPhone ?? ""}
            onChange={(e) =>
              setReimbursement({ ...reimbursement, checkPhone: e.target.value })
            }
          />
        </>
      )}
    </Stack>
  );
}
