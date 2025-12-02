// src/components/admin/AppContentControlCard.tsx

// used by admin/ university social media head
import type { FC, ChangeEvent } from "react";
import { useState } from "react";
import "../../pages/dashboards/dashboard.css";

type PageKey =
  | "home"
  | "about"
  | "academic-info"
  | "rules"
  | "navigation"
  | "updates";

type AssetItem = {
  id: string;
  label: string;
  type: "image" | "section";
  selected?: boolean;
};

type PageContentSettings = {
  heroTitle: string;
  heroSubtitle: string;
};

type AppContentControlCardProps = {
  role?: "admin" | "socialMediaManager";
  onSaveChanges?: (payload: {
    page: PageKey;
    content: PageContentSettings;
    assets: AssetItem[];
  }) => void;
};

const PAGE_LABELS: Record<PageKey, string> = {
  home: "Home Page",
  about: "About Page",
  "academic-info": "Academic Information Page",
  rules: "Rules Page",
  navigation: "Navigation / Map Page",
  updates: "Updates / Upcoming Events Page",
};

const DEFAULT_ASSETS: Record<PageKey, AssetItem[]> = {
  home: [
    { id: "h1", label: "Hero Background Image", type: "image" },
    { id: "h2", label: "Welcome Section Image", type: "image" },
    { id: "h3", label: "Highlight Cards Section", type: "section" },
  ],
  about: [
    { id: "a1", label: "Campus Tour Main Image", type: "image" },
    { id: "a2", label: "Vision & Mission Block", type: "section" },
  ],
  "academic-info": [
    { id: "ac1", label: "Departments Banner", type: "image" },
    { id: "ac2", label: "Programs List Section", type: "section" },
  ],
  rules: [
    { id: "r1", label: "Rules PDF Button Block", type: "section" },
    { id: "r2", label: "Code of Conduct Highlight", type: "section" },
  ],
  navigation: [
    { id: "n1", label: "Map Screenshot / Thumbnail", type: "image" },
    { id: "n2", label: "Live Map Container", type: "section" },
  ],
  updates: [
    { id: "u1", label: "Main Updates Banner", type: "image" },
    { id: "u2", label: "Daily Updates Strip", type: "section" },
    { id: "u3", label: "Events Grid", type: "section" },
  ],
};

const DEFAULT_CONTENT: Record<PageKey, PageContentSettings> = {
  home: {
    heroTitle: "",
    heroSubtitle: "",
  },
  about: {
    heroTitle: "",
    heroSubtitle: "",
  },
  "academic-info": {
    heroTitle: "",
    heroSubtitle: "",
  },
  rules: {
    heroTitle: "",
    heroSubtitle: "",
  },
  navigation: {
    heroTitle: "",
    heroSubtitle: "",
  },
  updates: {
    heroTitle: "",
    heroSubtitle: "",
  },
};

