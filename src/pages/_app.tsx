import "@/styles/globals.css";
import "@/styles/navbar-spacing.css";
import type { AppProps } from "next/app";
import { useRouter } from "next/router";
import { Geist, Geist_Mono } from 'next/font/google'
import { Navbar, Footer } from '../components/Layout'

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter()
  const isLandingPage = router.pathname === '/'
  const isEditorPage = router.pathname === '/editor'
  
  return (
    <div className={`${geistSans.className} ${geistMono.className}`}>
      <style jsx global>{`
        body {
          ${isLandingPage ? 'padding-top: 0 !important;' : ''}
          ${isEditorPage ? 'padding-top: 0 !important;' : ''}
        }
      `}</style>
      <Navbar />
      <Component {...pageProps} />
      <Footer />
    </div>
  )
}
