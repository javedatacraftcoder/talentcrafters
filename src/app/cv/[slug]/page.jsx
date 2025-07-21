"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { db } from "@/lib/firebase";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import html2pdf from "html2pdf.js";

export default function PublicCVPage() {
  const { data: session, status } = useSession();
  const { slug } = useParams();
  const [cvData, setCvData] = useState(null);
  const [translatedCV, setTranslatedCV] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [translating, setTranslating] = useState(false);
  const printRef = useRef();

  useEffect(() => {
    const fetchData = async () => {
      const cvsSnap = await getDocs(collection(db, "cvs"));
      const found = cvsSnap.docs.find((doc) => doc.data().cvSlug === slug);

      if (!found) {
        setLoading(false);
        return;
      }

      const data = found.data();
      const ownerEmail = found.id;
      const isPublic = data.dataConsent === true;
      const isOwner = session?.user?.email === ownerEmail;

      if (!isPublic && status !== "loading" && !isOwner) {
        setAccessDenied(true);
        setLoading(false);
        return;
      }

      if (isPublic && !isOwner) {
        const cvRef = doc(db, "cvs", ownerEmail);
        await updateDoc(cvRef, { views: (data.views || 0) + 1 });
      }

      setCvData({ ...data, views: (data.views || 0) + (isPublic && !isOwner ? 1 : 0) });
      setLoading(false);
    };

    fetchData();
  }, [slug, session, status]);

  const handleDownloadPDF = () => {
    const element = printRef.current;
    const opt = {
      margin: 0,
      filename: `${cvData.fullName}-cv.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: "in", format: "letter", orientation: "portrait" },
    };
    html2pdf().set(opt).from(element).save();
  };

  // 🔄 NUEVA implementación que usa el endpoint interno
  const translateText = async (text, targetLang) => {
    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ q: text, target: targetLang }),
      });

      const data = await res.json();
      return data.translatedText || text;
    } catch (err) {
      console.error("Translation error:", err);
      return text;
    }
  };

  const handleLanguageChange = async (e) => {
    const lang = e.target.value;
    if (!lang || !cvData) return;

    setTranslating(true);

    const translated = {};

    const fieldsToTranslate = ["summary", "technicalSkills", "softSkills"];
    for (let field of fieldsToTranslate) {
      if (cvData[field]) {
        translated[field] = await translateText(cvData[field], lang);
      }
    }

    const translateArraySection = async (sectionName, fields) => {
      if (!cvData[sectionName]) return [];
      return Promise.all(
        cvData[sectionName].map(async (item) => {
          const translatedItem = { ...item };
          for (let field of fields) {
            if (item[field]) {
              translatedItem[field] = await translateText(item[field], lang);
            }
          }
          return translatedItem;
        })
      );
    };

    translated["Work Experience"] = await translateArraySection("Work Experience", ["jobTitle", "company", "jobLocation", "description"]);
    translated["Education"] = await translateArraySection("Education", ["degree", "institution", "educationLocation", "achievements"]);
    translated["Projects"] = await translateArraySection("Projects", ["projectName", "projectDescription"]);
    translated["Certifications"] = cvData.Certifications || [];
    translated["References (optional)"] = await translateArraySection("References (optional)", ["refName", "refPosition", "refCompany"]);

    setTranslatedCV({ ...cvData, ...translated });
    setTranslating(false);
  };

  const data = translatedCV || cvData;

  if (loading || status === "loading") return <p className="text-center mt-5 text-dark">Loading CV...</p>;
  if (accessDenied) return <p className="text-center mt-5 text-danger">This CV is private.</p>;
  if (!cvData) return <p className="text-center mt-5 text-danger">CV not found</p>;

  const themeColor = data.themeColor || "#0d6efd";

  return (
    <div className="bg-white py-5">
      <div className="text-center mb-4">
        <button className="btn btn-success btn-sm me-3" onClick={handleDownloadPDF}>
          Download PDF
        </button>

        <select
          onChange={handleLanguageChange}
          className="form-select d-inline w-auto"
          disabled={translating}
        >
          <option value="">Translate CV</option>
          <option value="es">Español</option>
          <option value="fr">Français</option>
          <option value="de">Deutsch</option>
        </select>
      </div>

      <div className="mx-auto shadow-lg rounded" ref={printRef} style={{ maxWidth: "960px", boxShadow: "0 0 30px rgba(0,0,0,0.2)" }}>
        <div className="d-flex">
          {/* Sidebar */}
          <div className="bg-white p-4 d-flex flex-column align-items-center" style={{ width: "220px", borderRight: `4px solid ${themeColor}` }}>
            {data.photo && (
              <img src={data.photo} alt="Profile" className="rounded-circle mb-3" width="120" height="120" />
            )}
            <hr className="w-100" style={{ borderTop: `4px solid ${themeColor}` }} />
            <div className="text-center text-dark mt-3">
              <h5 className="fw-bold">{data.fullName}</h5>
              <p className="mb-1"><strong>Email:</strong> {data.email}</p>
              <p className="mb-1"><strong>Phone:</strong> {data.phone}</p>
              <p className="mb-1"><strong>Address:</strong> {data.location}</p>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-grow-1 p-4" style={{ color: "#1a1a1a" }}>
            {data.summary && (
              <div className="mb-4">
                <div className="d-flex">
                  <div className="fw-bold text-end pe-3" style={{ width: "160px" }}>Summary</div>
                  <div>{data.summary}</div>
                </div>
              </div>
            )}

            {data["Work Experience"]?.length > 0 && (
              <div className="mb-4">
                <div className="d-flex">
                  <div className="fw-bold text-end pe-3" style={{ width: "160px" }}>Work Experience</div>
                  <div>
                    {data["Work Experience"].map((job, i) => (
                      <div key={i} className="mb-2">
                        <h6 className="mb-1">{job.jobTitle} at {job.company}</h6>
                        <small className="text-muted">{job.startDate} – {job.endDate || "Present"} | {job.jobLocation}</small>
                        <p className="mb-0">{job.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {data.Education?.length > 0 && (
              <div className="mb-4">
                <div className="d-flex">
                  <div className="fw-bold text-end pe-3" style={{ width: "160px" }}>Education</div>
                  <div>
                    {data.Education.map((edu, i) => (
                      <div key={i} className="mb-2">
                        <h6>{edu.degree} - {edu.institution}</h6>
                        <small className="text-muted">{edu.educationStart} – {edu.educationEnd} | {edu.educationLocation}</small>
                        {edu.achievements && <p>{edu.achievements}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {data.Projects?.length > 0 && (
              <div className="mb-4">
                <div className="d-flex">
                  <div className="fw-bold text-end pe-3" style={{ width: "160px" }}>Projects</div>
                  <div>
                    {data.Projects.map((proj, i) => (
                      <div key={i} className="mb-2">
                        <h6>{proj.projectName}</h6>
                        <p>{proj.projectDescription}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {data.Certifications?.length > 0 && (
              <div className="mb-4">
                <div className="d-flex">
                  <div className="fw-bold text-end pe-3" style={{ width: "160px" }}>Certifications</div>
                  <div>
                    <ul>
                      {data.Certifications.map((cert, i) => (
                        <li key={i}>{cert.certification} ({cert.issuer}, {cert.year})</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {data["References (optional)"]?.length > 0 && (
              <div>
                <div className="d-flex">
                  <div className="fw-bold text-end pe-3" style={{ width: "160px" }}>References</div>
                  <div>
                    {data["References (optional)"].map((ref, i) => (
                      <p key={i}><strong>{ref.refName}</strong> - {ref.refPosition}, {ref.refCompany}</p>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