const AppContentControlCard: FC<AppContentControlCardProps> = ({
  role = "admin",
  onSaveChanges,
}) => {
  const [selectedPage, setSelectedPage] = useState<PageKey>("home");
  const [assetsByPage, setAssetsByPage] =
    useState<Record<PageKey, AssetItem[]>>(DEFAULT_ASSETS);
  const [contentByPage, setContentByPage] =
    useState<Record<PageKey, PageContentSettings>>(DEFAULT_CONTENT);

  const currentAssets = assetsByPage[selectedPage] ?? [];
  const currentContent = contentByPage[selectedPage] ?? {
    heroTitle: "",
    heroSubtitle: "",
  };

  const handlePageChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value as PageKey;
    setSelectedPage(value);
  };

  const handleHeroTitleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setContentByPage((prev) => ({
      ...prev,
      [selectedPage]: {
        ...prev[selectedPage],
        heroTitle: value,
      },
    }));
  };

  const handleHeroSubtitleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setContentByPage((prev) => ({
      ...prev,
      [selectedPage]: {
        ...prev[selectedPage],
        heroSubtitle: value,
      },
    }));
  };

  const handleToggleAssetSelected = (id: string) => {
    setAssetsByPage((prev) => {
      const updated = { ...prev };
      updated[selectedPage] = (prev[selectedPage] ?? []).map((asset) =>
        asset.id === id ? { ...asset, selected: !asset.selected } : asset
      );
      return updated;
    });
  };

  const handleAddImageSlot = () => {
    setAssetsByPage((prev) => {
      const existing = prev[selectedPage] ?? [];
      const newId = `${selectedPage}-img-${existing.length + 1}`;
      const newItem: AssetItem = {
        id: newId,
        label: `Extra Image Slot ${existing.length + 1}`,
        type: "image",
      };
      return {
        ...prev,
        [selectedPage]: [...existing, newItem],
      };
    });
  };

  const handleRemoveSelected = () => {
    setAssetsByPage((prev) => {
      const existing = prev[selectedPage] ?? [];
      const filtered = existing.filter((asset) => !asset.selected);
      return {
        ...prev,
        [selectedPage]: filtered,
      };
    });
  };

  const handleSave = () => {
    const payload = {
      page: selectedPage,
      content: currentContent,
      assets: currentAssets,
    };

    console.log(`[${role}] content panel save:`, payload);
    onSaveChanges?.(payload);
  };

  return (
    <section
      className="admin-content-section"
      data-aos="fade-up"
    >
      <div className="admin-content-card">
        {/* Header: title + page selector */}
        <div className="admin-content-header">
          <div>
            <h2 className="admin-section-title">
              App Content Control Panel
            </h2>
            <p className="admin-event-helper">
              Select a page, tweak its main heading and manage key image/section
              slots. This panel is shared between Admin and University Social Media Manager.
            </p>
          </div>

          <div className="admin-page-select">
            <label htmlFor="contentPageSelect">Page:</label>
            <select
              id="contentPageSelect"
              value={selectedPage}
              onChange={handlePageChange}
              className="admin-input"
            >
              {Object.entries(PAGE_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Main layout – text settings + assets list */}
        <div className="admin-content-layout">
          {/* LEFT: Text settings */}
          <div className="admin-content-text-panel">
            <h3 className="admin-content-subtitle">
              Page Hero Text
            </h3>
            <p className="admin-content-helper">
              This usually controls the main heading + subtitle on that page
              (for example the big text bar on Home or the title block on Updates).
            </p>

            <div className="admin-event-row">
              <input
                type="text"
                className="admin-input"
                placeholder="Main Hero Heading (e.g. Welcome to PAF-IAST)"
                value={currentContent.heroTitle}
                onChange={handleHeroTitleChange}
              />
            </div>

            <div className="admin-event-row">
              <textarea
                className="admin-textarea"
                placeholder="Hero Subtitle / Tagline (e.g. Your smart university assistant for campus life.)"
                value={currentContent.heroSubtitle}
                onChange={handleHeroSubtitleChange}
              />
            </div>
          </div>

          {/* RIGHT: Assets list */}
          <div className="admin-content-assets-panel">
            <h3 className="admin-content-subtitle">
              Page Assets (Images & Sections)
            </h3>
            <p className="admin-content-helper">
              Select which blocks you want to manage. For now these are logical
              slots – later you can connect them to real images and sections on each page.
            </p>

            <div className="admin-asset-list">
              {currentAssets.length === 0 && (
                <p className="admin-content-helper">
                  No assets configured yet. Use &quot;Add Image Slot&quot; to create one.
                </p>
              )}

              {currentAssets.map((asset) => (
                <button
                  key={asset.id}
                  type="button"
                  className={`admin-asset-item ${
                    asset.selected ? "selected" : ""
                  }`}
                  onClick={() => handleToggleAssetSelected(asset.id)}
                >
                  <span className="admin-asset-label">{asset.label}</span>
                  <span className={`admin-asset-tag asset-${asset.type}`}>
                    {asset.type === "image" ? "IMAGE" : "SECTION"}
                  </span>
                </button>
              ))}
            </div>

            <div className="admin-content-actions">
              <button
                type="button"
                className="admin-btn secondary"
                onClick={handleAddImageSlot}
              >
                Add Image Slot
              </button>
              <button
                type="button"
                className="admin-btn secondary"
                onClick={handleRemoveSelected}
              >
                Remove Selected
              </button>
            </div>
          </div>
        </div>

        {/* Bottom save row */}
        <div className="admin-content-actions bottom">
          <button
            type="button"
            className="admin-btn primary"
            onClick={handleSave}
          >
            Save Content Settings
          </button>
        </div>
      </div>
    </section>
  );
};

export default AppContentControlCard;
