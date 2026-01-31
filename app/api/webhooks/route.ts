import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import crypto from "crypto";
import { z } from "zod";

// Validation schema for webhook registration
const webhookSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  url: z.string().url("Invalid webhook URL"),
  events: z.array(z.enum(["transfer.completed", "transfer.failed"])).min(1, "At least one event is required"),
});

// GET /api/webhooks - List all webhooks for a user
export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "userId query parameter is required" },
        { status: 400 }
      );
    }

    const webhooks = await prisma.webhook.findMany({
      where: { userId },
      include: {
        deliveries: {
          take: 5,
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ webhooks });
  } catch (error) {
    console.error("Error fetching webhooks:", error);
    return NextResponse.json(
      { error: "Failed to fetch webhooks" },
      { status: 500 }
    );
  }
}

// POST /api/webhooks - Register a new webhook
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = webhookSchema.parse(body);

    // Generate a secure secret for HMAC signing
    const secret = crypto.randomBytes(32).toString("hex");

    const webhook = await prisma.webhook.create({
      data: {
        userId: validated.userId,
        url: validated.url,
        secret,
        events: validated.events,
        active: true,
      },
    });

    return NextResponse.json({
      webhook: {
        id: webhook.id,
        url: webhook.url,
        events: webhook.events,
        secret, // Only returned on creation!
        active: webhook.active,
        createdAt: webhook.createdAt,
      },
      message: "Webhook registered successfully. Save the secret - it won't be shown again!",
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error creating webhook:", error);
    return NextResponse.json(
      { error: "Failed to create webhook" },
      { status: 500 }
    );
  }
}

// DELETE /api/webhooks - Delete a webhook
export async function DELETE(request: NextRequest) {
  try {
    const webhookId = request.nextUrl.searchParams.get("id");

    if (!webhookId) {
      return NextResponse.json(
        { error: "id query parameter is required" },
        { status: 400 }
      );
    }

    await prisma.webhook.delete({
      where: { id: webhookId },
    });

    return NextResponse.json({ message: "Webhook deleted successfully" });
  } catch (error) {
    console.error("Error deleting webhook:", error);
    return NextResponse.json(
      { error: "Failed to delete webhook" },
      { status: 500 }
    );
  }
}
