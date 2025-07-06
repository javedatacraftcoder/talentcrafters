import Image from "next/image";

export default function Home() {
  return (
    <div className="container-fluid min-vh-100 d-flex flex-column justify-content-center">
      <div className="row g-0">
        {/* Lado izquierdo: Logo */}
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

        {/* Lado derecho: Formulario */}
        <div className="col-md-6 d-flex justify-content-center align-items-center bg-white p-5">
          <div className="w-100" style={{ maxWidth: "450px" }}>
            <h2 className="mb-4 text-primary">We’re building something great</h2>
            <p className="mb-4">Leave us a message and we’ll get back to you!</p>

            <form method="POST" action="https://formsubmit.co/infor@datacraftcoders.com">
              <div className="mb-3">
                <label htmlFor="name" className="form-label">Name</label>
                <input type="text" name="name" className="form-control" required />
              </div>
              <div className="mb-3">
                <label htmlFor="email" className="form-label">Email</label>
                <input type="email" name="email" className="form-control" required />
              </div>
              <div className="mb-3">
                <label htmlFor="message" className="form-label">Message</label>
                <textarea name="message" className="form-control" rows="4" required></textarea>
              </div>
              <input type="hidden" name="_captcha" value="false" />
              <button type="submit" className="btn btn-success w-100">Send Message</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
