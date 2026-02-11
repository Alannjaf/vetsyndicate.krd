import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { vetApplications, cities, branchAssignments, tempUploads } from "@/lib/db/schema";
import { auth } from "@/lib/auth/auth";
import { eq, desc, inArray, and, count } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { sendEmail, applicationSubmittedEmail } from "@/lib/email/send";
import { validateBase64Fields, validateBase64ArrayField, safeParseInt } from "@/lib/utils/validation";
import { rateLimit } from "@/lib/utils/rate-limit";

// GET - Fetch applications (branch/admin only, filtered by city for branch heads)
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || !["syndicate", "branch_head"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const cityId = searchParams.get("cityId");
    const page = Math.max(1, safeParseInt(searchParams.get("page"), 1))
    const limit = Math.min(100, Math.max(1, safeParseInt(searchParams.get("limit"), 25)))
    const offset = (page - 1) * limit;

    // Build query conditions
    let conditions = [];

    // Filter by status if provided
    if (status && ["pending", "approved", "rejected"].includes(status)) {
      conditions.push(eq(vetApplications.status, status as "pending" | "approved" | "rejected"));
    }

    // Filter by city
    if (session.user.role === "branch_head") {
      // Branch heads can only see their assigned cities
      const assignedCityIds = session.user.assignedCityIds || [];
      if (assignedCityIds.length === 0) {
        return NextResponse.json({ data: [], total: 0, page, limit });
      }
      conditions.push(inArray(vetApplications.cityId, assignedCityIds));
    } else if (cityId) {
      // Admin can filter by specific city
      conditions.push(eq(vetApplications.cityId, parseInt(cityId)));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count and paginated data in parallel
    const [countResult, results] = await Promise.all([
      db.select({ total: count() }).from(vetApplications).where(whereClause),
      db
        .select({
          id: vetApplications.id,
          trackingToken: vetApplications.trackingToken,
          fullNameKu: vetApplications.fullNameKu,
          fullNameEn: vetApplications.fullNameEn,
          emailAddress: vetApplications.emailAddress,
          phoneNumber: vetApplications.phoneNumber,
          cityId: vetApplications.cityId,
          status: vetApplications.status,
          rejectionReason: vetApplications.rejectionReason,
          createdAt: vetApplications.createdAt,
          reviewedAt: vetApplications.reviewedAt,
          city: cities,
        })
        .from(vetApplications)
        .leftJoin(cities, eq(vetApplications.cityId, cities.id))
        .where(whereClause)
        .orderBy(desc(vetApplications.createdAt))
        .limit(limit)
        .offset(offset),
    ]);

    const total = countResult[0]?.total || 0;
    const applicationsWithCity = results.map(({ city, ...app }) => ({
      ...app,
      city: city || null,
    }));

    return NextResponse.json({ data: applicationsWithCity, total, page, limit });
  } catch (error) {
    console.error("Error fetching applications:", error);
    return NextResponse.json(
      { error: "Failed to fetch applications" },
      { status: 500 }
    );
  }
}

