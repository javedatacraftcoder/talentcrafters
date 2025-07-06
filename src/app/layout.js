import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
// import "./globals.css"; // Si estás teniendo conflictos con Bootstrap, puedes comentar esto temporalmente

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Talent Crafters",
  description: "Create your professional CV and showcase it online",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* Bootstrap 5.0.2 CSS CDN */}
        <link 
          rel="stylesheet" 
          href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.3/css/bootstrap.min.css"
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        {children}

        {/* Bootstrap 5.0.2 JS CDN (via next/script, after page loads) */}
        <script 
          src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js" 
          crossOrigin="anonymous"
          defer
        ></script>
      </body>
    </html>
  );
}

