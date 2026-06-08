import { useEffect, useState } from 'react'

function App() {
  const [backendStatus, setBackendStatus] = useState<'checking' | 'up' | 'down'>('checking')

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await fetch('http://localhost:18080/actuator/health')
        if (res.ok) {
          setBackendStatus('up')
        } else {
          setBackendStatus('down')
        }
      } catch {
        // Retry after a delay — backend may still be starting
        setTimeout(checkHealth, 2000)
      }
    }
    checkHealth()
  }, [])

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold tracking-tight">
          StorySpark
        </h1>
        <p className="text-gray-400 text-lg">
          AI Novel Generator
        </p>
        <div className="flex items-center justify-center gap-2 text-sm">
          <span className="text-gray-500">Backend:</span>
          {backendStatus === 'checking' && (
            <span className="text-yellow-400">connecting...</span>
          )}
          {backendStatus === 'up' && (
            <span className="text-green-400">connected</span>
          )}
          {backendStatus === 'down' && (
            <span className="text-red-400">unreachable</span>
          )}
        </div>
      </div>
    </div>
  )
}

export default App
