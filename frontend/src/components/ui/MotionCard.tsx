import { motion } from "framer-motion"
import type { ReactNode } from "react"

interface MotionCardProps {
  children: ReactNode
  className?: string
  onClick?: () => void
  as?: "div" | "button"
}

export default function MotionCard({
  children,
  className = "",
  onClick,
  as = "div",
}: MotionCardProps) {
  const Component = as === "button" ? motion.button : motion.div

  return (
    <Component
      type={as === "button" ? "button" : undefined}
      onClick={onClick}
      className={`ws-section ${className}`}
      transition={{ type: "spring", stiffness: 400, damping: 28 }}
    >
      {children}
    </Component>
  )
}
