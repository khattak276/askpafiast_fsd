// src/components/admin/EventFormCard.tsx
// used by admin/ society head/ uni social media head



import type { FC, FormEvent, MouseEvent } from "react";
import { useEffect, useState } from "react";
import "../../pages/dashboards/dashboard.css";

export type EventFormData = {
  title: string;
  description: string;
  date: string;
  time: string;
  venue: string;
  host: string;
  organizers: string;
  containerNumber: string;   // 🔹 new
  tabName: string;           // 🔹 new
  imageFile?: File | null;
};

type EventFormCardProps = {
  title?: string;
  helperText?: string;
  submitLabel?: string;
  onSubmit?: (data: EventFormData) => void;
};

type PreviewData = EventFormData & {
  imageUrl?: string;
};

const EventFormCard: FC<EventFormCardProps> = ({
  title = "Create New Event",
  helperText = "Fill out the form to publish an event to the updates section.",
  submitLabel = "Add Event",
  onSubmit,
}) => {
  const [preview, setPreview] = useState<PreviewData | null>(null);

  // Helper to collect all form values (including file)
  const collectFormData = (form: HTMLFormElement): PreviewData => {
    const title = (form.elements.namedItem("eventTitle") as HTMLInputElement)
      .value;
    const description = (
      form.elements.namedItem("eventDescription") as HTMLTextAreaElement
    ).value;
    const date = (form.elements.namedItem("eventDate") as HTMLInputElement)
      .value;
    const time = (form.elements.namedItem("eventTime") as HTMLInputElement)
      .value;
    const venue = (form.elements.namedItem("eventVenue") as HTMLInputElement)
      .value;
    const host = (form.elements.namedItem("eventHost") as HTMLInputElement)
      .value;
    const organizers = (
      form.elements.namedItem("eventOrganizers") as HTMLInputElement
    ).value;

    const containerNumber = (
      form.elements.namedItem("eventContainer") as HTMLInputElement
    ).value;

    const tabName = (form.elements.namedItem("eventTab") as HTMLSelectElement)
      .value;

    const fileInput = form.elements.namedItem(
      "eventImage"
    ) as HTMLInputElement | null;
    const imageFile = fileInput?.files?.[0] ?? null;
    const imageUrl = imageFile ? URL.createObjectURL(imageFile) : undefined;

    return {
      title,
      description,
      date,
      time,
      venue,
      host,
      organizers,
      containerNumber,
      tabName,
      imageFile,
      imageUrl,
    };
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = collectFormData(form);

    // You’ll get everything including containerNumber, tabName & imageFile
    onSubmit?.(data);
  };

  const handlePreviewClick = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    const form = e.currentTarget.form as HTMLFormElement | null;
    if (!form) return;

    // Clean old object URL
    if (preview?.imageUrl) {
      URL.revokeObjectURL(preview.imageUrl);
    }

    const data = collectFormData(form);
    setPreview(data);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (preview?.imageUrl) {
        URL.revokeObjectURL(preview.imageUrl);
      }
    };
  }, [preview]);

  return (
    <section className="admin-event-section" data-aos="fade-up">
      <div className="admin-event-card">
        <h2 className="admin-section-title">{title}</h2>
        <p className="admin-event-helper">{helperText}</p>

        {/* ====== FORM ====== */}
        <form className="admin-event-form" onSubmit={handleSubmit}>
          {/* Title */}
          <div className="admin-event-row">
            <input
              name="eventTitle"
              type="text"
              required
              placeholder="Event Title"
              className="admin-input"
            />
          </div>

          {/* Date + Time */}
          <div className="admin-event-row two-col">
            <input
              name="eventDate"
              type="date"
              required
              className="admin-input"
            />
            <input
              name="eventTime"
              type="time"
              required
              className="admin-input"
            />
          </div>

          {/* Venue */}
          <div className="admin-event-row">
            <input
              name="eventVenue"
              type="text"
              required
              placeholder="Venue"
              className="admin-input"
            />
          </div>

          {/* Host + Organizers (separate persons) */}
          <div className="admin-event-row two-col">
            <input
              name="eventHost"
              type="text"
              required
              placeholder="Host (Main Person In-Charge)"
              className="admin-input"
            />
            <input
              name="eventOrganizers"
              type="text"
              required
              placeholder="Organizers (Society / Team Name)"
              className="admin-input"
            />
          </div>

          {/* Container number + Tab on Updates page */}
          <div className="admin-event-row two-col">
            <input
              name="eventContainer"
              type="number"
              min={1}
              required
              placeholder="Container Number (e.g. 1, 2, 3)"
              className="admin-input"
            />

            {/* Tab selector – shared by Admin & Social Media Manager */}
            <select
              name="eventTab"
              required
              className="admin-input"
            >
              <option value="">Select Tab on Updates Page</option>
              <option value="Upcoming Events">Upcoming Events</option>
              <option value="Notice Board">Notice Board</option>
              <option value="General Updates">General Updates</option>
              <option value="Society Events">Society Events</option>
            </select>
          </div>

          {/* Description */}
          <div className="admin-event-row">
            <textarea
              name="eventDescription"
              required
              placeholder="Event Description..."
              className="admin-textarea"
            />
          </div>

          {/* Image input */}
          <div className="admin-event-row">
            <label className="admin-file-label">
              <span>Event Image (Poster / Banner)</span>
              <input
                name="eventImage"
                type="file"
                accept="image/*"
                className="admin-file-input"
              />
            </label>
          </div>

          {/* Actions */}
          <div className="admin-event-actions">
            <button
              type="button"
              className="admin-btn secondary"
              onClick={handlePreviewClick}
            >
              Preview Card
            </button>
            <button type="submit" className="admin-btn primary">
              {submitLabel}
            </button>
          </div>
        </form>

        {/* ====== PREVIEW CARD ====== */}
        {preview && (
          <div className="admin-event-preview">
            {preview.imageUrl && (
              <div className="admin-event-preview-image-wrapper">
                <img
                  src={preview.imageUrl}
                  alt={preview.title || "Event image preview"}
                  className="admin-event-preview-image"
                />
              </div>
            )}

            <h3 className="admin-event-preview-title">
              Title: {preview.title || "-"}
            </h3>

            <p className="admin-event-preview-line">
              <strong>Description:</strong>{" "}
              {preview.description?.trim() || "-"}
            </p>

            <p className="admin-event-preview-line">
              <strong>Date/Time + Venue:</strong>{" "}
              {preview.date || preview.time || preview.venue
                ? `${preview.date || "-"}${
                    preview.time ? ` @ ${preview.time}` : ""
                  } @ ${preview.venue || "-"}`
                : "-"}
            </p>

            <p className="admin-event-preview-line">
              <strong>Host:</strong> {preview.host?.trim() || "-"}
            </p>

            <p className="admin-event-preview-line">
              <strong>Organizers:</strong>{" "}
              {preview.organizers?.trim() || "-"}
            </p>

            <p className="admin-event-preview-line">
              <strong>Placement:</strong>{" "}
              {preview.containerNumber
                ? `Container ${preview.containerNumber}`
                : "-"}
              {"  —  "}
              Tab: {preview.tabName || "-"}
            </p>
          </div>
        )}
      </div>
    </section>
  );
};

export default EventFormCard;
