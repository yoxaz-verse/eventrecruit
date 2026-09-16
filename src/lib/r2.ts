import "server-only";

import { createHash, createHmac } from "node:crypto";

type R2Config = { endpoint: URL; accessKeyId: string; secretAccessKey: string };

function config(): R2Config | null {
  const endpoint = process.env.CLOUDFLARE_R2_ENDPOINT?.trim();
  const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY?.trim();
  if (!endpoint || !accessKeyId || !secretAccessKey) return null;
  return { endpoint: new URL(endpoint.replace(/\/+$/, "") + "/"), accessKeyId, secretAccessKey };
}

const sha256 = (value: string | Uint8Array) => createHash("sha256").update(value).digest("hex");
const hmac = (key: string | Buffer, value: string) => createHmac("sha256", key).update(value).digest();

function objectUrl(endpoint: URL, key: string) {
  return new URL(key.split("/").map(encodeURIComponent).join("/"), endpoint);
}

async function signedRequest(method: "GET" | "PUT" | "DELETE", key: string, body?: Uint8Array, contentType?: string) {
  const settings = config();
  if (!settings) throw new Error("Cloudflare R2 is not configured.");
  const url = objectUrl(settings.endpoint, key);
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  const date = amzDate.slice(0, 8);
  const payloadHash = sha256(body ?? "");
  const signedHeaders = contentType ? "content-type;host;x-amz-content-sha256;x-amz-date" : "host;x-amz-content-sha256;x-amz-date";
  const canonicalHeaders = `${contentType ? `content-type:${contentType}\n` : ""}host:${url.host}\nx-amz-content-sha256:${payloadHash}\nx-amz-date:${amzDate}\n`;
  const canonicalRequest = [method, url.pathname, "", canonicalHeaders, signedHeaders, payloadHash].join("\n");
  const scope = `${date}/auto/s3/aws4_request`;
  const stringToSign = ["AWS4-HMAC-SHA256", amzDate, scope, sha256(canonicalRequest)].join("\n");
  const dateKey = hmac(`AWS4${settings.secretAccessKey}`, date);
  const regionKey = hmac(dateKey, "auto");
  const serviceKey = hmac(regionKey, "s3");
  const signingKey = hmac(serviceKey, "aws4_request");
  const signature = createHmac("sha256", signingKey).update(stringToSign).digest("hex");
  const headers: Record<string, string> = {
    Authorization: `AWS4-HMAC-SHA256 Credential=${settings.accessKeyId}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}`,
    "x-amz-content-sha256": payloadHash,
    "x-amz-date": amzDate,
  };
  if (contentType) headers["content-type"] = contentType;
  const requestBody = body ? Uint8Array.from(body).buffer : undefined;
  return fetch(url, { method, headers, body: requestBody });
}

export async function putR2Object(key: string, file: File) {
  const response = await signedRequest("PUT", key, new Uint8Array(await file.arrayBuffer()), file.type);
  if (!response.ok) throw new Error(`Cloudflare R2 upload failed (${response.status}).`);
}

export async function getR2Object(key: string) {
  const response = await signedRequest("GET", key);
  return response.ok ? response : null;
}

export async function deleteR2Object(key: string | null | undefined) {
  if (!key) return;
  const response = await signedRequest("DELETE", key);
  if (!response.ok && response.status !== 404) throw new Error(`Cloudflare R2 delete failed (${response.status}).`);
}
