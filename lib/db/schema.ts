import {
  pgTable,
  text,
  timestamp,
  integer,
  serial,
  jsonb,
  pgEnum,
  boolean,
} from "drizzle-orm/pg-core";

// Enums
export const userStatusEnum = pgEnum("user_status", ["active", "blocked"]);
export const qrStatusEnum = pgEnum("qr_status", ["generated", "filled"]);
export const roleEnum = pgEnum("role", ["syndicate", "clinic", "branch_head"]);
export const vetApplicationStatusEnum = pgEnum("vet_application_status", ["pending", "approved", "rejected"]);
export const vetMemberStatusEnum = pgEnum("vet_member_status", ["active", "suspended", "expired"]);
export const renewalRequestStatusEnum = pgEnum("renewal_request_status", ["pending", "approved", "rejected"]);

// Admin Users Table (Syndicate)
export const adminUsers = pgTable("admin_users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: roleEnum("role").default("syndicate").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Clinic Users Table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  accountNumber: text("account_number").notNull().unique(),
  password: text("password").notNull(),
  clinicName: text("clinic_name").notNull(),
  contactInfo: text("contact_info"),
  status: userStatusEnum("status").default("active").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  createdBy: text("created_by").notNull(),
});

// QR Code Batches Table
export const qrCodeBatches = pgTable("qr_code_batches", {
  id: serial("id").primaryKey(),
  quantity: integer("quantity").notNull(),
  generatedAt: timestamp("generated_at").defaultNow().notNull(),
  generatedBy: text("generated_by").notNull(),
  generatedByName: text("generated_by_name").notNull(),
});

// QR Codes Table
export const qrCodes = pgTable("qr_codes", {
  id: serial("id").primaryKey(),
  batchId: integer("batch_id"),
  qrCodeId: text("qr_code_id").notNull().unique(),
  status: qrStatusEnum("status").default("generated").notNull(),
  generatedAt: timestamp("generated_at").defaultNow().notNull(),
  generatedBy: text("generated_by").notNull(),
});

