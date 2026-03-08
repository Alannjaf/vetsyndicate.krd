"use client";

import React, { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface City {
  id: number;
  nameEn: string;
  nameKu: string;
  code: string;
}

interface UniversityDegree {
  degreeName: string;
  universityName: string;
  graduationYear: string;
}

interface Application {
  id: number;
  trackingToken: string;
  fullNameKu: string;
  fullNameEn: string;
  dateOfBirth: string;
  placeOfBirth: string | null;
  nationalIdNumber: string;
  nationalIdDate: string | null;
  marriageStatus: string;
  numberOfChildren: number;
  bloodType: string;
  // Education & Work
  universityDegrees: string | null;
  scientificRank: string | null;
  collegeCertificateBase64: string;
  jobLocation: string;
  yearOfEmployment: string | null;
  privateWorkDetails: string | null;
  // Contact
  currentLocation: string;
  phoneNumber: string;
  emailAddress: string;
  cityId: number;
  // Attachments
  nationalIdCardBase64: string | null;
  infoCardBase64: string | null;
  recommendationLetterBase64: string | null;
  // Verification
  confirmationChecked: boolean;
  signatureBase64: string;
  photoBase64: string;
  // Status
  status: "pending" | "approved" | "rejected";
  rejectionReason: string | null;
  createdAt: string;
  reviewedAt: string | null;
  city: City | null;
}

export default function ApplicationReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [processing, setProcessing] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [titleEn, setTitleEn] = useState("Veterinarian");
  const [titleKu, setTitleKu] = useState("پزیشکی ڤێتێرنەری");
  const [titleAr, setTitleAr] = useState("طبيب بيطري");
  const [memberId, setMemberId] = useState("");
  const [memberIdError, setMemberIdError] = useState("");
  const [checkingMemberId, setCheckingMemberId] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    fetchApplication();
  }, [id]);

  const fetchApplication = async () => {
    try {
      const response = await fetch(`/api/vet-applications/${id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch application");
      }
      const data = await response.json();
      setApplication(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  // Check member ID for duplicates with debounce
  const checkMemberIdDebounceRef = React.useRef<NodeJS.Timeout | null>(null);
  const handleMemberIdChange = (value: string) => {
    setMemberId(value);
    setMemberIdError("");
    if (checkMemberIdDebounceRef.current) {
      clearTimeout(checkMemberIdDebounceRef.current);
    }
    if (!value.trim()) return;
    setCheckingMemberId(true);
    checkMemberIdDebounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/vet-members/check-id?memberId=${encodeURIComponent(value.trim())}`);
        const data = await res.json();
        if (data.exists) {
          setMemberIdError(`Member ID "${value.trim()}" is already in use`);
        }
      } catch {} finally {
        setCheckingMemberId(false);
      }
    }, 500);
  };

  const handleApprove = async () => {
    if (!application) return;
    if (!memberId.trim()) {
      setError("Please enter a Member ID number before approving.");
      return;
    }
    if (memberIdError) {
      setError("Please fix the Member ID error before approving.");
      return;
    }
    setProcessing(true);
    setError("");

    try {
      const response = await fetch(`/api/vet-applications/${id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ titleEn, titleKu, titleAr, memberId: memberId.trim() }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to approve application");
      }

      router.push("/branch/applications");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!application || !rejectionReason.trim()) return;
    setProcessing(true);
    setError("");

    try {
      const response = await fetch(`/api/vet-applications/${id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: rejectionReason }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to reject application");
      }

      router.push("/branch/applications");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async () => {
    if (!application) return;
    setProcessing(true);
    setError("");
    try {
      const response = await fetch(`/api/vet-applications/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete application");
      }
      router.push("/branch/applications");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setShowDeleteModal(false);
    } finally {
      setProcessing(false);
    }
  };

  const handleDownloadFile = (base64Data: string, filename: string) => {
    const matches = base64Data.match(/^data:(.+);base64,(.+)$/);
    if (!matches) return;

    const mimeType = matches[1];
    const data = matches[2];

    const byteCharacters = atob(data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: mimeType });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Parse a stored value that may be a JSON array or a single base64 string
  const parseDocValue = (val: string | null): string[] => {
    if (!val) return [];
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) return parsed;
    } catch {}
    return [val];
  };

  const renderSingleAttachment = (base64: string, label: string, filename: string, index?: number) => {
    const key = index !== undefined ? `${label}-${index}` : label;
    return (
      <div key={key}>
        {base64.startsWith("data:image") ? (
          <img
            src={base64}
            alt={label}
            className="max-w-full h-auto max-h-96 rounded-lg border border-gray-200"
          />
        ) : (
          <button
            onClick={() => handleDownloadFile(base64, filename)}
            className="text-emerald-600 hover:text-emerald-700 underline flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Download {label} (PDF){index !== undefined ? ` #${index + 1}` : ""}
          </button>
        )}
      </div>
    );
  };

  const renderAttachment = (rawValue: string | null, label: string, filename: string) => {
    const files = parseDocValue(rawValue);
    if (files.length === 0) return null;
    return (
      <div>
        <p className="text-sm text-gray-500 mb-2">{label} ({files.length} file{files.length > 1 ? "s" : ""})</p>
        <div className="space-y-2">
          {files.map((file, i) => renderSingleAttachment(file, label, filename, files.length > 1 ? i : undefined))}
        </div>
      </div>
    );
  };

  const parseDegrees = (): UniversityDegree[] => {
    if (!application?.universityDegrees) return [];
    try {
      return JSON.parse(application.universityDegrees);
    } catch {
      return [];
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Application not found</p>
        <Link href="/branch/applications" className="text-emerald-600 hover:underline mt-2 inline-block">
          Back to Applications
        </Link>
      </div>
    );
  }

  const degrees = parseDegrees();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <Link
            href="/branch/applications"
            className="text-emerald-600 hover:text-emerald-700 text-sm mb-2 inline-flex items-center gap-1"
          >
            &larr; Back to Applications
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Application Review</h1>
          <p className="text-gray-600 mt-1">
            Review application details and approve or reject
          </p>
        </div>
        <span
          className={`px-3 py-1.5 rounded-full text-sm font-medium ${
            application.status === "pending"
              ? "bg-amber-100 text-amber-800"
              : application.status === "approved"
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {application.status}
        </span>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* 1. Personal Information */}
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">
              1. Personal Information / زانیاری کەسی
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Full Name (English)</p>
                <p className="font-medium text-gray-900">{application.fullNameEn}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Full Name (Kurdish)</p>
                <p className="font-medium text-gray-900" dir="rtl">{application.fullNameKu}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Date of Birth / ساڵی لە دایکبوون</p>
                <p className="font-medium text-gray-900">{application.dateOfBirth}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Place of Birth / شوێنی لە دایکبوون</p>
                <p className="font-medium text-gray-900">{application.placeOfBirth || "—"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">National ID Number / ژمارەی ناسنامە</p>
                <p className="font-medium text-gray-900">{application.nationalIdNumber}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">National ID Date / ڕێکەوتی ناسنامە</p>
                <p className="font-medium text-gray-900">{application.nationalIdDate || "—"}</p>
              </div>
            </div>
          </div>

          {/* 2. Education */}
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">
              2. Education / خوێندن
            </h2>
            {/* University Degrees */}
            {degrees.length > 0 && (
              <div className="mb-4">
                <p className="text-sm text-gray-500 mb-2">University Degrees / بڕوانامەکانی زانکۆ</p>
                <div className="space-y-2">
                  {degrees.map((degree, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                      <div className="grid md:grid-cols-3 gap-2">
                        <div>
                          <p className="text-xs text-gray-500">Degree / بڕوانامە</p>
                          <p className="font-medium text-gray-900 text-sm">{degree.degreeName || "—"}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">University / زانکۆ</p>
                          <p className="font-medium text-gray-900 text-sm">{degree.universityName || "—"}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Graduation Year / ساڵی دەرچوون</p>
                          <p className="font-medium text-gray-900 text-sm">{degree.graduationYear || "—"}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Scientific/Academic Rank / پلەی زانستی</p>
                <p className="font-medium text-gray-900">{application.scientificRank || "—"}</p>
              </div>
            </div>
          </div>

          {/* 3. Work */}
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">
              3. Work / کار
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Current Workplace / شوێنی کاری ئێستا</p>
                <p className="font-medium text-gray-900">{application.jobLocation}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Year of Employment / ساڵی دامەزراندن لە فەرمانگە</p>
                <p className="font-medium text-gray-900">{application.yearOfEmployment || "—"}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-sm text-gray-500">Private Work Details / جۆر و شوێنی کاری تایبەت</p>
                <p className="font-medium text-gray-900">{application.privateWorkDetails || "—"}</p>
              </div>
            </div>
          </div>

          {/* 4. Personal Details */}
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">
              4. Personal Details / زانیاری کەسی تر
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Marriage Status / باری خێزانی</p>
                <p className="font-medium text-gray-900">{application.marriageStatus}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Number of Children / ژمارەی منداڵ</p>
                <p className="font-medium text-gray-900">{application.numberOfChildren}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Blood Type / جۆری خوێن</p>
                <p className="font-medium text-gray-900">{application.bloodType}</p>
              </div>
            </div>
          </div>

          {/* 5. Contact Information */}
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">
              5. Contact Information / زانیاری پەیوەندی
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Place of Residence / شوێنی دانیشتن</p>
                <p className="font-medium text-gray-900">{application.currentLocation}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">City/Branch / شار/لق</p>
                <p className="font-medium text-gray-900">
                  {application.city?.nameEn} - {application.city?.nameKu} ({application.city?.code})
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Phone Number / ژمارەی مۆبایل</p>
                <p className="font-medium text-gray-900">{application.phoneNumber}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Email / ئیمەیل</p>
                <p className="font-medium text-gray-900">{application.emailAddress}</p>
              </div>
            </div>
          </div>

          {/* 6. Attachments */}
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">
              6. Attachments / هاوپێچ
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              {renderAttachment(
                application.collegeCertificateBase64,
                "Certificate / بڕوانامە",
                `certificate-${application.fullNameEn.replace(/\s+/g, "-")}.pdf`
              )}
              {renderAttachment(
                application.nationalIdCardBase64,
                "National ID Card / کارتی نیشتیمانی",
                `national-id-${application.fullNameEn.replace(/\s+/g, "-")}.pdf`
              )}
              {renderAttachment(
                application.infoCardBase64,
                "Information Card / کارتی زانیاری",
                `info-card-${application.fullNameEn.replace(/\s+/g, "-")}.pdf`
              )}
              {renderAttachment(
                application.recommendationLetterBase64,
                "Recommendation Letter / پاڵێنامە",
                `recommendation-${application.fullNameEn.replace(/\s+/g, "-")}.pdf`
              )}
              {!application.collegeCertificateBase64 &&
                !application.nationalIdCardBase64 &&
                !application.infoCardBase64 &&
                !application.recommendationLetterBase64 && (
                  <p className="text-gray-500 text-sm">No attachments uploaded</p>
                )}
            </div>
          </div>

          {/* 7. Signature & Confirmation */}
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">
              7. Declaration & Signature / ڕاگەیاندن و واژوو
            </h2>
            <div className="bg-gray-50 p-4 rounded-lg">
              {application.signatureBase64 ? (
                <img
                  src={application.signatureBase64}
                  alt="Digital Signature"
                  className="max-h-24"
                />
              ) : (
                <p className="text-gray-400 text-sm">No signature provided</p>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-2">
              <span className={application.confirmationChecked ? "text-green-600" : "text-red-600"}>
                {application.confirmationChecked ? "✓" : "✗"}
              </span>{" "}
              Applicant has confirmed all information is true and correct
            </p>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Photo */}
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Applicant Photo
            </h2>
            <div className="aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden">
              {application.photoBase64 ? (
                <img
                  src={application.photoBase64}
                  alt="Applicant"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <svg className="w-16 h-16 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                  </svg>
                </div>
              )}
            </div>
          </div>

          {/* Application Info */}
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Application Info
            </h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Submitted</p>
                <p className="font-medium text-gray-900">
                  {new Date(application.createdAt).toLocaleString()}
                </p>
              </div>
              {application.reviewedAt && (
                <div>
                  <p className="text-sm text-gray-500">Reviewed</p>
                  <p className="font-medium text-gray-900">
                    {new Date(application.reviewedAt).toLocaleString()}
                  </p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-500">Tracking Token</p>
                <p className="font-mono text-xs text-gray-600 break-all">
                  {application.trackingToken}
                </p>
              </div>
            </div>
          </div>

          {/* Edit & Delete */}
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Manage Application
            </h2>
            <div className="space-y-3">
              <Link
                href={`/branch/applications/${id}/edit`}
                className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium text-center block"
              >
                Edit Application
              </Link>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="w-full px-4 py-3 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition font-medium"
              >
                Delete Application
              </button>
            </div>
          </div>

          {/* Actions (only for pending) */}
          {application.status === "pending" && (
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Review Actions
              </h2>

              {/* Member ID field */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Member ID Number / ژمارەی ئەندامێتی <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={memberId}
                  onChange={(e) => handleMemberIdChange(e.target.value)}
                  placeholder="e.g. ERB001"
                  className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:border-transparent ${
                    memberIdError
                      ? "border-red-400 focus:ring-red-500"
                      : memberId.trim() && !checkingMemberId
                      ? "border-green-400 focus:ring-green-500"
                      : "border-gray-300 focus:ring-emerald-500"
                  }`}
                />
                {checkingMemberId && (
                  <p className="text-xs text-gray-400 mt-1">Checking availability...</p>
                )}
                {memberIdError && (
                  <p className="text-xs text-red-600 mt-1">{memberIdError}</p>
                )}
                {memberId.trim() && !memberIdError && !checkingMemberId && (
                  <p className="text-xs text-green-600 mt-1">Member ID is available</p>
                )}
              </div>

              {/* Title fields for approval */}
              <div className="space-y-3 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title (English)
                  </label>
                  <input
                    type="text"
                    value={titleEn}
                    onChange={(e) => setTitleEn(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title (Kurdish)
                  </label>
                  <input
                    type="text"
                    value={titleKu}
                    onChange={(e) => setTitleKu(e.target.value)}
                    dir="rtl"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title (Arabic)
                  </label>
                  <input
                    type="text"
                    value={titleAr}
                    onChange={(e) => setTitleAr(e.target.value)}
                    dir="rtl"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleApprove}
                  disabled={processing}
                  className="w-full px-4 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition font-medium disabled:opacity-50"
                >
                  {processing ? "Processing..." : "Approve Application"}
                </button>
                <button
                  onClick={() => setShowRejectModal(true)}
                  disabled={processing}
                  className="w-full px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium disabled:opacity-50"
                >
                  Reject Application
                </button>
              </div>
            </div>
          )}

          {/* Rejection reason (if rejected) */}
          {application.status === "rejected" && application.rejectionReason && (
            <div className="bg-red-50 rounded-xl p-6 border border-red-200">
              <h2 className="text-lg font-semibold text-red-800 mb-2">
                Rejection Reason
              </h2>
              <p className="text-red-700">{application.rejectionReason}</p>
            </div>
          )}
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Reject Application
            </h2>
            <p className="text-gray-600 mb-4">
              Please provide a reason for rejecting this application. This will be sent to the applicant.
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={4}
              placeholder="Enter rejection reason..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
            />
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectionReason("");
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectionReason.trim() || processing}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium disabled:opacity-50"
              >
                {processing ? "Rejecting..." : "Confirm Reject"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Delete Application
            </h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to permanently delete this application? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={processing}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium disabled:opacity-50"
              >
                {processing ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
