// src/app/cvcreate/page.jsx
"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";
import slugify from "slugify";
import { nanoid } from "nanoid";

const formSchema = {
  sections: [
    {
      title: "Personal Information",
      fields: [
        { label: "Full Name", name: "fullName", type: "text", required: true },
        { label: "Email Address", name: "email", type: "email", required: true },
        { label: "Phone Number", name: "phone", type: "tel", required: true },
        { label: "City and Country", name: "location", type: "text", required: false },
        { label: "LinkedIn or Portfolio URL", name: "linkedin", type: "url", required: false },
        { label: "Upload Profile Photo", name: "photo", type: "file", required: false }
      ]
    },
    {
      title: "Professional Summary",
      fields: [
        { label: "Brief summary about yourself", name: "summary", type: "textarea", required: true }
      ]
    },
    {
      title: "Work Experience",
      repeatable: true,
      fields: [
        { label: "Job Title", name: "jobTitle", type: "text", required: true },
        { label: "Company", name: "company", type: "text", required: true },
        { label: "Location", name: "jobLocation", type: "text", required: false },
        { label: "Start Date", name: "startDate", type: "month", required: true },
        { label: "End Date", name: "endDate", type: "month", required: false },
        { label: "Responsibilities and Achievements", name: "description", type: "textarea", required: true },
        { label: "Tools or Technologies Used", name: "tools", type: "text", required: false }
      ]
    },
    {
      title: "Education",
      repeatable: true,
      fields: [
        { label: "Degree or Program", name: "degree", type: "text", required: true },
        { label: "Institution", name: "institution", type: "text", required: true },
        { label: "Location", name: "educationLocation", type: "text", required: false },
        { label: "Start Date", name: "educationStart", type: "month", required: false },
        { label: "End Date", name: "educationEnd", type: "month", required: false },
        { label: "Academic Achievements", name: "achievements", type: "textarea", required: false }
      ]
    },
    {
      title: "Languages",
      repeatable: true,
      fields: [
        { label: "Language", name: "language", type: "text", required: true },
        { label: "Proficiency Level", name: "level", type: "select", options: ["Basic", "Intermediate", "Advanced", "Native"], required: true }
      ]
    },
    {
      title: "Certifications",
      repeatable: true,
      fields: [
        { label: "Certification Name", name: "certification", type: "text", required: true },
        { label: "Issuing Organization", name: "issuer", type: "text", required: false },
        { label: "Year", name: "year", type: "number", required: false }
      ]
    },
    {
      title: "Projects",
      repeatable: true,
      fields: [
        { label: "Project Name", name: "projectName", type: "text", required: true },
        { label: "Description", name: "projectDescription", type: "textarea", required: true },
        { label: "Your Role", name: "role", type: "text", required: false },
        { label: "Technologies Used", name: "projectTools", type: "text", required: false },
        { label: "Project Link", name: "projectLink", type: "url", required: false }
      ]
    },
    {
      title: "References (optional)",
      repeatable: true,
      fields: [
        { label: "Name", name: "refName", type: "text", required: false },
        { label: "Position", name: "refPosition", type: "text", required: false },
        { label: "Company", name: "refCompany", type: "text", required: false },
        { label: "Contact Info", name: "refContact", type: "text", required: false }
      ]
    },
    {
      title: "Consent",
      fields: [
        { label: "I authorize the use of my data to generate a public CV on this platform.", name: "dataConsent", type: "checkbox", required: true }
      ]
    }
  ]
};

