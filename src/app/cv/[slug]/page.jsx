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
      margin: 0.5,
      filename: `${cvData.fullName}-cv.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, backgroundColor: "#ffffff", useCORS: true },
      jsPDF: { unit: "in", format: "a4", orientation: "portrait" },
      pagebreak: { mode: ["css", "legacy"] },
    };
    html2pdf().set(opt).from(element).save();
  };

  if (loading || status === "loading") return <p className="text-center mt-5 text-dark">Loading CV...</p>;
  if (accessDenied) return <p className="text-center mt-5 text-danger">This CV is private.</p>;
  if (!cvData) return <p className="text-center mt-5 text-danger">CV not found</p>;

  return (
    <div className="container my-5">
      <div className="text-end mb-3">
        <button className="btn btn-success btn-sm" onClick={handleDownloadPDF}>Download PDF</button>
      </div>

      <div id="cv-print" ref={printRef} className="bg-white p-4 shadow" style={{ fontSize: '12px', lineHeight: '1.5' }}>
        <div className="text-center mb-4">
          {cvData.photo && <img src={cvData.photo} alt="Profile" className="rounded-circle mb-2" width="100" />}
          <h2 className="fw-bold mb-0">{cvData.fullName}</h2>
          <p className="mb-1">{cvData.profession}</p>
          <p className="mb-0">{cvData.email} | {cvData.phone} | {cvData.location}</p>
          {cvData.linkedin && <p className="mb-0">LinkedIn: {cvData.linkedin}</p>}
        </div>

        {cvData.summary && (
          <section className="mb-4">
            <h5 className="border-bottom pb-1">Professional Summary</h5>
            <p>{cvData.summary}</p>
          </section>
        )}

        {cvData["Work Experience"]?.length > 0 && (
          <section className="mb-4 page-break">
            <h5 className="border-bottom pb-1">Work Experience</h5>
            {cvData["Work Experience"].map((job, i) => (
              <div key={i} className="mb-2">
                <strong>{job.jobTitle} – {job.company}</strong>
                <div className="text-muted small">{job.startDate} – {job.endDate || "Present"} | {job.jobLocation}</div>
                <p>{job.description}</p>
              </div>
            ))}
          </section>
        )}

        {cvData.Education?.length > 0 && (
          <section className="mb-4 page-break">
            <h5 className="border-bottom pb-1">Education</h5>
            {cvData.Education.map((edu, i) => (
              <div key={i} className="mb-2">
                <strong>{edu.degree}</strong><br />
                <span>{edu.institution} — {edu.educationEnd}</span>
              </div>
            ))}
          </section>
        )}

        {cvData.Projects?.length > 0 && (
          <section className="mb-4">
            <h5 className="border-bottom pb-1">Projects</h5>
            {cvData.Projects.map((proj, i) => (
              <div key={i} className="mb-2">
                <strong>{proj.projectName}</strong>
                <p>{proj.projectDescription}</p>
                {proj.projectLink && (
                  <a href={proj.projectLink} target="_blank" rel="noopener noreferrer">
                    View Project
                  </a>
                )}
              </div>
            ))}
          </section>
        )}

        {cvData.Certifications?.length > 0 && (
          <section className="mb-4">
            <h5 className="border-bottom pb-1">Certifications</h5>
            <ul>
              {cvData.Certifications.map((cert, i) => (
                <li key={i}>{cert.certification} ({cert.issuer}, {cert.year})</li>
              ))}
            </ul>
          </section>
        )}

        {cvData.Skills?.length > 0 && (
          <section className="mb-4">
            <h5 className="border-bottom pb-1">Skills</h5>
            <ul className="mb-0">
              {cvData.Skills.map((item, i) => (
                <li key={i}>{item.skill}</li>
              ))}
            </ul>
          </section>
        )}

        {cvData.Languages?.length > 0 && (
          <section className="mb-4">
            <h5 className="border-bottom pb-1">Languages</h5>
            <ul className="mb-0">
              {cvData.Languages.map((lang, i) => (
                <li key={i}>{lang.language}: {lang.level}</li>
              ))}
            </ul>
          </section>
        )}

        {cvData["References (optional)"]?.length > 0 && (
          <section className="mb-4">
            <h5 className="border-bottom pb-1">References</h5>
            {cvData["References (optional)"].map((ref, i) => (
              <div key={i}>
                <strong>{ref.refName}</strong><br />
                <span>{ref.refPosition}, {ref.refCompany}</span><br />
                <span>{ref.refContact}</span>
              </div>
            ))}
          </section>
        )}
      </div>
    </div>
  );
}
