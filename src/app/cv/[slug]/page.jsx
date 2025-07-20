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

  const translateText = async (text, targetLang) => {
    const res = await fetch("https://libretranslate.de/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        q: text,
        source: "en",
        target: targetLang,
        format: "text",
      }),
    });
    const data = await res.json();
    return data.translatedText;
  };

  const handleLanguageChange = async (e) => {
    const lang = e.target.value;
    if (!lang || !cvData) return;

    setTranslating(true);

    const fieldsToTranslate = [
      "summary",
      "technicalSkills",
      "softSkills",
    ];

    const translated = {};

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

    translated["Work Experience"] = await translateArraySection("Work Experience", ["jobTitle", "company", "jobLocation", "description", "tools"]);
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
  const textColor = "#1a1a1a";

  return (
    <div className="bg-white py-5">
      <div className="text-center mb-4">
        <button className="btn btn-success btn-sm me-3" onClick={handleDownloadPDF}>
          Download PDF
        </button>

        <select onChange={handleLanguageChange} className="form-select d-inline w-auto" disabled={translating}>
          <option value="">Translate CV</option>
          <option value="es">Español</option>
          <option value="fr">Français</option>
          <option value="de">Deutsch</option>
        </select>
      </div>

      <div className="mx-auto shadow-lg rounded overflow-hidden" ref={printRef} style={{ maxWidth: "960px", background: "#fff", boxShadow: "0 0 25px rgba(0, 0, 0, 0.15)" }}>
        <div className="row g-0">
          <div className="col-md-4 text-white py-4 px-3" style={{ backgroundColor: themeColor }}>
            {data.photo && (
              <img src={data.photo} alt="Profile" className="rounded-circle mb-3 bg-white p-1" width="120" height="120" />
            )}
            <h3 className="fw-bold">{data.fullName}</h3>
            <p className="mb-1"><strong>📍 Address:</strong> {data.location}</p>
            <p className="mb-1"><strong>📞 Phone:</strong> {data.phone}</p>
            <p className="mb-3"><strong>📧 Email:</strong> {data.email}</p>
          </div>

          <div className="col-md-8 bg-white p-4" style={{ color: textColor }}>
            <h4 className="pb-2 mb-4 border-bottom border-3" style={{ borderColor: themeColor }}>Professional Summary</h4>
            <p>{data.summary}</p>

            {data["Work Experience"]?.length > 0 && (
              <section className="mb-4">
                <h4 className="pb-2 border-bottom border-3" style={{ borderColor: themeColor }}>Work Experience</h4>
                {data["Work Experience"].map((job, i) => (
                  <div key={i} className="mb-3">
                    <h6>{job.jobTitle} at {job.company}</h6>
                    <small className="text-muted">{job.startDate} – {job.endDate || "Present"} | {job.jobLocation}</small>
                    <p>{job.description}</p>
                  </div>
                ))}
              </section>
            )}

            {data.Education?.length > 0 && (
              <section className="mb-4">
                <h4 className="pb-2 border-bottom border-3" style={{ borderColor: themeColor }}>Education</h4>
                {data.Education.map((edu, i) => (
                  <div key={i} className="mb-3">
                    <h6>{edu.degree} - {edu.institution}</h6>
                    <small className="text-muted">{edu.educationStart} – {edu.educationEnd} | {edu.educationLocation}</small>
                    {edu.achievements && <p>{edu.achievements}</p>}
                  </div>
                ))}
              </section>
            )}

            {data.Projects?.length > 0 && (
              <section className="mb-4">
                <h4 className="pb-2 border-bottom border-3" style={{ borderColor: themeColor }}>Projects</h4>
                {data.Projects.map((proj, i) => (
                  <div key={i} className="mb-3">
                    <h6>{proj.projectName}</h6>
                    <p>{proj.projectDescription}</p>
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
