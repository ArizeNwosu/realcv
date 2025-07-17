import Image from "next/image";
import { Geist, Geist_Mono } from "next/font/google";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function Home() {
  return (
    <div
      className={`${geistSans.className} ${geistMono.className} font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-2 pb-12 gap-8 sm:p-4`}
    >
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        {/* Hero Section */}
        <div className="text-center sm:text-left">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4 tracking-tight">
            🚫 AI Résumés Are Getting You Rejected
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Recruiters are cracking down on ChatGPT-written applications. If your resume reads like a bot — you're done.
          </p>
          <div className="flex gap-3 items-center flex-col sm:flex-row">
            <a
              href="/editor"
              className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-blue-600 text-white gap-2 hover:bg-blue-700 font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 w-full sm:w-auto shadow-sm hover:shadow-md"
            >
              🔒 Create a Human Verified Resume
            </a>
            <a
              href="/output-example"
              className="rounded-full border border-solid border-gray-300 transition-colors flex items-center justify-center hover:bg-gray-50 font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 w-full sm:w-auto shadow-sm hover:shadow-md"
            >
              🔍 See a Sample Certificate
            </a>
          </div>
        </div>

        {/* The Problem – Stats + Fear */}
        <div className="text-center sm:text-left space-y-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            📉 You're Not Competing With People — You're Competing With Bots
          </h2>
          <div className="bg-red-50 p-6 rounded-lg border border-red-200 mb-6">
            <ul className="text-gray-700 space-y-3 mb-4">
              <li className="flex items-start gap-2">
                <span className="text-red-600 font-bold">•</span>
                <span>65% of employers now use AI to filter out AI-generated resumes <span className="text-sm text-gray-500">— Forbes, 2024</span></span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-600 font-bold">•</span>
                <span>24% of hiring managers disqualify applicants just for using ChatGPT <span className="text-sm text-gray-500">— Software Finder, 2024</span></span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-600 font-bold">•</span>
                <span>AI-written resumes are often flagged for keyword stuffing and lack of originality</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Comparison – Human vs AI */}
        <div className="text-center sm:text-left space-y-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            🤖 AI Résumés Look Like This
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-red-50 p-6 rounded-lg border border-red-200">
              <h3 className="font-bold text-red-700 mb-4 flex items-center gap-2">
                <span>❌</span> AI-Generated
              </h3>
              <ul className="text-gray-700 space-y-2 text-sm">
                <li>• Too perfect, overly polished</li>
                <li>• Filled with buzzwords and jargon</li>
                <li>• Template-based formatting</li>
                <li>• Generic achievements</li>
                <li>• Predictable phrasing ("results-driven," "synergy")</li>
              </ul>
            </div>
            <div className="bg-green-50 p-6 rounded-lg border border-green-200">
              <h3 className="font-bold text-green-700 mb-4 flex items-center gap-2">
                <span>✅</span> Human-Written
              </h3>
              <ul className="text-gray-700 space-y-2 text-sm">
                <li>• Story-driven, authentic tone</li>
                <li>• Specific and personal details</li>
                <li>• Unique writing style</li>
                <li>• Honest accomplishments</li>
                <li>• Shows real thinking and care</li>
              </ul>
            </div>
          </div>
          <p className="text-gray-600 text-sm italic">Recruiters can tell. So can algorithms.</p>
        </div>

        {/* The Proof – What RealCV Gives You */}
        <div className="text-center sm:text-left space-y-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            🔐 RealCV Verifies Your Resume Was Written by a Human — You
          </h2>
          <div className="bg-blue-50 p-6 rounded-lg border border-blue-200 mb-6">
            <h4 className="font-semibold text-blue-900 mb-3">How it works:</h4>
            <ul className="text-blue-800 space-y-2">
              <li>✅ Tracks how your resume was typed, edited, revised</li>
              <li>✅ Confirms originality and authorship</li>
              <li>✅ Issues a tamper-proof Proof of Humanity Certificate</li>
              <li>✅ Shows employers you did the work — not a bot</li>
            </ul>
          </div>
        </div>

        {/* Trust + Results */}
        <div className="text-center sm:text-left space-y-4">
          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 mb-6">
            <blockquote className="text-gray-700 mb-4 italic">
              "My old resume was getting ghosted. After verifying mine with RealCV, I landed 3 interviews in a week."
            </blockquote>
            <cite className="text-gray-600">— Alex G., Software Engineer</cite>
          </div>
          <div className="bg-green-50 p-6 rounded-lg border border-green-200">
            <h4 className="font-semibold text-green-900 mb-3">📈 Human-authored resumes receive:</h4>
            <div className="text-green-800 space-y-2">
              <div>• 7.8% more job offers</div>
              <div>• 8.4% higher average salary</div>
              <div className="text-sm text-gray-600">— MIT Behavioral Study, 2023</div>
            </div>
          </div>
        </div>

        {/* Final CTA */}
        <div className="text-center sm:text-left space-y-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            🚀 Don't Let AI Cost You the Job You Deserve
          </h2>
          <p className="text-lg text-gray-600 mb-6">
            Stand out. Get noticed. Get interviews.
          </p>
          <div className="flex gap-3 items-center flex-col sm:flex-row">
            <a
              href="/editor"
              className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-blue-600 text-white gap-2 hover:bg-blue-700 font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 w-full sm:w-auto shadow-sm hover:shadow-md"
            >
              🧾 Create a Human Verified Resume
            </a>
            <a
              href="/output-example"
              className="rounded-full border border-solid border-gray-300 transition-colors flex items-center justify-center hover:bg-gray-50 font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 w-full sm:w-auto shadow-sm hover:shadow-md"
            >
              🔍 See a Sample Certificate
            </a>
          </div>
        </div>
      </main>
      <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center">
        {/* Site links will go here */}
      </footer>
    </div>
  );
}
