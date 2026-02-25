"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";

interface MemberData {
  id: number;
  memberId: string;
  fullNameKu: string;
  fullNameEn: string;
  titleKu: string;
  titleEn: string;
  titleAr: string | null;
  dateOfBirth: string;
  photoBase64: string | null;
  qrCodeId: string;
  issueDate: string;
  expiryDate: string;
  bloodGroup: string | null;
  cityCode: string | null;
  qrDataUrl: string;
}

const CARD_WIDTH = 428;
const CARD_HEIGHT = 270;

export default function MemberIdCardPage() {
  const params = useParams();
  const [member, setMember] = useState<MemberData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const frontCardRef = useRef<HTMLDivElement>(null);
  const backCardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchMember = async () => {
      try {
        const response = await fetch(`/api/vet-members/${params.id}/id-card`);
        if (!response.ok) {
          throw new Error("Failed to fetch member data");
        }
        const data = await response.json();
        setMember(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchMember();
    }
  }, [params.id]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-GB"); // DD/MM/YYYY format
  };

  const handleDownloadPDF = async () => {
    if (!frontCardRef.current || !backCardRef.current || !member) return;

    setDownloading(true);

    try {
      const [{ toPng }, { jsPDF }] = await Promise.all([
        import("html-to-image"),
        import("jspdf"),
      ]);

      const scale = 2;

      const frontImage = await toPng(frontCardRef.current, {
        quality: 1,
        pixelRatio: scale,
        backgroundColor: "#ffffff",
      });

      const backImage = await toPng(backCardRef.current, {
        quality: 1,
        pixelRatio: scale,
        backgroundColor: "#ffffff",
      });

      const pdfWidth = 85.6;
      const pdfHeight = 53.98;

      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: [pdfWidth, pdfHeight],
      });

      // Page 1: Front card (photo side)
      pdf.addImage(frontImage, "PNG", 0, 0, pdfWidth, pdfHeight);

      // Page 2: Back card (QR/ID side)
      pdf.addPage();
      pdf.addImage(backImage, "PNG", 0, 0, pdfWidth, pdfHeight);

      pdf.save(`vet-id-card-${member.memberId}.pdf`);
    } catch (err) {
      console.error("Error generating PDF:", err);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading ID Card...</p>
        </div>
      </div>
    );
  }

  if (error || !member) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">Error</div>
          <p className="text-gray-600">{error || "Member not found"}</p>
        </div>
      </div>
    );
  }

  const labelStyle: React.CSSProperties = {
    fontSize: "15px",
    color: "#1a1a1a",
    fontWeight: "normal",
    direction: "rtl",
    textAlign: "right",
    right: "15px",
    lineHeight: "1.2",
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Kurdistan Veterinary Syndicate ID Card
          </h1>
          <p className="text-gray-600 mt-1">Member ID: {member.memberId}</p>
        </div>

        {/* Download Button */}
        <div className="flex justify-center mb-6">
          <button
            onClick={handleDownloadPDF}
            disabled={downloading}
            className="px-6 py-3 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {downloading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Generating PDF...
              </>
            ) : (
              <>
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
                Download PDF
              </>
            )}
          </button>
        </div>

        {/* Cards Container */}
        <div className="flex flex-col items-center gap-6">
          {/* ==================== FRONT CARD (Photo side) ==================== */}
          <div
            ref={frontCardRef}
            id="front-card"
            className="rounded-xl shadow-2xl overflow-hidden"
            style={{
              fontFamily:
                "var(--font-rabar), var(--font-noto-naskh), Arial, sans-serif",
              width: `${CARD_WIDTH}px`,
              height: `${CARD_HEIGHT}px`,
              position: "relative",
            }}
          >
            {/* Background */}
            <img
              src="/id-card-front.jpg?v=2"
              alt="ID Card Front"
              style={{
                width: "100%",
                height: "100%",
                display: "block",
              }}
            />

            {/* Photo overlay — lower-left area below the gold stripe */}
            {member.photoBase64 && (
              <div
                style={{
                  position: "absolute",
                  top: "110px", // ← PHOTO vertical position
                  left: "25px", // ← PHOTO horizontal position
                  width: "95px", // ← PHOTO width
                  height: "115px", // ← PHOTO height
                  overflow: "hidden",
                  backgroundImage: `url(${member.photoBase64})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  backgroundRepeat: "no-repeat",
                }}
              />
            )}

            {/* Signature — in front of photo */}
            <img
              src="/signature.png"
              alt="Signature"
              style={{
                position: "absolute",
                top: "200px", // ← SIGNATURE vertical position
                left: "60px", // ← SIGNATURE horizontal position
                width: "70px", // ← SIGNATURE size width
                height: "35px", // ← SIGNATURE size height
                opacity: 0.9,
              }}
            />

            {/* Kurdish name */}
            <div
              style={{
                position: "absolute",
                top: "105px",
                left: "130px",
                right: "15px",
                textAlign: "right",
                direction: "rtl",
                fontSize: "17px",
                fontWeight: "bold",
                color: "#1a1a1a",
                lineHeight: "1.3",
              }}
            >
              دکتۆر {member.fullNameKu}
            </div>

            {/* English name */}
            <div
              style={{
                position: "absolute",
                top: "125px",
                left: "130px",
                right: "15px",
                textAlign: "right",
                fontSize: "17px",
                fontWeight: "bold",
                color: "#1a1a1a",
                lineHeight: "1.3",
              }}
            >
              Dr. {member.fullNameEn}
            </div>

            {/* Label: پیشە (Profession) */}
            <div
              style={{
                ...labelStyle,
                position: "absolute",
                top: "150px",
                left: "130px",
              }}
            >
              نازناوی پیشە/العنوان الوظيفي/ Job Title
            </div>

            {/* Title (Kurdish on first line, Arabic + English on second line) */}
            <div
              style={{
                position: "absolute",
                top: "168px",
                left: "130px",
                right: "15px",
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-end",
                gap: "0px",
              }}
            >
              <div
                style={{
                  direction: "rtl",
                  fontSize: "14px",
                  fontWeight: "normal",
                  color: "#1a1a1a",
                  textAlign: "right",
                  lineHeight: "1.15",
                }}
              >
                {member.titleKu}
              </div>
              <div
                style={{
                  fontSize: "14px",
                  fontWeight: "normal",
                  color: "#1a1a1a",
                  textAlign: "right",
                  direction: "rtl",
                  lineHeight: "1.15",
                  whiteSpace: "nowrap",
                }}
              >
                {member.titleAr || "طبيب بيطري"} / {member.titleEn}
              </div>
            </div>

            {/* Label: بەرواری لەدایکبوون (Date of Birth) */}
            <div
              style={{
                ...labelStyle,
                position: "absolute",
                top: "205px",
                left: "130px",
              }}
            >
              لەدایک بوون/تاریخ المیلاد/Date of Birth
            </div>

            {/* Date of Birth */}
            <div
              style={{
                position: "absolute",
                top: "225px",
                left: "130px",
                right: "15px",
                textAlign: "right",
                fontSize: "15px",
                fontWeight: "normal",
                color: "#1a1a1a",
                lineHeight: "1.3",
              }}
            >
              {member.dateOfBirth}
            </div>
          </div>

          {/* ==================== BACK CARD (QR/ID side) ==================== */}
          <div
            ref={backCardRef}
            id="back-card"
            className="rounded-xl shadow-2xl overflow-hidden"
            style={{
              fontFamily:
                "var(--font-rabar), var(--font-noto-naskh), Arial, sans-serif",
              width: `${CARD_WIDTH}px`,
              height: `${CARD_HEIGHT}px`,
              position: "relative",
            }}
          >
            {/* Background */}
            <img
              src="/id-card-back.jpg?v=2"
              alt="ID Card Back"
              style={{
                width: "100%",
                height: "100%",
                display: "block",
              }}
            />

            {/* QR Code — middle-left area of card body */}
            <div
              style={{
                position: "absolute",
                top: "137px",
                left: "30px",
                width: "90px",
                height: "90px",
                backgroundColor: "white",
                borderRadius: "4px",
                padding: "4px",
              }}
            >
              <img
                src={member.qrDataUrl}
                alt="QR Code"
                style={{ width: "100%", height: "100%", display: "block" }}
              />
            </div>

            {/* Label: ژمارەی ئەندامێتی (Membership Number) */}
            <div
              style={{
                ...labelStyle,
                position: "absolute",
                top: "105px",
                left: "140px",
              }}
            >
              ژمارەی ناسنامە/رقم الهوية/ID. No
            </div>

            {/* Member ID */}
            <div
              style={{
                position: "absolute",
                top: "122px",
                left: "140px",
                right: "15px",
                textAlign: "right",
                fontSize: "15px",
                fontWeight: "normal",
                color: "#1a1a1a",
                lineHeight: "1.2",
              }}
            >
              {member.memberId}
            </div>

            {/* Label: Blood Group */}
            <div
              style={{
                ...labelStyle,
                position: "absolute",
                top: "151px",
                left: "140px",
              }}
            >
              گروپی خوێن/فصيلة الدم/.B.G
            </div>

            {/* Blood Group Value */}
            <div
              style={{
                position: "absolute",
                top: "171px",
                left: "140px",
                right: "15px",
                textAlign: "right",
                fontSize: "15px",
                fontWeight: "normal",
                color: "#1a1a1a",
                lineHeight: "1.2",
              }}
            >
              {member.bloodGroup || "—"}
            </div>

            {/* Label: بەرواری بەسەرچوون (Expiry Date) */}
            <div
              style={{
                ...labelStyle,
                position: "absolute",
                top: "200px",
                left: "140px",
              }}
            >
              رێکەوتی بەسەرچوون/تاريخ النفاذ/Exp. Date
            </div>

            {/* Expiry Date */}
            <div
              style={{
                position: "absolute",
                top: "223px",
                left: "140px",
                right: "15px",
                textAlign: "right",
                fontSize: "15px",
                fontWeight: "normal",
                color: "#1a1a1a",
                lineHeight: "1.3",
              }}
            >
              {formatDate(member.expiryDate)}
            </div>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body {
            background: white !important;
          }
          button {
            display: none !important;
          }
          h1,
          p {
            display: none !important;
          }
          .max-w-lg {
            max-width: none !important;
          }
        }
      `}</style>
    </div>
  );
}
