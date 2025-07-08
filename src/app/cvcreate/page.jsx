// src/app/create-cv/page.jsx
"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";

const formSchema = {
  sections: [
    {
      title: "Personal Information",
      fields: [
        { label: "Full Name", name: "fullName", type: "text", required: true },
        { label: "Email Address", name: "email", type: "email", required: true },
        { label: "Phone Number", name: "phone", type: "tel", required: true },
        { label: "City and Country", name: "location", type: "text", required: false },
        { label: "LinkedIn or Portfolio URL", name: "linkedin", type: "url", required: false }
      ]
    },
    {
      title: "Professional Summary",
      fields: [
        {
          label: "Brief summary about yourself",
          name: "summary",
          type: "textarea",
          required: true
        }
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
        {
          label: "I authorize the use of my data to generate a public CV on this platform.",
          name: "dataConsent",
          type: "checkbox",
          required: true
        }
      ]
    }
  ]
};

export default function CreateCVPage() {
  return (
    <div className="container mt-5">
      <h2 className="mb-4">Create Your CV</h2>
      {/* Aquí va el render dinámico de todas las secciones con add/remove y guardado en Firestore */}
      <p>Formulario en desarrollo con todas las secciones dinámicas.</p>
    </div>
  );
}