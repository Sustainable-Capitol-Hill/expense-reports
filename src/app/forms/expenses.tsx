"use client";
import {
  Alert,
  Button,
  Grid,
  Group,
  Radio,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { IconCheck, IconX } from "@tabler/icons-react";
import { useState } from "react";
import z from "zod";

import { submitExpense } from "../submit";
import { FileDrop } from "./filedrop";
import { ReimbursementMethodForm } from "./reimbursement";
import {
  BasicInfoValidator,
  PartialBasicInfo,
  PartialReimbursementMethod,
  ReimbursementMethodValidator,
} from "./types";

export function ExpenseForm() {
  const [info, setInfo] = useState<PartialBasicInfo>({});
  const [reimbursement, setReimbursement] =
    useState<PartialReimbursementMethod>({});

  const [errors, setErrors] = useState<string[]>([]);
  const [success, setSuccess] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleSubmit = async () => {
    setSuccess(false);

    const parsedInfo = BasicInfoValidator.safeParse(info);
    const parsedReimbursement =
      ReimbursementMethodValidator.safeParse(reimbursement);

    let hasError = false;
    const errors = [];

    if (!parsedInfo.success) {
      errors.push(z.prettifyError(parsedInfo.error));
      hasError = true;
    }

    if (!parsedReimbursement.success) {
      errors.push(z.prettifyError(parsedReimbursement.error));
      hasError = true;
    }

    if (hasError) {
      setErrors(errors);
      return;
    }

    setErrors([]);

    setIsSubmitting(true);
    // we know the data exists at this point because we would have return early if not
    try {
      await submitExpense(parsedInfo.data!, parsedReimbursement.data!);
    } catch (error) {
      setIsSubmitting(false);
      setErrors([String(error)]);
      return;
    }
    setIsSubmitting(false);

    setInfo((info) => ({
      ...info,
      purchaseDate: undefined,
      itemDescription: "",
      itemPrice: undefined,
      receipts: [],
    }));
    setSuccess(true);
  };

  return (
    <div>
      {success && (
        <Alert title="Success" color="green" icon={<IconCheck />} mb="md">
          Your expense report has been submitted successfully! Your information
          was preserved in case you want to submit another item.
        </Alert>
      )}
      {errors.length > 0 && (
        <Alert title="Error" color="red" mb="md" icon={<IconX />}>
          {errors.map((error) => (
            <div key={error}>
              {error.split("\n").map((line, index) => (
                <Text key={index}>{line}</Text>
              ))}
            </div>
          ))}
        </Alert>
      )}
      <Stack>
        <Title order={3}>Your Info</Title>
        <TextInput
          label="Full Name"
          value={info.name ?? ""}
          onChange={(e) => setInfo({ ...info, name: e.target.value })}
        />
        <TextInput
          label="Email Address"
          value={info.email ?? ""}
          onChange={(e) => setInfo({ ...info, email: e.target.value })}
        />
        <Grid>
          <Grid.Col span={{ base: 12, xs: 6 }}>
            <Stack>
              <Title order={3}>Item Info</Title>
              <DateInput
                label="Purchase Date"
                maxDate={new Date()}
                firstDayOfWeek={0}
                weekendDays={[]} // Prevent weekends from showing in red
                value={info.purchaseDate ?? ""}
                onChange={(date) =>
                  setInfo((info) =>
                    date ? { ...info, purchaseDate: new Date(date) } : info,
                  )
                }
              />
              <TextInput
                label="Item Description"
                placeholder="What did you buy, and what was it for?"
                value={info.itemDescription ?? ""}
                onChange={(e) =>
                  setInfo({ ...info, itemDescription: e.target.value })
                }
              />
              <TextInput
                leftSection={"$"}
                label="Item Price"
                type="number"
                value={info.itemPrice ?? ""}
                onChange={(e) =>
                  setInfo({ ...info, itemPrice: Number(e.target.value) })
                }
              />
            </Stack>
          </Grid.Col>
          <Grid.Col span={{ base: 12, xs: 6 }}>
            <FileDrop basicInfo={info} setBasicInfo={setInfo} />
          </Grid.Col>
        </Grid>
        <Title order={3}>Reimbursement Method</Title>
        <Group>
          <Radio
            label="PayPal"
            checked={reimbursement.reimbursementMethod === "paypal"}
            onChange={() => setReimbursement({ reimbursementMethod: "paypal" })}
          />
          <Radio
            label="Check"
            checked={reimbursement.reimbursementMethod === "check"}
            onChange={() => setReimbursement({ reimbursementMethod: "check" })}
          />
          <Radio
            label="Direct Deposit"
            checked={reimbursement.reimbursementMethod === "direct_deposit"}
            onChange={() =>
              setReimbursement({ reimbursementMethod: "direct_deposit" })
            }
          />
          <Radio
            label="Already Known"
            checked={reimbursement.reimbursementMethod === "already_known"}
            onChange={() =>
              setReimbursement({ reimbursementMethod: "already_known" })
            }
          />
        </Group>
      </Stack>
      <ReimbursementMethodForm
        reimbursement={reimbursement}
        setReimbursement={setReimbursement}
      />
      <Button
        mt="md"
        mb="md"
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        onClick={handleSubmit}
        disabled={isSubmitting}
        loading={isSubmitting}
      >
        Submit Report
      </Button>
    </div>
  );
}
