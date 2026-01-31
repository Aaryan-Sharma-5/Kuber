import { NextRequest, NextResponse } from "next/server";
import { processTransfer } from "@/lib/ledger";
import { transferSchema } from "@/lib/validations";
import { ZodError } from "zod";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    const validatedData = transferSchema.parse(body);

    // Process the transfer
    const result = await processTransfer({
      idempotencyKey: validatedData.idempotencyKey,
      fromAccountId: validatedData.fromAccountId,
      toAccountId: validatedData.toAccountId,
      amount: validatedData.amount,
      description: validatedData.description,
    });

    return NextResponse.json(result.body, { status: result.statusCode });
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

    console.error("Transfer error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500 }
    );
  }
}
