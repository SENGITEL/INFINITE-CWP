import type { Metadata } from "next"
import { LoginForm } from "./login-form"

export const metadata: Metadata = {
  title: "Acceso · NOC CWP",
  description: "Inicia sesión para acceder a la bitácora NOC",
}

export default function LoginPage() {
  return <LoginForm />
}
