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

  return (
    <div className="container my-5 text-dark">
      <div className="row shadow rounded overflow-hidden">
        <div className="col-md-4 bg-light text-center py-4 px-3">
          {cvData.photo && (
            <img src={cvData.photo} alt="Profile" className="rounded-circle mb-3" width="120" height="120" />
          )}
          <h3 className="fw-bold">{cvData.fullName}</h3>
          <p className="text-muted mb-1">{cvData.location}</p>
          <p className="mb-1">📞 {cvData.phone}</p>
          <p className="mb-3">📧 {cvData.email}</p>
          {cvData.linkedin && (
            <a href={cvData.linkedin} target="_blank" className="btn btn-outline-primary btn-sm mb-3">
              View LinkedIn
            </a>
          )}
          <hr />
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
          <hr />
          <p className="text-muted small">Views: {cvData.views}</p>
          <button className="btn btn-success btn-sm mt-2" onClick={handleDownloadPDF}>Download PDF</button>
        </div>

        <div className="col-md-8 bg-white p-4" ref={printRef}>
          <h4 className="border-bottom pb-2 mb-4">Professional Summary</h4>
          <p>{cvData.summary}</p>

          {cvData["Work Experience"]?.length > 0 && (
            <section className="mb-4">
              <h4 className="border-bottom pb-2">Work Experience</h4>
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
              <h4 className="border-bottom pb-2">Education</h4>
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
              <h4 className="border-bottom pb-2">Projects</h4>
              {cvData.Projects.map((proj, i) => (
                <div key={i} className="mb-3">
                  <h6>{proj.projectName}</h6>
                  <p>{proj.projectDescription}</p>
                  {proj.projectLink && <a href={proj.projectLink} target="_blank">View Project</a>}
                </div>
              ))}
            </section>
          )}

          {cvData.Certifications?.length > 0 && (
            <section className="mb-4">
              <h4 className="border-bottom pb-2">Certifications</h4>
              <ul>
                {cvData.Certifications.map((cert, i) => (
                  <li key={i}>{cert.certification} ({cert.issuer}, {cert.year})</li>
                ))}
              </ul>
            </section>
          )}

          {cvData["References (optional)"]?.length > 0 && (
            <section className="mb-4">
              <h4 className="border-bottom pb-2">References</h4>
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
  );
}
