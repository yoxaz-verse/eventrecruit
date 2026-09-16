export const MAX_STORED_IMAGE_BYTES = 500 * 1024;

export function validBrandImage(file: File) {
  return file.size > 0 && file.size <= MAX_STORED_IMAGE_BYTES && file.type === "image/webp";
}

export async function validBrandImageSignature(file: File) {
  if (!validBrandImage(file)) return false;
  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const starts = (signature: number[]) => signature.every((byte, index) => bytes[index] === byte);
  return starts([82, 73, 70, 70]) && [87, 69, 66, 80].every((byte, index) => bytes[index + 8] === byte);
}
