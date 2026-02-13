"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import VetApplicationForm from "@/components/VetApplicationForm";

interface City {
  id: number;
  nameEn: string;
  nameKu: string;
  code: string;
}

export default function ApplyPage() {
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [trackingToken, setTrackingToken] = useState("");

  useEffect(() => {
    fetchCities();
  }, []);

  const fetchCities = async () => {
    try {
      const response = await fetch("/api/cities");
      if (!response.ok) throw new Error("Failed to fetch cities");
      const data = await response.json();
      setCities(data);
    } catch (err) {
      console.error("Error fetching cities:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = (token: string, _applicationId: number) => {
    setTrackingToken(token);
    setSubmitted(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-lg mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Application Submitted!</h1>
            <p className="text-gray-600 mb-4">
              Your application has been submitted successfully.
            </p>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 text-left">
              <p className="text-sm font-medium text-amber-800 mb-1">
                Please save this link to track your application:
              </p>
              <p dir="rtl" className="text-sm font-medium text-amber-800 mb-3">
                تکایە ئەم لینکە هەڵبگرە بۆ شوێنکەوتنی داواکاریەکەت:
              </p>
              <div className="bg-white rounded border border-amber-200 p-3">
                <p className="font-mono text-sm text-emerald-600 break-all select-all">
                  {typeof window !== "undefined" ? `${window.location.origin}/application-status/${trackingToken}` : `/application-status/${trackingToken}`}
                </p>
              </div>
            </div>
            <Link
              href={`/application-status/${trackingToken}`}
              className="inline-block px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition font-medium"
            >
              Check Application Status / شوێنکەوتنی داواکاری
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center text-emerald-600 hover:text-emerald-700 font-medium mb-6"
        >
          ← Back to Home
        </Link>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Veterinary Syndicate Membership Application
          </h1>
          <p className="text-gray-600">
            داواکاری ئەندامەتی سەندیکای پزیشکانی ڤێتێرنەری
          </p>
        </div>

        <VetApplicationForm
          cities={cities}
          isAdminMode={false}
          onSuccess={handleSuccess}
        />
      </div>
    </div>
  );
}
