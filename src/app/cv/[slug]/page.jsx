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
      <div className="shadow rounded overflow-hidden bg-white p-0" style={{ maxWidth: "960px", margin: "0 auto" }}>
        {/* Top panel */}
        <div className="d-flex">
          {/* Sidebar */}
          <div className="bg-light d-flex flex-column align-items-center justify-content-center px-3 py-4 position-relative" style={{ width: "200px" }}>
            {cvData.photo && (
              <img
                src={cvData.photo}
                alt="Profile"
                className="rounded-circle border border-white mb-3"
                width="120"
                height="120"
              />
            )}
            <div
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                width: "100%",
                height: "20px",
                backgroundColor: themeColor,
              }}
            ></div>
          </div>

          {/* Header info */}
          <div className="flex-grow-1 p-4">
            <h2 className="fw-bold mb-2">{cvData.fullName}</h2>
            <p className="mb-1"><strong>Email:</strong> {cvData.email}</p>
            <p className="mb-1"><strong>Phone:</strong> {cvData.phone}</p>
            <p className="mb-1"><strong>Address:</strong> {cvData.location}</p>
            {cvData.linkedin && (
              <a
                href={cvData.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline-primary btn-sm mt-2"
              >
                View LinkedIn
              </a>
            )}
          </div>
        </div>

        {/* Main CV content */}
        <div className="p-4 text-dark" ref={printRef}>
          <div className="row">
            <div className="col-md-3 text-end pe-3">
              <ul className="list-unstyled">
                {cvData.summary && <li className="fw-bold mb-4">Summary</li>}
                {cvData["Work Experience"]?.length > 0 && <li className="fw-bold mb-4">Work</li>}
                {cvData.Education?.length > 0 && <li className="fw-bold mb-4">Education</li>}
                {cvData.Projects?.length > 0 && <li className="fw-bold mb-4">Projects</li>}
                {cvData.Certifications?.length > 0 && <li className="fw-bold mb-4">Certs</li>}
                {cvData["References (optional)"]?.length > 0 && <li className="fw-bold">Refs</li>}
              </ul>
            </div>

            <div className="col-md-9">
              {cvData.summary && (
                <section className="mb-4">
                  <h5 className="fw-bold">Professional Summary</h5>
                  <p>{cvData.summary}</p>
                </section>
              )}

              {cvData["Work Experience"]?.length > 0 && (
                <section className="mb-4">
                  <h5 className="fw-bold">Work Experience</h5>
                  {cvData["Work Experience"].map((job, i) => (
                    <div key={i} className="mb-2">
                      <strong>{job.jobTitle}</strong> at <strong>{job.company}</strong>
                      <br />
                      <small className="text-muted">{job.startDate} – {job.endDate || "Present"} | {job.jobLocation}</small>
                      <p>{job.description}</p>
                      {job.tools && <p><small><strong>Tools:</strong> {job.tools}</small></p>}
                    </div>
                  ))}
                </section>
              )}

              {cvData.Education?.length > 0 && (
                <section className="mb-4">
                  <h5 className="fw-bold">Education</h5>
                  {cvData.Education.map((edu, i) => (
                    <div key={i} className="mb-2">
                      <strong>{edu.degree}</strong> - {edu.institution}
                      <br />
                      <small className="text-muted">{edu.educationStart} – {edu.educationEnd} | {edu.educationLocation}</small>
                      {edu.achievements && <p>{edu.achievements}</p>}
                    </div>
                  ))}
                </section>
              )}

              {cvData.Projects?.length > 0 && (
                <section className="mb-4">
                  <h5 className="fw-bold">Projects</h5>
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
                  <h5 className="fw-bold">Certifications</h5>
                  <ul>
                    {cvData.Certifications.map((cert, i) => (
                      <li key={i}>{cert.certification} ({cert.issuer}, {cert.year})</li>
                    ))}
                  </ul>
                </section>
              )}

              {cvData["References (optional)"]?.length > 0 && (
                <section className="mb-4">
                  <h5 className="fw-bold">References</h5>
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
    </div>
  );
}
