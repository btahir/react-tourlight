import type { Metadata } from 'next'
import { RuntimeLab } from '@/components/lab'

export const metadata: Metadata = {
  title: 'Runtime lab · Tourlight',
  robots: { index: false, follow: false },
}

export default function LabPage() {
  return <RuntimeLab />
}
