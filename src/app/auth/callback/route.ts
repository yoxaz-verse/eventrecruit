import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  return NextResponse.redirect(
    new URL(
      "/login?message=This+email+link+is+no+longer+supported.+Request+a+new+verification+code.",
      request.url,
    ),
  );
}
