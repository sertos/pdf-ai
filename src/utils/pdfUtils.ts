export function getPdfFileSource(fileData: string | undefined | null): { data: Uint8Array } | string | null {
  if (!fileData) return null;
  
  if (fileData.startsWith('blob:') || fileData.startsWith('http://') || fileData.startsWith('https://')) {
    return fileData;
  }

  try {
    const cleanBase64 = fileData
      .replace(/^data:application\/pdf;base64,/, '')
      .replace(/^data:.*?;base64,/, '')
      .trim();

    if (!cleanBase64) return null;

    const binaryString = window.atob(cleanBase64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return { data: bytes };
  } catch (err) {
    console.error("Error converting PDF base64 to Uint8Array:", err);
    return null;
  }
}
