import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { vetMembers } from "@/lib/db/schema";
import { auth } from "@/lib/auth/auth";
import { eq } from "drizzle-orm";

// GET - Check if a member ID already exists
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || !["syndicate", "branch_head"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const memberId = request.nextUrl.searchParams.get("memberId")?.trim();
    if (!memberId) {
      return NextResponse.json({ exists: false });
    }

    const [existing] = await db
      .select({ id: vetMembers.id })
      .from(vetMembers)
      .where(eq(vetMembers.memberId, memberId));

    return NextResponse.json({ exists: !!existing });
  } catch (error) {
    console.error("Error checking member ID:", error);
    return NextResponse.json(
      { error: "Failed to check member ID" },
      { status: 500 }
    );
  }
}
