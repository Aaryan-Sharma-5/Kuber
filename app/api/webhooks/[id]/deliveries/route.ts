import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/webhooks/[id]/deliveries - Get delivery history for a webhook
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const deliveries = await prisma.webhookDelivery.findMany({
      where: { webhookId: id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const stats = {
      total: deliveries.length,
      success: deliveries.filter((d: { status: string }) => d.status === "success").length,
      failed: deliveries.filter((d: { status: string }) => d.status === "failed").length,
      pending: deliveries.filter((d: { status: string }) => d.status === "pending").length,
    };

    return NextResponse.json({ deliveries, stats });
  } catch (error) {
    console.error("Error fetching deliveries:", error);
    return NextResponse.json(
      { error: "Failed to fetch deliveries" },
      { status: 500 }
    );
  }
}
