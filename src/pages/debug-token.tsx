import { useState, useEffect } from 'react'
import { ResponsePortalManager } from '../lib/responsePortal'

export default function DebugToken() {
  const [tokenToTest, setTokenToTest] = useState('resp_8cjmrg62tmimdas7bg3')
  const [debugInfo, setDebugInfo] = useState<any>(null)

  const testToken = () => {
    console.log('🔍 Testing token:', tokenToTest)
    
    const allQuestionSets = ResponsePortalManager.getAllQuestionSets()
    const questionSet = ResponsePortalManager.getQuestionSetByToken(tokenToTest)
    
    const info = {
      token: tokenToTest,
      allQuestionSets: allQuestionSets,
      availableTokens: allQuestionSets.map(qs => qs.token),
      foundQuestionSet: questionSet,
      localStorage: {
        questionSets: localStorage.getItem('realcv_question_sets'),
        responses: localStorage.getItem('realcv_responses')
      }
    }
    
    console.log('Debug info:', info)
    setDebugInfo(info)
  }

  useEffect(() => {
    testToken()
  }, [])

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>Token Debug Tool</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <input 
          type="text" 
          value={tokenToTest}
          onChange={(e) => setTokenToTest(e.target.value)}
          style={{ padding: '8px', width: '300px', marginRight: '10px' }}
        />
        <button onClick={testToken} style={{ padding: '8px 16px' }}>
          Test Token
        </button>
      </div>

      {debugInfo && (
        <div>
          <h2>Debug Results:</h2>
          <pre style={{ background: '#f5f5f5', padding: '16px', borderRadius: '4px', overflow: 'auto' }}>
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}