"use client";

import { useState, useRef, useMemo } from "react";
import { v4 as uuidv4 } from "uuid";
import SignatureCanvas from "@/components/SignatureCanvas";
import DatePicker from "@/components/DatePicker";
import ImageCropModal from "@/components/ImageCropModal";
import MultiFileUpload from "@/components/MultiFileUpload";

interface FileEntry {
  base64: string;
  uploadId: number;
}

interface City {
  id: number;
  nameEn: string;
  nameKu: string;
  code: string;
}

interface ApplicationData {
  id: number;
  fullNameKu: string;
  fullNameEn: string;
  dateOfBirth: string;
  placeOfBirth: string | null;
  nationalIdNumber: string;
  nationalIdDate: string | null;
  marriageStatus: string;
  numberOfChildren: number;
  bloodType: string;
  scientificRank: string | null;
  collegeCertificateBase64: string;
  jobLocation: string;
  yearOfEmployment: string | null;
  privateWorkDetails: string | null;
  currentLocation: string;
  phoneNumber: string;
  emailAddress: string;
  cityId: number;
  photoBase64: string;
  nationalIdCardBase64: string | null;
  infoCardBase64: string | null;
  recommendationLetterBase64: string | null;
  signatureBase64: string;
  confirmationChecked: boolean;
  universityDegrees: string | null;
}

interface VetApplicationFormProps {
  cities: City[];
  isAdminMode?: boolean;
  preselectedCityId?: number;
  initialData?: ApplicationData;
  onSuccess: (trackingToken: string, applicationId: number) => void;
  onCancel?: () => void;
}

const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const MARRIAGE_STATUSES = ["Single", "Married", "Divorced", "Widowed"];
const SCIENTIFIC_RANKS = [
  { value: "بکالۆریۆس", label: "بکالۆریۆس / Bachelor" },
  { value: "دپلۆمی باڵا", label: "دپلۆمی باڵا / Higher Diploma" },
  { value: "ماستەر", label: "ماستەر / Master" },
  { value: "دکتۆرا", label: "دکتۆرا / PhD" },
  { value: "یاریدەدەری مامۆستا", label: "یاریدەدەری مامۆستا / Assistant Lecturer" },
  { value: "مامۆستا", label: "مامۆستا / Lecturer" },
  { value: "پرۆفیسۆری یاریدەدەر", label: "پرۆفیسۆری یاریدەدەر / Assistant Professor" },
  { value: "پرۆفیسۆر", label: "پرۆفیسۆر / Professor" },
];

interface UniversityDegree {
  degreeName: string;
  universityName: string;
  graduationYear: string;
}

