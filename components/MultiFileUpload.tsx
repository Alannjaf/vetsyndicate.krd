"use client";

import { useRef, useState } from "react";
import { compressImage } from "@/lib/utils/compress-image";

interface FileEntry {
  base64: string; // for thumbnail display
  uploadId: number; // server-side temp_uploads ID
}

interface MultiFileUploadProps {
  value: FileEntry[];
  onChange: (files: FileEntry[]) => void;
  sessionToken: string;
  fieldName: string;
  accept: string;
  maxFiles?: number;
  label: string;
  required?: boolean;
}

export default function MultiFileUpload({
  value,
  onChange,
  sessionToken,
  fieldName,
  accept,
  maxFiles = 5,
  label,
  required = false,
}: MultiFileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploadingCount, setUploadingCount] = useState(0);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remaining = maxFiles - value.length;
    if (remaining <= 0) return;

    const filesToProcess = Array.from(files).slice(0, remaining);
    setUploadingCount(filesToProcess.length);

    const newEntries: FileEntry[] = [];

    for (const file of filesToProcess) {
      // Validate file type
      const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "application/pdf"];
      if (!allowedTypes.includes(file.type)) {
        setUploadingCount((c) => c - 1);
        continue;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setUploadingCount((c) => c - 1);
        continue;
      }

      let base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });

      // Compress image files to reduce payload size; PDFs pass through
      if (file.type.startsWith("image/")) {
        base64 = await compressImage(base64);
      }

      // Upload to temp storage
      try {
        const res = await fetch("/api/temp-uploads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionToken, fieldName, fileData: base64 }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          console.error("Upload failed:", err.error || res.statusText);
          setUploadingCount((c) => c - 1);
          continue;
        }

        const { id } = await res.json();
        newEntries.push({ base64, uploadId: id });
      } catch (err) {
        console.error("Upload error:", err);
      }

      setUploadingCount((c) => c - 1);
    }

    if (newEntries.length > 0) {
      onChange([...value, ...newEntries]);
    }

    // Reset input so the same file can be selected again
    if (inputRef.current) inputRef.current.value = "";
  };

  const removeFile = async (index: number) => {
    const entry = value[index];
    // Delete from server
    if (entry.uploadId) {
      fetch(
        `/api/temp-uploads?id=${entry.uploadId}&sessionToken=${encodeURIComponent(sessionToken)}`,
        { method: "DELETE" }
      ).catch(() => {});
    }
    onChange(value.filter((_, i) => i !== index));
  };

  const isPdf = (base64: string) => base64.startsWith("data:application/pdf");

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-600">*</span>}
      </label>

      {/* Thumbnail Grid */}
      {(value.length > 0 || uploadingCount > 0) && (
        <div className="flex flex-wrap gap-2 mb-2">
          {value.map((entry, index) => (
            <div
              key={entry.uploadId}
              className="relative w-20 h-20 rounded-lg border border-gray-200 overflow-hidden group"
            >
              {isPdf(entry.base64) ? (
                <div className="w-full h-full bg-red-50 flex flex-col items-center justify-center">
                  <svg className="w-8 h-8 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zM6 20V4h7v5h5v11H6z" />
                  </svg>
                  <span className="text-xs text-red-600 font-medium mt-1">PDF</span>
                </div>
              ) : (
                <img
                  src={entry.base64}
                  alt={`File ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              )}
              <button
                type="button"
                onClick={() => removeFile(index)}
                className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white rounded-bl-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs font-bold"
              >
                ×
              </button>
            </div>
          ))}
          {/* Uploading placeholders */}
          {Array.from({ length: uploadingCount }).map((_, i) => (
            <div
              key={`uploading-${i}`}
              className="w-20 h-20 rounded-lg border border-gray-200 flex items-center justify-center bg-gray-50"
            >
              <svg className="animate-spin h-6 w-6 text-emerald-500" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
          ))}
        </div>
      )}

      {/* File Input */}
      {value.length < maxFiles && (
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple
          onChange={handleFileChange}
          disabled={uploadingCount > 0}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:bg-emerald-50 file:text-emerald-700 disabled:opacity-50"
        />
      )}

      <p className="text-xs text-gray-500 mt-1">
        Max 5MB per file. JPG, PNG, or PDF. {value.length}/{maxFiles} files uploaded.
      </p>
    </div>
  );
}
