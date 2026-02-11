import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tempUploads } from "@/lib/db/schema";
import { eq, and, lt, count } from "drizzle-orm";
import { validateBase64Image } from "@/lib/utils/validation";
import { rateLimit } from "@/lib/utils/rate-limit";

const ALLOWED_FIELD_NAMES = [
  "photoBase64",
  "collegeCertificateBase64",
  "nationalIdCardBase64",
  "infoCardBase64",
  "recommendationLetterBase64",
];

const MAX_UPLOADS_PER_SESSION = 25;

// Lazy cleanup: delete uploads older than 24h
async function cleanupOldUploads() {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
  await db.delete(tempUploads).where(lt(tempUploads.createdAt, cutoff));
}

// POST - Upload one file
export async function POST(request: NextRequest) {
  try {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      "unknown";
    const rl = rateLimit(`temp-upload:${ip}`, 30, 10 * 60 * 1000);
    if (!rl.success) {
      return NextResponse.json(
        { error: "Too many uploads. Please try again later." },
        { status: 429 }
      );
    }

    // Fire-and-forget cleanup (don't block the response)
    cleanupOldUploads().catch(() => {});

    const body = await request.json();
    const { sessionToken, fieldName, fileData } = body;

    if (!sessionToken || typeof sessionToken !== "string") {
      return NextResponse.json(
        { error: "Missing sessionToken" },
        { status: 400 }
      );
    }

    if (!fieldName || !ALLOWED_FIELD_NAMES.includes(fieldName)) {
      return NextResponse.json(
        { error: "Invalid fieldName" },
        { status: 400 }
      );
    }

    if (!fileData || typeof fileData !== "string") {
      return NextResponse.json(
        { error: "Missing fileData" },
        { status: 400 }
      );
    }

    // Validate base64 format and size
    const validationError = validateBase64Image(fileData, fieldName);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    // Check session upload count
    const [sessionCount] = await db
      .select({ total: count() })
      .from(tempUploads)
      .where(eq(tempUploads.sessionToken, sessionToken));

    if (sessionCount && sessionCount.total >= MAX_UPLOADS_PER_SESSION) {
      return NextResponse.json(
        { error: "Too many uploads for this session" },
        { status: 400 }
      );
    }

    const [inserted] = await db
      .insert(tempUploads)
      .values({ sessionToken, fieldName, fileData })
      .returning({ id: tempUploads.id });

    return NextResponse.json({ id: inserted.id }, { status: 201 });
  } catch (error) {
    console.error("Error uploading temp file:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}

// DELETE - Remove one file
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const sessionToken = searchParams.get("sessionToken");

    if (!id || !sessionToken) {
      return NextResponse.json(
        { error: "Missing id or sessionToken" },
        { status: 400 }
      );
    }

    await db
      .delete(tempUploads)
      .where(
        and(
          eq(tempUploads.id, parseInt(id)),
          eq(tempUploads.sessionToken, sessionToken)
        )
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting temp file:", error);
    return NextResponse.json(
      { error: "Failed to delete file" },
      { status: 500 }
    );
  }
}
