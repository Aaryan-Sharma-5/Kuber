import { NextRequest, NextResponse } from "next/server";
import { getAllAccounts, createAccount } from "@/lib/ledger";
import { createAccountSchema } from "@/lib/validations";
import { ZodError } from "zod";

export async function GET() {
  try {
    const accounts = await getAllAccounts();
    return NextResponse.json({ success: true, accounts });
  } catch (error) {
    console.error("Error fetching accounts:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch accounts" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createAccountSchema.parse(body);

    const account = await createAccount(
      validatedData.userId,
      validatedData.name,
      validatedData.initialBalance || 0
    );

    return NextResponse.json({ success: true, account }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          success: false,
          message: "Validation error",
          errors: error.issues,
        },
        { status: 400 }
      );
    }

    console.error("Error creating account:", error);
    return NextResponse.json(
      { success: false, message: "Failed to create account" },
      { status: 500 }
    );
  }
}
