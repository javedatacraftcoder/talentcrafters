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

  if (loading || status === "loading") return <p className="text-center mt-5 text-dark">Loading CV...</p>;
  if (accessDenied) return <p className="text-center mt-5 text-danger">This CV is private.</p>;
  if (!cvData) return <p className="text-center mt-5 text-danger">CV not found</p>;

  const themeColor = cvData.themeColor || "#004085";

  return (
    <div className="container my-5 text-dark">
      <div className="text-end mb-3">
        <button className="btn btn-success btn-sm" onClick={handleDownloadPDF}>
          Download PDF
        </button>
      </div>

      <div className="d-flex shadow rounded overflow-hidden" ref={printRef} style={{ background: '#fff' }}>
        {/* Left Panel */}
        <div className="p-4" style={{ backgroundColor: themeColor, color: 'white', width: '35%' }}>
          {cvData.photo && (
            <div className="text-center">
              <img src={cvData.photo} alt="Profile" className="rounded-circle mb-3 bg-white p-1" width="120" height="120" />
            </div>
          )}
          <h2 className="text-white">{cvData.fullName?.toUpperCase()}</h2>
          <h5 className="mt-2">{cvData.profession || "Customer Experience Specialist"}</h5>

          <div className="mt-4">
            <h6 className="text-white text-uppercase border-bottom pb-1">Contact</h6>
            <p>{cvData.email}</p>
            <p>{cvData.phone}</p>
            <p>{cvData.linkedin}</p>
            <p>{cvData.location}</p>
          </div>

          {cvData.Languages?.length > 0 && (
            <div className="mt-4">
              <h6 className="text-white text-uppercase border-bottom pb-1">Languages</h6>
              <ul className="list-unstyled">
                {cvData.Languages.map((lang, i) => (
                  <li key={i}>{lang.language}: {lang.level}</li>
                ))}
              </ul>
            </div>
          )}

          {cvData["References (optional)"]?.length > 0 && (
            <div className="mt-4">
              <h6 className="text-white text-uppercase border-bottom pb-1">References</h6>
              {cvData["References (optional)"].map((ref, i) => (
                <div key={i} className="mb-2">
                  <p className="mb-0"><strong>{ref.refName}</strong></p>
                  <small>{ref.refPosition}, {ref.refCompany}</small><br />
                  <small>{ref.refContact}</small>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Panel */}
        <div className="p-4" style={{ width: '65%' }}>
          <div>
            <h5 className="text-uppercase border-bottom pb-2" style={{ borderColor: themeColor }}>Professional Summary</h5>
            <p>{cvData.summary}</p>
          </div>

          {cvData["Work Experience"]?.length > 0 && (
            <div className="mt-4">
              <h5 className="text-uppercase border-bottom pb-2" style={{ borderColor: themeColor }}>Work Experience</h5>
              {cvData["Work Experience"].map((job, i) => (
                <div key={i} className="mb-3">
                  <strong>{job.jobTitle} – {job.company}</strong>
                  <div className="text-muted small">{job.startDate} – {job.endDate || "Present"} | {job.jobLocation}</div>
                  <p>{job.description}</p>
                </div>
              ))}
            </div>
          )}

          {cvData.Education?.length > 0 && (
            <div className="mt-4">
              <h5 className="text-uppercase border-bottom pb-2" style={{ borderColor: themeColor }}>Education</h5>
              {cvData.Education.map((edu, i) => (
                <div key={i} className="mb-3">
                  <strong>{edu.degree}</strong><br />
                  <span>{edu.institution} — {edu.educationEnd}</span>
                </div>
              ))}
            </div>
          )}

          {cvData.Projects?.length > 0 && (
            <div className="mt-4">
              <h5 className="text-uppercase border-bottom pb-2" style={{ borderColor: themeColor }}>Projects</h5>
              {cvData.Projects.map((proj, i) => (
                <div key={i} className="mb-3">
                  <strong>{proj.projectName}</strong>
                  <p>{proj.projectDescription}</p>
                  {proj.projectLink && (
                    <a href={proj.projectLink} target="_blank" rel="noopener noreferrer" style={{ color: themeColor }}>
                      View Project
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}

          {cvData.Certifications?.length > 0 && (
            <div className="mt-4">
              <h5 className="text-uppercase border-bottom pb-2" style={{ borderColor: themeColor }}>Certifications</h5>
              <ul>
                {cvData.Certifications.map((cert, i) => (
                  <li key={i}>{cert.certification} ({cert.issuer}, {cert.year})</li>
                ))}
              </ul>
            </div>
          )}

          {cvData.Skills?.length > 0 && (
            <div className="mt-4">
              <h5 className="text-uppercase border-bottom pb-2" style={{ borderColor: themeColor }}>Skills</h5>
              <ul>
                {cvData.Skills.map((item, i) => (
                  <li key={i}>{item.skill}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}