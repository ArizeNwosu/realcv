import { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const { name, email, subject, message } = req.body

    // Basic validation
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ message: 'All fields are required' })
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Please enter a valid email address' })
    }

    // Create email content
    const emailContent = `
New Contact Form Submission from RealCV

Name: ${name}
Email: ${email}
Subject: ${subject}

Message:
${message}

---
This message was sent from the RealCV contact form.
Reply to: ${email}
    `.trim()

    // For now, we'll use a simple approach - you can integrate with services like:
    // - Sendgrid, Mailgun, AWS SES, etc.
    // - Or use a service like Formspree, Netlify Forms, etc.
    
    // Since we don't have email service configured, we'll simulate success
    // In a real implementation, you would send the email here
    
    console.log('📧 Contact form submission:', {
      name,
      email,
      subject,
      message: message.substring(0, 100) + '...',
      timestamp: new Date().toISOString()
    })

    // Simulate email sending delay
    await new Promise(resolve => setTimeout(resolve, 1000))

    // For demonstration, we'll always return success
    // In production, you would handle actual email sending errors
    return res.status(200).json({ 
      message: 'Message sent successfully! We will get back to you soon.',
      success: true 
    })

  } catch (error) {
    console.error('Contact form error:', error)
    return res.status(500).json({ 
      message: 'Failed to send message. Please try again or contact support@realcv.app directly.',
      error: error instanceof Error ? error.message : 'Unknown error' 
    })
  }
}