export default function CreateCVPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [formData, setFormData] = useState({});
  const [repeatableSections, setRepeatableSections] = useState({});

  if (!session) return <p className="text-center mt-5 text-dark">Please log in to create your CV.</p>;

  const handleChange = (e, sectionKey, index = null) => {
    const { name, value, type, checked, files } = e.target;
    if (index !== null) {
      setRepeatableSections((prev) => {
        const updated = [...(prev[sectionKey] || [])];
        updated[index] = { ...updated[index], [name]: type === "checkbox" ? checked : value };
        return { ...prev, [sectionKey]: updated };
      });
    } else {
      if (type === "file" && files.length > 0) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setFormData((prev) => ({ ...prev, [name]: reader.result }));
        };
        reader.readAsDataURL(files[0]);
      } else {
        setFormData((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
      }
    }
  };

  const addSectionEntry = (sectionKey) => {
    setRepeatableSections((prev) => ({
      ...prev,
      [sectionKey]: [...(prev[sectionKey] || []), {}],
    }));
  };

  const removeSectionEntry = (sectionKey, index) => {
    setRepeatableSections((prev) => ({
      ...prev,
      [sectionKey]: prev[sectionKey].filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const fullName = formData.fullName || session.user.name;
    const baseSlug = slugify(fullName, { lower: true });
    const uniqueSlug = `${baseSlug}-${nanoid(6)}`;

    const finalData = {
      ...formData,
      ...repeatableSections,
      cvSlug: uniqueSlug,
    };

    await setDoc(doc(db, "cvs", session.user.email), finalData);
    router.push("/dashboard");
  };

  return (
    <div className="container mt-5 text-dark">
      <h2 className="mb-4">Create Your CV</h2>
      <form onSubmit={handleSubmit}>
        {formSchema.sections.map((section, i) => (
          <div key={i} className="mb-4">
            <h5>{section.title}</h5>
            {section.repeatable ? (
              <>
                {(repeatableSections[section.title] || [{}]).map((entry, idx) => (
                  <div key={idx} className="border rounded p-3 mb-3">
                    {section.fields.map((field) => (
                      <div className="mb-2" key={field.name}>
                        <label className="form-label">{field.label}</label>
                        {field.type === "textarea" ? (
                          <textarea
                            name={field.name}
                            className="form-control"
                            required={field.required}
                            value={entry[field.name] || ""}
                            onChange={(e) => handleChange(e, section.title, idx)}
                          ></textarea>
                        ) : field.type === "select" ? (
                          <select
                            name={field.name}
                            className="form-control"
                            required={field.required}
                            value={entry[field.name] || ""}
                            onChange={(e) => handleChange(e, section.title, idx)}
                          >
                            <option value="">Select...</option>
                            {field.options.map((opt, i) => (
                              <option key={i} value={opt}>{opt}</option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type={field.type}
                            name={field.name}
                            className="form-control"
                            required={field.required}
                            value={entry[field.name] || ""}
                            onChange={(e) => handleChange(e, section.title, idx)}
                          />
                        )}
                      </div>
                    ))}
                    <button type="button" onClick={() => removeSectionEntry(section.title, idx)} className="btn btn-sm btn-danger">
                      − Remove
                    </button>
                  </div>
                ))}
                <button type="button" onClick={() => addSectionEntry(section.title)} className="btn btn-sm btn-primary">
                  + Add {section.title}
                </button>
              </>
            ) : (
              section.fields.map((field) => (
                <div className="mb-2" key={field.name}>
                  <label className="form-label">{field.label}</label>
                  {field.type === "textarea" ? (
                    <textarea
                      name={field.name}
                      className="form-control"
                      required={field.required}
                      onChange={(e) => handleChange(e)}
                    ></textarea>
                  ) : field.type === "checkbox" ? (
                    <div className="form-check">
                      <input
                        type="checkbox"
                        name={field.name}
                        className="form-check-input"
                        required={field.required}
                        onChange={(e) => handleChange(e)}
                      />
                      <label className="form-check-label">{field.label}</label>
                    </div>
                  ) : field.type === "file" ? (
                    <input
                      type="file"
                      name={field.name}
                      className="form-control"
                      accept="image/*"
                      onChange={(e) => handleChange(e)}
                    />
                  ) : (
                    <input
                      type={field.type}
                      name={field.name}
                      className="form-control"
                      required={field.required}
                      onChange={(e) => handleChange(e)}
                    />
                  )}
                </div>
              ))
            )}
          </div>
        ))}
        <button type="submit" className="btn btn-success mt-4">
          Save CV
        </button>
      </form>
    </div>
  );
}
