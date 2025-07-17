import Head from 'next/head'

export default function Employers() {
  return (
    <div style={{maxWidth: 800, margin: '0 auto', padding: '48px 16px', fontSize: '1.05rem', lineHeight: 1.7}}>
      <Head>
        <title>For Employers | RealCV</title>
      </Head>
      
      {/* Hero Section */}
      <div style={{textAlign: 'center', marginBottom: 48}}>
        <h1 style={{fontWeight: 700, fontSize: '2.5rem', marginBottom: 16, color: '#111827'}}>
          🧠 Drowning in AI Resumes? You're Not Alone.
        </h1>
        <p style={{fontSize: '1.2rem', color: '#6b7280', marginBottom: 32}}>
          Over 50% of job applicants are now using ChatGPT to flood your inbox with templated, keyword-stuffed resumes. And most of them aren't qualified.
        </p>
        <a
          href="/output-example"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '12px 24px',
            backgroundColor: '#3b82f6',
            color: 'white',
            borderRadius: '8px',
            textDecoration: 'none',
            fontWeight: 500,
            transition: 'background-color 0.2s'
          }}
          onMouseOver={(e) => (e.target as HTMLElement).style.backgroundColor = '#2563eb'}
          onMouseOut={(e) => (e.target as HTMLElement).style.backgroundColor = '#3b82f6'}
        >
          🔎 See Real Human Resumes
        </a>
      </div>

      {/* Problem: The AI Application Crisis */}
      <div style={{marginBottom: 48}}>
        <h2 style={{fontWeight: 600, fontSize: '1.8rem', marginBottom: 24, color: '#111827'}}>
          ⚠️ Problem: The AI Application Crisis
        </h2>
        <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 24}}>
          <div style={{background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, padding: 24}}>
            <div style={{fontSize: '2rem', marginBottom: 8}}>📈</div>
            <h3 style={{fontWeight: 600, marginBottom: 8, color: '#dc2626'}}>11,000 applications per minute.</h3>
            <p style={{color: '#6b7280', fontSize: '0.95rem'}}>That's how fast AI is flooding job boards—with resumes that all look the same.</p>
          </div>
          <div style={{background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, padding: 24}}>
            <div style={{fontSize: '2rem', marginBottom: 8}}>🤖</div>
            <h3 style={{fontWeight: 600, marginBottom: 8, color: '#dc2626'}}>50% of job seekers use AI tools.</h3>
            <p style={{color: '#6b7280', fontSize: '0.95rem'}}>Result? Recruiters spend more time filtering noise than finding talent.</p>
          </div>
          <div style={{background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, padding: 24}}>
            <div style={{fontSize: '2rem', marginBottom: 8}}>🚫</div>
            <h3 style={{fontWeight: 600, marginBottom: 8, color: '#dc2626'}}>38% of qualified applicants get auto-rejected.</h3>
            <p style={{color: '#6b7280', fontSize: '0.95rem'}}>AI filters often screen out good candidates before a human even sees them.</p>
          </div>
          <div style={{background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, padding: 24}}>
            <div style={{fontSize: '2rem', marginBottom: 8}}>😨</div>
            <h3 style={{fontWeight: 600, marginBottom: 8, color: '#dc2626'}}>56% of employers are worried.</h3>
            <p style={{color: '#6b7280', fontSize: '0.95rem'}}>Bias, false negatives, and spammy submissions are crippling hiring accuracy.</p>
          </div>
        </div>
      </div>

      {/* The Cost to Your Business */}
      <div style={{marginBottom: 48}}>
        <h2 style={{fontWeight: 600, fontSize: '1.8rem', marginBottom: 24, color: '#111827'}}>
          📉 The Cost to Your Business
        </h2>
        <div style={{background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, padding: 24}}>
          <ul style={{color: '#6b7280', lineHeight: 1.8}}>
            <li>• Wasted recruiter hours on junk resumes</li>
            <li>• Missed top talent due to overzealous AI filters</li>
            <li>• Bad hires from polished-but-incompetent applications</li>
            <li>• Brand damage when your hiring process becomes impersonal or unfair</li>
          </ul>
        </div>
      </div>

      {/* The Solution: Verified Human-Written Resumes */}
      <div style={{marginBottom: 48}}>
        <h2 style={{fontWeight: 600, fontSize: '1.8rem', marginBottom: 24, color: '#111827'}}>
          ✅ The Solution: Verified Human-Written Resumes
        </h2>
        <p style={{fontSize: '1.1rem', color: '#6b7280', marginBottom: 24}}>
          RealCV ensures every resume you receive was actually written by a human. Our system verifies authenticity using behavioral signals, writing telemetry, and proof-of-origin.
        </p>
        <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24}}>
          <div style={{background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, padding: 24}}>
            <h3 style={{fontWeight: 600, marginBottom: 16, color: '#dc2626'}}>No more:</h3>
            <ul style={{color: '#6b7280', lineHeight: 1.8}}>
              <li>• Copy-pasted cover letters</li>
              <li>• GPT-generated slop</li>
              <li>• Mass AI spam</li>
            </ul>
          </div>
          <div style={{background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: 24}}>
            <h3 style={{fontWeight: 600, marginBottom: 16, color: '#16a34a'}}>Only:</h3>
            <ul style={{color: '#6b7280', lineHeight: 1.8}}>
              <li>• Authentic writing</li>
              <li>• Real candidates</li>
              <li>• Hire-ready talent</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Trust Built In */}
      <div style={{marginBottom: 48}}>
        <h2 style={{fontWeight: 600, fontSize: '1.8rem', marginBottom: 24, color: '#111827'}}>
          🔐 Trust Built In
        </h2>
        <div style={{background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 12, padding: 24}}>
          <ul style={{color: '#1e40af', lineHeight: 1.8}}>
            <li>• AI-authorship detection & writing timeline proof</li>
            <li>• Behavioral "human proof" tokens attached to each resume</li>
            <li>• Seamless ATS integration with minimal disruption</li>
          </ul>
        </div>
      </div>

      {/* Verify Resume Section */}
      <div style={{marginBottom: 48}}>
        <h2 style={{fontWeight: 600, fontSize: '1.8rem', marginBottom: 24, color: '#111827'}}>
          ✅ Verify a Resume Right Now
        </h2>
        <div style={{background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 12, padding: 32, textAlign: 'center'}}>
          <p style={{fontSize: '1.1rem', color: '#6b7280', marginBottom: 24}}>
            Have a RealCV resume from a candidate? Verify its authenticity instantly with the 12-character document code.
          </p>
          <a
            href="/verify-code"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '12px 24px',
              backgroundColor: '#16a34a',
              color: 'white',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: 500,
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => (e.target as HTMLElement).style.backgroundColor = '#15803d'}
            onMouseOut={(e) => (e.target as HTMLElement).style.backgroundColor = '#16a34a'}
          >
            🔍 Verify Resume
          </a>
          <div style={{marginTop: 16, fontSize: '0.9rem', color: '#6b7280'}}>
            Example code format: AB19F8C392XZ
          </div>
        </div>
      </div>

      {/* Trust Tier Explanation */}
      <div style={{marginBottom: 48}}>
        <h2 style={{fontWeight: 600, fontSize: '1.8rem', marginBottom: 24, color: '#111827'}}>
          📊 Understanding Trust Tiers
        </h2>
        <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20}}>
          <div style={{background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: 20}}>
            <div style={{display: 'flex', alignItems: 'center', marginBottom: 12}}>
              <span style={{background: '#16a34a', color: 'white', padding: '4px 8px', borderRadius: 16, fontSize: '0.8rem', fontWeight: 600}}>Tier 3</span>
              <span style={{marginLeft: 12, fontWeight: 600, color: '#16a34a'}}>High Trust</span>
            </div>
            <div style={{fontSize: '0.9rem', color: '#374151', lineHeight: 1.6}}>
              <strong>Requirements:</strong> 15+ minutes active typing, 3+ edits, 0 large pastes<br/>
              <strong>Confidence:</strong> Strong evidence of human authorship with extensive writing time and organic behavior patterns.
            </div>
          </div>
          <div style={{background: '#fffbeb', border: '1px solid #fed7aa', borderRadius: 12, padding: 20}}>
            <div style={{display: 'flex', alignItems: 'center', marginBottom: 12}}>
              <span style={{background: '#f59e0b', color: 'white', padding: '4px 8px', borderRadius: 16, fontSize: '0.8rem', fontWeight: 600}}>Tier 2</span>
              <span style={{marginLeft: 12, fontWeight: 600, color: '#f59e0b'}}>Medium Trust</span>
            </div>
            <div style={{fontSize: '0.9rem', color: '#374151', lineHeight: 1.6}}>
              <strong>Requirements:</strong> 5+ minutes active typing, 2+ edits<br/>
              <strong>Confidence:</strong> Moderate evidence of human authorship with reasonable writing behavior patterns.
            </div>
          </div>
          <div style={{background: '#f9fafb', border: '1px solid #d1d5db', borderRadius: 12, padding: 20}}>
            <div style={{display: 'flex', alignItems: 'center', marginBottom: 12}}>
              <span style={{background: '#6b7280', color: 'white', padding: '4px 8px', borderRadius: 16, fontSize: '0.8rem', fontWeight: 600}}>Tier 1</span>
              <span style={{marginLeft: 12, fontWeight: 600, color: '#6b7280'}}>Basic Trust</span>
            </div>
            <div style={{fontSize: '0.9rem', color: '#374151', lineHeight: 1.6}}>
              <strong>Requirements:</strong> Below Tier 2 thresholds<br/>
              <strong>Confidence:</strong> Basic evidence of human authorship. Limited writing time or activity detected.
            </div>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div style={{textAlign: 'center', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 12, padding: 48}}>
        <h2 style={{fontWeight: 600, fontSize: '1.8rem', marginBottom: 16, color: '#111827'}}>
          🎯 Ready to screen real humans again?
        </h2>
        <p style={{fontSize: '1.1rem', color: '#6b7280', marginBottom: 32}}>
          Let us help you cut through the noise and hire with confidence.
        </p>
        <a
          href="/output-example"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '16px 32px',
            backgroundColor: '#16a34a',
            color: 'white',
            borderRadius: '8px',
            textDecoration: 'none',
            fontWeight: 600,
            fontSize: '1.1rem',
            transition: 'background-color 0.2s'
          }}
          onMouseOver={(e) => (e.target as HTMLElement).style.backgroundColor = '#15803d'}
          onMouseOut={(e) => (e.target as HTMLElement).style.backgroundColor = '#16a34a'}
        >
          🟩 Request Access to RealCV for Employers
        </a>
      </div>
    </div>
  )
} 