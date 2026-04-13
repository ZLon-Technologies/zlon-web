'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'

export default function LoadingScreen({ onFinish }) {
  const [shiftUp, setShiftUp] = useState(false)

  useEffect(() => {
    const t1 = setTimeout(() => setShiftUp(true), 450)
    const t2 = setTimeout(() => {
      onFinish?.()
    }, 1100)

    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [onFinish])

  return (
    <div className="relative flex h-dvh items-center justify-center overflow-hidden bg-white">
      <div
        className="absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage: "url('/zlon-watermark.svg')",
          backgroundRepeat: 'repeat',
          backgroundSize: '260px 260px'
        }}
      />

      <div
        className={`relative transition-all duration-700 ease-out ${
          shiftUp ? '-translate-y-8 opacity-0' : 'translate-y-0 opacity-100'
        }`}
      >
        <Image
          src="/zlon-logo.png"
          alt="ZLon"
          width={220}
          height={80}
          priority
        />
      </div>
    </div>
  )
}