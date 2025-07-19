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
      html2canvas: { scale: 2 },
      jsPDF: { unit: "in", format: "letter", orientation: "portrait" },
    };
    html2pdf().set(opt).from(element).save();
  };

  if (loading || status === "loading") return <p className="text-center mt-5 text-dark">Loading CV...</p>;
  if (accessDenied) return <p className="text-center mt-5 text-danger">This CV is private.</p>;
  if (!cvData) return <p className="text-center mt-5 text-danger">CV not found</p>;

  const themeColor = cvData.themeColor || "#0d6efd";

  return (
    <div className="container my-5">
      <div className="bg-white shadow-lg rounded p-0 overflow-hidden" ref={printRef}>
        {/* Header con imagen + franja */}
        <div className="text-center position-relative">
          {cvData.photo && (
            <img
              src={cvData.photo}
              alt="Profile"
              className="rounded-circle border border-white position-relative z-1"
              width="120"
              height="120"
              style={{ marginTop: "1.5rem" }}
            />
          )}
          <div
            style={{ backgroundColor: themeColor, height: "20px", marginTop: "-10px" }}
            className="w-100"
          ></div>
          <div className="pt-3 pb-4 px-3">
            <h3 className="fw-bold mb-1">{cvData.fullName}</h3>
            <p className="mb-1"><strong>Email:</strong> {cvData.email}</p>
            <p className="mb-1"><strong>Phone:</strong> {cvData.phone}</p>
            <p className="mb-0"><strong>Address:</strong> {cvData.location}</p>
          </div>
        </div>

        <hr className="my-0" />

        {/* Cuerpo principal dividido en 2 columnas */}
        <div className="row p-4 text-dark" style={{ color: "#222" }}>
          <div className="col-md-4 border-end">
            {cvData.summary && <p><strong>Summary</strong></p>}
            {cvData["Work Experience"]?.length > 0 && <p><strong>Work Experience</strong></p>}
            {cvData.Education?.length > 0 && <p><strong>Education</strong></p>}
            {cvData.Projects?.length > 0 && <p><strong>Projects</strong></p>}
            {cvData.Certifications?.length > 0 && <p><strong>Certifications</strong></p>}
            {cvData["References (optional)"]?.length > 0 && <p><strong>References</strong></p>}
          </div>

          <div className="col-md-8">
            {cvData.summary && (
              <section className="mb-4">
                <p>{cvData.summary}</p>
              </section>
            )}

            {cvData["Work Experience"]?.length > 0 && (
              <section className="mb-4">
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
                {cvData.Projects.map((proj, i) => (
                  <div key={i} className="mb-3">
                    <h6>{proj.projectName}</h6>
                    <p>{proj.projectDescription}</p>
                    {proj.projectLink && <a href={proj.projectLink} target="_blank" rel="noopener noreferrer" style={{ color: themeColor }}>View Project</a>}
                  </div>
                ))}
              </section>
            )}

            {cvData.Certifications?.length > 0 && (
              <section className="mb-4">
                <ul>
                  {cvData.Certifications.map((cert, i) => (
                    <li key={i}>{cert.certification} ({cert.issuer}, {cert.year})</li>
                  ))}
                </ul>
              </section>
            )}

            {cvData["References (optional)"]?.length > 0 && (
              <section className="mb-4">
                {cvData["References (optional)"].map((ref, i) => (
                  <p key={i}><strong>{ref.refName}</strong> - {ref.refPosition}, {ref.refCompany} ({ref.refContact})</p>
                ))}
              </section>
            )}
          </div>
        </div>

        <div className="text-center pb-4">
          <button className="btn btn-outline-dark btn-sm" onClick={handleDownloadPDF}>
            Download PDF
          </button>
        </div>
      </div>
    </div>
  );
}
