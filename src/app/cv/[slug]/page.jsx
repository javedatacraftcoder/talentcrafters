// src/app/cv/[slug]/page.jsx
"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import html2pdf from "html2pdf.js";

export default function PublicCVPage() {
  const { data: session } = useSession();
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

      const isOwner = session?.user?.email === ownerEmail;
      const isPublic = data.dataConsent === true;

      if (!isPublic && !isOwner) {
        setAccessDenied(true);
      } else {
        setCvData(data);
      }

      setLoading(false);
    };

    fetchData();
  }, [slug, session]);

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

  if (loading) return <p className="text-center mt-5 text-dark">Loading CV...</p>;
  if (accessDenied) return <p className="text-center mt-5 text-danger">This CV is private.</p>;
  if (!cvData) return <p className="text-center mt-5 text-danger">CV not found</p>;

  return (
    <div className="container my-5 text-dark">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="fw-bold m-0">{cvData.fullName}</h1>
          <p className="m-0">{cvData.location} | {cvData.phone} | {cvData.email}</p>
          {cvData.linkedin && (
            <a href={cvData.linkedin} target="_blank" className="btn btn-outline-primary btn-sm mt-1">
              Portfolio
            </a>
          )}
        </div>
        <button className="btn btn-success" onClick={handleDownloadPDF}>Download PDF</button>
      </div>

      <div ref={printRef} className="bg-white p-4 border rounded">
        <section className="mb-4">
          <h4>Professional Summary</h4>
          <p>{cvData.summary}</p>
        </section>

        {cvData["Work Experience"]?.length > 0 && (
          <section className="mb-4">
            <h4>Work Experience</h4>
            {cvData["Work Experience"].map((job, i) => (
              <div key={i} className="mb-3">
                <h6 className="mb-1">{job.jobTitle} at {job.company}</h6>
                <small>{job.startDate} – {job.endDate || "Present"} | {job.jobLocation}</small>
                <p className="mb-1">{job.description}</p>
                {job.tools && <small><strong>Tools:</strong> {job.tools}</small>}
              </div>
            ))}
          </section>
        )}

        {cvData.Education?.length > 0 && (
          <section className="mb-4">
            <h4>Education</h4>
            {cvData.Education.map((edu, i) => (
              <div key={i} className="mb-3">
                <h6 className="mb-1">{edu.degree} - {edu.institution}</h6>
                <small>{edu.educationStart} – {edu.educationEnd} | {edu.educationLocation}</small>
                {edu.achievements && <p className="mb-1">{edu.achievements}</p>}
              </div>
            ))}
          </section>
        )}

        {cvData.Projects?.length > 0 && (
          <section className="mb-4">
            <h4>Projects</h4>
            {cvData.Projects.map((proj, i) => (
              <div key={i} className="mb-3">
                <h6 className="mb-1">{proj.projectName}</h6>
                <p className="mb-1">{proj.projectDescription}</p>
                {proj.projectLink && <a href={proj.projectLink} target="_blank">View Project</a>}
              </div>
            ))}
          </section>
        )}

        {cvData.Skills && (
          <section className="mb-4">
            <h4>Skills</h4>
            <p><strong>Technical:</strong> {cvData.technicalSkills}</p>
            {cvData.softSkills && <p><strong>Soft:</strong> {cvData.softSkills}</p>}
          </section>
        )}

        {cvData.Languages?.length > 0 && (
          <section className="mb-4">
            <h4>Languages</h4>
            <ul>
              {cvData.Languages.map((lang, i) => (
                <li key={i}>{lang.language} – {lang.level}</li>
              ))}
            </ul>
          </section>
        )}

        {cvData.Certifications?.length > 0 && (
          <section className="mb-4">
            <h4>Certifications</h4>
            <ul>
              {cvData.Certifications.map((cert, i) => (
                <li key={i}>{cert.certification} ({cert.issuer}, {cert.year})</li>
              ))}
            </ul>
          </section>
        )}

        {cvData["References (optional)"]?.length > 0 && (
          <section className="mb-4">
            <h4>References</h4>
            {cvData["References (optional)"].map((ref, i) => (
              <div key={i}>
                <p><strong>{ref.refName}</strong> - {ref.refPosition}, {ref.refCompany} ({ref.refContact})</p>
              </div>
            ))}
          </section>
        )}
      </div>
    </div>
  );
}
