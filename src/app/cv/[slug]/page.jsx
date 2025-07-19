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
      <div className="shadow-lg p-0 rounded overflow-hidden" style={{ backgroundColor: "#fff" }} ref={printRef}>
        <div className="d-flex">
          <div style={{ width: "120px", backgroundColor: themeColor }}></div>
          <div className="p-4 d-flex align-items-center">
            <img
              src={cvData.photo || "/default-avatar.png"}
              alt="Profile"
              className="rounded-circle border border-white"
              width="120"
              height="120"
              style={{ objectFit: "cover" }}
            />
          </div>
          <div className="p-4 flex-grow-1">
            <h2 className="fw-bold mb-0 text-dark">{cvData.fullName}</h2>
            {cvData.jobTitle && <p className="text-muted mb-3">{cvData.jobTitle}</p>}
            <p className="mb-1"><strong>Phone:</strong> {cvData.phone}</p>
            <p className="mb-1"><strong>Email:</strong> {cvData.email}</p>
            <p><strong>Address:</strong> {cvData.location}</p>
          </div>
        </div>
        <hr className="m-0" />

        <div className="row m-0 p-0">
          <div className="col-md-3 text-end border-end p-4">
            {cvData.summary && <p className="fw-bold">Profile</p>}
            {cvData["Work Experience"]?.length > 0 && <p className="fw-bold">Experience</p>}
            {cvData.Education?.length > 0 && <p className="fw-bold">Education</p>}
            {cvData.Projects?.length > 0 && <p className="fw-bold">Projects</p>}
            {cvData.Certifications?.length > 0 && <p className="fw-bold">Certifications</p>}
            {cvData["References (optional)"]?.length > 0 && <p className="fw-bold">References</p>}
            {cvData.technicalSkills && <p className="fw-bold">Skills</p>}
            {cvData.Languages?.length > 0 && <p className="fw-bold">Languages</p>}
          </div>

          <div className="col-md-9 p-4 text-dark">
            {cvData.summary && (
              <section className="mb-4">
                <h5 className="fw-bold">Profile</h5>
                <p>{cvData.summary}</p>
              </section>
            )}

            {cvData["Work Experience"]?.length > 0 && (
              <section className="mb-4">
                <h5 className="fw-bold">Experience</h5>
                {cvData["Work Experience"].map((job, i) => (
                  <div key={i} className="mb-3">
                    <strong>{job.jobTitle}</strong> at {job.company}<br />
                    <small className="text-muted">{job.startDate} – {job.endDate || "Present"} | {job.jobLocation}</small>
                    <p>{job.description}</p>
                  </div>
                ))}
              </section>
            )}

            {cvData.Education?.length > 0 && (
              <section className="mb-4">
                <h5 className="fw-bold">Education</h5>
                {cvData.Education.map((edu, i) => (
                  <div key={i} className="mb-3">
                    <strong>{edu.degree}</strong> - {edu.institution}<br />
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
                  <div key={i} className="mb-3">
                    <strong>{proj.projectName}</strong>
                    <p>{proj.projectDescription}</p>
                    {proj.projectLink && <a href={proj.projectLink} target="_blank">View Project</a>}
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
                  <p key={i}><strong>{ref.refName}</strong> - {ref.refPosition}, {ref.refCompany} ({ref.refContact})</p>
                ))}
              </section>
            )}

            {cvData.technicalSkills && (
              <section className="mb-4">
                <h5 className="fw-bold">Skills</h5>
                <p><strong>Technical:</strong> {cvData.technicalSkills}</p>
                {cvData.softSkills && <p><strong>Soft:</strong> {cvData.softSkills}</p>}
              </section>
            )}

            {cvData.Languages?.length > 0 && (
              <section className="mb-4">
                <h5 className="fw-bold">Languages</h5>
                <ul>
                  {cvData.Languages.map((lang, i) => (
                    <li key={i}>{lang.language} – {lang.level}</li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
