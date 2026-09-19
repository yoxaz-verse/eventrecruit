import readXlsxFile from "read-excel-file/node";
import { normalizeEmail, normalizePhone } from "@/lib/agency-operations";

export type ImportContactRow={rowNumber:number;selected:boolean;name:string;phone:string;email:string;whatsapp:string;location:string;skills:string[];availability:string;errors:string[]};
const aliases:Record<string,string[]>={name:["name","full name","staff name","contact name"],phone:["phone","phone number","mobile","mobile number"],email:["email","email id","e-mail"],whatsapp:["whatsapp","whatsapp number"],location:["location","city"],skills:["skills","skill"],availability:["availability","availability status"]};
const canonical=(heading:string)=>{const normalized=heading.trim().toLowerCase();return Object.entries(aliases).find(([,values])=>values.includes(normalized))?.[0]??normalized;};
export async function parseContactWorkbook(buffer:ArrayBuffer,fileName:string):Promise<ImportContactRow[]>{
  const parseCsv=(source:string)=>{const rows:string[][]=[];let row:string[]=[],cell="",quoted=false;for(let i=0;i<source.length;i++){const char=source[i];if(char==='"'&&quoted&&source[i+1]==='"'){cell+='"';i++;}else if(char==='"')quoted=!quoted;else if(char===','&&!quoted){row.push(cell);cell="";}else if((char==='\n'||char==='\r')&&!quoted){if(char==='\r'&&source[i+1]==='\n')i++;row.push(cell);if(row.some(value=>value.trim()))rows.push(row);row=[];cell="";}else cell+=char;}row.push(cell);if(row.some(value=>value.trim()))rows.push(row);return rows;};
  type RawCell=string|number|boolean|Date|null;
  const rawRows=(fileName.toLowerCase().endsWith(".csv")?parseCsv(new TextDecoder().decode(buffer)):await readXlsxFile(Buffer.from(buffer))) as RawCell[][];
  if(!rawRows.length)return [];
  const headings=rawRows[0].map(value=>canonical(String(value??"")));
  const output:ImportContactRow[]=[];
  rawRows.slice(1).forEach((row,index)=>{const rowNumber=index+2,mapped:Record<string,string>={};headings.forEach((heading,column)=>mapped[heading]=String(row[column]??"").trim());const name=mapped.name??"",phone=normalizePhone(mapped.phone??""),email=normalizeEmail(mapped.email??"");if(!name&&!phone&&!email)return;const errors:string[]=[];if(!name)errors.push("Name is required");if(!phone&&!email)errors.push("Phone or email is required");if((mapped.phone??"")&&!phone)errors.push("Phone is invalid");output.push({rowNumber,selected:true,name,phone,email,whatsapp:normalizePhone(mapped.whatsapp??""),location:mapped.location??"",skills:(mapped.skills??"").split(",").map(x=>x.trim()).filter(Boolean),availability:mapped.availability??"",errors});});
  return output;
}
