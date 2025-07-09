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

      // Verificar si puede ver
      if (!isPublic && status !== "loading") {
        if (!isOwner) {
          setAccessDenied(true);
          setLoading(false);
          return;
        }
      }

      // Incrementar vistas si es público y no es el dueño
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
        {/* Puedes agregar esta línea si quieres ver las vistas también */}
        {cvData.views >= 0 && (
          <p className="text-muted text-end" style={{ fontSize: "0.9rem" }}>
            Views: {cvData.views}
          </p>
        )}

        <section className="mb-4">
          <h4>Professional Summary</h4>
          <p>{cvData.summary}</p>
        </section>

        {/* Resto de secciones igual */}
        {/* ... */}
      </div>
    </div>
  );
}
