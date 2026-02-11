import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { vetApplications, cities, branchAssignments, vetMembers, tempUploads } from "@/lib/db/schema";
import { auth } from "@/lib/auth/auth";
import { eq, and, inArray } from "drizzle-orm";

// GET - Fetch single application by ID (branch/admin only)
export async function GET(
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

    const [application] = await db
      .select()
      .from(vetApplications)
      .where(eq(vetApplications.id, applicationId));

    if (!application) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    // Check if branch head has access to this city
    if (session.user.role === "branch_head") {
      const assignedCityIds = session.user.assignedCityIds || [];
      if (!assignedCityIds.includes(application.cityId)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    // Get city info
    const [city] = await db
      .select()
      .from(cities)
      .where(eq(cities.id, application.cityId));

    return NextResponse.json({
      ...application,
      city,
    });
  } catch (error) {
    console.error("Error fetching application:", error);
    return NextResponse.json(
      { error: "Failed to fetch application" },
      { status: 500 }
    );
  }
}

// PUT - Update application (syndicate/branch_head only)
export async function PUT(
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

    const [existing] = await db
      .select()
      .from(vetApplications)
      .where(eq(vetApplications.id, applicationId));

    if (!existing) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    // Check if branch head has access to this city
    if (session.user.role === "branch_head") {
      const assignedCityIds = session.user.assignedCityIds || [];
      if (!assignedCityIds.includes(existing.cityId)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const body = await request.json();

    // Resolve files from temp_uploads if session token is present
    if (body.uploadSessionToken) {
      const uploads = await db
        .select()
        .from(tempUploads)
        .where(eq(tempUploads.sessionToken, body.uploadSessionToken));

      // Group uploads by fieldName
      const byField: Record<string, string[]> = {};
      for (const upload of uploads) {
        if (!byField[upload.fieldName]) byField[upload.fieldName] = [];
        byField[upload.fieldName].push(upload.fileData);
      }

      // Resolve photo (single value) — only if new upload exists
      if (byField.photoBase64?.length) {
        body.photoBase64 = byField.photoBase64[0];
      }

      // Resolve document arrays — only override fields that have new uploads
      const docFields = [
        "collegeCertificateBase64",
        "nationalIdCardBase64",
        "infoCardBase64",
        "recommendationLetterBase64",
      ];
      for (const field of docFields) {
        if (byField[field]?.length) {
          body[field] = JSON.stringify(byField[field]);
        }
      }
    }

    // For fields not uploaded via temp, keep existing DB values
    const updateData: Record<string, unknown> = {
      fullNameKu: body.fullNameKu,
      fullNameEn: body.fullNameEn,
      dateOfBirth: body.dateOfBirth,
      placeOfBirth: body.placeOfBirth || null,
      nationalIdNumber: body.nationalIdNumber,
      nationalIdDate: body.nationalIdDate || null,
      marriageStatus: body.marriageStatus,
      numberOfChildren: body.numberOfChildren || 0,
      bloodType: body.bloodType,
      universityDegrees: body.universityDegrees || null,
      scientificRank: body.scientificRank || null,
      collegeCertificateBase64: body.collegeCertificateBase64 ?? existing.collegeCertificateBase64,
      jobLocation: body.jobLocation,
      yearOfEmployment: body.yearOfEmployment || null,
      privateWorkDetails: body.privateWorkDetails || null,
      currentLocation: body.currentLocation,
      phoneNumber: body.phoneNumber,
      emailAddress: body.emailAddress,
      cityId: body.cityId,
      nationalIdCardBase64: body.nationalIdCardBase64 ?? existing.nationalIdCardBase64,
      infoCardBase64: body.infoCardBase64 ?? existing.infoCardBase64,
      recommendationLetterBase64: body.recommendationLetterBase64 ?? existing.recommendationLetterBase64,
      signatureBase64: body.signatureBase64 ?? existing.signatureBase64,
      photoBase64: body.photoBase64 ?? existing.photoBase64,
    };

    const [updated] = await db
      .update(vetApplications)
      .set(updateData)
      .where(eq(vetApplications.id, applicationId))
      .returning();

    // Clean up temp uploads
    if (body.uploadSessionToken) {
      await db
        .delete(tempUploads)
        .where(eq(tempUploads.sessionToken, body.uploadSessionToken));
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating application:", error);
    return NextResponse.json(
      { error: "Failed to update application" },
      { status: 500 }
    );
  }
}

// DELETE - Delete application (syndicate/branch_head only)
export async function DELETE(
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

    const [existing] = await db
      .select()
      .from(vetApplications)
      .where(eq(vetApplications.id, applicationId));

    if (!existing) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    // Check if branch head has access to this city
    if (session.user.role === "branch_head") {
      const assignedCityIds = session.user.assignedCityIds || [];
      if (!assignedCityIds.includes(existing.cityId)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    // If approved, also delete the associated vet member
    if (existing.status === "approved") {
      await db
        .delete(vetMembers)
        .where(eq(vetMembers.applicationId, applicationId));
    }

    await db
      .delete(vetApplications)
      .where(eq(vetApplications.id, applicationId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting application:", error);
    return NextResponse.json(
      { error: "Failed to delete application" },
      { status: 500 }
    );
  }
}
