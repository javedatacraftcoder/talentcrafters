"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc, deleteDoc, setDoc } from "firebase/firestore";

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [cvExists, setCvExists] = useState(null); // null = loading
  const [cvSlug, setCvSlug] = useState("");
  const [profileData, setProfileData] = useState({ phone: "", address: "", linkedin: "", photo: "" });
  const [saving, setSaving] = useState(false);

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
          setProfileData({
            phone: data.phone || "",
            address: data.address || "",
            linkedin: data.linkedin || "",
            photo: data.photo || user.image || "",
          });
        } else {
          setCvExists(false);
          setProfileData({
            phone: "",
            address: "",
            linkedin: "",
            photo: user.image || "",
          });
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

  const handleProfileChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "photo" && files[0]) {
      const reader = new FileReader();
      reader.onload = () => {
        setProfileData((prev) => ({ ...prev, photo: reader.result }));
      };
      reader.readAsDataURL(files[0]);
    } else {
      setProfileData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      const ref = doc(db, "cvs", session.user.email);
      await setDoc(ref, { ...profileData, cvSlug }, { merge: true });
      alert("Profile updated successfully.");
    } catch (err) {
      console.error("Error updating profile:", err);
      alert("Failed to update profile.");
    }
    setSaving(false);
  };

  return (
    <div className="container mt-5 text-dark">
      <div className="row">
        {/* Info usuario */}
        <div className="col-md-6 mb-4">
          <div className="p-4 border rounded bg-light">
            <h5 className="mb-3">General Info</h5>
            <div className="mb-2"><strong>Name:</strong> {user?.name}</div>
            <div className="mb-2"><strong>Email:</strong> {user?.email}</div>
            <div className="mb-3">
              <label className="form-label">Phone</label>
              <input type="text" name="phone" className="form-control" value={profileData.phone} onChange={handleProfileChange} />
            </div>
            <div className="mb-3">
              <label className="form-label">Address</label>
              <input type="text" name="address" className="form-control" value={profileData.address} onChange={handleProfileChange} />
            </div>
            <div className="mb-3">
              <label className="form-label">LinkedIn or Portfolio</label>
              <input type="url" name="linkedin" className="form-control" value={profileData.linkedin} onChange={handleProfileChange} />
            </div>
            <div className="mb-3">
              <label className="form-label">Profile Photo</label>
              <input type="file" name="photo" accept="image/*" className="form-control" onChange={handleProfileChange} />
              {profileData.photo && (
                <img
                  src={profileData.photo}
                  alt="Profile"
                  className="rounded-circle mt-3"
                  width="100"
                  height="100"
                />
              )}
            </div>
            <button className="btn btn-success" onClick={saveProfile} disabled={saving}>
              {saving ? "Saving..." : "Save Profile"}
            </button>
          </div>
        </div>

        {/* Gestión CV */}
        <div className="col-md-6 mb-4">
          <div className="p-4 border rounded bg-white">
            <h5 className="mb-3">My CV</h5>
            {cvExists ? (
              <>
                <p>Your CV is ready.</p>
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
                    className="btn btn-outline-success"
                  >
                    View Public CV
                  </a>
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
