"use client"

import * as React from "react"
import { X } from "lucide-react"
import { createPortal } from "react-dom"
import { cn } from "@/lib/utils"

const DialogContext = React.createContext<{
  open: boolean
  setOpen: (open: boolean) => void
} | null>(null)

export function Dialog({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false)
  return (
    <DialogContext.Provider value={{ open, setOpen }}>
      {children}
    </DialogContext.Provider>
  )
}

export function DialogTrigger({
  children,
  asChild,
}: {
  children: React.ReactNode
  asChild?: boolean
}) {
  const context = React.useContext(DialogContext)
  if (!context) throw new Error("DialogTrigger must be used inside Dialog")

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<any>, {
      onClick: (e: React.MouseEvent) => {
        if (children.props.onClick) children.props.onClick(e)
        context.setOpen(true)
      },
    })
  }

  return (
    <button type="button" onClick={() => context.setOpen(true)}>
      {children}
    </button>
  )
}

export function DialogPortal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = React.useState(false)
  
  React.useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  if (!mounted) return null
  return createPortal(children, document.body)
}

export function DialogOverlay({ onClick }: { onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm transition-all duration-200 animate-in fade-in"
    />
  )
}

export function DialogContent({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  const context = React.useContext(DialogContext)
  if (!context) throw new Error("DialogContent must be used inside Dialog")

  if (!context.open) return null

  return (
    <DialogPortal>
      <DialogOverlay onClick={() => context.setOpen(false)} />
      <div
        className={cn(
          "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border border-zinc-800 bg-zinc-950 p-6 shadow-2xl duration-200 rounded-xl text-white focus:outline-none animate-in fade-in zoom-in-95",
          className
        )}
      >
        {children}
        <button
          type="button"
          onClick={() => context.setOpen(false)}
          className="absolute right-4 top-4 rounded-md opacity-70 ring-offset-zinc-950 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          <X className="h-4 w-4 text-zinc-400" />
          <span className="sr-only">Close</span>
        </button>
      </div>
    </DialogPortal>
  )
}

export function DialogHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex flex-col space-y-1.5 text-center sm:text-left",
        className
      )}
      {...props}
    />
  )
}

export function DialogTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2
      className={cn(
        "text-lg font-semibold leading-none tracking-tight",
        className
      )}
      {...props}
    />
  )
}

export function DialogDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn("text-sm text-zinc-500 dark:text-zinc-400", className)}
      {...props}
    />
  )
}
