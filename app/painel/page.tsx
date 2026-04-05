// ============================================
// PÁGINA PRINCIPAL DO PAINEL ADMINISTRATIVO
// ============================================
// Dashboard central para administradores gerenciarem o sistema
// Acesso restrito apenas para usuários com role "admin"

"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Navbar from "@/components/layout/navbar"
import Footer from "@/components/layout/footer"
import { BookOpen, Users, Award, PenLine, Settings, FileText } from "lucide-react"
import { useAuth } from "@/lib/auth-context"

export default function PainelPage() {
  const router = useRouter()
  const { user, isAdmin } = useAuth()

  // Proteção: Redireciona usuários não autorizados
  useEffect(() => {
    if (!user) {
      // Não está logado: vai para login
      router.push("/login")
    } else if (!isAdmin) {
      // Está logado mas não é admin: volta para home
      router.push("/")
    }
  }, [user, isAdmin, router])

  // Se não for admin, não renderiza nada (evita flash de conteúdo)
  if (!user || !isAdmin) {
    return null
  }

  // Cards de navegação do painel
  const painelCards = [
    {
      title: "Gerenciar Cursos",
      description: "Criar, editar e organizar cursos da plataforma",
      icon: BookOpen,
      href: "/admin/cursos",
      color: "text-teal-600",
      bgColor: "bg-teal-50",
    },
    {
      title: "Usuários",
      description: "Visualizar e gerenciar usuários cadastrados",
      icon: Users,
      href: "/admin/usuarios",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Certificados",
      description: "Gerenciar emissão de certificados",
      icon: Award,
      href: "/admin/certificados",
      color: "text-amber-600",
      bgColor: "bg-amber-50",
    },
    {
      title: "Assinaturas",
      description: "Gerenciar assinaturas digitais de responsáveis e instrutores",
      icon: PenLine,
      href: "/admin/assinaturas",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "Conteúdo",
      description: "Gerenciar páginas e conteúdo do site",
      icon: FileText,
      href: "/admin/conteudo",
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Configurações",
      description: "Configurações gerais do sistema",
      icon: Settings,
      href: "/admin/configuracoes",
      color: "text-gray-600",
      bgColor: "bg-gray-50",
    },
  ]

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow bg-slate-50 py-12 px-4">
        <div className="container max-w-7xl mx-auto">
          {/* Cabeçalho */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-neutral-900 mb-2">Painel Administrativo</h1>
            <p className="text-muted-foreground">
              Bem-vindo, {user.name}. Gerencie todos os aspectos da plataforma Nauta Treinamentos.
            </p>
          </div>

          {/* Grid de cards de navegação */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {painelCards.map((card) => {
              const Icon = card.icon
              return (
                <Link key={card.href} href={card.href}>
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                    <CardHeader>
                      <div className={`w-12 h-12 rounded-lg ${card.bgColor} flex items-center justify-center mb-3`}>
                        <Icon className={`h-6 w-6 ${card.color}`} />
                      </div>
                      <CardTitle className="text-xl">{card.title}</CardTitle>
                      <CardDescription>{card.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-teal-600 font-medium">Acessar →</p>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>

          {/* Estatísticas rápidas */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Total de Cursos</CardDescription>
                <CardTitle className="text-3xl">24</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Usuários Ativos</CardDescription>
                <CardTitle className="text-3xl">1,234</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Certificados Emitidos</CardDescription>
                <CardTitle className="text-3xl">856</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Taxa de Conclusão</CardDescription>
                <CardTitle className="text-3xl">87%</CardTitle>
              </CardHeader>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
