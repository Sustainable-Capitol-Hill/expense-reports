import "@mantine/core/styles.css";
import "@mantine/dropzone/styles.css";
import "@mantine/dates/styles.css";

import { MantineProvider } from "@mantine/core";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <MantineProvider>{children}</MantineProvider>
      </body>
    </html>
  );
}
