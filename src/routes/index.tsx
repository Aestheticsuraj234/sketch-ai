import Header from '@/components/Header'
import { PromptInput, BackgroundPattern, LoginPrompt, MockupList, QuickActions } from '@/components/home'
import { authClient } from '@/lib/auth-client'

import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: RouteComponent,
})

function RouteComponent() {
  const { data: session, isPending } = authClient.useSession()
  const isAuthenticated = !!session

  return (
    <div className="relative min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <BackgroundPattern />

      <Header />

      <main className="relative flex flex-col items-center px-4 pt-32 pb-16">
        <h1 className="mb-10 text-center text-4xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-5xl">
          What do you want to create?
        </h1>

        {/* Prompt input - show login prompt if not authenticated */}
        {isPending ? (
          <PromptInputSkeleton />
        ) : isAuthenticated ? (
          <>
            <PromptInput />
            <div className="mt-6">
              <QuickActions />
            </div>
          </>
        ) : (
          <LoginPrompt />
        )}

        {/* Mockup list - only show for authenticated users */}
        {isAuthenticated && <MockupList />}
      </main>
    </div>
  )
}

function PromptInputSkeleton() {
  return (
    <div className="w-full max-w-2xl">
      <div className="h-[120px] rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100/50 dark:bg-zinc-900/50 animate-pulse" />
    </div>
  )
}
