// src/app/edit-cv/page.jsx
"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

export default function EditCVPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [formData, setFormData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.user?.email) {
      const loadData = async () => {
        const ref = doc(db, "cvs", session.user.email);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          setFormData(snap.data());
        }
        setLoading(false);
      };
      loadData();
    }
  }, [session]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await setDoc(doc(db, "cvs", session.user.email), formData);
    router.push("/dashboard");
  };

  if (!session) return <p className="text-center mt-5 text-dark">Please log in to edit your CV.</p>;
  if (loading) return <p className="text-center mt-5 text-dark">Loading...</p>;
  if (!formData) return <p className="text-center mt-5 text-dark">No CV found to edit.</p>;

  return (
    <div className="container mt-5 text-dark">
      <h2 className="mb-4">Edit Your CV</h2>
      <form onSubmit={handleSubmit}>
        {Object.entries(formData).map(([key, value]) => (
          typeof value === "string" || typeof value === "number" ? (
            <div className="mb-3" key={key}>
              <label className="form-label text-capitalize">{key}</label>
              <input
                type="text"
                name={key}
                className="form-control"
                value={value}
                onChange={handleChange}
              />
            </div>
          ) : null
        ))}
        <button type="submit" className="btn btn-success mt-3">Update CV</button>
      </form>
    </div>
  );
}
