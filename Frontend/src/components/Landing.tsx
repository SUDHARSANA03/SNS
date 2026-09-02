import React from 'react'
import { ViewId } from '../data'
import { LandingPage } from '../pages/Landing/LandingPage'

interface Props {
  onNext?: (view?: string) => void
  onOpen?: (view?: ViewId) => void
  exiting?: boolean
  hidden?: boolean
}

export default function Landing({ onNext, onOpen }: Props) {
  const handleNext = (view?: string) => {
    if (onNext) {
      onNext(view)
    } else if (onOpen) {
      onOpen((view as ViewId) || 'feed')
    }
  }

  return <LandingPage onNext={handleNext} />
}
