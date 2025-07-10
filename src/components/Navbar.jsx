"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

export default function Navbar() {
  const { data: session, status } = useSession();
  const [profilePhoto, setProfilePhoto] = useState("");

  useEffect(() => {
    const fetchPhoto = async () => {
      if (session?.user?.email) {
        const ref = doc(db, "cvs", session.user.email);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data();
          if (data.photo) {
            setProfilePhoto(data.photo);
          }
        }
      }
    };
    fetchPhoto();
  }, [session]);

  return (
    <nav className="navbar navbar-expand-md navbar-light bg-white shadow-sm px-4">
      <div className="container-fluid">
        <Link href="/" className="navbar-brand fw-bold text-dark">
          Talent Crafters
        </Link>

        {/* Botón hamburguesa para móviles */}
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarMenu"
          aria-controls="navbarMenu"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        {/* Contenido colapsable */}
        <div className="collapse navbar-collapse" id="navbarMenu">
          <div className="ms-auto d-flex flex-column flex-md-row align-items-start align-items-md-center gap-3 mt-3 mt-md-0">
            <Link href="/" className="btn btn-outline-secondary w-100 w-md-auto">
              Home
            </Link>

            {status === "unauthenticated" && (
              <Link href="/login" className="btn btn-outline-primary w-100 w-md-auto">
                Login
              </Link>
            )}

            {status === "authenticated" && (
              <>
                <Link href="/dashboard" className="btn btn-outline-primary w-100 w-md-auto">
                  Dashboard
                </Link>

                {session?.user && (
                  <div className="d-flex align-items-center gap-2">
                    <span className="text-dark fw-medium">{session.user.name}</span>
                    <Image
                      src={profilePhoto || session.user.image || "/default-avatar.png"}
                      alt="Profile"
                      width={32}
                      height={32}
                      className="rounded-circle"
                    />
                  </div>
                )}

                <button
                  onClick={() => signOut()}
                  className="btn btn-outline-danger w-100 w-md-auto"
                >
                  Logout
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
