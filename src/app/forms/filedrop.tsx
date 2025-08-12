import { Stack, Text, Title } from "@mantine/core";
import { IconPhoto, IconUpload, IconX } from "@tabler/icons-react";
import { Dropzone, IMAGE_MIME_TYPE } from "@mantine/dropzone";

import { PartialBasicInfo } from "./types";

export function FileDrop({
  basicInfo,
  setBasicInfo,
}: {
  basicInfo: PartialBasicInfo;
  setBasicInfo: React.Dispatch<React.SetStateAction<PartialBasicInfo>>;
}) {
  return (
    <div>
      <Title order={3}>Upload Receipts</Title>
      <Dropzone
        mt="sm"
        onDrop={(files) => {
          setBasicInfo((info) => {
            const filtered = files.filter((file) => {
              return !info.receipts?.map((r) => r.name).includes(file.name);
            });

            if (filtered.length === 0) {
              alert("You already uploaded that file!");
              return info;
            }

            return {
              ...info,
              receipts: [...(info.receipts || []), ...filtered],
            };
          });
        }}
        onReject={() => {
          alert("Sorry, you can't upload that type of file.");
        }}
        maxSize={5 * 1024 ** 2}
        accept={IMAGE_MIME_TYPE}
      >
        <Stack
          gap="xs"
          justify="center"
          align="center"
          mih={220}
          style={{ pointerEvents: "none" }}
        >
          <Dropzone.Accept>
            <IconUpload
              size={52}
              color="var(--mantine-color-blue-6)"
              stroke={1.5}
            />
          </Dropzone.Accept>
          <Dropzone.Reject>
            <IconX size={52} color="var(--mantine-color-red-6)" stroke={1.5} />
          </Dropzone.Reject>
          <Dropzone.Idle>
            <IconPhoto
              size={52}
              color="var(--mantine-color-dimmed)"
              stroke={1.5}
            />
          </Dropzone.Idle>

          <div>
            <Text size="md" inline>
              Drag images here or click to select files
            </Text>
          </div>
        </Stack>
      </Dropzone>
      <ul>
        {basicInfo.receipts?.map((file) => (
          <li key={file.name}>{file.name}</li>
        ))}
      </ul>
    </div>
  );
}
