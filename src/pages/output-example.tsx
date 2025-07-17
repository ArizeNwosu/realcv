import Head from 'next/head'

export default function OutputExample() {
  return (
    <div style={{maxWidth: 800, margin: '0 auto', padding: '48px 16px', fontSize: '1.05rem', lineHeight: 1.7}}>
      <Head>
        <title>Output Example | RealCV</title>
      </Head>
      <h1 style={{fontWeight: 700, fontSize: '2rem', marginBottom: 24}}>Sample Human-Verified Resume</h1>
      <div style={{background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', padding: 32, marginBottom: 32}}>
        {/* Header and Contact Information */}
        <h2 style={{fontWeight: 600, fontSize: '1.3rem', marginBottom: 8}}>1. Header and Contact Information</h2>
        <div style={{marginBottom: 24, color: '#374151'}}>
          <div style={{fontStyle: 'italic'}}>William Henry Gates III</div>
          <div>741 Lakefield Road, Suite G, Westlake Village, CA. 91361. USA</div>
          <div>william.gates@microsoft.com</div>
          <div>(555) 123-4567</div>
          <div>@WilliamGates</div>
        </div>
        {/* Objective or Summary */}
        <h2 style={{fontWeight: 600, fontSize: '1.3rem', marginBottom: 8}}>2. Objective or Summary</h2>
        <div style={{marginBottom: 24, color: '#374151'}}>
          <div style={{fontStyle: 'italic'}}>
            Visionary technologist and philanthropist with a passion for empowering people through software. Seeking to drive innovation and positive global impact by leveraging decades of experience in technology leadership, entrepreneurship, and social good.
          </div>
        </div>
        {/* Work Experience */}
        <h2 style={{fontWeight: 600, fontSize: '1.3rem', marginBottom: 8}}>3. Work Experience</h2>
        <div style={{marginBottom: 24, color: '#374151'}}>
          <div style={{fontWeight: 500}}>Co-Chair, Bill & Melinda Gates Foundation</div>
          <div>2000 – Present | Seattle, WA</div>
          <ul style={{marginLeft: 20}}>
            <li>Guided one of the world’s largest private philanthropic foundations, focusing on global health, education, and poverty alleviation.</li>
            <li>Oversaw grantmaking and strategic initiatives impacting millions worldwide.</li>
          </ul>
          <div style={{fontWeight: 500, marginTop: 16}}>Chairman, Microsoft Corporation</div>
          <div>1975 – 2014 | Redmond, WA</div>
          <ul style={{marginLeft: 20}}>
            <li>Co-founded Microsoft and led the company to become the global leader in software, services, and solutions.</li>
            <li>Developed and launched the Windows operating system, revolutionizing personal computing.</li>
            <li>Managed company growth from startup to Fortune 500 enterprise.</li>
          </ul>
        </div>
        {/* Education */}
        <h2 style={{fontWeight: 600, fontSize: '1.3rem', marginBottom: 8}}>4. Education</h2>
        <div style={{marginBottom: 24, color: '#374151'}}>
          <div style={{fontWeight: 500}}>Harvard University</div>
          <div>Attended 1973 – 1975 (no degree)</div>
          <div>Cambridge, MA</div>
        </div>
        {/* Skills */}
        <h2 style={{fontWeight: 600, fontSize: '1.3rem', marginBottom: 8}}>5. Skills</h2>
        <div style={{marginBottom: 24, color: '#374151'}}>
          <ul style={{marginLeft: 20}}>
            <li>Technology Leadership</li>
            <li>Software Development</li>
            <li>Strategic Vision</li>
            <li>Philanthropy</li>
            <li>Public Speaking</li>
            <li>Business Strategy</li>
          </ul>
        </div>
        {/* Awards */}
        <h2 style={{fontWeight: 600, fontSize: '1.3rem', marginBottom: 8}}>6. Awards</h2>
        <div style={{marginBottom: 24, color: '#374151'}}>
          <ul style={{marginLeft: 20}}>
            <li>Presidential Medal of Freedom</li>
            <li>Time Person of the Year (multiple)</li>
            <li>National Medal of Technology and Innovation</li>
            <li>Honorary Knight Commander of the Order of the British Empire (KBE)</li>
          </ul>
        </div>
        {/* References */}
        <h2 style={{fontWeight: 600, fontSize: '1.3rem', marginBottom: 8}}>7. References</h2>
        <div style={{marginBottom: 24, color: '#374151'}}>
          <div>Available upon request.</div>
        </div>
        {/* Verification Section */}
        <div style={{marginTop: 32, padding: 16, background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, textAlign: 'center'}}>
          <div style={{fontWeight: 600, color: '#16a34a', marginBottom: 8}}>✅ Verified Human Creation</div>
          <div style={{fontSize: '0.98rem', color: '#374151', marginBottom: 8}}>
            Creator: @WilliamGates<br/>
            Content: "William's 2025 Resume"<br/>
            Method: Typed over 43 minutes with 7 revisions, no copy/paste events<br/>
            Location: Web app (macOS)<br/>
            Date: July 15, 2025<br/>
            Trust Level: Tier 2 (Process-based Proof)
          </div>
          <a href="https://www.realcv.app" target="_blank" rel="noopener noreferrer">
            <img src="https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=https://www.realcv.app" alt="QR code to RealCV" style={{borderRadius: 8, background: '#fff', border: '1px solid #e5e7eb', margin: '0 auto'}}/>
          </a>
          <div>
            <a href="https://www.realcv.app" target="_blank" rel="noopener noreferrer" style={{color: '#2563eb', textDecoration: 'underline', fontSize: 13, marginTop: 8, display: 'inline-block'}}>View Public Proof</a>
          </div>
        </div>
      </div>
    </div>
  )
} 