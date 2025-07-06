// src/app/test-firestore/page.js
"use client";

import { db } from "@/lib/firebase";
import { collection, doc, setDoc } from "firebase/firestore";

export default function TestFirestore() {
  const handleSave = async () => {
    const ref = doc(collection(db, "users"), "demo-user-id");
    await setDoc(ref, {
      firstName: "Javier",
      lastName: "Velazquez",
      role: "Frontend Developer",
      createdAt: new Date(),
    });
    alert("Documento guardado en Firestore");
  };

  return (
    <div className="container mt-5">
      <h1>Test Firestore</h1>
      <button className="btn btn-primary" onClick={handleSave}>
        Guardar CV demo
      </button>
    </div>
  );
}
