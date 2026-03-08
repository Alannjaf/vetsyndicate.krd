"use client";

import { useState, useEffect, use, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatDate } from "@/lib/utils/date";
import DatePicker from "@/components/DatePicker";

interface City {
  id: number;
  nameEn: string;
  nameKu: string;
  code: string;
}

interface Member {
  id: number;
  memberId: string;
  applicationId: number;
  fullNameKu: string;
  fullNameEn: string;
  titleEn: string;
  titleKu: string;
  titleAr: string | null;
  dateOfBirth: string;
  photoBase64: string;
  nationalIdNumber: string | null;
  phoneNumber: string | null;
  emailAddress: string | null;
  jobLocation: string | null;
  educationLevel: string | null;
  qrCodeId: string;
  issueDate: string;
  expiryDate: string;
  status: "active" | "suspended" | "expired";
  suspensionReason: string | null;
  cityId: number;
  city: City | null;
}

export default function AdminMemberDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [processing, setProcessing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [suspensionReason, setSuspensionReason] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [editData, setEditData] = useState({
    memberId: "",
    fullNameKu: "",
    fullNameEn: "",
    titleEn: "",
    titleKu: "",
    titleAr: "",
    dateOfBirth: "",
    phoneNumber: "",
    emailAddress: "",
    jobLocation: "",
    educationLevel: "",
    photoBase64: "",
  });
  const [memberIdError, setMemberIdError] = useState("");
  const [checkingMemberId, setCheckingMemberId] = useState(false);
  const checkMemberIdDebounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchMember();
  }, [id]);

  const fetchMember = async () => {
    try {
      const response = await fetch(`/api/vet-members/${id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch member");
      }
      const data = await response.json();
      setMember(data);
      setEditData({
        memberId: data.memberId || "",
        fullNameKu: data.fullNameKu || "",
        fullNameEn: data.fullNameEn || "",
        titleEn: data.titleEn || "",
        titleKu: data.titleKu || "",
        titleAr: data.titleAr || "",
        dateOfBirth: data.dateOfBirth || "",
        phoneNumber: data.phoneNumber || "",
        emailAddress: data.emailAddress || "",
        jobLocation: data.jobLocation || "",
        educationLevel: data.educationLevel || "",
        photoBase64: data.photoBase64 || "",
      });
      setMemberIdError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be less than 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setEditData((prev) => ({
        ...prev,
        photoBase64: reader.result as string,
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleMemberIdChange = (value: string) => {
    setEditData({ ...editData, memberId: value });
    setMemberIdError("");
    if (checkMemberIdDebounceRef.current) {
      clearTimeout(checkMemberIdDebounceRef.current);
    }
    if (!value.trim() || value.trim() === member?.memberId) return;
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

  const handleSave = async () => {
    if (memberIdError) {
      setError("Please fix the Member ID error before saving.");
      return;
    }
    if (!editData.memberId.trim()) {
      setError("Member ID is required.");
      return;
    }
    setProcessing(true);
    setError("");

    try {
      const response = await fetch(`/api/vet-members/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update member");
      }

      await fetchMember();
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setProcessing(false);
    }
  };

  const handleRenew = async () => {
    setProcessing(true);
    setError("");

    try {
      const response = await fetch(`/api/vet-members/${id}/renew`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to renew membership");
      }

      await fetchMember();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setProcessing(false);
    }
  };

  const handleSuspend = async () => {
    if (!suspensionReason.trim()) return;
    setProcessing(true);
    setError("");

    try {
      const response = await fetch(`/api/vet-members/${id}/suspend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ suspend: true, reason: suspensionReason }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to suspend member");
      }

      await fetchMember();
      setShowSuspendModal(false);
      setSuspensionReason("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setProcessing(false);
    }
  };

  const handleReactivate = async () => {
    setProcessing(true);
    setError("");

    try {
      const response = await fetch(`/api/vet-members/${id}/suspend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ suspend: false }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to reactivate member");
      }

      await fetchMember();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async () => {
    setProcessing(true);
    setError("");

    try {
      const response = await fetch(`/api/vet-members/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete member");
      }

      router.push("/syndicate/vet-members");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setProcessing(false);
    }
  };

  const isExpiringSoon = (expiryDate: string) => {
    const expiry = new Date(expiryDate);
    const now = new Date();
    const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
  };

  const isExpired = (expiryDate: string) => {
    return new Date(expiryDate) < new Date();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Member not found</p>
        <Link href="/syndicate/vet-members" className="text-emerald-600 hover:underline mt-2 inline-block">
          Back to Members
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <Link
            href="/syndicate/vet-members"
            className="text-emerald-600 hover:text-emerald-700 text-sm mb-2 inline-flex items-center gap-1"
          >
            ← Back to Members
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Member Details</h1>
        </div>
        <div className="flex gap-2">
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
            >
              Edit Member
            </button>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
          <button onClick={() => setError("")} className="float-right text-red-500">&times;</button>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {isEditing ? (
            /* Edit Form */
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">
                Edit Member Information
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Member ID Number / ژمارەی ئەندامێتی
                  </label>
                  <input
                    type="text"
                    value={editData.memberId}
                    onChange={(e) => handleMemberIdChange(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:border-transparent ${
                      memberIdError
                        ? "border-red-400 focus:ring-red-500"
                        : editData.memberId.trim() && editData.memberId.trim() !== member?.memberId && !checkingMemberId
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
                  {editData.memberId.trim() && editData.memberId.trim() !== member?.memberId && !memberIdError && !checkingMemberId && (
                    <p className="text-xs text-green-600 mt-1">Member ID is available</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name (English)
                  </label>
                  <input
                    type="text"
                    value={editData.fullNameEn}
                    onChange={(e) => setEditData({ ...editData, fullNameEn: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name (Kurdish)
                  </label>
                  <input
                    type="text"
                    value={editData.fullNameKu}
                    onChange={(e) => setEditData({ ...editData, fullNameKu: e.target.value })}
                    dir="rtl"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title (English)
                  </label>
                  <input
                    type="text"
                    value={editData.titleEn}
                    onChange={(e) => setEditData({ ...editData, titleEn: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title (Kurdish)
                  </label>
                  <input
                    type="text"
                    value={editData.titleKu}
                    onChange={(e) => setEditData({ ...editData, titleKu: e.target.value })}
                    dir="rtl"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title (Arabic)
                  </label>
                  <input
                    type="text"
                    value={editData.titleAr}
                    onChange={(e) => setEditData({ ...editData, titleAr: e.target.value })}
                    dir="rtl"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date of Birth
                  </label>
                  <DatePicker
                    value={editData.dateOfBirth}
                    onChange={(value) => setEditData({ ...editData, dateOfBirth: value })}
                    placeholder="DD/MM/YYYY"
                    maxDate={new Date()}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={editData.phoneNumber}
                    onChange={(e) => setEditData({ ...editData, phoneNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={editData.emailAddress}
                    onChange={(e) => setEditData({ ...editData, emailAddress: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Job Location
                  </label>
                  <input
                    type="text"
                    value={editData.jobLocation}
                    onChange={(e) => setEditData({ ...editData, jobLocation: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Photo
                  </label>
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-24 bg-gray-100 rounded-lg overflow-hidden">
                      {editData.photoBase64 ? (
                        <img src={editData.photoBase64} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-emerald-50 file:text-emerald-700"
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={processing}
                  className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition font-medium disabled:opacity-50"
                >
                  {processing ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          ) : (
            /* View Mode */
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">
                Member Information
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Full Name (English)</p>
                  <p className="font-medium text-gray-900">{member.fullNameEn}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Full Name (Kurdish)</p>
                  <p className="font-medium text-gray-900" dir="rtl">{member.fullNameKu}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Title</p>
                  <p className="font-medium text-gray-900">{member.titleEn}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Date of Birth</p>
                  <p className="font-medium text-gray-900">{member.dateOfBirth}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Phone Number</p>
                  <p className="font-medium text-gray-900">{member.phoneNumber || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email Address</p>
                  <p className="font-medium text-gray-900">{member.emailAddress || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Job Location</p>
                  <p className="font-medium text-gray-900">{member.jobLocation || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Education Level</p>
                  <p className="font-medium text-gray-900">{member.educationLevel || "N/A"}</p>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          {!isEditing && (
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">
                Actions
              </h2>
              <div className="flex flex-wrap gap-3">
                <Link
                  href={`/member-id-card/${member.id}`}
                  target="_blank"
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                  </svg>
                  View ID Card
                </Link>

                <button
                  onClick={handleRenew}
                  disabled={processing}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2 disabled:opacity-50"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Renew Membership
                </button>

                {member.status === "suspended" ? (
                  <button
                    onClick={handleReactivate}
                    disabled={processing}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2 disabled:opacity-50"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Reactivate
                  </button>
                ) : (
                  <button
                    onClick={() => setShowSuspendModal(true)}
                    className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                    </svg>
                    Suspend
                  </button>
                )}

                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Photo & ID */}
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
            <div className="aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden mb-4">
              {member.photoBase64 ? (
                <img src={member.photoBase64} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <svg className="w-16 h-16 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                  </svg>
                </div>
              )}
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500">Member ID</p>
              <p className="text-2xl font-bold text-emerald-600 font-mono">{member.memberId}</p>
            </div>
          </div>

          {/* Status & Dates */}
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Status</h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Current Status</p>
                <span
                  className={`inline-block px-2 py-1 text-sm rounded-full font-medium ${
                    member.status === "active"
                      ? "bg-green-100 text-green-800"
                      : member.status === "suspended"
                      ? "bg-red-100 text-red-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {member.status}
                </span>
              </div>
              {member.suspensionReason && (
                <div>
                  <p className="text-sm text-gray-500">Suspension Reason</p>
                  <p className="text-red-600">{member.suspensionReason}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-500">Issue Date</p>
                <p className="font-medium">{formatDate(member.issueDate)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Expiry Date</p>
                <p
                  className={`font-medium ${
                    isExpired(member.expiryDate)
                      ? "text-red-600"
                      : isExpiringSoon(member.expiryDate)
                      ? "text-amber-600"
                      : ""
                  }`}
                >
                  {formatDate(member.expiryDate)}
                  {isExpired(member.expiryDate) && " (Expired)"}
                  {isExpiringSoon(member.expiryDate) && " (Expiring Soon)"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">City/Branch</p>
                <p className="font-medium">
                  {member.city?.code} - {member.city?.nameEn}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">QR Code ID</p>
                <p className="font-mono text-xs text-gray-600">{member.qrCodeId}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Suspend Modal */}
      {showSuspendModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Suspend Member</h2>
            <p className="text-gray-600 mb-4">
              Please provide a reason for suspending this member.
            </p>
            <textarea
              value={suspensionReason}
              onChange={(e) => setSuspensionReason(e.target.value)}
              rows={3}
              placeholder="Enter suspension reason..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
            />
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => {
                  setShowSuspendModal(false);
                  setSuspensionReason("");
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSuspend}
                disabled={!suspensionReason.trim() || processing}
                className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition font-medium disabled:opacity-50"
              >
                {processing ? "Suspending..." : "Confirm Suspend"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-lg font-semibold text-red-600 mb-4">Delete Member</h2>
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete this member? This action cannot be undone.
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
                {processing ? "Deleting..." : "Delete Member"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
