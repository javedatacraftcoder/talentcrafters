"use client";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";

export default function Navbar() {
  const { data: session } = useSession();

  return (
    <nav className="navbar navbar-light bg-white shadow-sm px-4">
      <Link href="/" className="navbar-brand fw-bold text-dark">
        Talent Crafters
      </Link>
      <div className="d-flex gap-3">
        <Link href="/" className="btn btn-outline-secondary">
          Home
        </Link>
        {session && (
          <button onClick={() => signOut()} className="btn btn-outline-danger">
            Logout
          </button>
        )}
      </div>
    </nav>
  );
}
