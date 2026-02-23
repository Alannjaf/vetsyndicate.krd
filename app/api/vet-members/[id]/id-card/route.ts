import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db";
import { vetMembers, vetApplications, cities } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import QRCode from "qrcode";

// QR Code cache - stores generated QR codes to avoid regenerating for the same data
const MAX_CACHE_SIZE = 500;
const qrCodeCache = new Map<string, string>();

// GET - Return member data for ID card generation
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const memberId = parseInt(id);

    if (isNaN(memberId)) {
      return NextResponse.json({ error: "Invalid member ID" }, { status: 400 });
    }

    const session = await auth();
    if (!session || !["syndicate", "branch_head"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get member
    const [member] = await db
      .select()
      .from(vetMembers)
      .where(eq(vetMembers.id, memberId));

    if (!member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    // Get city
    const [city] = await db
      .select()
      .from(cities)
      .where(eq(cities.id, member.cityId));

    // Get blood type from linked application
    const [application] = await db
      .select({ bloodType: vetApplications.bloodType })
      .from(vetApplications)
      .where(eq(vetApplications.id, member.applicationId));

    // Generate QR code as data URL (with caching)
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const verifyUrl = `${baseUrl}/verify/${member.qrCodeId}`;
    
    // Check cache first
    let qrDataUrl = qrCodeCache.get(verifyUrl);
    if (!qrDataUrl) {
      // Generate and cache if not found
      qrDataUrl = await QRCode.toDataURL(verifyUrl, {
        width: 200,
        margin: 1,
        errorCorrectionLevel: "M",
      });
      if (qrCodeCache.size >= MAX_CACHE_SIZE) {
        const firstKey = qrCodeCache.keys().next().value;
        if (firstKey) qrCodeCache.delete(firstKey);
      }
      qrCodeCache.set(verifyUrl, qrDataUrl);
    }

    // Return JSON data for client-side rendering
    return NextResponse.json(
      {
        id: member.id,
        memberId: member.memberId,
        fullNameKu: member.fullNameKu,
        fullNameEn: member.fullNameEn,
        titleKu: member.titleKu,
        titleEn: member.titleEn,
        titleAr: member.titleAr,
        dateOfBirth: member.dateOfBirth,
        photoBase64: member.photoBase64,
        qrCodeId: member.qrCodeId,
        issueDate: member.issueDate,
        expiryDate: member.expiryDate,
        bloodGroup: application?.bloodType || null,
        cityCode: city?.code || null,
        qrDataUrl: qrDataUrl,
      },
      {
        headers: {
          "Cache-Control": "private, max-age=60, stale-while-revalidate=300",
        },
      }
    );
  } catch (error) {
    console.error("Error fetching member data:", error);
    return NextResponse.json(
      { error: "Failed to fetch member data" },
      { status: 500 }
    );
  }
}
