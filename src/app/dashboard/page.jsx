"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc, deleteDoc, updateDoc } from "firebase/firestore";
import QRCode from "qrcode.react";

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [cvExists, setCvExists] = useState(null);
  const [cvSlug, setCvSlug] = useState("");
  const [cvData, setCvData] = useState(null);

  const user = session?.user;

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }

    if (user?.email) {
      const checkCV = async () => {
        const cvRef = doc(db, "cvs", user.email);
        const cvSnap = await getDoc(cvRef);
        if (cvSnap.exists()) {
          const data = cvSnap.data();
          setCvExists(true);
          setCvSlug(data.cvSlug);
          setCvData(data);
        } else {
          setCvExists(false);
        }
      };

      checkCV();
    }
  }, [status, user, router]);

  if (status === "loading" || cvExists === null) return <p className="text-center mt-5 text-dark">Loading...</p>;

  const publicURL = `https://talentcrafters.datacraftcoders.com/cv/${cvSlug}`;

  const handleDeleteCV = async () => {
    const confirmed = window.confirm("Are you sure you want to delete your CV? This action cannot be undone.");
    if (!confirmed) return;

    try {
      await deleteDoc(doc(db, "cvs", session.user.email));
      alert("CV deleted successfully.");
      router.refresh();
    } catch (error) {
      console.error("Error deleting CV:", error);
      alert("There was a problem deleting your CV.");
    }
  };

  const updateThemeColor = async (e) => {
    const newColor = e.target.value;
    const cvRef = doc(db, "cvs", session.user.email);

    try {
      await updateDoc(cvRef, { themeColor: newColor });
      setCvData((prev) => ({ ...prev, themeColor: newColor }));
    } catch (error) {
      console.error("Error updating theme color:", error);
      alert("Failed to update theme color.");
    }
  };

  const whatsappMessage = `Check out my CV: ${publicURL}`;
  const whatsappURL = `https://wa.me/?text=${encodeURIComponent(whatsappMessage)}`;

  return (
    <div className="container mt-5 text-dark">
      <div className="row">
        {/* Info usuario */}
        <div className="col-md-6 mb-4">
          <div className="p-4 border rounded bg-light">
            <h5 className="mb-3">General Info</h5>
            <div className="mb-2"><strong>Name:</strong> {user?.name}</div>
            <div className="mb-2"><strong>Email:</strong> {user?.email}</div>
            <div className="mb-2"><strong>Phone:</strong> {cvData?.phone || <em>Not provided</em>}</div>
            <div className="mb-2"><strong>Address:</strong> {cvData?.location || <em>Not provided</em>}</div>

            {/* Nuevo selector de color */}
            <div className="mb-2">
              <label className="form-label"><strong>Theme Color:</strong></label>
              <select
                className="form-select"
                value={cvData?.themeColor || ""}
                onChange={updateThemeColor}
              >
                <option value="">Select a color theme</option>
                <option value="#3D74B6">Blue </option>
                <option value="#7F8CAA">Gray </option>
                <option value="#819067">Grayish-green </option>
                <option value="#725CAD">Violet </option>
                <option value="#FF6F3C">Orange (Modern)</option>
              </select>
            </div>

            <div className="mt-3">
              <img
                src={cvData?.photo || "/default-avatar.png"}
                alt="Profile"
                className="rounded-circle"
                width="100"
                height="100"
              />
            </div>
          </div>
        </div>

        {/* Gestión CV */}
        <div className="col-md-6 mb-4">
          <div className="p-4 border rounded bg-white">
            <h5 className="mb-3">My CV</h5>
            {cvExists ? (
              <>
                <p>Your CV is ready.</p>

                <p className="mb-1">
                  <strong>Status:</strong>{" "}
                  {cvData?.dataConsent ? (
                    <span className="text-success">Public ✅</span>
                  ) : (
                    <span className="text-danger">Private 🔒</span>
                  )}
                </p>

                {!cvData?.dataConsent && (
                  <small className="text-muted d-block mb-3">
                    To make your CV public, go to "Edit CV" and check the consent box.
                  </small>
                )}

                <a href="/editcv" className="btn btn-primary me-2">Edit CV</a>
                <button onClick={handleDeleteCV} className="btn btn-danger me-2">
                  Delete CV
                </button>
                <div className="mt-3">
                  <label className="form-label">Public URL</label>
                  <input
                    type="text"
                    className="form-control mb-2"
                    value={publicURL}
                    readOnly
                  />
                  <a
                    href={publicURL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-outline-success mb-2"
                  >
                    View Public CV
                  </a>

                  <a
                    href={whatsappURL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-success mb-2"
                  >
                    Share on WhatsApp
                  </a>

                  <div className="mb-3">
                    <label className="form-label">QR Code</label>
                    <QRCode value={publicURL} size={128} />
                  </div>

                  {typeof cvData?.views === "number" && (
                    <p className="text-muted mb-0">
                      <strong>Public views:</strong> {cvData.views}
                    </p>
                  )}
                </div>
              </>
            ) : (
              <>
                <p>You don't have a CV yet</p>
                <a href="/cvcreate" className="btn btn-primary">Create CV</a>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
