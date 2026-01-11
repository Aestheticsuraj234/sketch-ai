import { LoginForm } from '@/components/auth/login-form'
import { createFileRoute } from '@tanstack/react-router'


export const Route = createFileRoute('/_auth/login')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
       
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <LoginForm />
          </div>
        </div>
      </div>
      <div className="bg-muted hidden lg:flex flex-col items-center justify-center">
        <img
          src="/login.svg"
          alt="Image"
          height={550}
          width={550}
        />
      </div>
    </div>
  )
}
