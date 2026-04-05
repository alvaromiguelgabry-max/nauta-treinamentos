// ============================================
// CONTEXTO DE AUTENTICAÇÃO
// ============================================
// Este arquivo gerencia o estado de autenticação global da aplicação
// Permite que qualquer componente acesse informações do usuário logado

"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

// Interface: Define a estrutura dos dados do usuário
interface User {
  id: string
  name: string
  email: string
  avatarUrl?: string
  cpf?: string
  phone?: string
  birthDate?: string
  role: "user" | "admin" // Papel do usuário: usuário comum ou administrador
}

// Interface: Define quais funcionalidades o contexto disponibiliza
interface AuthContextType {
  user: User | null // Dados do usuário logado (null se não estiver logado)
  isAdmin: boolean // Verifica se o usuário é administrador
  isLoading: boolean // true enquanto o estado ainda está sendo hidratado do localStorage
  login: (email: string, password: string) => boolean // Função de login tradicional
  loginWithGoogle: () => void // Função de login com Google
  loginAsAdmin: () => void // Função para simular login como admin
  logout: () => void // Função de logout
}

// Cria o contexto (inicialmente undefined)
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Provider: Componente que envolve a aplicação e fornece o contexto
export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Estado: Armazena os dados do usuário logado
  const [user, setUser] = useState<User | null>(null)
  // Estado: true enquanto o localStorage ainda não foi lido (evita redirect prematuro)
  const [isLoading, setIsLoading] = useState(true)

  // useEffect: Verifica se existe usuário salvo no localStorage ao carregar a página
  useEffect(() => {
    const savedUser = localStorage.getItem("nauta_user")
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser))
      } catch {
        localStorage.removeItem("nauta_user")
      }
    }
    // Marca que a hidratação terminou — a partir daqui o estado é confiável
    setIsLoading(false)
  }, [])

  // Função: Login tradicional com email e senha
  const login = (email: string, password: string): boolean => {
    // Simulação: Verifica credenciais mockadas
    // Em produção, isso seria uma chamada à API
    if (
      (email === "usuario@nautatreinamentos.com" && password === "senha123") ||
      (email === "admin@nautatreinamentos.com" && password === "admin123")
    ) {
      const newUser: User = {
        id: email === "admin@nautatreinamentos.com" ? "admin-1" : "user-1",
        name: email === "admin@nautatreinamentos.com" ? "Administrador Nauta" : "Usuário Nauta",
        email: email,
        avatarUrl: "/placeholder.svg?width=40&height=40&text=UN",
        role: email === "admin@nautatreinamentos.com" ? "admin" : "user",
      }
      setUser(newUser)
      localStorage.setItem("nauta_user", JSON.stringify(newUser))
      return true
    }
    return false
  }

  // Função: Login com Google (simulado)
  const loginWithGoogle = () => {
    // Simula login bem-sucedido com Google
    const googleUser: User = {
      id: "google-user-1",
      name: "Usuário Google",
      email: "usuario@gmail.com",
      avatarUrl: "/placeholder.svg?width=40&height=40&text=UG",
      role: "user",
    }
    setUser(googleUser)
    localStorage.setItem("nauta_user", JSON.stringify(googleUser))
  }

  // Função: Simula login como administrador (para testes)
  const loginAsAdmin = () => {
    const adminUser: User = {
      id: "admin-1",
      name: "Administrador Nauta",
      email: "admin@nautatreinamentos.com",
      avatarUrl: "/placeholder.svg?width=40&height=40&text=AD",
      role: "admin",
    }
    setUser(adminUser)
    localStorage.setItem("nauta_user", JSON.stringify(adminUser))
  }

  // Função: Logout (remove dados do usuário)
  const logout = () => {
    setUser(null)
    localStorage.removeItem("nauta_user")
  }

  // Computed: Verifica se o usuário atual é admin
  const isAdmin = user?.role === "admin"

  // Retorna o Provider com todas as funcionalidades disponíveis
  return (
    <AuthContext.Provider value={{ user, isAdmin, isLoading, login, loginWithGoogle, loginAsAdmin, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

// Hook customizado: Facilita o uso do contexto nos componentes
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider")
  }
  return context
}
