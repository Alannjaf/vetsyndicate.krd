import Link from "next/link";
import Image from "next/image";
import { auth } from "@/lib/auth/auth";
import LogoutButton from "@/components/LogoutButton";
import dynamic from "next/dynamic";

const OrgChart = dynamic(() => import("@/components/OrgChart"), {
  loading: () => (
    <div className="flex justify-center items-center py-20">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600" />
    </div>
  ),
});

export default async function Home() {
  const session = await auth();

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white">
      {/* Header */}
      <header className="container mx-auto px-4 py-6 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-3">
          <Image src="/Logo.svg" alt="Logo" width={50} height={50} />
          <span className="text-xl font-bold text-emerald-700 hidden sm:block">Veterinarians Syndicate</span>
        </Link>
        <div className="flex gap-4 items-center">
          {session ? (
            <>
              <Link
                href={
                  session.user.role === "syndicate"
                    ? "/syndicate/dashboard"
                    : "/clinic/dashboard"
                }
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
              >
                Go to Dashboard
              </Link>
              <LogoutButton />
            </>
          ) : (
            <Link
              href="/login"
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
            >
              Login
            </Link>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="flex justify-center mb-8">
          <Image src="/Logo.svg" alt="Veterinarians Syndicate Logo" width={150} height={150} />
        </div>
        <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
          Veterinarians Syndicate in Kurdistan Region of Iraq
        </h2>
        <p className="text-2xl text-emerald-600 font-semibold mb-4 max-w-2xl mx-auto">
          Healthy Animals. Safe Food. Stronger Communities
        </p>
        <p className="text-lg text-gray-500 mb-8 max-w-3xl mx-auto">
          A comprehensive platform for veterinary clinics and the syndicate to
          manage pet health records, vaccinations, and digital passports.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link
            href="/apply"
            className="px-8 py-3 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition text-lg font-semibold shadow-lg shadow-amber-200"
          >
            Apply for Membership / داواکاری ئەندامەتی
          </Link>
          {session ? (
            <Link
              href={
                session.user.role === "syndicate"
                  ? "/syndicate/dashboard"
                  : "/clinic/dashboard"
              }
              className="px-8 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition text-lg font-semibold"
            >
              Go to Dashboard
            </Link>
          ) : (
            <Link
              href="/login"
              className="px-8 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition text-lg font-semibold"
            >
              Clinic Login
            </Link>
          )}
          <Link
            href="/scan"
            className="px-8 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition text-lg font-semibold"
          >
            Scan QR Code
          </Link>
        </div>
      </section>

      {/* About Section */}
      <section className="py-20 bg-gradient-to-r from-emerald-800 to-teal-700">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
              <div className="flex-shrink-0">
                <div className="w-32 h-32 md:w-40 md:h-40 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/20">
                  <Image src="/Logo.svg" alt="Logo" width={96} height={96} className="w-20 h-20 md:w-24 md:h-24" />
                </div>
              </div>
              <div className="text-center md:text-left">
                <h3 className="text-3xl font-bold text-white mb-4">About Us</h3>
                <p className="text-lg text-emerald-100 leading-relaxed">
                  The <span className="font-semibold text-white">Veterinarians Syndicate in Kurdistan Region of Iraq</span>, 
                  founded in <span className="font-semibold text-amber-300">1992</span>, is the professional body representing 
                  veterinarians across the Kurdistan Region of Iraq. We advance animal health and welfare, safeguard public 
                  health through a <span className="italic text-white">One Health</span> approach, and uphold professional 
                  standards in veterinary practice, education, and ethics.
                </p>
                <p className="text-emerald-200 mt-4">
                  The Syndicate serves as a trusted partner to government, academia, and industry, supporting evidence-based 
                  policy, continuous professional development, and services that protect both animals and people.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Veterinarian CTA Section */}
      <section className="py-20 bg-gradient-to-br from-amber-50 to-yellow-50">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mb-2">
              Are You a Veterinarian?
            </h3>
            <p className="text-2xl font-semibold text-amber-600 mb-4" dir="rtl">
              ئایا تۆ پزیشکی ڤێتێرنەرییت؟
            </p>
            <p className="text-lg text-gray-600 mb-4 max-w-2xl mx-auto">
              Join the Veterinarians Syndicate in Kurdistan Region of Iraq. Apply online for membership and become part of a professional community advancing animal health and welfare.
            </p>
            <p className="text-lg text-gray-500 mb-8 max-w-2xl mx-auto" dir="rtl">
              ئەندام بە لە سەندیکای پزیشکانی ڤێتێرنەری هەرێمی کوردستانی عێراق. بە ئۆنلاین داواکاری ئەندامەتی بکە و ببە بەشێک لە کۆمەڵگەیەکی پیشەیی کە لە پێناو تەندروستی و خۆشگوزەرانی ئاژەڵاندا کار دەکات.
            </p>
            <Link
              href="/apply"
              className="inline-block px-10 py-4 bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition text-xl font-bold shadow-lg shadow-amber-200 hover:shadow-xl hover:shadow-amber-300"
            >
              Apply for Membership / داواکاری ئەندامەتی
            </Link>
          </div>
        </div>
      </section>

      {/* Organizational Structure Section */}
      <section className="container mx-auto px-4 py-20">
        <h3 className="text-3xl font-bold text-center text-gray-900 mb-4">
          Organizational Structure
        </h3>
        <p className="text-center text-gray-600 mb-8 max-w-2xl mx-auto">
          Our leadership team dedicated to advancing veterinary medicine in Kurdistan
        </p>
        <p className="text-center text-sm text-gray-500 mb-8">
          Click on any member with subordinates to expand or collapse
        </p>
        <OrgChart />
      </section>

      {/* Pet Passport Portal Section */}
      <section className="py-20 bg-gradient-to-br from-emerald-50 to-teal-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">
              Pet Passport Portal
            </h3>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              The Pet Passport Portal of the Veterinarians Syndicate in Kurdistan Region of Iraq 
              is an official record of a pet&apos;s identity, vaccinations, and health status.
            </p>
          </div>

          {/* Info Cards */}
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-12">
            {/* For Pet Owners */}
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-emerald-100">
              <div className="w-14 h-14 bg-emerald-100 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-7 h-7 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-3">For Pet Owners</h4>
              <p className="text-gray-600 text-sm leading-relaxed mb-4">
                Scan the QR code printed in your passport or enter the numeric code to view your pet&apos;s latest verified record.
              </p>
              <p className="text-gray-500 text-sm italic">
                Records are read-only to the public and time-stamped by the issuing clinic.
              </p>
            </div>

            {/* For Veterinary Clinics */}
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-emerald-100">
              <div className="w-14 h-14 bg-teal-100 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-7 h-7 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-3">For Veterinary Clinics</h4>
              <p className="text-gray-600 text-sm leading-relaxed mb-4">
                Sign in with your clinic account to issue new passports, update vaccinations, and record treatments.
              </p>
              <ul className="text-gray-500 text-sm space-y-2">
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>Unique numeric + QR code per passport</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>All edits are audit-logged</span>
                </li>
              </ul>
            </div>

            {/* Data Protection */}
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-emerald-100">
              <div className="w-14 h-14 bg-amber-100 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-7 h-7 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-3">Data Protection</h4>
              <p className="text-gray-600 text-sm leading-relaxed mb-4">
                Owner details are minimized; medical entries follow The Syndicate standards.
              </p>
              <p className="text-gray-500 text-sm italic">
                Read-only public views enhance transparency while protecting privacy.
              </p>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/scan"
              className="px-8 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition text-lg font-semibold shadow-lg shadow-emerald-200"
            >
              Access Pet Passport Portal
            </Link>
            <Link
              href="/login"
              className="px-8 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition text-lg font-semibold shadow-lg shadow-teal-200"
            >
              Clinic Login
            </Link>
            <Link
              href="/scan"
              className="px-8 py-3 bg-white text-emerald-700 border-2 border-emerald-600 rounded-lg hover:bg-emerald-50 transition text-lg font-semibold"
            >
              Verify a Passport
            </Link>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20 bg-white border-t border-gray-200">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">
              Get in Touch
            </h3>
            <p className="text-gray-600 max-w-xl mx-auto">
              Have questions? Reach out to us through any of the channels below.
            </p>
          </div>
          
          <div className="max-w-4xl mx-auto">
            {/* Main Contact Info */}
            <div className="grid md:grid-cols-3 gap-8 text-center mb-12">
              {/* Address */}
              <div>
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Address</h4>
                <p className="text-gray-600 text-sm">
                  Street 120m - Mnara city2<br />
                  Erbil, Iraq
                </p>
              </div>

              {/* General Email */}
              <div>
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Email</h4>
                <a href="mailto:info@vetsyndicate.krd" className="text-emerald-600 hover:text-emerald-700 text-sm">
                  info@vetsyndicate.krd
                </a>
              </div>

              {/* Website */}
              <div>
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                  </svg>
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Website</h4>
                <a href="https://vetsyndicate.krd" target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:text-emerald-700 text-sm">
                  vetsyndicate.krd
                </a>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-200 my-12"></div>

            {/* Branch Contacts */}
            <div className="grid md:grid-cols-2 gap-12">
              {/* Branch Emails */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-6 text-center md:text-left">Branch Emails</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">Erbil Branch</span>
                    <a href="mailto:erbil.branch@vetsyndicate.krd" className="text-emerald-600 hover:text-emerald-700 text-sm">erbil.branch@vetsyndicate.krd</a>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">Duhok Branch</span>
                    <a href="mailto:duhok.branch@vetsyndicate.krd" className="text-emerald-600 hover:text-emerald-700 text-sm">duhok.branch@vetsyndicate.krd</a>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">Zakho Branch</span>
                    <a href="mailto:zakho.branch@vetsyndicate.krd" className="text-emerald-600 hover:text-emerald-700 text-sm">zakho.branch@vetsyndicate.krd</a>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-gray-600">International Affairs</span>
                    <a href="mailto:Zhigger.abozaid@vetsyndicate.krd" className="text-emerald-600 hover:text-emerald-700 text-sm">Zhigger.abozaid@vetsyndicate.krd</a>
                  </div>
                </div>
              </div>

              {/* Phone Numbers */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-6 text-center md:text-left">Phone Numbers</h4>
                <div className="grid grid-cols-2 gap-4">
                  <a href="tel:+9647509004033" className="flex items-center gap-2 text-gray-700 hover:text-emerald-600 transition">
                    <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <span className="text-sm">+964 750 900 4033</span>
                  </a>
                  <a href="tel:+9647509004022" className="flex items-center gap-2 text-gray-700 hover:text-emerald-600 transition">
                    <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <span className="text-sm">+964 750 900 4022</span>
                  </a>
                  <a href="tel:+9647509004722" className="flex items-center gap-2 text-gray-700 hover:text-emerald-600 transition">
                    <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <span className="text-sm">+964 750 900 4722</span>
                  </a>
                  <a href="tel:+9647509004766" className="flex items-center gap-2 text-gray-700 hover:text-emerald-600 transition">
                    <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <span className="text-sm">+964 750 900 4766</span>
                  </a>
                  <a href="tel:+9647509004733" className="flex items-center gap-2 text-gray-700 hover:text-emerald-600 transition">
                    <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <span className="text-sm">+964 750 900 4733</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 mt-20">
        <div className="container mx-auto px-4 text-center">
          <div className="flex justify-center mb-4">
            <Image src="/Logo.svg" alt="Logo" width={60} height={60} className="opacity-80" />
          </div>
          <p className="text-emerald-400 font-semibold mb-2">Veterinarians Syndicate in Kurdistan Region of Iraq</p>
          <p className="text-gray-400 text-sm mb-4">Healthy Animals. Safe Food. Stronger Communities</p>
          <p className="text-gray-500 text-sm">&copy; 2025 Veterinarians Syndicate. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
