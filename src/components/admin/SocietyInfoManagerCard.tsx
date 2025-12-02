// admin/socity heads
// src/components/admin/SocietyInfoManagerCard.tsx


import type { FC, FormEvent, MouseEvent } from "react";
import { useState } from "react";
import "../../pages/dashboards/dashboard.css";

export type SocietyInfo = {
  societyName: string;
  headName: string;
  facultyAdvisor: string;
  contactEmail: string;
  contactNumber: string;
  instagram?: string;
  facebook?: string;
  whatsapp?: string;
  membersCount?: string;
  eventsCount?: string;
  status?: string; // "Active" | "Inactive" | etc.
};

type SocietyInfoManagerCardProps = {
  title?: string;
  helperText?: string;
  initialData?: SocietyInfo;
  saveLabel?: string;
  onSave?: (data: SocietyInfo) => void;
};

const SocietyInfoManagerCard: FC<SocietyInfoManagerCardProps> = ({
  title = "Manage Society Information",
  helperText = "Update and maintain the details of a university society.",
  initialData,
  saveLabel = "Save Society Info",
  onSave,
}) => {
  const [preview, setPreview] = useState<SocietyInfo | null>(initialData ?? null);

  // Collect data from the form (uncontrolled inputs, same pattern as EventFormCard)
  const collectFormData = (form: HTMLFormElement): SocietyInfo => {
    const getVal = (name: string) =>
      (form.elements.namedItem(name) as HTMLInputElement | HTMLTextAreaElement)
        ?.value ?? "";

    return {
      societyName: getVal("societyName"),
      headName: getVal("societyHead"),
      facultyAdvisor: getVal("facultyAdvisor"),
      contactEmail: getVal("societyEmail"),
      contactNumber: getVal("societyPhone"),
      instagram: getVal("instagramLink"),
      facebook: getVal("facebookLink"),
      whatsapp: getVal("whatsappLink"),
      membersCount: getVal("membersCount"),
      eventsCount: getVal("eventsCount"),
      status: getVal("societyStatus"),
    };
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = collectFormData(form);
    onSave?.(data);
  };

  const handlePreviewClick = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    const form = e.currentTarget.form as HTMLFormElement | null;
    if (!form) return;
    const data = collectFormData(form);
    setPreview(data);
  };

  return (
    <section className="society-section" data-aos="fade-up">
      <div className="society-card">
        <h2 className="admin-section-title">{title}</h2>
        <p className="society-helper-text">{helperText}</p>

        {/* ====== FORM ====== */}
        <form className="society-form" onSubmit={handleSubmit}>
          {/* Society name */}
          <div className="society-row">
            <input
              name="societyName"
              type="text"
              required
              placeholder="Society Name (e.g. CS Society)"
              defaultValue={initialData?.societyName ?? ""}
              className="admin-input"
            />
          </div>

          {/* Head + Advisor */}
          <div className="society-row two-col">
            <input
              name="societyHead"
              type="text"
              required
              placeholder="Society Head (Student)"
              defaultValue={initialData?.headName ?? ""}
              className="admin-input"
            />
            <input
              name="facultyAdvisor"
              type="text"
              placeholder="Faculty Advisor"
              defaultValue={initialData?.facultyAdvisor ?? ""}
              className="admin-input"
            />
          </div>

          {/* Contact info */}
          <div className="society-row two-col">
            <input
              name="societyEmail"
              type="email"
              required
              placeholder="Contact Email"
              defaultValue={initialData?.contactEmail ?? ""}
              className="admin-input"
            />
            <input
              name="societyPhone"
              type="text"
              required
              placeholder="Contact Number"
              defaultValue={initialData?.contactNumber ?? ""}
              className="admin-input"
            />
          </div>

          {/* Social links */}
          <div className="society-row three-col">
            <input
              name="instagramLink"
              type="text"
              placeholder="Instagram Link"
              defaultValue={initialData?.instagram ?? ""}
              className="admin-input"
            />
            <input
              name="facebookLink"
              type="text"
              placeholder="Facebook Page Link"
              defaultValue={initialData?.facebook ?? ""}
              className="admin-input"
            />
            <input
              name="whatsappLink"
              type="text"
              placeholder="WhatsApp Group Link"
              defaultValue={initialData?.whatsapp ?? ""}
              className="admin-input"
            />
          </div>

          {/* Members + Events + Status */}
          <div className="society-row three-col">
            <input
              name="membersCount"
              type="number"
              min={0}
              placeholder="Total Members"
              defaultValue={initialData?.membersCount ?? ""}
              className="admin-input"
            />
            <input
              name="eventsCount"
              type="number"
              min={0}
              placeholder="Events Organized"
              defaultValue={initialData?.eventsCount ?? ""}
              className="admin-input"
            />
            <select
              name="societyStatus"
              defaultValue={initialData?.status ?? "Active"}
              className="admin-input society-select"
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Paused">Paused</option>
            </select>
          </div>

          {/* Actions */}
          <div className="society-actions">
            <button
              type="button"
              className="admin-btn secondary"
              onClick={handlePreviewClick}
            >
              Preview Society Card
            </button>
            <button type="submit" className="admin-btn primary">
              {saveLabel}
            </button>
          </div>
        </form>

        {/* ====== PREVIEW AREA ====== */}
        {preview && (
          <div className="society-preview">
            <h3 className="society-preview-title">
              {preview.societyName || "Society Name"}
            </h3>

            <p className="society-preview-line">
              <strong>Head:</strong> {preview.headName || "-"}{" "}
              {preview.facultyAdvisor
                ? ` | Faculty Advisor: ${preview.facultyAdvisor}`
                : ""}
            </p>

            <p className="society-preview-line">
              <strong>Contact:</strong>{" "}
              {preview.contactEmail || "-"}{" "}
              {preview.contactNumber ? ` | ${preview.contactNumber}` : ""}
            </p>

            <p className="society-preview-line">
              <strong>Members:</strong> {preview.membersCount || "-"}{" "}
              | <strong>Events:</strong> {preview.eventsCount || "-"}{" "}
              | <strong>Status:</strong> {preview.status || "Active"}
            </p>

            {(preview.instagram || preview.facebook || preview.whatsapp) && (
              <p className="society-preview-line">
                <strong>Socials:</strong>{" "}
                {preview.instagram && <>IG ✓{"  "}</>}
                {preview.facebook && <>FB ✓{"  "}</>}
                {preview.whatsapp && <>WA ✓</>}
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export default SocietyInfoManagerCard;
