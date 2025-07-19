import { NextApiRequest, NextApiResponse } from 'next'

// Demo verification data for the example resume
const DEMO_VERIFICATION_DATA = {
  id: 'demo-william-gates-resume-2025',
  code: 'WG2025REAL01', // Fixed demo code for consistency
  title: "William Henry Gates III - Resume 2025",
  sections: [
    {
      id: 'header',
      title: 'Header and Contact Information',
      content: `William Henry Gates III
741 Lakefield Road, Suite G, Westlake Village, CA. 91361. USA
william.gates@microsoft.com
(555) 123-4567
@WilliamGates`
    },
    {
      id: 'objective',
      title: 'Objective or Summary',
      content: 'Visionary technologist and philanthropist with a passion for empowering people through software. Seeking to drive innovation and positive global impact by leveraging decades of experience in technology leadership, entrepreneurship, and social good.'
    },
    {
      id: 'experience',
      title: 'Work Experience',
      content: `Co-Chair, Bill & Melinda Gates Foundation
2000 – Present | Seattle, WA
• Guided one of the world's largest private philanthropic foundations, focusing on global health, education, and poverty alleviation.
• Oversaw grantmaking and strategic initiatives impacting millions worldwide.

Chairman, Microsoft Corporation
1975 – 2014 | Redmond, WA
• Co-founded Microsoft and led the company to become the global leader in software, services, and solutions.
• Developed and launched the Windows operating system, revolutionizing personal computing.
• Managed company growth from startup to Fortune 500 enterprise.`
    },
    {
      id: 'education',
      title: 'Education',
      content: `Harvard University
Attended 1973 – 1975 (no degree)
Cambridge, MA`
    },
    {
      id: 'skills',
      title: 'Skills',
      content: `• Technology Leadership
• Software Development
• Strategic Vision
• Philanthropy
• Public Speaking
• Business Strategy`
    },
    {
      id: 'awards',
      title: 'Awards',
      content: `• Presidential Medal of Freedom
• Time Person of the Year (multiple)
• National Medal of Technology and Innovation
• Honorary Knight Commander of the Order of the British Empire (KBE)`
    },
    {
      id: 'references',
      title: 'References',
      content: 'Available upon request.'
    }
  ],
  session: {
    startTime: 1721067000000, // July 15, 2025, 2:00 PM
    totalTypingTime: 2580000, // 43 minutes of active typing
    keystrokes: 3247,
    editCount: 7,
    pasteEvents: [], // No paste events - all human typed
    lastActivity: 1721069580000 // July 15, 2025, 2:43 PM
  },
  createdAt: 1721067000000, // July 15, 2025, 2:00 PM
  updatedAt: 1721069580000, // July 15, 2025, 2:43 PM
  creator: '@WilliamGates',
  location: 'Web app (macOS)',
  contentDescription: "William's 2025 Resume"
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const { code, id } = req.query

    // Support lookup by either document code or direct ID
    if (code === DEMO_VERIFICATION_DATA.code || id === DEMO_VERIFICATION_DATA.id) {
      return res.status(200).json(DEMO_VERIFICATION_DATA)
    }

    return res.status(404).json({ message: 'Verification not found' })

  } catch (error) {
    console.error('Demo verification API error:', error)
    return res.status(500).json({ 
      message: 'Failed to retrieve verification data',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}