import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    const authHeader = req.headers.get("authorization");
    if (authHeader) headers["authorization"] = authHeader;

    const tenantHeader = req.headers.get("x-tenant-id");
    if (tenantHeader) headers["x-tenant-id"] = tenantHeader;

    const res = await fetch(`${BACKEND_URL}/loomi/chat`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json(
        { error: `Loomi AI error (${res.status}): ${errText}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to communicate with Loomi AI." },
      { status: 500 }
    );
  }
}

