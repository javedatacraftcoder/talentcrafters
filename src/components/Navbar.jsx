"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import Image from "next/image";

export default function Navbar() {
  const { data: session, status } = useSession();

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

            {/* Nombre + foto de perfil */}
            {session?.user && (
              <div className="d-flex align-items-center gap-2">
                <span className="text-dark fw-medium">{session.user.name}</span>
                <Image
                  src={session.user.image || "/default-avatar.png"}
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