export default function VetApplicationForm({
  cities,
  isAdminMode = false,
  preselectedCityId,
  initialData,
  onSuccess,
  onCancel,
}: VetApplicationFormProps) {
  const isEditMode = !!initialData;
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [photoUploading, setPhotoUploading] = useState(false);

  // Session token for grouping temp uploads
  const sessionToken = useMemo(() => uuidv4(), []);

  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);

  const [universityDegrees, setUniversityDegrees] = useState<UniversityDegree[]>(() => {
    if (initialData?.universityDegrees) {
      try {
        const parsed = JSON.parse(initialData.universityDegrees);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {}
    }
    return [{ degreeName: "", universityName: "", graduationYear: "" }];
  });

  // Track photo upload ID (for temp upload)
  const [photoUploadId, setPhotoUploadId] = useState<number | null>(null);

  // Document fields now store FileEntry[] (base64 for thumbnail + server upload ID)
  const [docFiles, setDocFiles] = useState<{
    collegeCertificateBase64: FileEntry[];
    nationalIdCardBase64: FileEntry[];
    infoCardBase64: FileEntry[];
    recommendationLetterBase64: FileEntry[];
  }>({
    collegeCertificateBase64: [],
    nationalIdCardBase64: [],
    infoCardBase64: [],
    recommendationLetterBase64: [],
  });

  const [formData, setFormData] = useState({
    // Personal Info
    fullNameKu: initialData?.fullNameKu || "",
    fullNameEn: initialData?.fullNameEn || "",
    dateOfBirth: initialData?.dateOfBirth || "",
    placeOfBirth: initialData?.placeOfBirth || "",
    nationalIdNumber: initialData?.nationalIdNumber || "",
    nationalIdDate: initialData?.nationalIdDate || "",
    marriageStatus: initialData?.marriageStatus || "",
    numberOfChildren: initialData?.numberOfChildren || 0,
    bloodType: initialData?.bloodType || "",
    // Education & Work
    scientificRank: initialData?.scientificRank || "",
    jobLocation: initialData?.jobLocation || "",
    yearOfEmployment: initialData?.yearOfEmployment || "",
    privateWorkDetails: initialData?.privateWorkDetails || "",
    // Contact
    currentLocation: initialData?.currentLocation || "",
    phoneNumber: initialData?.phoneNumber || "",
    emailAddress: initialData?.emailAddress || "",
    cityId: initialData?.cityId?.toString() || preselectedCityId?.toString() || "",
    // Photo stays as single base64 for display
    photoBase64: initialData?.photoBase64 || "",
    // Verification
    signatureBase64: initialData?.signatureBase64 || "",
    confirmationChecked: initialData?.confirmationChecked || false,
    // Admin options
    sendEmail: true,
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else if (type === "number") {
      setFormData((prev) => ({ ...prev, [name]: parseInt(value) || 0 }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
    if (!allowedTypes.includes(file.type)) {
      setError("Invalid file type. Allowed: JPG, PNG");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("File must be less than 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setCropImageSrc(reader.result as string);
    };
    reader.readAsDataURL(file);
    setError("");
  };

  const addDegree = () => {
    if (universityDegrees.length < 3) {
      setUniversityDegrees([...universityDegrees, { degreeName: "", universityName: "", graduationYear: "" }]);
    }
  };

  const removeDegree = (index: number) => {
    if (universityDegrees.length > 1) {
      setUniversityDegrees(universityDegrees.filter((_, i) => i !== index));
    }
  };

  const updateDegree = (index: number, field: keyof UniversityDegree, value: string) => {
    const updated = [...universityDegrees];
    updated[index][field] = value;
    setUniversityDegrees(updated);
  };

  // Upload photo to temp storage after cropping
  const uploadPhotoToTemp = async (base64: string) => {
    setPhotoUploading(true);
    try {
      // Delete previous photo upload if any
      if (photoUploadId) {
        fetch(
          `/api/temp-uploads?id=${photoUploadId}&sessionToken=${encodeURIComponent(sessionToken)}`,
          { method: "DELETE" }
        ).catch(() => {});
      }
      const res = await fetch("/api/temp-uploads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionToken, fieldName: "photoBase64", fileData: base64 }),
      });
      if (res.ok) {
        const { id } = await res.json();
        setPhotoUploadId(id);
      }
    } catch (err) {
      console.error("Photo upload error:", err);
    } finally {
      setPhotoUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    // Validation for public submissions
    if (!isAdminMode) {
      if (!formData.confirmationChecked) {
        setError("You must confirm that all information is true and correct");
        setSubmitting(false);
        return;
      }

      if (!formData.signatureBase64) {
        setError("Please provide your digital signature");
        setSubmitting(false);
        return;
      }
    }

    if (!formData.photoBase64) {
      setError("Please upload the ID photo");
      setSubmitting(false);
      return;
    }

    if (docFiles.collegeCertificateBase64.length === 0) {
      setError("Please upload the college certificate / تکایە بڕوانامە باربکە");
      setSubmitting(false);
      return;
    }

    if (docFiles.nationalIdCardBase64.length === 0) {
      setError("Please upload the National ID Card / تکایە کارتی نیشتیمانی باربکە");
      setSubmitting(false);
      return;
    }

    if (docFiles.infoCardBase64.length === 0) {
      setError("Please upload the Information Card / تکایە کارتی زانیاری باربکە");
      setSubmitting(false);
      return;
    }

    // Validate university degrees - at least the first entry must be fully filled
    const firstDegree = universityDegrees[0];
    if (!firstDegree.degreeName || !firstDegree.universityName || !firstDegree.graduationYear) {
      setError("Please fill in at least one complete university degree (degree name, university name, and graduation year) / تکایە لانیکەم یەک بڕوانامەی زانکۆ تەواو پڕ بکەرەوە");
      setSubmitting(false);
      return;
    }
    // Check that any additional degrees that are partially filled are complete
    for (let i = 1; i < universityDegrees.length; i++) {
      const d = universityDegrees[i];
      const hasAny = d.degreeName || d.universityName || d.graduationYear;
      const hasAll = d.degreeName && d.universityName && d.graduationYear;
      if (hasAny && !hasAll) {
        setError(`Please complete all fields for degree ${i + 1} or remove it / تکایە هەموو خانەکانی بڕوانامەی ${i + 1} پڕ بکەرەوە یان بیسڕەوە`);
        setSubmitting(false);
        return;
      }
    }

    try {
      const url = isEditMode
        ? `/api/vet-applications/${initialData.id}`
        : "/api/vet-applications";
      const method = isEditMode ? "PUT" : "POST";

      // Submit lightweight payload — files are already in temp_uploads
      const payload = JSON.stringify({
        ...formData,
        cityId: parseInt(formData.cityId),
        universityDegrees: JSON.stringify(universityDegrees),
        // Send session token so server resolves files from temp_uploads
        uploadSessionToken: sessionToken,
        // Signature stays inline (it's tiny canvas data)
        signatureBase64: formData.signatureBase64,
        sendEmail: isAdminMode ? formData.sendEmail : true,
      });

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: payload,
      });

      const responseText = await response.text();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let result: any;
      try {
        result = JSON.parse(responseText);
      } catch {
        if (!response.ok) {
          throw new Error(
            `Failed to ${isEditMode ? "update" : "submit"} application`
          );
        }
        throw new Error(`Failed to ${isEditMode ? "update" : "submit"} application`);
      }

      if (!response.ok) {
        throw new Error(result.error || `Failed to ${isEditMode ? "update" : "submit"} application`);
      }
      if (isEditMode) {
        onSuccess(result.trackingToken || "", result.id || initialData.id);
      } else {
        onSuccess(result.trackingToken, result.id);
      }
    } catch (err) {
      if (err instanceof TypeError && err.message === "Failed to fetch") {
        setError(
          "Failed to submit — there may be a network issue. Please try again. / ناردن سەرکەوتوو نەبوو — لەوانەیە کێشەی تۆڕ هەیە. تکایە دووبارە هەوڵ بدەرەوە."
        );
      } else {
        setError(err instanceof Error ? err.message : "An error occurred");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-8">
      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Admin Mode Banner */}
      {isAdminMode && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-medium">Admin Mode:</span>
            <span>Creating application on behalf of an applicant. Signature and confirmation are optional.</span>
          </div>
        </div>
      )}

      {/* 1. Personal Information */}
      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">
          <span className="text-emerald-700">1.</span> Personal Information / زانیاری کەسی
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          {/* Kurdish Name + Photo */}
          <div className="md:col-span-2">
            <div className="flex gap-4 items-start">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <span dir="rtl" className="text-base">ناوی چواری پزیشک *</span>
                  <span className="block text-xs text-gray-500">Full Name (Kurdish - 4 names)</span>
                </label>
                <input
                  type="text"
                  name="fullNameKu"
                  value={formData.fullNameKu}
                  onChange={handleChange}
                  required
                  dir="rtl"
                  placeholder="ناوی یەکەم، ناوی دووەم، ناوی سێیەم، ناوی چوارەم"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
              {/* Photo Upload (side) */}
              <div className="flex-shrink-0">
                <label className="block text-sm font-medium text-gray-700 mb-1 text-center">
                  <span dir="rtl">وێنە *</span>
                  <span className="block text-xs text-gray-500">Photo</span>
                </label>
                <div className="w-28 h-36 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden relative">
                  {formData.photoBase64 ? (
                    <img src={formData.photoBase64} alt="Photo" className="w-full h-full object-cover" />
                  ) : (
                    <svg className="w-10 h-10 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                    </svg>
                  )}
                  {photoUploading && (
                    <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                      <svg className="animate-spin h-6 w-6 text-emerald-500" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                    </div>
                  )}
                </div>
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => photoInputRef.current?.click()}
                  className="mt-2 w-full text-xs px-2 py-1 bg-emerald-50 text-emerald-700 rounded hover:bg-emerald-100"
                >
                  Upload
                </button>
              </div>
            </div>
          </div>

          {/* English Name */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <span dir="rtl" className="text-base">ناو بە زمانی ئینگلیزی *</span>
              <span className="block text-xs text-gray-500">Name in English (4 names)</span>
            </label>
            <input
              type="text"
              name="fullNameEn"
              value={formData.fullNameEn}
              onChange={handleChange}
              required
              placeholder="First Name, Second Name, Third Name, Fourth Name"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>

          {/* Date + Place of Birth */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <span dir="rtl" className="text-base">ساڵی لە دایکبوون *</span>
              <span className="block text-xs text-gray-500">Year of Birth</span>
            </label>
            <DatePicker
              value={formData.dateOfBirth}
              onChange={(value) => setFormData((prev) => ({ ...prev, dateOfBirth: value }))}
              placeholder="DD/MM/YYYY"
              maxDate={new Date()}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <span dir="rtl" className="text-base">شوێنی لە دایکبوون</span>
              <span className="block text-xs text-gray-500">Place of Birth</span>
            </label>
            <input
              type="text"
              name="placeOfBirth"
              value={formData.placeOfBirth}
              onChange={handleChange}
              dir="rtl"
              placeholder="شوێنی لە دایکبوون"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>

          {/* National ID Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <span dir="rtl" className="text-base">ژمارەی ناسنامە یان کارتی نیشتیمانی *</span>
              <span className="block text-xs text-gray-500">National ID Number</span>
            </label>
            <input
              type="text"
              name="nationalIdNumber"
              value={formData.nationalIdNumber}
              onChange={handleChange}
              required
              placeholder="ژمارەی ناسنامە"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>
          {/* National ID Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <span dir="rtl" className="text-base">ڕێکەوتی ناسنامە یان کارتی نیشتیمانی *</span>
              <span className="block text-xs text-gray-500">National ID Date</span>
            </label>
            <DatePicker
              value={formData.nationalIdDate}
              onChange={(value) => setFormData((prev) => ({ ...prev, nationalIdDate: value }))}
              placeholder="DD/MM/YYYY"
              maxDate={new Date()}
              required
            />
          </div>
        </div>
      </div>

      {/* 2. Education */}
      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">
          <span className="text-emerald-700">2.</span> Education / خوێندن
        </h2>
        <div className="space-y-4">
          {/* University Degrees (up to 3) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <span dir="rtl" className="text-base">بڕوانامەکانی زانکۆ و ناوی زانکۆیەکان و ساڵی دەرچوون *</span>
              <span className="block text-xs text-gray-500">University Degrees, University Names, and Graduation Years *</span>
            </label>
            {universityDegrees.map((degree, index) => (
              <div key={index} className="grid md:grid-cols-4 gap-2 mb-3 items-end">
                <div className="md:col-span-1">
                  <input
                    type="text"
                    value={degree.degreeName}
                    onChange={(e) => updateDegree(index, "degreeName", e.target.value)}
                    placeholder={`بڕوانامە ${index + 1}`}
                    dir="rtl"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
                  />
                </div>
                <div className="md:col-span-2">
                  <input
                    type="text"
                    value={degree.universityName}
                    onChange={(e) => updateDegree(index, "universityName", e.target.value)}
                    placeholder="ناوی زانکۆ"
                    dir="rtl"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
                  />
                </div>
                <div className="md:col-span-1 flex gap-2">
                  <select
                    value={degree.graduationYear}
                    onChange={(e) => updateDegree(index, "graduationYear", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
                  >
                    <option value="">ساڵی دەرچوون</option>
                    {Array.from({ length: new Date().getFullYear() - 1969 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                  {universityDegrees.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeDegree(index)}
                      className="px-2 py-1 text-red-600 hover:bg-red-50 rounded"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            ))}
            {universityDegrees.length < 3 && (
              <button
                type="button"
                onClick={addDegree}
                className="text-sm text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add another degree (max 3)
              </button>
            )}
          </div>

          {/* Scientific Rank */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <span dir="rtl" className="text-base">پلەی زانستی</span>
              <span className="block text-xs text-gray-500">Scientific/Academic Rank</span>
            </label>
            <select
              name="scientificRank"
              value={formData.scientificRank}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              <option value="">پلەی زانستی هەڵبژێرە</option>
              {SCIENTIFIC_RANKS.map((rank) => (
                <option key={rank.value} value={rank.value}>{rank.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 3. Work */}
      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">
          <span className="text-emerald-700">3.</span> Work / کار
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <span dir="rtl" className="text-base">شوێنی کاری ئێستا *</span>
              <span className="block text-xs text-gray-500">Current Workplace</span>
            </label>
            <input
              type="text"
              name="jobLocation"
              value={formData.jobLocation}
              onChange={handleChange}
              required
              dir="rtl"
              placeholder="شوێنی کاری ئێستا"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <span dir="rtl" className="text-base">ساڵی دامەزراندن لە فەرمانگە</span>
              <span className="block text-xs text-gray-500">Year of Employment at Office</span>
            </label>
            <input
              type="text"
              name="yearOfEmployment"
              value={formData.yearOfEmployment}
              onChange={handleChange}
              placeholder="e.g., 2015"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <span dir="rtl" className="text-base">جۆر و شوێنی کاری تایبەت (کلینک، نوسینگە، تاقیگە، کۆمپانیا)</span>
              <span className="block text-xs text-gray-500">Type & Location of Private Work (clinic, office, lab, company)</span>
            </label>
            <input
              type="text"
              name="privateWorkDetails"
              value={formData.privateWorkDetails}
              onChange={handleChange}
              dir="rtl"
              placeholder="کلینک / نوسینگە / تاقیگە / کۆمپانیا + شوێن"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* 4. Personal Details */}
      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">
          <span className="text-emerald-700">4.</span> Personal Details / زانیاری کەسی تر
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <span dir="rtl" className="text-base">باری خێزانی *</span>
              <span className="block text-xs text-gray-500">Marriage Status</span>
            </label>
            <select
              name="marriageStatus"
              value={formData.marriageStatus}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              <option value="">Select status</option>
              {MARRIAGE_STATUSES.map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <span dir="rtl" className="text-base">ژمارەی منداڵ</span>
              <span className="block text-xs text-gray-500">Number of Children</span>
            </label>
            <input
              type="number"
              name="numberOfChildren"
              value={formData.numberOfChildren}
              onChange={handleChange}
              min="0"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <span dir="rtl" className="text-base">جۆری خوێن *</span>
              <span className="block text-xs text-gray-500">Blood Type</span>
            </label>
            <select
              name="bloodType"
              value={formData.bloodType}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              <option value="">Select blood type</option>
              {BLOOD_TYPES.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 5. Contact Information */}
      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">
          <span className="text-emerald-700">5.</span> Contact Information / زانیاری پەیوەندی
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <span dir="rtl" className="text-base">شوێنی دانیشتن *</span>
              <span className="block text-xs text-gray-500">Place of Residence</span>
            </label>
            <input
              type="text"
              name="currentLocation"
              value={formData.currentLocation}
              onChange={handleChange}
              required
              dir="rtl"
              placeholder="شوێنی دانیشتن"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <span dir="rtl" className="text-base">ژمارەی مۆبایل *</span>
              <span className="block text-xs text-gray-500">Mobile Number</span>
            </label>
            <input
              type="tel"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              required
              placeholder="07501234567"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <span dir="rtl" className="text-base">ئیمەیل *</span>
              <span className="block text-xs text-gray-500">Email</span>
            </label>
            <input
              type="email"
              name="emailAddress"
              value={formData.emailAddress}
              onChange={handleChange}
              required
              placeholder="name@example.com"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <span dir="rtl" className="text-base">شار/لق *</span>
              <span className="block text-xs text-gray-500">City/Branch (digital only)</span>
            </label>
            <select
              name="cityId"
              value={formData.cityId}
              onChange={handleChange}
              required
              disabled={preselectedCityId !== undefined && cities.length === 1}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:bg-gray-100"
            >
              <option value="">Select city</option>
              {cities.map((city) => (
                <option key={city.id} value={city.id}>
                  {city.nameEn} - {city.nameKu}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 6. Attachments */}
      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">
          <span className="text-emerald-700">6.</span> <span dir="rtl">هاوپێچ (وێنەی کۆپی)</span> / Attachments (Copy Images)
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          {/* 1- Certificate */}
          <div>
            <MultiFileUpload
              label="1- بڕوانامە / Certificate"
              value={docFiles.collegeCertificateBase64}
              onChange={(files) => setDocFiles((prev) => ({ ...prev, collegeCertificateBase64: files }))}
              sessionToken={sessionToken}
              fieldName="collegeCertificateBase64"
              accept="image/*,.pdf"
              required
            />
          </div>

          {/* 2- National ID Card */}
          <div>
            <MultiFileUpload
              label="2- کارتی نیشتیمانی / National ID Card"
              value={docFiles.nationalIdCardBase64}
              onChange={(files) => setDocFiles((prev) => ({ ...prev, nationalIdCardBase64: files }))}
              sessionToken={sessionToken}
              fieldName="nationalIdCardBase64"
              accept="image/*,.pdf"
              required
            />
          </div>

          {/* 3- Information Card */}
          <div>
            <MultiFileUpload
              label="3- کارتی زانیاری / Information Card"
              value={docFiles.infoCardBase64}
              onChange={(files) => setDocFiles((prev) => ({ ...prev, infoCardBase64: files }))}
              sessionToken={sessionToken}
              fieldName="infoCardBase64"
              accept="image/*,.pdf"
              required
            />
          </div>

          {/* 4- Recommendation Letter (optional) */}
          <div>
            <MultiFileUpload
              label="4- پاڵێنامە / Recommendation Letter (Optional / ئارەزوومەندانە)"
              value={docFiles.recommendationLetterBase64}
              onChange={(files) => setDocFiles((prev) => ({ ...prev, recommendationLetterBase64: files }))}
              sessionToken={sessionToken}
              fieldName="recommendationLetterBase64"
              accept="image/*,.pdf"
            />
          </div>
        </div>
      </div>

      {/* 7. Signature & Confirmation */}
      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">
          <span className="text-emerald-700">7.</span> <span dir="rtl">ڕاگەیاندن و واژوو</span> / Declaration & Signature
          {isAdminMode && <span className="text-sm font-normal text-gray-500 ml-2">(Optional in admin mode)</span>}
        </h2>
        
        {!isAdminMode && (
          <div className="mb-6">
            <label className="flex items-start gap-3 cursor-pointer p-4 -m-4 rounded-lg hover:bg-gray-50 active:bg-gray-100 transition-colors">
              <input
                type="checkbox"
                name="confirmationChecked"
                checked={formData.confirmationChecked}
                onChange={handleChange}
                className="w-7 h-7 min-w-[1.75rem] text-emerald-600 border-gray-300 rounded focus:ring-emerald-500 mt-0.5"
              />
              <span className="text-base text-gray-700 leading-relaxed">
                I confirm that all the information provided above is true and correct to the best of my knowledge. I understand that providing false information may result in rejection of my application or revocation of membership.
                <br />
                <span dir="rtl" className="block mt-2 text-right">
                  من پشتڕاست دەکەمەوە کە هەموو ئەو زانیاریانەی کە لە سەرەوە دابینم کراوە ڕاست و دروستن. من تێدەگەم کە پێدانی زانیاری هەڵە دەبێتە هۆی ڕەتکردنەوەی داواکاریەکەم یان هەڵوەشاندنەوەی ئەندامێتیم.
                </span>
              </span>
            </label>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Digital Signature {!isAdminMode && "*"} / واژووی دیجیتاڵی
          </label>
          <SignatureCanvas
            value={formData.signatureBase64}
            onChange={(signature) =>
              setFormData((prev) => ({ ...prev, signatureBase64: signature }))
            }
          />
        </div>
      </div>

      {/* Admin Options */}
      {isAdminMode && (
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">
            Admin Options
          </h2>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              name="sendEmail"
              checked={formData.sendEmail}
              onChange={handleChange}
              className="w-5 h-5 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
            />
            <span className="text-sm text-gray-700">
              Send email notification to the applicant with the tracking token
            </span>
          </label>
        </div>
      )}

      {/* Error Message (near submit) */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Submit Button */}
      <div className="flex justify-center gap-4">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-8 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium text-lg"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="px-8 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition font-medium text-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Submitting...
            </span>
          ) : (
            isEditMode ? "Update Application / نوێکردنەوەی داواکاری" : isAdminMode ? "Create Application" : "Submit Application / ناردنی داواکاری"
          )}
        </button>
      </div>

      {/* Photo Crop Modal */}
      {cropImageSrc && (
        <ImageCropModal
          imageSrc={cropImageSrc}
          onCropComplete={(croppedBase64) => {
            setFormData((prev) => ({ ...prev, photoBase64: croppedBase64 }));
            setCropImageSrc(null);
            if (photoInputRef.current) photoInputRef.current.value = "";
            // Upload cropped photo to temp storage
            uploadPhotoToTemp(croppedBase64);
          }}
          onCancel={() => {
            setCropImageSrc(null);
            if (photoInputRef.current) photoInputRef.current.value = "";
          }}
        />
      )}
    </form>
  );
}
