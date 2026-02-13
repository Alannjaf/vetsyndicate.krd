import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { vetApplications, vetMembers, cities } from "@/lib/db/schema";
import { auth } from "@/lib/auth/auth";
import { eq, count } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { sendEmail, applicationApprovedEmail } from "@/lib/email/send";
import { auditLog } from '@/lib/utils/audit';

// POST - Approve application
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || !["syndicate", "branch_head"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const applicationId = parseInt(id);

    if (isNaN(applicationId)) {
      return NextResponse.json({ error: "Invalid application ID" }, { status: 400 });
    }

    // Get the application
    const [application] = await db
      .select()
      .from(vetApplications)
      .where(eq(vetApplications.id, applicationId));

    if (!application) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    // Check if branch head has access
    if (session.user.role === "branch_head") {
      const assignedCityIds = session.user.assignedCityIds || [];
      if (!assignedCityIds.includes(application.cityId)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    // Check if already processed
    if (application.status !== "pending") {
      return NextResponse.json(
        { error: "Application has already been processed" },
        { status: 400 }
      );
    }

    // Get optional title from request body
    const body = await request.json().catch(() => ({}));
    const titleEn = body.titleEn || "Veterinarian";
    const titleKu = body.titleKu || "پزیشکی ڤێتێرنەری";
    const titleAr = body.titleAr || "طبيب بيطري";

    // Generate member ID (sequential: 00001, 00002, etc.)
    const [memberCount] = await db
      .select({ count: count() })
      .from(vetMembers);
    const nextNumber = (memberCount?.count || 0) + 1;
    const memberId = nextNumber.toString().padStart(5, "0");

    // Generate QR code ID
    const qrCodeId = `VET-${uuidv4().substring(0, 8).toUpperCase()}`;

    // Calculate expiry date (1 year from now)
    const issueDate = new Date();
    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 1);

    // Create member record
    const [newMember] = await db
      .insert(vetMembers)
      .values({
        applicationId: application.id,
        memberId,
        fullNameKu: application.fullNameKu,
        fullNameEn: application.fullNameEn,
        titleEn,
        titleKu,
        titleAr,
        dateOfBirth: application.dateOfBirth,
        photoBase64: application.photoBase64,
        nationalIdNumber: application.nationalIdNumber,
        phoneNumber: application.phoneNumber,
        emailAddress: application.emailAddress,
        jobLocation: application.jobLocation,
        scientificRank: application.scientificRank,
        qrCodeId,
        issueDate,
        expiryDate,
        status: "active",
        cityId: application.cityId,
        createdBy: parseInt(session.user.id) || 0,
      })
      .returning();

    // Update application status
    await db
      .update(vetApplications)
      .set({
        status: "approved",
        reviewedBy: parseInt(session.user.id) || null,
        reviewedAt: new Date(),
      })
      .where(eq(vetApplications.id, applicationId));

    // Send approval email
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const emailContent = applicationApprovedEmail(
      application.fullNameEn,
      memberId,
      application.trackingToken,
      baseUrl
    );
    await sendEmail({
      to: application.emailAddress,
      subject: emailContent.subject,
      html: emailContent.html,
    });

    auditLog({ action: 'application.approved', actorId: session.user.id, actorRole: session.user.role, targetId: id, targetType: 'application' })

    return NextResponse.json({
      message: "Application approved successfully",
      member: {
        id: newMember.id,
        memberId: newMember.memberId,
        qrCodeId: newMember.qrCodeId,
      },
    });
  } catch (error) {
    console.error("Error approving application:", error);
    return NextResponse.json(
      { error: "Failed to approve application" },
      { status: 500 }
    );
  }
}
