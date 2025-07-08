"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [cvExists, setCvExists] = useState(null); // null = loading
  const [cvSlug, setCvSlug] = useState("");

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
          setCvExists(true);
          setCvSlug(cvSnap.data().cvSlug);
        } else {
          setCvExists(false);
        }
      };

      checkCV();
    }
  }, [status, user, router]);

  if (status === "loading" || cvExists === null) return <p className="text-center mt-5 text-dark">Loading...</p>;

  const publicURL = `https://talentcrafters.datacraftcoders.com/cv/${cvSlug}`;

  return (
    <div className="container mt-5 text-dark">
      <div className="row">
        {/* Info usuario */}
        <div className="col-md-6 mb-4">
          <div className="p-4 border rounded bg-light">
            <h5 className="mb-3">General Info</h5>
            <div className="mb-2"><strong>Name:</strong> {user?.name}</div>
            <div className="mb-2"><strong>Email:</strong> {user?.email}</div>
            <div className="mb-2"><strong>Phone:</strong> <em>(editable después)</em></div>
            <div className="mb-2"><strong>Address:</strong> <em>(editable después)</em></div>
            <div className="mt-3">
              <img
                src={user?.image || "/default-avatar.png"}
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
                <a href="/editcv" className="btn btn-primary me-2">Edit CV</a>
                <button className="btn btn-danger me-2">Delete CV</button>
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
