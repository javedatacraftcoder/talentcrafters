// src/app/cv/[slug]/page.jsx
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
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [selectedLang, setSelectedLang] = useState("original");
  const [isTranslating, setIsTranslating] = useState(false);
  const [translatedCV, setTranslatedCV] = useState(null);
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

      if (!isPublic && status !== "loading") {
        if (!isOwner) {
          setAccessDenied(true);
          setLoading(false);
          return;
        }
      }

      if (isPublic && !isOwner) {
        const cvRef = doc(db, "cvs", ownerEmail);
        await updateDoc(cvRef, {
          views: (data.views || 0) + 1,
        });
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

  const handleTranslate = async (lang) => {
    setSelectedLang(lang);

    if (lang === "original") {
      setTranslatedCV(null);
      return;
    }

    setIsTranslating(true);

    try {
      const response = await fetch("https://libretranslate.de/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          q: cvData.summary,
          source: "en",
          target: lang,
          format: "text",
        }),
      });
      const data = await response.json();
      setTranslatedCV(data.translatedText);
    } catch (error) {
      console.error("Translation error:", error);
      setTranslatedCV(null);
    } finally {
      setIsTranslating(false);
    }
  };

  if (loading || status === "loading") return <p className="text-center mt-5 text-dark">Loading CV...</p>;
  if (accessDenied) return <p className="text-center mt-5 text-danger">This CV is private.</p>;
  if (!cvData) return <p className="text-center mt-5 text-danger">CV not found</p>;

  const themeColor = cvData.themeColor || "#0d6efd";
  const textColor = "#1a1a1a";

  return (
    <div className="bg-white py-5">
      {isTranslating && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex flex-column justify-content-center align-items-center bg-white bg-opacity-75" style={{ zIndex: 9999 }}>
          <img src="/talentcrafterslogo.png" alt="Logo" width={120} className="mb-3" />
          <p className="fs-5 text-dark">Translating CV...</p>
        </div>
      )}

      <div className="text-center mb-4">
        <div className="mb-2">
          <select
            value={selectedLang}
            onChange={(e) => handleTranslate(e.target.value)}
            className="form-select w-auto d-inline-block"
          >
            <option value="original">Original (EN)</option>
            <option value="es">Español</option>
            <option value="fr">Français</option>
            <option value="de">Deutsch</option>
          </select>
        </div>
        <button className="btn btn-success btn-sm" onClick={handleDownloadPDF}>
          Download PDF
        </button>
      </div>

      <div className="mx-auto shadow-lg rounded overflow-hidden" ref={printRef} style={{ maxWidth: "960px", background: "#fff", boxShadow: "0 0 25px rgba(0, 0, 0, 0.15)" }}>
        <div className="row g-0">
          {/* Side panel */}
          <div className="col-md-4 text-white py-4 px-3" style={{ backgroundColor: themeColor }}>
            {cvData.photo && (
              <img src={cvData.photo} alt="Profile" className="rounded-circle mb-3 bg-white p-1" width="120" height="120" />
            )}
            <h3 className="fw-bold">{cvData.fullName}</h3>
            <p className="mb-1"><strong>📍 Address:</strong> {cvData.location}</p>
            <p className="mb-1"><strong>📞 Phone:</strong> {cvData.phone}</p>
            <p className="mb-3"><strong>📧 Email:</strong> {cvData.email}</p>
            {cvData.linkedin && (
              <a href={cvData.linkedin} target="_blank" className="btn btn-light btn-sm mb-3 fw-bold" rel="noopener noreferrer">
                View LinkedIn
              </a>
            )}
            <hr className="border-light" />
            {cvData.technicalSkills && (
              <>
                <h6 className="text-uppercase mt-4">Skills</h6>
                <p>{cvData.technicalSkills}</p>
              </>
            )}
            {cvData.softSkills && (
              <>
                <h6 className="text-uppercase">Soft Skills</h6>
                <p>{cvData.softSkills}</p>
              </>
            )}
            {cvData.Languages?.length > 0 && (
              <>
                <h6 className="text-uppercase">Languages</h6>
                <ul className="list-unstyled">
                  {cvData.Languages.map((lang, i) => (
                    <li key={i}>{lang.language} – {lang.level}</li>
                  ))}
                </ul>
              </>
            )}
            <hr className="border-light" />
            <p className="small">Views: {cvData.views}</p>
          </div>

          {/* Main panel */}
           <div className="col-md-8 bg-white p-4" style={{ color: textColor }}>
            <h4 className="pb-2 mb-4 border-bottom border-3" style={{ borderColor: themeColor }}>Professional Summary</h4>
            <p>{translatedCV || cvData.summary}</p>

            {cvData["Work Experience"]?.length > 0 && (
              <section className="mb-4">
                <h4 className="pb-2 border-bottom border-3" style={{ borderColor: themeColor }}>Work Experience</h4>
                {cvData["Work Experience"].map((job, i) => (
                  <div key={i} className="mb-3">
                    <h6>{job.jobTitle} at {job.company}</h6>
                    <small className="text-muted">{job.startDate} – {job.endDate || "Present"} | {job.jobLocation}</small>
                    <p>{job.description}</p>
                    {job.tools && <small><strong>Tools:</strong> {job.tools}</small>}
                  </div>
                ))}
              </section>
            )}

            {cvData.Education?.length > 0 && (
              <section className="mb-4">
                <h4 className="pb-2 border-bottom border-3" style={{ borderColor: themeColor }}>Education</h4>
                {cvData.Education.map((edu, i) => (
                  <div key={i} className="mb-3">
                    <h6>{edu.degree} - {edu.institution}</h6>
                    <small className="text-muted">{edu.educationStart} – {edu.educationEnd} | {edu.educationLocation}</small>
                    {edu.achievements && <p>{edu.achievements}</p>}
                  </div>
                ))}
              </section>
            )}

            {cvData.Projects?.length > 0 && (
              <section className="mb-4">
                <h4 className="pb-2 border-bottom border-3" style={{ borderColor: themeColor }}>Projects</h4>
                {cvData.Projects.map((proj, i) => (
                  <div key={i} className="mb-3">
                    <h6>{proj.projectName}</h6>
                    <p>{proj.projectDescription}</p>
                    {proj.projectLink && (
                      <a href={proj.projectLink} target="_blank" rel="noopener noreferrer" style={{ color: themeColor }}>
                        View Project
                      </a>
                    )}
                  </div>
                ))}
              </section>
            )}

            {cvData.Certifications?.length > 0 && (
              <section className="mb-4">
                <h4 className="pb-2 border-bottom border-3" style={{ borderColor: themeColor }}>Certifications</h4>
                <ul>
                  {cvData.Certifications.map((cert, i) => (
                    <li key={i}>{cert.certification} ({cert.issuer}, {cert.year})</li>
                  ))}
                </ul>
              </section>
            )}

            {cvData["References (optional)"]?.length > 0 && (
              <section className="mb-4">
                <h4 className="pb-2 border-bottom border-3" style={{ borderColor: themeColor }}>References</h4>
                {cvData["References (optional)"].map((ref, i) => (
                  <div key={i}>
                    <p><strong>{ref.refName}</strong> - {ref.refPosition}, {ref.refCompany} ({ref.refContact})</p>
                  </div>
                ))}
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
