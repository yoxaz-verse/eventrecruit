import assert from "node:assert/strict";
import test from "node:test";
import { MAX_STORED_IMAGE_BYTES, validBrandImage, validBrandImageSignature } from "../src/lib/image-upload";

function webpFile(size = 32, type = "image/webp") {
  const bytes = new Uint8Array(size);
  bytes.set([82, 73, 70, 70], 0);
  bytes.set([87, 69, 66, 80], 8);
  return new File([bytes], "compressed.webp", { type });
}

test("accepts only genuine compressed WebP images within 500 KB", async () => {
  const file = webpFile(MAX_STORED_IMAGE_BYTES);
  assert.equal(validBrandImage(file), true);
  assert.equal(await validBrandImageSignature(file), true);
});

test("rejects compressed image payloads over 500 KB", async () => {
  const file = webpFile(MAX_STORED_IMAGE_BYTES + 1);
  assert.equal(validBrandImage(file), false);
  assert.equal(await validBrandImageSignature(file), false);
});

test("rejects incorrect MIME types and forged WebP declarations", async () => {
  assert.equal(await validBrandImageSignature(webpFile(32, "image/png")), false);
  assert.equal(await validBrandImageSignature(new File([new Uint8Array(32)], "fake.webp", { type: "image/webp" })), false);
});
