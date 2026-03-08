import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { vetMembers, cities } from "@/lib/db/schema";
import { auth } from "@/lib/auth/auth";
import { eq } from "drizzle-orm";
import { validateBase64Fields } from "@/lib/utils/validation";

// GET - Fetch single member
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
    const memberId = parseInt(id);

    if (isNaN(memberId)) {
      return NextResponse.json({ error: "Invalid member ID" }, { status: 400 });
    }

    const [member] = await db
      .select()
      .from(vetMembers)
      .where(eq(vetMembers.id, memberId));

    if (!member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    // Check if branch head has access
    if (session.user.role === "branch_head") {
      const assignedCityIds = session.user.assignedCityIds || [];
      if (!assignedCityIds.includes(member.cityId)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    // Get city info
    const [city] = await db
      .select()
      .from(cities)
      .where(eq(cities.id, member.cityId));

    return NextResponse.json({
      ...member,
      city,
    });
  } catch (error) {
    console.error("Error fetching member:", error);
    return NextResponse.json(
      { error: "Failed to fetch member" },
      { status: 500 }
    );
  }
}

// PUT - Update member
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
    const memberId = parseInt(id);

    if (isNaN(memberId)) {
      return NextResponse.json({ error: "Invalid member ID" }, { status: 400 });
    }

    // Get existing member
    const [existingMember] = await db
      .select()
      .from(vetMembers)
      .where(eq(vetMembers.id, memberId));

    if (!existingMember) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    // Check if branch head has access
    if (session.user.role === "branch_head") {
      const assignedCityIds = session.user.assignedCityIds || [];
      if (!assignedCityIds.includes(existingMember.cityId)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const body = await request.json();
    const {
      fullNameKu,
      fullNameEn,
      titleEn,
      titleKu,
      titleAr,
      dateOfBirth,
      photoBase64,
      phoneNumber,
      emailAddress,
      jobLocation,
      scientificRank,
    } = body;
    const newMemberId = body.memberId?.trim();

    const base64Error = validateBase64Fields(body, ['photoBase64'])
    if (base64Error) {
      return NextResponse.json({ error: base64Error }, { status: 400 })
    }

    // If memberId is being changed, check for duplicates
    if (newMemberId && newMemberId !== existingMember.memberId) {
      const [duplicate] = await db
        .select({ id: vetMembers.id })
        .from(vetMembers)
        .where(eq(vetMembers.memberId, newMemberId));

      if (duplicate) {
        return NextResponse.json(
          { error: `Member ID "${newMemberId}" is already in use. Please choose a different ID number.` },
          { status: 409 }
        );
      }
    }

    // Update member
    const [updatedMember] = await db
      .update(vetMembers)
      .set({
        memberId: newMemberId || existingMember.memberId,
        fullNameKu: fullNameKu || existingMember.fullNameKu,
        fullNameEn: fullNameEn || existingMember.fullNameEn,
        titleEn: titleEn || existingMember.titleEn,
        titleKu: titleKu || existingMember.titleKu,
        titleAr: titleAr !== undefined ? titleAr : existingMember.titleAr,
        dateOfBirth: dateOfBirth || existingMember.dateOfBirth,
        photoBase64: photoBase64 || existingMember.photoBase64,
        phoneNumber: phoneNumber !== undefined ? phoneNumber : existingMember.phoneNumber,
        emailAddress: emailAddress !== undefined ? emailAddress : existingMember.emailAddress,
        jobLocation: jobLocation !== undefined ? jobLocation : existingMember.jobLocation,
        scientificRank: scientificRank !== undefined ? scientificRank : existingMember.scientificRank,
        updatedAt: new Date(),
        updatedBy: parseInt(session.user.id) || null,
      })
      .where(eq(vetMembers.id, memberId))
      .returning();

    return NextResponse.json(updatedMember);
  } catch (error) {
    console.error("Error updating member:", error);
    return NextResponse.json(
      { error: "Failed to update member" },
      { status: 500 }
    );
  }
}

// DELETE - Delete member
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
    const memberId = parseInt(id);

    if (isNaN(memberId)) {
      return NextResponse.json({ error: "Invalid member ID" }, { status: 400 });
    }

    // Get existing member
    const [existingMember] = await db
      .select()
      .from(vetMembers)
      .where(eq(vetMembers.id, memberId));

    if (!existingMember) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    // Check if branch head has access
    if (session.user.role === "branch_head") {
      const assignedCityIds = session.user.assignedCityIds || [];
      if (!assignedCityIds.includes(existingMember.cityId)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    await db.delete(vetMembers).where(eq(vetMembers.id, memberId));

    return NextResponse.json({ message: "Member deleted successfully" });
  } catch (error) {
    console.error("Error deleting member:", error);
    return NextResponse.json(
      { error: "Failed to delete member" },
      { status: 500 }
    );
  }
}
