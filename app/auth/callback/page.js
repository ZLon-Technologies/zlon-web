'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AuthCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    setTimeout(() => {
      router.replace('/')
    }, 800)
  }, [])

  return (
    <div style={{
      height: '100vh',
      display: 'grid',
      placeItems: 'center',
      background: '#fff',
      color: '#000'
    }}>
      <h1>ZLon.</h1>
    </div>
  )
}