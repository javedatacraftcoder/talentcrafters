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

  const handleRepeatableChange = (section, index, e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => {
      const updated = [...(prev[section] || [])];
      updated[index] = { ...updated[index], [name]: type === "checkbox" ? checked : value };
      return { ...prev, [section]: updated };
    });
  };

  const addRepeatableEntry = (section) => {
    setFormData((prev) => ({
      ...prev,
      [section]: [...(prev[section] || []), {}],
    }));
  };

  const removeRepeatableEntry = (section, index) => {
    setFormData((prev) => ({
      ...prev,
      [section]: prev[section].filter((_, i) => i !== index),
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
          Array.isArray(value) ? (
            <div key={key} className="mb-4">
              <h5 className="text-capitalize">{key.replace(/([A-Z])/g, ' $1')}</h5>
              {value.map((item, idx) => (
                <div key={idx} className="border rounded p-3 mb-3">
                  {Object.entries(item).map(([field, val]) => (
                    <div className="mb-2" key={field}>
                      <label className="form-label text-capitalize">{field.replace(/([A-Z])/g, ' $1')}</label>
                      <input
                        type="text"
                        name={field}
                        className="form-control"
                        value={val}
                        onChange={(e) => handleRepeatableChange(key, idx, e)}
                      />
                    </div>
                  ))}
                  <button type="button" className="btn btn-sm btn-danger" onClick={() => removeRepeatableEntry(key, idx)}>
                    − Remove
                  </button>
                </div>
              ))}
              <button type="button" className="btn btn-sm btn-primary" onClick={() => addRepeatableEntry(key)}>
                + Add {key.replace(/([A-Z])/g, ' $1')}
              </button>
            </div>
          ) : (typeof value === "string" || typeof value === "number" || typeof value === "boolean") && (
            <div className="mb-3" key={key}>
              <label className="form-label text-capitalize">{key.replace(/([A-Z])/g, ' $1')}</label>
              <input
                type="text"
                name={key}
                className="form-control"
                value={value}
                onChange={handleChange}
              />
            </div>
          )
        ))}
        <button type="submit" className="btn btn-success mt-3">Update CV</button>
      </form>
    </div>
  );
}
