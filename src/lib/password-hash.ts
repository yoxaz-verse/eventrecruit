import {randomBytes,scrypt as callbackScrypt,timingSafeEqual} from "node:crypto";
import {promisify} from "node:util";
const scrypt=promisify(callbackScrypt);
export async function hashPassword(password:string){const salt=randomBytes(16);const key=await scrypt(password,salt,64) as Buffer;return `scrypt:${salt.toString("hex")}:${key.toString("hex")}`;}
export async function verifyPassword(password:string,encoded:string){const [algorithm,saltHex,keyHex]=encoded.split(":");if(algorithm!=="scrypt"||!/^[0-9a-f]{32}$/.test(saltHex??"")||!/^[0-9a-f]{128}$/.test(keyHex??""))return false;const expected=Buffer.from(keyHex,"hex");const actual=await scrypt(password,Buffer.from(saltHex,"hex"),expected.length) as Buffer;return timingSafeEqual(expected,actual);}
