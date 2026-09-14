declare module "nodemailer/lib/addressparser" {
  function addressparser(input: string): Array<{ address: string; name: string }>;
  export default addressparser;
}
