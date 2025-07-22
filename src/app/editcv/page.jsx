// src/app/editcv/page.jsx
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
    const { name, value, type, checked, files } = e.target;

    if (type === "file" && files.length > 0) {
      const file = files[0];
      const reader = new FileReader();
      reader.onload = function (event) {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const MAX_SIZE = 300;
          const scale = Math.min(MAX_SIZE / img.width, MAX_SIZE / img.height);
          canvas.width = img.width * scale;
          canvas.height = img.height * scale;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const base64 = canvas.toDataURL("image/jpeg", 0.7);
          setFormData((prev) => ({ ...prev, [name]: base64 }));
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
      return;
    }

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
    await setDoc(doc(db, "cvs", session.user.email), {
      ...formData,
      cvSlug: formData.cvSlug,
    });
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
          ["views", "cvSlug", "themeColor"].includes(key) ? null : (
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
            ) : key === "dataConsent" ? (
              <div className="form-check mb-3" key={key}>
                <input
                  className="form-check-input"
                  type="checkbox"
                  name={key}
                  id={key}
                  checked={!!value}
                  onChange={handleChange}
                />
                <label className="form-check-label" htmlFor={key}>
                  I authorize the use of my data to generate a public CV on this platform.
                </label>
              </div>
            ) : key === "photo" ? (
              <div className="mb-3" key={key}>
                <label className="form-label">Current Profile Photo</label>
                {value && <div className="mb-2">
                  <img src={value} alt="Current Profile" width="100" height="100" className="rounded-circle" />
                </div>}
                <input
                  type="file"
                  accept="image/*"
                  name="photo"
                  className="form-control"
                  onChange={handleChange}
                />
                <div className="form-text">Upload a new image to replace the current one.</div>
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
          )
        ))}
        <button type="submit" className="btn btn-success mt-3">Update CV</button>
      </form>
    </div>
  );
}
