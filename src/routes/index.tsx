import Header from '@/components/Header'

import { createFileRoute } from '@tanstack/react-router'


export const Route = createFileRoute('/')({

  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div>
      <Header />
    </div>
  )
}
