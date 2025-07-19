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
      <div className="mx-auto shadow-lg rounded bg-white p-0" style={{ maxWidth: "900px" }} ref={printRef}>
        {/* Header superior */}
        <div className="d-flex">
          {/* Foto + franja */}
          <div className="position-relative text-center p-4" style={{ width: "250px" }}>
            <img
              src={cvData.photo || "/default-avatar.png"}
              alt="Profile"
              className="rounded-circle border border-2 mb-3"
              width={130}
              height={130}
            />
            <div
              style={{ width: "8px", height: "80px", backgroundColor: themeColor, margin: "10px auto 0" }}
            ></div>
          </div>

          {/* Info personal */}
          <div className="flex-grow-1 d-flex flex-column justify-content-center text-dark">
            <h2 className="fw-bold mb-2">{cvData.fullName}</h2>
            <p className="mb-1"><strong>Email:</strong> {cvData.email}</p>
            <p className="mb-1"><strong>Phone:</strong> {cvData.phone}</p>
            <p className="mb-1"><strong>Address:</strong> {cvData.location}</p>
          </div>
        </div>

        <hr className="m-0" />

        {/* Cuerpo del CV */}
        <div className="row p-4">
          {/* Columna izquierda con títulos */}
          <div className="col-md-4 text-end pe-4 text-dark">
            {cvData.summary && <p className="fw-bold mb-4">Professional Summary</p>}
            {cvData["Work Experience"]?.length > 0 && <p className="fw-bold mb-4">Work Experience</p>}
            {cvData.Education?.length > 0 && <p className="fw-bold mb-4">Education</p>}
            {cvData.Projects?.length > 0 && <p className="fw-bold mb-4">Projects</p>}
            {cvData.Certifications?.length > 0 && <p className="fw-bold mb-4">Certifications</p>}
            {cvData["References (optional)"]?.length > 0 && <p className="fw-bold mb-4">References</p>}
          </div>

          {/* Columna derecha con contenido */}
          <div className="col-md-8 text-dark">
            {cvData.summary && (
              <div className="mb-4">
                <p>{cvData.summary}</p>
              </div>
            )}

            {cvData["Work Experience"]?.length > 0 && (
              <div className="mb-4">
                {cvData["Work Experience"].map((job, i) => (
                  <div key={i} className="mb-3">
                    <h6>{job.jobTitle} at {job.company}</h6>
                    <small className="text-muted">{job.startDate} – {job.endDate || "Present"} | {job.jobLocation}</small>
                    <p>{job.description}</p>
                    {job.tools && <small><strong>Tools:</strong> {job.tools}</small>}
                  </div>
                ))}
              </div>
            )}

            {cvData.Education?.length > 0 && (
              <div className="mb-4">
                {cvData.Education.map((edu, i) => (
                  <div key={i} className="mb-3">
                    <h6>{edu.degree} - {edu.institution}</h6>
                    <small className="text-muted">{edu.educationStart} – {edu.educationEnd} | {edu.educationLocation}</small>
                    {edu.achievements && <p>{edu.achievements}</p>}
                  </div>
                ))}
              </div>
            )}

            {cvData.Projects?.length > 0 && (
              <div className="mb-4">
                {cvData.Projects.map((proj, i) => (
                  <div key={i} className="mb-3">
                    <h6>{proj.projectName}</h6>
                    <p>{proj.projectDescription}</p>
                    {proj.projectLink && <a href={proj.projectLink} target="_blank">View Project</a>}
                  </div>
                ))}
              </div>
            )}

            {cvData.Certifications?.length > 0 && (
              <div className="mb-4">
                <ul>
                  {cvData.Certifications.map((cert, i) => (
                    <li key={i}>{cert.certification} ({cert.issuer}, {cert.year})</li>
                  ))}
                </ul>
              </div>
            )}

            {cvData["References (optional)"]?.length > 0 && (
              <div className="mb-4">
                {cvData["References (optional)"].map((ref, i) => (
                  <div key={i}>
                    <p><strong>{ref.refName}</strong> - {ref.refPosition}, {ref.refCompany} ({ref.refContact})</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="text-center mt-4">
        <button className="btn btn-primary" onClick={handleDownloadPDF}>
          Download PDF
        </button>
      </div>
    </div>
  );
}
