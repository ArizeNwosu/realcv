export interface ResumeSection {
  id: string
  title: string
  content: string
  placeholder: string
}

export const defaultResumeTemplate: ResumeSection[] = [
  {
    id: 'header',
    title: 'Contact Information',
    content: '',
    placeholder: 'Street Address • City, State Zip • name@email.com • Phone Number'
  },
  {
    id: 'highlights',
    title: 'Highlights',
    content: '',
    placeholder: '• Experienced marketing professional with 5+ years driving growth for Fortune 500 companies\n• Led cross-functional teams of 10+ to deliver projects 20% ahead of schedule\n• Fluent in Spanish and French; experience in international markets\n• Strong analytical skills with expertise in data visualization and market research'
  },
  {
    id: 'experience',
    title: 'Professional Experience',
    content: '',
    placeholder: 'Job Title | Company Name, City, State | Month Year – Month Year\n• Accomplished [specific achievement with quantified results]\n• Managed [specific responsibility with scope and impact]\n• Developed [specific initiative with measurable outcome]'
  },
  {
    id: 'education',
    title: 'Education',
    content: '',
    placeholder: 'Master of Business Administration | Harvard Business School, Boston, MA | Year\nBachelor of Arts, Economics | University Name, City, State | Year\nMagna Cum Laude, Phi Beta Kappa, Dean\'s List\nGPA: 3.8/4.0'
  },
  {
    id: 'skills',
    title: 'Skills & Interests',
    content: '',
    placeholder: 'Technical: Python, SQL, Tableau, Salesforce, Adobe Creative Suite\nLanguages: English (native), Spanish (fluent), French (conversational)\nInterests: Marathon running, photography, volunteer coaching'
  },
  {
    id: 'activities',
    title: 'Activities & Leadership',
    content: '',
    placeholder: 'President, Graduate Student Association | University Name | Year – Year\n• Led organization of 200+ members, increased engagement by 40%\nVolunteer, Habitat for Humanity | Year – Present\n• Coordinate construction projects, mentor new volunteers'
  }
]

export function getEmptyResume(): ResumeSection[] {
  return defaultResumeTemplate.map(section => ({ ...section }))
}