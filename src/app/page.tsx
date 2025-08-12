import { Container, Title } from "@mantine/core";

import { ExpenseForm } from "./forms/expenses";

export default function Home() {
  return (
    <Container mt="md">
      <Title order={1}>Request Reimbursement</Title>
      <p>
        This form is for getting you reimbursed for buying things for the
        Capitol Hill Tool Library. Wow, thanks! We need some info from you the
        first time we reimburse you, so we know how to send you money, and then
        some info about the transaction, so we know how much to send you. Refer
        to our{" "}
        <a
          href="https://docs.google.com/document/d/1WYaXQTrb2Kuy71qE630gJKgy9JAD7Jun7tlTyQJU6GE/edit?tab=t.0#heading=h.ytfr9zbum6vj"
          target="_blank"
          rel="noreferer"
        >
          expense reimbursement policy
        </a>
        .
      </p>
      <ExpenseForm />
    </Container>
  );
}
