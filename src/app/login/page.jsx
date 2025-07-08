"use client";
import { signIn } from "next-auth/react";
import Image from "next/image";

export default function LoginPage() {
  return (
    <div className="container-fluid min-vh-100 d-flex align-items-center">
      <div className="row w-100">
        {/* Logo lado izquierdo */}
        <div className="col-md-6 d-flex justify-content-center align-items-center bg-light p-5">
          <Image
            src="/talentcrafterslogo.png"
            alt="Talent Crafters Logo"
            width={400}
            height={400}
            priority
            style={{ maxWidth: "100%", height: "auto" }}
          />
        </div>

        {/* Botón de login lado derecho */}
        <div className="col-md-6 d-flex justify-content-center align-items-center p-5">
          <div className="text-center">
            <h2 className="mb-4">Login to Talent Crafters</h2>
            <button
              onClick={() =>
                signIn("google", {
                  callbackUrl: `${window.location.origin}/dashboard`,
                  prompt: "select_account",
                })
              }
              className="btn btn-primary"
            >
              Sign in with Google
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
