import { Anchor, Grid, Popover, Stack, Text, TextInput } from "@mantine/core";
import { IconHelp } from "@tabler/icons-react";

import { PartialReimbursementMethod } from "./types";

const halfWidthSpan = { base: 12, xs: 6 };

export function ReimbursementMethodForm({
  reimbursement,
  setReimbursement,
}: {
  reimbursement: PartialReimbursementMethod;
  setReimbursement: React.Dispatch<
    React.SetStateAction<PartialReimbursementMethod>
  >;
}) {
  const fields = () => {
    switch (reimbursement.reimbursementMethod) {
      case "paypal":
        return (
          <TextInput
            label="PayPal Email"
            value={reimbursement.paypalEmail ?? ""}
            onChange={(e) =>
              setReimbursement({
                ...reimbursement,
                paypalEmail: e.target.value,
              })
            }
          />
        );
      case "check":
        return (
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
        );
      case "direct_deposit":
        return (
          <Grid>
            <Grid.Col span={halfWidthSpan}>
              <TextInput
                label={
                  <span
                    style={{ display: "inline-flex", alignItems: "center" }}
                  >
                    Routing Number{" "}
                    <Popover position="top" width={350} shadow="md" withArrow>
                      <Popover.Target>
                        <IconHelp size="16px" style={{ marginLeft: 4 }} />
                      </Popover.Target>
                      <Popover.Dropdown>
                        A nine-digit code to uniquely identify your bank.{" "}
                        <Anchor
                          href="https://bank-code.net/routing-numbers"
                          target="_blank"
                          rel="noreferrer"
                        >
                          Find your routing number.
                        </Anchor>
                      </Popover.Dropdown>
                    </Popover>
                  </span>
                }
                value={reimbursement.routingNumber ?? ""}
                onChange={(e) =>
                  setReimbursement({
                    ...reimbursement,
                    routingNumber: e.target.value,
                  })
                }
              />
            </Grid.Col>
            <Grid.Col span={halfWidthSpan}>
              <TextInput
                label="Account Number"
                value={reimbursement.accountNumber ?? ""}
                onChange={(e) =>
                  setReimbursement({
                    ...reimbursement,
                    accountNumber: e.target.value,
                  })
                }
              />
            </Grid.Col>
          </Grid>
        );
      case "already_known":
        return (
          <Text>
            You can select this option if we already have your information, so
            you don&apos;t need to enter it again!
          </Text>
        );
    }
  };

  return <Stack mt="md">{fields()}</Stack>;
}
