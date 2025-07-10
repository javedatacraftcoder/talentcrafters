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
    <nav className="navbar navbar-light bg-white shadow-sm px-4">
      <Link href="/" className="navbar-brand fw-bold text-dark">
        Talent Crafters
      </Link>

      <div className="d-flex align-items-center gap-3">
        <Link href="/" className="btn btn-outline-secondary">
          Home
        </Link>

        {status === "unauthenticated" && (
          <Link href="/login" className="btn btn-outline-primary">
            Login
          </Link>
        )}

        {status === "authenticated" && (
          <>
            <Link href="/dashboard" className="btn btn-outline-primary">
              Dashboard
            </Link>

            {/* Nombre + foto de perfil (prioriza la de Firestore) */}
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

            <button onClick={() => signOut()} className="btn btn-outline-danger">
              Logout
            </button>
          </>
        )}
      </div>
    </nav>
  );
}
