import { NextRequest, NextResponse } from "next/server";
import { getAccountDetails } from "@/lib/ledger";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const account = await getAccountDetails(id);

    if (!account) {
      return NextResponse.json(
        { success: false, message: "Account not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, account });
  } catch (error) {
    console.error("Error fetching account:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch account" },
      { status: 500 }
    );
  }
}
