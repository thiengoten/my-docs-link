const DRIVE_FILES_URL = "https://www.googleapis.com/drive/v3/files";

export async function getDriveFileMetadata(accessToken: string, fileId: string) {
  const res = await fetch(`${DRIVE_FILES_URL}/${fileId}?fields=mimeType,name`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    throw new Error(`Drive metadata request failed: ${res.status}`);
  }
  return (await res.json()) as { mimeType: string; name: string };
}

export async function downloadDriveFile(accessToken: string, fileId: string) {
  const res = await fetch(`${DRIVE_FILES_URL}/${fileId}?alt=media`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    throw new Error(`Drive download request failed: ${res.status}`);
  }
  return Buffer.from(await res.arrayBuffer());
}
