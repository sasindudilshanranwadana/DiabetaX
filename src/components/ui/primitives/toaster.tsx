import { Toaster as SonnerToaster } from 'sonner'

export function Toaster() {
  return (
    <SonnerToaster
      theme="dark"
      position="top-right"
      toastOptions={{
        classNames: {
          toast: 'group toast group-[.toaster]:bg-[#0F172A] group-[.toaster]:text-foreground group-[.toaster]:border-white/10 group-[.toaster]:shadow-xl',
          description: 'group-[.toast]:text-muted-foreground',
          actionButton: 'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground',
          cancelButton: 'group-[.toast]:bg-white/5 group-[.toast]:text-muted-foreground',
        },
      }}
    />
  )
}

export { toast } from 'sonner'