// POST - Submit new application (public or admin/branch on behalf)
export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    const rl = rateLimit(`application:${ip}`, 3, 60 * 60 * 1000)
    if (!rl.success) {
      return NextResponse.json({ error: 'Too many submissions. Please try again later.' }, { status: 429 })
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

      // Resolve photo (single value)
      if (byField.photoBase64?.length) {
        body.photoBase64 = byField.photoBase64[0];
      }

      // Resolve document arrays as JSON-stringified arrays
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

    // Check if this is an admin/branch submission
    const session = await auth();
    const isAdminSubmission = session && ["syndicate", "branch_head"].includes(session.user.role);
    // For syndicate admin (id: 'admin'), submittedById is null since they don't have a DB record
    const submittedById = isAdminSubmission && session.user.id !== 'admin' 
      ? parseInt(session.user.id) 
      : null;

    // For admin submissions, validate city access for branch heads
    if (isAdminSubmission && session.user.role === "branch_head") {
      const assignedCityIds = session.user.assignedCityIds || [];
      if (!assignedCityIds.includes(body.cityId)) {
        return NextResponse.json(
          { error: "You can only create applications for your assigned cities" },
          { status: 403 }
        );
      }
    }

    // Validate required fields - signature is optional for admin submissions
    const requiredFields = [
      "fullNameKu",
      "fullNameEn",
      "dateOfBirth",
      "nationalIdNumber",
      "marriageStatus",
      "bloodType",
      "collegeCertificateBase64",
      "jobLocation",
      "currentLocation",
      "phoneNumber",
      "emailAddress",
      "cityId",
      "photoBase64",
    ];

    // Signature is required only for public submissions
    if (!isAdminSubmission) {
      requiredFields.push("signatureBase64");
    }

    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Validate confirmation checkbox (required only for public submissions)
    if (!isAdminSubmission && !body.confirmationChecked) {
      return NextResponse.json(
        { error: "You must confirm that all information is true and correct" },
        { status: 400 }
      );
    }

    // Validate university degrees - at least one complete entry required
    if (body.universityDegrees) {
      try {
        const degrees = typeof body.universityDegrees === "string"
          ? JSON.parse(body.universityDegrees)
          : body.universityDegrees;
        if (!Array.isArray(degrees) || degrees.length === 0) {
          return NextResponse.json(
            { error: "At least one university degree is required" },
            { status: 400 }
          );
        }
        const first = degrees[0];
        if (!first.degreeName || !first.universityName || !first.graduationYear) {
          return NextResponse.json(
            { error: "Please complete all fields for the first university degree (degree name, university name, and graduation year)" },
            { status: 400 }
          );
        }
      } catch {
        return NextResponse.json(
          { error: "Invalid university degrees format" },
          { status: 400 }
        );
      }
    } else {
      return NextResponse.json(
        { error: "At least one university degree is required" },
        { status: 400 }
      );
    }

    // Required document fields (recommendation letter is optional)
    const requiredDocArrayFields = [
      { field: "nationalIdCardBase64", label: "National ID Card" },
      { field: "infoCardBase64", label: "Information Card" },
    ];
    for (const { field, label } of requiredDocArrayFields) {
      const val = body[field];
      if (!val) {
        return NextResponse.json(
          { error: `${label} is required / ${field} پێویستە` },
          { status: 400 }
        );
      }
      // Validate JSON array format
      try {
        const arr = typeof val === "string" ? JSON.parse(val) : val;
        if (!Array.isArray(arr) || arr.length === 0) {
          return NextResponse.json(
            { error: `${label} is required — please upload at least one file` },
            { status: 400 }
          );
        }
      } catch {
        // Might be a legacy single string — that's OK
      }
    }

    // Validate city exists
    const [city] = await db
      .select()
      .from(cities)
      .where(eq(cities.id, body.cityId));

    if (!city || !city.isActive) {
      return NextResponse.json(
        { error: "Invalid or inactive city selected" },
        { status: 400 }
      );
    }

    // Validate single base64 fields (photo, signature)
    const singleBase64Error = validateBase64Fields(body, [
      'photoBase64',
      'signatureBase64',
    ])
    if (singleBase64Error) {
      return NextResponse.json({ error: singleBase64Error }, { status: 400 })
    }

    // Validate array base64 fields (documents may be JSON arrays or legacy single strings)
    const arrayDocFields = [
      'collegeCertificateBase64',
      'nationalIdCardBase64',
      'infoCardBase64',
      'recommendationLetterBase64',
    ];
    for (const field of arrayDocFields) {
      const val = body[field];
      if (!val) continue;
      const err = validateBase64ArrayField(val, field);
      if (err) return NextResponse.json({ error: err }, { status: 400 });
    }

    // Generate unique tracking token
    const trackingToken = uuidv4();

    // Insert application
    const [newApplication] = await db
      .insert(vetApplications)
      .values({
        trackingToken,
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
        collegeCertificateBase64: body.collegeCertificateBase64,
        jobLocation: body.jobLocation,
        yearOfEmployment: body.yearOfEmployment || null,
        privateWorkDetails: body.privateWorkDetails || null,
        currentLocation: body.currentLocation,
        phoneNumber: body.phoneNumber,
        emailAddress: body.emailAddress,
        cityId: body.cityId,
        nationalIdCardBase64: body.nationalIdCardBase64,
        infoCardBase64: body.infoCardBase64,
        recommendationLetterBase64: body.recommendationLetterBase64 || null,
        confirmationChecked: isAdminSubmission ? true : body.confirmationChecked,
        signatureBase64: body.signatureBase64 || "",
        photoBase64: body.photoBase64,
        status: "pending",
        submittedById,
      })
      .returning();

    // Clean up temp uploads
    if (body.uploadSessionToken) {
      await db
        .delete(tempUploads)
        .where(eq(tempUploads.sessionToken, body.uploadSessionToken));
    }

    // Send confirmation email (optional for admin submissions)
    const shouldSendEmail = isAdminSubmission ? body.sendEmail !== false : true;
    if (shouldSendEmail && body.emailAddress) {
      const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
      const emailContent = applicationSubmittedEmail(
        body.fullNameEn,
        trackingToken,
        baseUrl
      );
      await sendEmail({
        to: body.emailAddress,
        subject: emailContent.subject,
        html: emailContent.html,
      });
    }

    return NextResponse.json(
      {
        message: "Application submitted successfully",
        trackingToken,
        id: newApplication.id,
        submittedByAdmin: isAdminSubmission,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error submitting application:", error);
    return NextResponse.json(
      { error: "Failed to submit application" },
      { status: 500 }
    );
  }
}
