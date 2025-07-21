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
  const [originalData, setOriginalData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("original");
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

      const newData = { ...data, views: (data.views || 0) + (isPublic && !isOwner ? 1 : 0) };
      setCvData(newData);
      setOriginalData(newData);
      setLoading(false);
    };

    fetchData();
  }, [slug, session, status]);

  const handleDownloadPDF = () => {
    const element = printRef.current;
    const opt = {
      margin: 0.5,
      filename: `${cvData.fullName}-cv.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: "in", format: "letter", orientation: "portrait" },
    };
    html2pdf().set(opt).from(element).save();
  };

  const translateCV = async (lang) => {
    if (lang === "original") {
      setCvData(originalData);
      return;
    }

    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: JSON.stringify(originalData), targetLang: lang }),
      });

      const { translatedText } = await res.json();
      const parsed = JSON.parse(translatedText);
      setCvData(parsed);
    } catch (error) {
      console.error("Translation error:", error);
      alert("Failed to translate CV.");
    }
  };

  const handleLanguageChange = (e) => {
    const lang = e.target.value;
    setSelectedLanguage(lang);
    translateCV(lang);
  };

  if (loading || status === "loading") return <p className="text-center mt-5 text-dark">Loading CV...</p>;
  if (accessDenied) return <p className="text-center mt-5 text-danger">This CV is private.</p>;
  if (!cvData) return <p className="text-center mt-5 text-danger">CV not found</p>;

  const themeColor = cvData.themeColor || "#0d6efd";

  return (
    <div className="container my-5 text-dark">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3 className="fw-bold">{cvData.fullName}</h3>
        <div className="d-flex align-items-center gap-2">
          <select className="form-select" value={selectedLanguage} onChange={handleLanguageChange}>
            <option value="original">🌐 Original</option>
            <option value="en">English</option>
            <option value="es">Español</option>
            <option value="fr">Français</option>
            <option value="de">Deutsch</option>
            <option value="it">Italiano</option>
          </select>
          <button className="btn btn-success" onClick={handleDownloadPDF}>Download PDF</button>
        </div>
      </div>

      <div className="row shadow rounded overflow-hidden bg-white p-4" ref={printRef}>
        {/* Header section with color stripe */}
        <div className="d-flex align-items-start mb-4 border-bottom pb-3" style={{ borderColor: themeColor }}>
          <img
            src={cvData.photo || "/default-avatar.png"}
            alt="Profile"
            className="rounded-circle me-4"
            style={{ width: "100px", height: "100px", objectFit: "cover" }}
          />
          <div className="flex-grow-1">
            <h4 className="mb-1">{cvData.fullName}</h4>
            <p className="mb-1"><strong>Email:</strong> {cvData.email}</p>
            <p className="mb-1"><strong>Phone:</strong> {cvData.phone}</p>
            <p className="mb-0"><strong>Address:</strong> {cvData.location}</p>
          </div>
        </div>

        {/* Sections */}
        <div className="row">
          <div className="col-md-3 border-end text-end pe-4">
            {cvData.summary && <p className="fw-bold">Summary</p>}
            {cvData["Work Experience"]?.length > 0 && <p className="fw-bold">Experience</p>}
            {cvData.Education?.length > 0 && <p className="fw-bold">Education</p>}
            {cvData.Projects?.length > 0 && <p className="fw-bold">Projects</p>}
            {cvData.Certifications?.length > 0 && <p className="fw-bold">Certifications</p>}
            {cvData["References (optional)"]?.length > 0 && <p className="fw-bold">References</p>}
          </div>

          <div className="col-md-9 ps-4">
            {cvData.summary && (
              <section className="mb-3">
                <p>{cvData.summary}</p>
              </section>
            )}

            {cvData["Work Experience"]?.length > 0 && (
              <section className="mb-3">
                {cvData["Work Experience"].map((job, i) => (
                  <div key={i} className="mb-2">
                    <h6 className="mb-1">{job.jobTitle} at {job.company}</h6>
                    <small className="text-muted">{job.startDate} – {job.endDate || "Present"} | {job.jobLocation}</small>
                    <p>{job.description}</p>
                  </div>
                ))}
              </section>
            )}

            {cvData.Education?.length > 0 && (
              <section className="mb-3">
                {cvData.Education.map((edu, i) => (
                  <div key={i} className="mb-2">
                    <h6 className="mb-1">{edu.degree} - {edu.institution}</h6>
                    <small className="text-muted">{edu.educationStart} – {edu.educationEnd} | {edu.educationLocation}</small>
                    {edu.achievements && <p>{edu.achievements}</p>}
                  </div>
                ))}
              </section>
            )}

            {cvData.Projects?.length > 0 && (
              <section className="mb-3">
                {cvData.Projects.map((proj, i) => (
                  <div key={i} className="mb-2">
                    <h6 className="mb-1">{proj.projectName}</h6>
                    <p>{proj.projectDescription}</p>
                  </div>
                ))}
              </section>
            )}

            {cvData.Certifications?.length > 0 && (
              <section className="mb-3">
                <ul>
                  {cvData.Certifications.map((cert, i) => (
                    <li key={i}>{cert.certification} ({cert.issuer}, {cert.year})</li>
                  ))}
                </ul>
              </section>
            )}

            {cvData["References (optional)"]?.length > 0 && (
              <section className="mb-3">
                {cvData["References (optional)"].map((ref, i) => (
                  <p key={i}><strong>{ref.refName}</strong> - {ref.refPosition}, {ref.refCompany} ({ref.refContact})</p>
                ))}
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
