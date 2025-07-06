export default function Home() {
  return (
    <div className="container-fluid vh-100 d-flex align-items-center">
      <div className="row w-100">
        {/* Lado izquierdo: Logo */}
        <div className="col-md-6 d-flex justify-content-center align-items-center bg-light">
          <img
            src="/talentcrafterslogo.png"
            alt="Talent Crafters Logo"
            style={{ maxWidth: "80%", height: "auto" }}
          />
        </div>

        {/* Lado derecho: Formulario */}
        <div className="col-md-6 d-flex justify-content-center align-items-center bg-white">
          <div className="w-75">
            <h2 className="mb-4">We’re building something great</h2>
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
              {/* Anti-spam hidden input */}
              <input type="hidden" name="_captcha" value="false" />
              <button type="submit" className="btn btn-primary w-100">Send</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