// Pet Profiles Table (Current State)
export const petProfiles = pgTable("pet_profiles", {
  id: serial("id").primaryKey(),
  qrCodeId: text("qr_code_id").notNull().unique(),
  petName: text("pet_name"),
  species: text("species"),
  breed: text("breed"),
  dateOfBirth: text("date_of_birth"),
  age: text("age"),
  gender: text("gender"),
  color: text("color"),
  notableFeatures: text("notable_features"),
  // Owner information
  ownerName: text("owner_name"),
  ownerAddress: text("owner_address"),
  ownerCity: text("owner_city"),
  ownerCountry: text("owner_country"),
  ownerPhone: text("owner_phone"),
  ownerEmail: text("owner_email"),
  secondaryContact: text("secondary_contact"),
  // Transponder/Microchip
  transponderCode: text("transponder_code"),
  transponderAppliedDate: text("transponder_applied_date"),
  transponderLocation: text("transponder_location"),
  // Tattoo (optional)
  tattooCode: text("tattoo_code"),
  tattooAppliedDate: text("tattoo_applied_date"),
  tattooLocation: text("tattoo_location"),
  // Issuing clinic information
  issuingVetName: text("issuing_vet_name"),
  issuingVetAddress: text("issuing_vet_address"),
  issuingVetPostalCode: text("issuing_vet_postal_code"),
  issuingVetCity: text("issuing_vet_city"),
  issuingVetCountry: text("issuing_vet_country"),
  issuingVetPhone: text("issuing_vet_phone"),
  issuingVetEmail: text("issuing_vet_email"),
  // Other
  photoBase64: text("photo_base64"),
  allergies: text("allergies"),
  chronicConditions: text("chronic_conditions"),
  currentMedications: text("current_medications"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  lastEditedBy: text("last_edited_by"),
  lastEditedByName: text("last_edited_by_name"),
  lastEditedAt: timestamp("last_edited_at"),
  // Passport sections lock - prevents clinics from editing after first submission
  passportSectionsLocked: text("passport_sections_locked")
    .default("false")
    .notNull(),
});

// Pet Profile Versions Table (Full History)
export const petProfileVersions = pgTable("pet_profile_versions", {
  id: serial("id").primaryKey(),
  profileId: integer("profile_id").notNull(),
  versionNumber: integer("version_number").notNull(),
  editorId: integer("editor_id"),
  editorName: text("editor_name").notNull(),
  editorRole: text("editor_role").notNull(),
  editedAt: timestamp("edited_at").defaultNow().notNull(),
  petData: jsonb("pet_data").notNull(),
  changeDescription: text("change_description"),
});

// Vaccinations Table (Linked to Versions)
export const vaccinations = pgTable("vaccinations", {
  id: serial("id").primaryKey(),
  versionId: integer("version_id").notNull(),
  vaccinationType: text("vaccination_type").notNull(),
  vaccinationDate: text("vaccination_date").notNull(),
  nextDueDate: text("next_due_date"),
  batchNumber: text("batch_number"),
  notes: text("notes"),
});

// Rabies Vaccinations Table (Linked to Versions)
export const rabiesVaccinations = pgTable("rabies_vaccinations", {
  id: serial("id").primaryKey(),
  versionId: integer("version_id").notNull(),
  manufacturer: text("manufacturer"),
  vaccineName: text("vaccine_name"),
  batchNumber: text("batch_number"),
  vaccinationDate: text("vaccination_date"),
  validFrom: text("valid_from"),
  validUntil: text("valid_until"),
  authorizedVeterinarian: text("authorized_veterinarian"),
  notes: text("notes"),
});

// Parasite Treatments Table (Linked to Versions)
export const parasiteTreatments = pgTable("parasite_treatments", {
  id: serial("id").primaryKey(),
  versionId: integer("version_id").notNull(),
  manufacturer: text("manufacturer"),
  productName: text("product_name"),
  treatmentDate: text("treatment_date"),
  validUntil: text("valid_until"),
  authorizedVeterinarian: text("authorized_veterinarian"),
  notes: text("notes"),
});

// Other Treatments Table (Linked to Versions)
export const otherTreatments = pgTable("other_treatments", {
  id: serial("id").primaryKey(),
  versionId: integer("version_id").notNull(),
  manufacturer: text("manufacturer"),
  vaccineName: text("vaccine_name"),
  batchNumber: text("batch_number"),
  vaccinationDate: text("vaccination_date"),
  validUntil: text("valid_until"),
  authorizedVeterinarian: text("authorized_veterinarian"),
  notes: text("notes"),
});

// Syndicate Members Table (Organizational Structure)
export const syndicateMembers = pgTable("syndicate_members", {
  id: serial("id").primaryKey(),
  nameEn: text("name_en").notNull(),           // English name
  nameKu: text("name_ku").notNull(),           // Kurdish name
  titleEn: text("title_en").notNull(),         // Position in English
  titleKu: text("title_ku").notNull(),         // Position in Kurdish
  photoBase64: text("photo_base64"),           // Photo as base64 (nullable for avatar fallback)
  parentId: integer("parent_id"),              // Parent member ID for hierarchy
  displayOrder: integer("display_order").default(0), // Order among siblings
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ============================================
// VETERINARY SYNDICATE MEMBERSHIP TABLES
// ============================================

// Cities Table - Admin-managed list of syndicate branch cities
export const cities = pgTable("cities", {
  id: serial("id").primaryKey(),
  nameEn: text("name_en").notNull(),
  nameKu: text("name_ku").notNull(),
  code: text("code").notNull().unique(),  // e.g., "ERB", "SLM", "DHK"
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Vet Applications Table - Stores all membership applications
export const vetApplications = pgTable("vet_applications", {
  id: serial("id").primaryKey(),
  trackingToken: text("tracking_token").notNull().unique(), // UUID for status checking
  
  // Personal info
  fullNameKu: text("full_name_ku").notNull(),       // Full name in Kurdish (4 names)
  fullNameEn: text("full_name_en").notNull(),       // Full name in English (4 names)
  dateOfBirth: text("date_of_birth").notNull(),
  placeOfBirth: text("place_of_birth"),             // NEW: Place of birth
  nationalIdNumber: text("national_id_number").notNull(),
  nationalIdDate: text("national_id_date"),              // Date of national ID
  marriageStatus: text("marriage_status").notNull(),
  numberOfChildren: integer("number_of_children").default(0),
  bloodType: text("blood_type").notNull(),
  
  // Education & Work
  universityDegrees: text("university_degrees"),    // NEW: JSON array of degrees
  scientificRank: text("scientific_rank"),          // NEW: Academic/scientific rank
  collegeCertificateBase64: text("college_certificate_base64").notNull(),
  jobLocation: text("job_location").notNull(),      // Current workplace
  yearOfEmployment: text("year_of_employment"),     // NEW: Year of employment at office
  privateWorkDetails: text("private_work_details"), // NEW: Type & location of private work
  
  // Contact
  currentLocation: text("current_location").notNull(), // Place of residence
  phoneNumber: text("phone_number").notNull(),
  emailAddress: text("email_address").notNull(),
  cityId: integer("city_id").notNull(),  // FK to cities - which branch will handle this
  
  // Attachments
  nationalIdCardBase64: text("national_id_card_base64"),     // NEW: National ID card copy
  infoCardBase64: text("info_card_base64"),                  // NEW: Information card copy
  recommendationLetterBase64: text("recommendation_letter_base64"), // NEW: Recommendation letter
  
  // Verification
  confirmationChecked: boolean("confirmation_checked").default(false).notNull(),
  signatureBase64: text("signature_base64").notNull(),
  photoBase64: text("photo_base64").notNull(),
  
  // Status
  status: vetApplicationStatusEnum("status").default("pending").notNull(),
  rejectionReason: text("rejection_reason"),
  reviewedBy: integer("reviewed_by"),  // FK to adminUsers
  reviewedAt: timestamp("reviewed_at"),
  
  // Submission tracking (for admin/branch submissions on behalf of applicant)
  submittedById: integer("submitted_by_id"),  // FK to adminUsers (null = self-submitted)
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Vet Members Table - Approved members with ID info
export const vetMembers = pgTable("vet_members", {
  id: serial("id").primaryKey(),
  applicationId: integer("application_id").notNull(),  // FK to vetApplications
  memberId: text("member_id").notNull().unique(),      // Auto-generated: 00001, 00002...
  
  // Copied from application for ID card
  fullNameKu: text("full_name_ku").notNull(),
  fullNameEn: text("full_name_en").notNull(),
  titleEn: text("title_en").notNull().default("Veterinarian"),
  titleKu: text("title_ku").notNull().default("پزیشکی ڤێتێرنەری"),
  titleAr: text("title_ar").default("طبيب بيطري"),
  dateOfBirth: text("date_of_birth").notNull(),
  photoBase64: text("photo_base64").notNull(),
  
  // Additional member data (copied for reference)
  nationalIdNumber: text("national_id_number"),
  phoneNumber: text("phone_number"),
  emailAddress: text("email_address"),
  jobLocation: text("job_location"),
  scientificRank: text("scientific_rank"),  // NEW: Academic/scientific rank

  // ID details
  qrCodeId: text("qr_code_id").notNull().unique(),
  issueDate: timestamp("issue_date").defaultNow().notNull(),
  expiryDate: timestamp("expiry_date").notNull(),
  
  // Status
  status: vetMemberStatusEnum("status").default("active").notNull(),
  suspensionReason: text("suspension_reason"),
  
  // Management
  cityId: integer("city_id").notNull(),  // FK to cities
  createdBy: integer("created_by").notNull(),  // FK to adminUsers who approved
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  updatedBy: integer("updated_by"),  // FK to adminUsers who last updated
});

// Branch Assignments Table - Links admin users to cities
export const branchAssignments = pgTable("branch_assignments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),    // FK to adminUsers
  cityId: integer("city_id").notNull(),    // FK to cities
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Renewal Requests Table - Track renewal requests from members
export const renewalRequests = pgTable("renewal_requests", {
  id: serial("id").primaryKey(),
  memberId: integer("member_id").notNull(),  // FK to vetMembers
  requestedAt: timestamp("requested_at").defaultNow().notNull(),
  status: renewalRequestStatusEnum("status").default("pending").notNull(),
  processedBy: integer("processed_by"),  // FK to adminUsers
  processedAt: timestamp("processed_at"),
  notes: text("notes"),
});

// Temp Uploads Table - Stores individual file uploads before form submission
export const tempUploads = pgTable("temp_uploads", {
  id: serial("id").primaryKey(),
  sessionToken: text("session_token").notNull(),
  fieldName: text("field_name").notNull(),
  fileData: text("file_data").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Types
export type TempUpload = typeof tempUploads.$inferSelect;
export type NewTempUpload = typeof tempUploads.$inferInsert;
export type AdminUser = typeof adminUsers.$inferSelect;
export type NewAdminUser = typeof adminUsers.$inferInsert;
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type QrCodeBatch = typeof qrCodeBatches.$inferSelect;
export type NewQrCodeBatch = typeof qrCodeBatches.$inferInsert;
export type QrCode = typeof qrCodes.$inferSelect;
export type NewQrCode = typeof qrCodes.$inferInsert;
export type PetProfile = typeof petProfiles.$inferSelect;
export type NewPetProfile = typeof petProfiles.$inferInsert;
export type PetProfileVersion = typeof petProfileVersions.$inferSelect;
export type NewPetProfileVersion = typeof petProfileVersions.$inferInsert;
export type Vaccination = typeof vaccinations.$inferSelect;
export type NewVaccination = typeof vaccinations.$inferInsert;
export type RabiesVaccination = typeof rabiesVaccinations.$inferSelect;
export type NewRabiesVaccination = typeof rabiesVaccinations.$inferInsert;
export type ParasiteTreatment = typeof parasiteTreatments.$inferSelect;
export type NewParasiteTreatment = typeof parasiteTreatments.$inferInsert;
export type OtherTreatment = typeof otherTreatments.$inferSelect;
export type NewOtherTreatment = typeof otherTreatments.$inferInsert;
export type SyndicateMember = typeof syndicateMembers.$inferSelect;
export type NewSyndicateMember = typeof syndicateMembers.$inferInsert;

// Vet Membership Types
export type City = typeof cities.$inferSelect;
export type NewCity = typeof cities.$inferInsert;
export type VetApplication = typeof vetApplications.$inferSelect;
export type NewVetApplication = typeof vetApplications.$inferInsert;
export type VetMember = typeof vetMembers.$inferSelect;
export type NewVetMember = typeof vetMembers.$inferInsert;
export type BranchAssignment = typeof branchAssignments.$inferSelect;
export type NewBranchAssignment = typeof branchAssignments.$inferInsert;
export type RenewalRequest = typeof renewalRequests.$inferSelect;
export type NewRenewalRequest = typeof renewalRequests.$inferInsert;
