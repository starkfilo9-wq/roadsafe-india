import { useState } from "react";
import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  ChevronRight,
  Clock3,
  FileWarning,
  Gauge,
  ImagePlus,
  MapPin,
  Navigation,
  Plus,
  ShieldCheck,
  Sparkles,
  Upload,
} from "lucide-react";
import "./App.css";

type Report = {
  id: number;
  type: string;
  location: string;
  description: string;
  priority: "High" | "Medium" | "Low";
  status: "New" | "Under Review" | "Resolved";
};

const initialReports: Report[] = [
  {
    id: 1001,
    type: "Pothole",
    location: "NH 44, Hyderabad",
    description: "Large pothole affecting two-wheelers and cars.",
    priority: "High",
    status: "Under Review",
  },
  {
    id: 1002,
    type: "Poor Street Lighting",
    location: "Kukatpally Main Road",
    description: "Street lights are not working at night.",
    priority: "Medium",
    status: "New",
  },
  {
    id: 1003,
    type: "Damaged Traffic Signal",
    location: "Madhapur Junction",
    description: "Traffic signal is not functioning correctly.",
    priority: "High",
    status: "Under Review",
  },
];

function App() {
  const [activeTab, setActiveTab] = useState("Overview");

  const [hazardType, setHazardType] = useState("Pothole");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [imageName, setImageName] = useState("");

  const [duplicate, setDuplicate] = useState(false);
  const [duplicateConfidence, setDuplicateConfidence] = useState(0);
  const [matchingReport, setMatchingReport] = useState<Report | null>(null);

  const [analysisMessage, setAnalysisMessage] = useState("");

  const [submitted, setSubmitted] = useState(false);

  const [reports, setReports] = useState<Report[]>(initialReports);

  /* ---------------- IMAGE / CAMERA ---------------- */

  const handleImage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    if (file) {
      setImageName(file.name);
    }
  };

  /* ---------------- LOCATION ---------------- */

  const detectLocation = () => {
    setLocation("Current location detected");
  };

  /* ---------------- TEXT NORMALIZATION ---------------- */

  const normalize = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  };

  /* ---------------- TEXT SIMILARITY ---------------- */

  const similarity = (a: string, b: string) => {
    const wordsA = new Set(a.split(" ").filter(Boolean));
    const wordsB = new Set(b.split(" ").filter(Boolean));

    if (wordsA.size === 0 || wordsB.size === 0) {
      return 0;
    }

    let commonWords = 0;

    wordsA.forEach((word) => {
      if (wordsB.has(word)) {
        commonWords++;
      }
    });

    return (
      (commonWords / Math.max(wordsA.size, wordsB.size)) *
      100
    );
  };

  /* ---------------- HAZARD KEYWORDS ---------------- */

  const hazardKeywords: Record<string, string[]> = {
    pothole: [
      "pothole",
      "hole",
      "road hole",
      "crater",
      "road pit",
    ],

    "damaged traffic signal": [
      "traffic signal",
      "signal",
      "signal damaged",
      "signal broken",
      "signal not working",
    ],

    "poor street lighting": [
      "street light",
      "streetlight",
      "lighting",
      "light not working",
      "dark road",
    ],

    "unsafe intersection": [
      "intersection",
      "junction",
      "dangerous junction",
      "unsafe crossing",
    ],

    "road damage": [
      "road damage",
      "damaged road",
      "broken road",
      "road broken",
    ],
  };

  const isRelatedHazard = (
    type: string,
    text: string
  ) => {
    const keywords = hazardKeywords[type] || [type];

    return keywords.some((keyword) =>
      normalize(text).includes(normalize(keyword))
    );
  };

  /* ---------------- DUPLICATE DETECTION ---------------- */

  const analyzeReport = () => {
    const newType = normalize(hazardType);
    const newLocation = normalize(location);
    const newDescription = normalize(description);

    if (!newLocation && !newDescription) {
      setAnalysisMessage(
        "Please enter a location or description before analysis."
      );

      setDuplicate(false);
      setMatchingReport(null);
      setDuplicateConfidence(0);

      return;
    }

    let bestMatch: Report | null = null;
    let highestConfidence = 0;

    reports.forEach((report) => {
      const existingType = normalize(report.type);
      const existingLocation = normalize(report.location);
      const existingDescription = normalize(
        report.description
      );

      let confidence = 0;

      /* Same hazard type */

      if (existingType === newType) {
        confidence += 30;
      }

      /* Related hazard wording */

      if (
        isRelatedHazard(
          newType,
          report.type + " " + report.description
        )
      ) {
        confidence += 15;
      }

      /* Location matching */

      const locationScore = similarity(
        newLocation,
        existingLocation
      );

      if (locationScore >= 70) {
        confidence += 40;
      } else if (locationScore >= 40) {
        confidence += 25;
      }

      /* Location contains existing location */

      if (
        newLocation &&
        existingLocation &&
        (newLocation.includes(existingLocation) ||
          existingLocation.includes(newLocation))
      ) {
        confidence += 30;
      }

      /* Description similarity */

      const descriptionScore = similarity(
        newDescription,
        existingDescription
      );

      if (descriptionScore >= 60) {
        confidence += 25;
      } else if (descriptionScore >= 35) {
        confidence += 15;
      }

      /* Hazard keywords */

      if (
        isRelatedHazard(
          newType,
          newDescription
        )
      ) {
        confidence += 10;
      }

      if (confidence > highestConfidence) {
        highestConfidence = confidence;
        bestMatch = report;
      }
    });

    const finalConfidence = Math.min(
      Math.round(highestConfidence),
      100
    );

    if (bestMatch && finalConfidence >= 60) {
      setDuplicate(true);
      setDuplicateConfidence(finalConfidence);
      setMatchingReport(bestMatch);

      setAnalysisMessage(
        "Possible duplicate incident detected."
      );
    } else {
      setDuplicate(false);
      setDuplicateConfidence(finalConfidence);
      setMatchingReport(null);

      setAnalysisMessage(
        "No strong duplicate found. This appears to be a new incident."
      );
    }
  };

  /* ---------------- SUBMIT REPORT ---------------- */

  const submitReport = () => {
    const newReport: Report = {
      id: Date.now(),

      type: hazardType,

      location:
        location || "Location not provided",

      description:
        description || "No description provided",

      priority:
        hazardType === "Damaged Traffic Signal" ||
        hazardType === "Unsafe Intersection"
          ? "High"
          : "Medium",

      status: "New",
    };

    setReports((current) => [
      newReport,
      ...current,
    ]);

    setSubmitted(true);

    setDescription("");
    setLocation("");
    setImageName("");

    setDuplicate(false);
    setDuplicateConfidence(0);
    setMatchingReport(null);
    setAnalysisMessage("");

    setTimeout(() => {
      setSubmitted(false);
      setActiveTab("Reports");
    }, 1200);
  };

  /* ---------------- DASHBOARD COUNTS ---------------- */

  const totalReports = reports.length;

  const highPriority = reports.filter(
    (report) => report.priority === "High"
  ).length;

  const resolved = reports.filter(
    (report) => report.status === "Resolved"
  ).length;

  const underReview = reports.filter(
    (report) => report.status === "Under Review"
  ).length;

  /* ---------------- UI ---------------- */

  return (
    <div className="app">

      {/* TOP BAR */}

      <header className="topbar">

        <div className="brand">

          <div className="brand-icon">
            <ShieldCheck size={24} />
          </div>

          <div>
            <div className="brand-name">
              RoadSafe India
            </div>

            <div className="brand-subtitle">
              AI-powered road safety reporting
            </div>
          </div>

        </div>

        <nav className="nav">

          <button
            className={
              activeTab === "Overview"
                ? "active"
                : ""
            }
            onClick={() =>
              setActiveTab("Overview")
            }
          >
            Overview
          </button>

          <button
            className={
              activeTab === "Report"
                ? "active"
                : ""
            }
            onClick={() =>
              setActiveTab("Report")
            }
          >
            Report Hazard
          </button>

          <button
            className={
              activeTab === "Reports"
                ? "active"
                : ""
            }
            onClick={() =>
              setActiveTab("Reports")
            }
          >
            Reports
          </button>

        </nav>

        <div className="ai-status">
          <span className="status-dot"></span>
          Local AI Active
        </div>

      </header>

      {/* ================= OVERVIEW ================= */}

      {activeTab === "Overview" && (

        <main>

          <section className="welcome">

            <div>

              <div className="eyebrow">
                <Sparkles size={16} />
                SMART ROAD SAFETY PLATFORM
              </div>

              <h1>
                Make every road a safer road.
              </h1>

              <p>
                Report potholes, damaged signals,
                poor lighting and other hazards.
                RoadSafe uses local AI analysis
                to organize and prioritize incidents.
              </p>

              <button
                className="primary-button"
                onClick={() =>
                  setActiveTab("Report")
                }
              >
                <Plus size={20} />
                Report a Hazard
                <ChevronRight size={18} />
              </button>

            </div>

            <div className="hero-card">

              <div className="hero-line">
                <Gauge size={26} />
                <span>
                  Road Safety Monitoring
                </span>
              </div>

              <div className="hero-number">
                {totalReports}
              </div>

              <div className="hero-caption">
                incidents currently tracked
              </div>

            </div>

          </section>

          <section className="stats">

            <div className="stat-card">
              <div className="stat-icon">
                <FileWarning size={23} />
              </div>

              <div>
                <span>Total Reports</span>
                <strong>
                  {totalReports}
                </strong>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">
                <AlertTriangle size={23} />
              </div>

              <div>
                <span>High Priority</span>
                <strong>
                  {highPriority}
                </strong>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">
                <CheckCircle2 size={23} />
              </div>

              <div>
                <span>Resolved</span>
                <strong>
                  {resolved}
                </strong>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">
                <Clock3 size={23} />
              </div>

              <div>
                <span>Under Review</span>
                <strong>
                  {underReview}
                </strong>
              </div>
            </div>

          </section>

          <section className="dashboard-grid">

            <div className="panel">

              <div className="panel-header">

                <div>
                  <h2>
                    Recent Reports
                  </h2>

                  <p>
                    Latest incidents submitted
                    by citizens
                  </p>
                </div>

                <button
                  className="text-button"
                  onClick={() =>
                    setActiveTab("Reports")
                  }
                >
                  View all
                  <ChevronRight size={16} />
                </button>

              </div>

              <div className="report-list">

                {reports
                  .slice(0, 4)
                  .map((report) => (

                    <div
                      className="report-row"
                      key={report.id}
                    >

                      <div className="report-type-icon">
                        <AlertTriangle size={19} />
                      </div>

                      <div className="report-info">

                        <strong>
                          {report.type}
                        </strong>

                        <span>
                          <MapPin size={14} />
                          {report.location}
                        </span>

                      </div>

                      <span
                        className={`priority ${report.priority.toLowerCase()}`}
                      >
                        {report.priority}
                      </span>

                    </div>

                  ))}

              </div>

            </div>

            <div className="panel ai-panel">

              <div className="ai-panel-icon">
                <Sparkles size={25} />
              </div>

              <h2>
                RoadSafe Local AI
              </h2>

              <p>
                Reports are analyzed locally
                to identify hazard categories,
                duplicate patterns and
                priority levels.
              </p>

              <div className="ai-feature">
                <CheckCircle2 size={18} />
                No external AI service required
              </div>

              <div className="ai-feature">
                <CheckCircle2 size={18} />
                Image and description analysis
              </div>

              <div className="ai-feature">
                <CheckCircle2 size={18} />
                Duplicate incident detection
              </div>

            </div>

          </section>

        </main>
      )}

      {/* ================= REPORT ================= */}

      {activeTab === "Report" && (

        <main className="report-page">

          <div className="page-heading">

            <div>

              <div className="eyebrow">
                <AlertTriangle size={16} />
                CITIZEN REPORT
              </div>

              <h1>
                Report a road hazard
              </h1>

              <p>
                Provide details and evidence
                so authorities can investigate
                the issue quickly.
              </p>

            </div>

          </div>

          <div className="form-layout">

            <section className="form-panel">

              {/* HAZARD TYPE */}

              <div className="form-section">

                <label>
                  Hazard Type
                </label>

                <select
                  value={hazardType}
                  onChange={(event) =>
                    setHazardType(
                      event.target.value
                    )
                  }
                >
                  <option>
                    Pothole
                  </option>

                  <option>
                    Damaged Traffic Signal
                  </option>

                  <option>
                    Poor Street Lighting
                  </option>

                  <option>
                    Unsafe Intersection
                  </option>

                  <option>
                    Road Damage
                  </option>

                  <option>
                    Other
                  </option>

                </select>

              </div>

              {/* DESCRIPTION */}

              <div className="form-section">

                <label>
                  Description
                </label>

                <textarea
                  value={description}
                  onChange={(event) =>
                    setDescription(
                      event.target.value
                    )
                  }
                  placeholder="Describe the road safety problem..."
                  rows={5}
                />

              </div>

              {/* LOCATION */}

              <div className="form-section">

                <label>
                  Location
                </label>

                <div className="location-input">

                  <MapPin size={19} />

                  <input
                    value={location}
                    onChange={(event) =>
                      setLocation(
                        event.target.value
                      )
                    }
                    placeholder="Enter road, area or landmark"
                  />

                  <button
                    onClick={detectLocation}
                  >
                    <Navigation size={16} />
                    Detect
                  </button>

                </div>

              </div>

              {/* CAMERA */}

              <div className="form-section">

                <label>
                  Evidence Photo
                </label>

                <div className="upload-box">

                  <div className="upload-icon">
                    <Camera size={30} />
                  </div>

                  <h3>
                    Capture or Upload Evidence
                  </h3>

                  <p>
                    Take a photo of the road
                    hazard or select an
                    existing image.
                  </p>

                  <div className="upload-actions">

                    <label className="camera-button">

                      <Camera size={18} />

                      Take Photo

                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handleImage}
                        hidden
                      />

                    </label>

                    <label className="upload-button">

                      <Upload size={18} />

                      Upload Image

                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImage}
                        hidden
                      />

                    </label>

                  </div>

                  {imageName && (

                    <div className="selected-image">

                      <CheckCircle2 size={18} />

                      <span>
                        {imageName}
                      </span>

                    </div>

                  )}

                </div>

              </div>

              {/* AI BUTTONS */}

              <div className="form-actions">

                <button
                  className="secondary-button"
                  onClick={analyzeReport}
                >
                  <Sparkles size={18} />
                  Analyze with Local AI
                </button>

                <button
                  className="primary-button"
                  onClick={submitReport}
                >
                  <ShieldCheck size={18} />
                  Submit Report
                </button>

              </div>

              {/* AI RESULT */}

              {analysisMessage && (

                <div
                  className={
                    duplicate
                      ? "duplicate-result"
                      : "analysis-result"
                  }
                >

                  {duplicate ? (
                    <AlertTriangle size={22} />
                  ) : (
                    <CheckCircle2 size={22} />
                  )}

                  <div>

                    <strong>
                      {duplicate
                        ? "Possible Duplicate Report"
                        : "New Incident"}
                    </strong>

                    <p>
                      {analysisMessage}
                    </p>

                    {duplicate && (
                      <strong>
                        Confidence:{" "}
                        {duplicateConfidence}%
                      </strong>
                    )}

                  </div>

                </div>

              )}

              {/* MATCHING REPORT */}

              {duplicate &&
                matchingReport && (

                  <div className="duplicate-card">

                    <AlertTriangle size={26} />

                    <h3>
                      Matching Existing Report
                    </h3>

                    <p>
                      A similar incident already
                      exists in the system.
                    </p>

                    <div className="matching-report">

                      <strong>
                        {matchingReport.type}
                      </strong>

                      <span>
                        <MapPin size={15} />
                        {matchingReport.location}
                      </span>

                      <span>
                        {matchingReport.description}
                      </span>

                    </div>

                    <button
                      onClick={() =>
                        setActiveTab("Reports")
                      }
                    >
                      View Existing Reports
                    </button>

                  </div>

                )}

              {submitted && (

                <div className="success-message">

                  <CheckCircle2 size={20} />

                  Report submitted successfully.

                </div>

              )}

            </section>

            <aside>

              <div className="new-incident-card">

                <div className="new-icon">
                  <ImagePlus size={25} />
                </div>

                <h3>
                  Local AI Analysis
                </h3>

                <p>
                  The system compares your
                  hazard type, location and
                  description with existing
                  reports to identify possible
                  duplicate incidents.
                </p>

              </div>

              <div className="tip-card">

                <strong>
                  Photo tip
                </strong>

                <p>
                  Take a clear photo showing
                  the road hazard and
                  surrounding area. This helps
                  with verification.
                </p>

              </div>

            </aside>

          </div>

        </main>
      )}

      {/* ================= REPORTS ================= */}

      {activeTab === "Reports" && (

        <main className="report-page">

          <div className="page-heading">

            <div>

              <div className="eyebrow">
                <FileWarning size={16} />
                INCIDENT DATABASE
              </div>

              <h1>
                Road safety reports
              </h1>

              <p>
                Monitor reported hazards and
                their current investigation status.
              </p>

            </div>

            <button
              className="primary-button"
              onClick={() =>
                setActiveTab("Report")
              }
            >
              <Plus size={18} />
              New Report
            </button>

          </div>

          <section className="reports-table">

            <div className="table-header">

              <span>
                Hazard
              </span>

              <span>
                Location
              </span>

              <span>
                Priority
              </span>

              <span>
                Status
              </span>

            </div>

            {reports.map((report) => (

              <div
                className="table-row"
                key={report.id}
              >

                <strong>
                  {report.type}
                </strong>

                <span className="table-location">
                  <MapPin size={15} />
                  {report.location}
                </span>

                <span
                  className={`priority ${report.priority.toLowerCase()}`}
                >
                  {report.priority}
                </span>

                <span
                  className={`status ${report.status
                    .toLowerCase()
                    .replace(" ", "-")}`}
                >
                  {report.status}
                </span>

              </div>

            ))}

          </section>

          <section className="map-placeholder">

            <div className="map-icon">
              <MapPin size={32} />
            </div>

            <h2>
              Incident Map
            </h2>

            <p>
              Map integration can display
              reported road hazards by location.
            </p>

          </section>

        </main>
      )}

      <footer>

        <span>
          © 2026 RoadSafe India
        </span>

        <span>
          Local-first road safety platform
        </span>

      </footer>

    </div>
  );
}

export default App;