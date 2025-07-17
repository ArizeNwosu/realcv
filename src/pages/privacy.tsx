import Head from 'next/head'

export default function Privacy() {
  return (
    <div style={{maxWidth: 800, margin: '0 auto', padding: '48px 16px', fontSize: '1.05rem', lineHeight: 1.7}}>
      <Head>
        <title>Privacy Policy | RealCV</title>
      </Head>
      <h1 style={{fontWeight: 700, fontSize: '2rem', marginBottom: 24}}>Privacy Policy</h1>
      <p><strong>Effective Date:</strong> July 2025</p>
      <p>This Privacy Policy explains how RealCV ("we", "us", or "our") collects, uses, and protects your information when you use our website and services.</p>
      <h2>1. Information We Collect</h2>
      <ul>
        <li>Personal information you provide (such as name, email, address, resume content, etc.).</li>
        <li>Usage data (such as IP address, browser type, device information, and usage patterns).</li>
        <li>Cookies and similar tracking technologies.</li>
      </ul>
      <h2>2. How We Use Information</h2>
      <ul>
        <li>To provide, maintain, and improve our services.</li>
        <li>To communicate with you about your account or our services.</li>
        <li>To personalize your experience and develop new features.</li>
        <li>To comply with legal obligations.</li>
      </ul>
      <h2>3. Sharing of Information</h2>
      <p>We do not sell your personal information. We may share information with service providers, legal authorities, or in connection with a business transfer, as required by law or to protect our rights.</p>
      <h2>4. Data Security</h2>
      <p>We implement reasonable security measures to protect your information. However, no method of transmission over the Internet or electronic storage is 100% secure.</p>
      <h2>5. Your Rights</h2>
      <ul>
        <li>You may access, update, or delete your personal information by contacting us.</li>
        <li>You may opt out of marketing communications at any time.</li>
      </ul>
      <h2>6. Changes to This Policy</h2>
      <p>We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new policy on this page.</p>
      <h2>7. Contact Information</h2>
      <p>If you have any questions about this Privacy Policy, please contact us at:</p>
      <ul>
        <li><strong>Business Name:</strong> RealCV</li>
        <li><strong>Address:</strong> 741 Lakefield Road, Suite G, Westlake Village, CA. 91361. USA</li>
        <li><strong>Email:</strong> <a href="mailto:support@realcv.app">support@realcv.app</a></li>
      </ul>
      <p>By using RealCV, you acknowledge that you have read and understood this Privacy Policy.</p>
    </div>
  )
} 