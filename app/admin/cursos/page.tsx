"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Navbar from "@/components/layout/navbar"
import Footer from "@/components/layout/footer"
import { Edit, Trash2, Plus, BookOpen, AlertTriangle } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { courses, type Course } from "@/lib/data"

export default function GerenciarCursosPage() {
  const router = useRouter()
  const { user, isAdmin, isLoading } = useAuth()
  const [cursosList, setCursosList] = useState<Course[]>(courses)
  // Curso pendente de exclusão no modal destrutivo
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null)
  // Valor digitado pelo usuário no campo de confirmação destrutiva
  const [deleteConfirmText, setDeleteConfirmText] = useState("")

  useEffect(() => {
    if (isLoading) return
    if (!user) {
      router.push("/login")
    } else if (!isAdmin) {
      router.push("/")
    }
  }, [user, isAdmin, isLoading, router])

  // Abre o modal destrutivo e limpa o campo de confirmação
  const handleDeleteClick = (course: Course) => {
    setCourseToDelete(course)
    setDeleteConfirmText("")
  }

  // Fecha o modal sem excluir, limpando o campo
  const handleCancelDelete = () => {
    setCourseToDelete(null)
    setDeleteConfirmText("")
  }

  // Executa a exclusão após confirmação do texto "excluir"
  const confirmDelete = () => {
    if (courseToDelete && deleteConfirmText.toLowerCase() === "excluir") {
      setCursosList(cursosList.filter((c) => c.id !== courseToDelete.id))
      setCourseToDelete(null)
      setDeleteConfirmText("")
    }
  }

  if (isLoading || !user || !isAdmin) {
    return null
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow bg-slate-50 py-8 px-4">
        <div className="container max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
            <div>
              <div className="text-sm text-muted-foreground mb-2">
                <Link href="/painel" className="hover:text-teal-600">
                  Painel
                </Link>{" "}
                / Gerenciar Cursos
              </div>
              <h1 className="text-3xl font-bold text-neutral-900">Gerenciar Cursos</h1>
              <p className="text-muted-foreground mt-1">Visualize, edite e organize todos os cursos da plataforma</p>
            </div>
            <Link href="/admin/cursos/novo">
              <Button size="lg" className="bg-teal-600 hover:bg-teal-700">
                <Plus className="h-5 w-5 mr-2" />
                Criar Novo Curso
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Total de Cursos</CardDescription>
                <CardTitle className="text-2xl">{cursosList.length}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Cursos Publicados</CardDescription>
                <CardTitle className="text-2xl">{cursosList.length}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Rascunhos</CardDescription>
                <CardTitle className="text-2xl">0</CardTitle>
              </CardHeader>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Todos os Cursos ({cursosList.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {cursosList.map((course) => (
                  <div
                    key={course.id}
                    className="flex flex-col md:flex-row md:items-center gap-4 p-4 border rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <div className="w-full md:w-32 h-20 bg-slate-200 rounded overflow-hidden flex-shrink-0">
                      <Image
                        src={course.imageUrl || "/placeholder.svg"}
                        alt={course.name}
                        width={128}
                        height={80}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="flex-grow min-w-0">
                      <h3 className="font-semibold text-lg text-neutral-900 truncate">{course.name}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">{course.shortDescription}</p>
                      <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                        <span className="bg-teal-100 text-teal-700 px-2 py-1 rounded">{course.category}</span>
                        {course.duration && <span>⏱️ {course.duration}</span>}
                        <span>💰 {course.price}</span>
                      </div>
                    </div>

                    <div className="flex gap-2 md:flex-col md:w-auto w-full">
                      <Link href={`/admin/cursos/editar/${course.id}`} className="flex-1 md:flex-none">
                        <Button variant="outline" size="sm" className="w-full bg-transparent">
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 md:flex-none text-red-600 hover:text-red-700 hover:bg-red-50 bg-transparent"
                        onClick={() => handleDeleteClick(course)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Deletar
                      </Button>
                    </div>
                  </div>
                ))}

                {cursosList.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg">Nenhum curso cadastrado ainda</p>
                    <p className="text-sm">Clique em "Criar Novo Curso" para começar</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />

      {/* ——————————————————————————————
          MODAL DESTRUTIVO DE EXCLUSÃO DE CURSO
          O usuário deve digitar "excluir" para habilitar o botão de confirmação.
          Garante que a ação foi intencional antes de remover permanentemente.
      —————————————————————————————— */}
      {courseToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">

            {/* Cabeçalho com ícone de alerta */}
            <div className="p-6 border-b">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                </div>
                <h2 className="text-xl font-bold text-neutral-900">Excluir Curso</h2>
              </div>
              <p className="text-sm text-neutral-700">
                Você está prestes a excluir permanentemente o curso:{" "}
                <strong className="text-neutral-900">&quot;{courseToDelete.name}&quot;</strong>.
              </p>
              <p className="text-sm text-red-600 mt-2 font-medium">
                Esta ação é irreversível e não pode ser desfeita.
              </p>
            </div>

            {/* Campo de confirmação: usuário deve digitar "excluir" */}
            <div className="p-6 space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-700">
                  Para confirmar, digite{" "}
                  <strong className="font-mono bg-red-100 px-1 rounded">excluir</strong>{" "}
                  no campo abaixo:
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="deleteConfirm">Confirmação</Label>
                <Input
                  id="deleteConfirm"
                  placeholder="Digite excluir para confirmar"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  className={deleteConfirmText.toLowerCase() === "excluir" ? "border-red-400" : ""}
                  autoComplete="off"
                />
              </div>
            </div>

            {/* Botões de ação */}
            <div className="flex gap-3 p-6 border-t bg-slate-50 rounded-b-xl">
              {/* Cancelar: fecha sem excluir */}
              <Button
                variant="outline"
                className="flex-1 bg-transparent"
                onClick={handleCancelDelete}
              >
                Cancelar
              </Button>
              {/* Confirmar: habilitado somente quando texto = "excluir" */}
              <Button
                className="flex-1 bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={deleteConfirmText.toLowerCase() !== "excluir"}
                onClick={confirmDelete}
              >
                Excluir Permanentemente
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
