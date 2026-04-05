// ============================================
// PÁGINA DE EDIÇÃO/CRIAÇÃO DE CURSO
// ============================================
// Interface completa para administradores criarem e editarem cursos.
// Organizada em seções via menu lateral:
//   - Informações Gerais
//   - Preço e Promoção
//   - Módulos e Aulas (com suporte a conteúdo PT/EN)
//   - Assinatura do Instrutor (multi-select de instrutores cadastrados)
//   - Mensagens do Curso
//   - Publicar / Despublicar Curso

"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"

// Componentes de UI
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

// Hooks e dados
import { useAuth } from "@/lib/auth-context"
import { courses } from "@/lib/data"
import { cn } from "@/lib/utils"

// Ícones
import {
  Save,
  Eye,
  FileText,
  DollarSign,
  BookOpen,
  MessageSquare,
  Upload,
  Plus,
  Trash2,
  GripVertical,
  Video,
  FileType,
  X,
  ChevronUp,
  ChevronDown,
  PenLine,
  Globe,
  EyeOff,
  Check,
} from "lucide-react"

// ============================================
// TIPOS
// ============================================

// Dados principais do formulário de curso
interface CourseFormData {
  title: string
  shortDescription: string
  bannerDescription: string
  fullDescription: string
  popupDescription: string
  duration: number
  imageUrl: string
  videoUrl: string
  languages: string[]
  // Instrutores vinculados (IDs das assinaturas cadastradas)
  instructorIds: string[]
  price: number
  promotionalPrice: number
  sections: CourseSection[]
  // Status de publicação: true = publicado, false = rascunho
  published: boolean
}

// Seção (módulo) dentro do curso
interface CourseSection {
  id: string
  // Nome do módulo em PT e EN
  namePT: string
  nameEN: string
  // Objetivos de aprendizagem em PT e EN
  learningObjectivesPT: string
  learningObjectivesEN: string
  items: CourseSectionItem[]
}

// Item dentro de uma seção (aula, tarefa ou teste final)
interface CourseSectionItem {
  id: string
  type: "lesson" | "assignment" | "final-test"
  // Nome do item em PT e EN
  namePT: string
  nameEN: string
  // Descrição em PT e EN
  descriptionPT: string
  descriptionEN: string
  content?: LessonContent | QuizContent
}

// Conteúdo de uma aula (artigo, vídeo ou PDF)
interface LessonContent {
  type: "article" | "video" | "pdf"
  // Texto do artigo em PT e EN
  articleContentPT?: string
  articleContentEN?: string
  videoUrl?: string
  videoTranscriptPT?: string
  videoTranscriptEN?: string
  pdfUrl?: string
}

// Conteúdo de um quiz (questões)
interface QuizContent {
  questions: QuizQuestion[]
}

interface QuizQuestion {
  id: string
  question: string
  options: string[]
  correctOption: number
}

// Instrutor simulado (vem da página de assinaturas em produção)
interface InstructorOption {
  id: string
  name: string
  role: string
  crea: string
}

// ============================================
// DADOS MOCKADOS DE INSTRUTORES
// ============================================
// Em produção, esses dados viriam do banco de dados de assinaturas cadastradas
const INSTRUCTORS_MOCK: InstructorOption[] = [
  { id: "ass-1", name: "Eng. Carlos Eduardo Lima", role: "Responsável", crea: "CREA-RJ 123456/D" },
  { id: "ass-2", name: "Téc. Mariana Santos", role: "Instrutor", crea: "CREA-SP 654321/T" },
  { id: "ass-3", name: "Eng. Roberto Alves", role: "Instrutor", crea: "CREA-MG 789012/D" },
]

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
export default function EditarCursoPage() {
  const params = useParams()
  const router = useRouter()
  const { user, isAdmin, isLoading } = useAuth()
  const courseId = params.courseId as string
  const isNewCourse = courseId === "novo"

  // Seção ativa no menu lateral
  const [activeSection, setActiveSection] = useState("geral")

  // Dados do formulário do curso
  const [formData, setFormData] = useState<CourseFormData>({
    title: "",
    shortDescription: "",
    bannerDescription: "",
    fullDescription: "",
    popupDescription: "",
    duration: 0,
    imageUrl: "",
    videoUrl: "",
    languages: [],
    instructorIds: [],
    price: 0,
    promotionalPrice: 0,
    sections: [],
    published: false,
  })

  // Controla qual item/seção está pendente de exclusão (para o modal de confirmação)
  const [itemToDelete, setItemToDelete] = useState<{ sectionId: string; itemId?: string } | null>(null)

  // Indica se há alterações não salvas
  const [unsavedChanges, setUnsavedChanges] = useState(false)

  // Proteção de rota: aguarda hidratação antes de redirecionar
  useEffect(() => {
    if (isLoading) return
    if (!user || !isAdmin) {
      router.push("/")
    }
  }, [user, isAdmin, isLoading, router])

  // Carrega dados do curso ao editar um existente
  useEffect(() => {
    if (!isNewCourse) {
      const course = courses.find((c) => c.id === courseId)
      if (course) {
        setFormData({
          title: course.name,
          shortDescription: course.shortDescription,
          bannerDescription: course.longDescription || "",
          fullDescription: course.longDescription || "",
          popupDescription: course.shortDescription,
          duration: Number.parseInt(course.duration?.replace(/\D/g, "") || "0"),
          imageUrl: course.imageUrl || "",
          videoUrl: "",
          languages: ["Português"],
          instructorIds: [],
          price: course.priceValue,
          promotionalPrice: course.originalPriceValue || 0,
          sections: [],
          published: false,
        })
      }
    }
  }, [courseId, isNewCourse])

  // ——————————————————————————————
  // HELPERS DE FORMULÁRIO
  // ——————————————————————————————

  // Atualiza qualquer campo do formData e marca alterações não salvas
  const updateField = (field: keyof CourseFormData, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setUnsavedChanges(true)
  }

  // Alterna seleção de idioma (checkbox)
  const toggleLanguage = (lang: string) => {
    const newLanguages = formData.languages.includes(lang)
      ? formData.languages.filter((l) => l !== lang)
      : [...formData.languages, lang]
    updateField("languages", newLanguages)
  }

  // Alterna seleção de instrutor (multi-select)
  const toggleInstructor = (id: string) => {
    const newIds = formData.instructorIds.includes(id)
      ? formData.instructorIds.filter((i) => i !== id)
      : [...formData.instructorIds, id]
    updateField("instructorIds", newIds)
  }

  // ——————————————————————————————
  // GERENCIAMENTO DE SEÇÕES (MÓDULOS)
  // ——————————————————————————————

  // Adiciona uma nova seção vazia
  const addSection = () => {
    const newSection: CourseSection = {
      id: `section-${Date.now()}`,
      namePT: "",
      nameEN: "",
      learningObjectivesPT: "",
      learningObjectivesEN: "",
      items: [],
    }
    updateField("sections", [...formData.sections, newSection])
  }

  // Atualiza campo de uma seção específica
  const updateSection = (sectionId: string, field: keyof CourseSection, value: unknown) => {
    const newSections = formData.sections.map((s) =>
      s.id === sectionId ? { ...s, [field]: value } : s,
    )
    updateField("sections", newSections)
  }

  // Exclui uma seção (chamada pelo modal de confirmação)
  const deleteSection = (sectionId: string) => {
    updateField("sections", formData.sections.filter((s) => s.id !== sectionId))
    setItemToDelete(null)
  }

  // Move seção para cima na lista
  const moveSectionUp = (index: number) => {
    if (index > 0) {
      const newSections = [...formData.sections]
      ;[newSections[index - 1], newSections[index]] = [newSections[index], newSections[index - 1]]
      updateField("sections", newSections)
    }
  }

  // Move seção para baixo na lista
  const moveSectionDown = (index: number) => {
    if (index < formData.sections.length - 1) {
      const newSections = [...formData.sections]
      ;[newSections[index], newSections[index + 1]] = [newSections[index + 1], newSections[index]]
      updateField("sections", newSections)
    }
  }

  // ——————————————————————————————
  // GERENCIAMENTO DE ITENS (AULAS)
  // ——————————————————————————————

  // Adiciona item (aula, tarefa ou teste) a uma seção
  const addItem = (sectionId: string, type: "lesson" | "assignment" | "final-test") => {
    const newItem: CourseSectionItem = {
      id: `item-${Date.now()}`,
      type,
      namePT: "",
      nameEN: "",
      descriptionPT: "",
      descriptionEN: "",
    }
    const newSections = formData.sections.map((s) =>
      s.id === sectionId ? { ...s, items: [...s.items, newItem] } : s,
    )
    updateField("sections", newSections)
  }

  // Atualiza campo de um item específico
  const updateItem = (sectionId: string, itemId: string, field: keyof CourseSectionItem, value: unknown) => {
    const newSections = formData.sections.map((s) =>
      s.id === sectionId
        ? { ...s, items: s.items.map((item) => (item.id === itemId ? { ...item, [field]: value } : item)) }
        : s,
    )
    updateField("sections", newSections)
  }

  // Exclui um item de uma seção (chamada pelo modal de confirmação)
  const deleteItem = (sectionId: string, itemId: string) => {
    const newSections = formData.sections.map((s) =>
      s.id === sectionId ? { ...s, items: s.items.filter((item) => item.id !== itemId) } : s,
    )
    updateField("sections", newSections)
    setItemToDelete(null)
  }

  // ——————————————————————————————
  // AÇÕES PRINCIPAIS
  // ——————————————————————————————

  // Salva o curso (simulado)
  const handleSave = () => {
    console.log("Salvando curso:", formData)
    setUnsavedChanges(false)
    alert("Curso salvo com sucesso!")
  }

  // Alterna o status de publicação do curso
  const handleTogglePublish = () => {
    const newStatus = !formData.published
    updateField("published", newStatus)
    alert(newStatus ? "Curso publicado com sucesso!" : "Curso despublicado. Agora está como rascunho.")
  }

  // Abre preview em nova aba
  const handlePreview = () => {
    window.open("/curso-vitrine?id=preview", "_blank")
  }

  if (isLoading || !user || !isAdmin) {
    return null
  }

  // Itens do menu lateral de navegação entre seções
  const menuItems = [
    { id: "geral", label: "Informações Gerais", icon: FileText },
    { id: "preco", label: "Preço e Promoção", icon: DollarSign },
    { id: "modulos", label: "Módulos e Aulas", icon: BookOpen },
    { id: "assinatura", label: "Assinatura do Instrutor", icon: PenLine },
    { id: "mensagens", label: "Mensagens do Curso", icon: MessageSquare },
    { id: "publicar", label: "Publicar Curso", icon: Upload },
  ]

  // ——————————————————————————————
  // RENDER PRINCIPAL
  // ——————————————————————————————
  return (
    <div className="flex flex-col h-screen">

      {/* ——— HEADER FIXO ——— */}
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push("/admin/cursos")}>
            ← Voltar
          </Button>
          <div>
            <h1 className="text-xl font-bold">{isNewCourse ? "Criar Novo Curso" : "Editar Curso"}</h1>
            {unsavedChanges && <p className="text-xs text-amber-600">Alterações não salvas</p>}
          </div>
        </div>
        <div className="flex gap-3 items-center">
          {/* Badge de status de publicação */}
          <span
            className={cn(
              "text-xs font-medium px-3 py-1 rounded-full border",
              formData.published
                ? "bg-teal-50 text-teal-700 border-teal-200"
                : "bg-amber-50 text-amber-700 border-amber-200",
            )}
          >
            {formData.published ? "Publicado" : "Rascunho"}
          </span>
          <Button variant="outline" onClick={handlePreview} className="bg-transparent">
            <Eye className="h-4 w-4 mr-2" />
            Visualizar
          </Button>
          <Button onClick={handleSave} className="bg-teal-600 hover:bg-teal-700">
            <Save className="h-4 w-4 mr-2" />
            Salvar
          </Button>
        </div>
      </header>

      {/* ——— LAYOUT: SIDEBAR + CONTEÚDO ——— */}
      <div className="flex flex-1 overflow-hidden">

        {/* Menu lateral de navegação */}
        <aside className="w-64 bg-white border-r overflow-y-auto">
          <nav className="p-4 space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors",
                    activeSection === item.id
                      ? "bg-teal-50 text-teal-700 font-medium"
                      : "text-neutral-700 hover:bg-slate-50",
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </button>
              )
            })}
          </nav>
        </aside>

        {/* Área de conteúdo principal (scrollável) */}
        <main className="flex-1 overflow-y-auto bg-slate-50 p-8">
          <div className="max-w-4xl mx-auto">

            {/* ==========================================
                SEÇÃO: INFORMAÇÕES GERAIS
                Campos básicos do curso.
                O campo Instrutor(es) foi REMOVIDO daqui
                e centralizado na aba "Assinatura do Instrutor".
            ========================================== */}
            {activeSection === "geral" && (
              <Card>
                <CardHeader>
                  <CardTitle>Informações Gerais</CardTitle>
                  <CardDescription>Configure os detalhes básicos do curso</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">

                  {/* Título */}
                  <div className="space-y-2">
                    <Label htmlFor="title">
                      Título do curso <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="title"
                      placeholder="Ex: Segurança Offshore Essencial"
                      value={formData.title}
                      onChange={(e) => updateField("title", e.target.value)}
                    />
                  </div>

                  {/* Descrição reduzida */}
                  <div className="space-y-2">
                    <Label htmlFor="shortDescription">
                      Descrição reduzida <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      id="shortDescription"
                      placeholder="Uma breve descrição do curso (máx. 160 caracteres)"
                      rows={2}
                      maxLength={160}
                      value={formData.shortDescription}
                      onChange={(e) => updateField("shortDescription", e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">{formData.shortDescription.length}/160 caracteres</p>
                  </div>

                  {/* Descrição para banner */}
                  <div className="space-y-2">
                    <Label htmlFor="bannerDescription">
                      Descrição para o banner <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      id="bannerDescription"
                      placeholder="Descrição que aparecerá no banner do curso"
                      rows={3}
                      value={formData.bannerDescription}
                      onChange={(e) => updateField("bannerDescription", e.target.value)}
                    />
                  </div>

                  {/* Descrição completa */}
                  <div className="space-y-2">
                    <Label htmlFor="fullDescription">Descrição completa</Label>
                    <Textarea
                      id="fullDescription"
                      placeholder="Descrição detalhada do curso..."
                      rows={6}
                      value={formData.fullDescription}
                      onChange={(e) => updateField("fullDescription", e.target.value)}
                    />
                  </div>

                  {/* Descrição para popup */}
                  <div className="space-y-2">
                    <Label htmlFor="popupDescription">
                      Descrição para popup <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      id="popupDescription"
                      placeholder="Texto que aparece em popups e notificações"
                      rows={2}
                      value={formData.popupDescription}
                      onChange={(e) => updateField("popupDescription", e.target.value)}
                    />
                  </div>

                  {/* Carga horária */}
                  <div className="space-y-2">
                    <Label htmlFor="duration">
                      Carga horária (em horas) <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="duration"
                      type="number"
                      min="0"
                      placeholder="Ex: 40"
                      value={formData.duration}
                      onChange={(e) => updateField("duration", Number.parseInt(e.target.value) || 0)}
                    />
                  </div>

                  {/* Upload de imagem */}
                  <div className="space-y-2">
                    <Label htmlFor="imageFile">
                      Imagem do curso <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="imageFile"
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) updateField("imageUrl", URL.createObjectURL(file))
                      }}
                    />
                    {formData.imageUrl && (
                      <div className="mt-2 border rounded p-2">
                        <img
                          src={formData.imageUrl || "/placeholder.svg"}
                          alt="Preview"
                          className="w-32 h-20 object-cover rounded"
                        />
                      </div>
                    )}
                  </div>

                  {/* Upload de vídeo de apresentação */}
                  <div className="space-y-2">
                    <Label htmlFor="videoFile">Vídeo de apresentação (Opcional)</Label>
                    <Input
                      id="videoFile"
                      type="file"
                      accept="video/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) updateField("videoUrl", URL.createObjectURL(file))
                      }}
                    />
                  </div>

                  {/* Seleção de idiomas do curso */}
                  <div className="space-y-3">
                    <Label>
                      Linguagem <span className="text-red-500">*</span>
                    </Label>
                    <div className="space-y-2">
                      {["Português", "Inglês"].map((lang) => (
                        <div key={lang} className="flex items-center space-x-2">
                          <Checkbox
                            id={`lang-${lang}`}
                            checked={formData.languages.includes(lang)}
                            onCheckedChange={() => toggleLanguage(lang)}
                          />
                          <label htmlFor={`lang-${lang}`} className="text-sm cursor-pointer">
                            {lang}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* NOTA: O campo Instrutor(es) foi removido daqui.
                      A seleção de instrutores está centralizada na aba
                      "Assinatura do Instrutor" no menu lateral. */}

                </CardContent>
              </Card>
            )}

            {/* ==========================================
                SEÇÃO: PREÇO E PROMOÇÃO
            ========================================== */}
            {activeSection === "preco" && (
              <Card>
                <CardHeader>
                  <CardTitle>Preço e Promoção</CardTitle>
                  <CardDescription>Defina os valores do curso</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">

                  {/* Preço principal */}
                  <div className="space-y-2">
                    <Label htmlFor="price">
                      Preço do curso (R$) <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="price"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Ex: 960.00"
                      value={formData.price}
                      onChange={(e) => updateField("price", Number.parseFloat(e.target.value) || 0)}
                    />
                  </div>

                  {/* Preço promocional */}
                  <div className="space-y-2">
                    <Label htmlFor="promotionalPrice">Preço promocional (R$) (Opcional)</Label>
                    <Input
                      id="promotionalPrice"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Ex: 720.00"
                      value={formData.promotionalPrice}
                      onChange={(e) => updateField("promotionalPrice", Number.parseFloat(e.target.value) || 0)}
                    />
                    <p className="text-xs text-muted-foreground">Deixe em 0 se não houver promoção ativa</p>
                  </div>

                  {/* Preview do desconto */}
                  {formData.promotionalPrice > 0 && formData.promotionalPrice < formData.price && (
                    <div className="bg-teal-50 border border-teal-200 rounded p-4">
                      <p className="text-sm font-medium text-teal-900">Preview do desconto:</p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-2xl font-bold text-teal-600">
                          R$ {formData.promotionalPrice.toFixed(2)}
                        </span>
                        <span className="text-sm text-muted-foreground line-through">
                          R$ {formData.price.toFixed(2)}
                        </span>
                        <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-1 rounded">
                          {Math.round(((formData.price - formData.promotionalPrice) / formData.price) * 100)}% OFF
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* ==========================================
                SEÇÃO: MÓDULOS E AULAS
                Permite editar nome e conteúdo em PT e EN.
                Modal de confirmação ao excluir módulo.
            ========================================== */}
            {activeSection === "modulos" && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Módulos e Aulas</CardTitle>
                    <CardDescription>
                      Construa a estrutura do curso. Use as abas PT / EN para inserir conteúdo nos dois idiomas.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button onClick={addSection} className="w-full bg-teal-600 hover:bg-teal-700">
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Módulo
                    </Button>
                  </CardContent>
                </Card>

                {/* Lista de seções/módulos */}
                {formData.sections.map((section, sectionIndex) => (
                  <Card key={section.id} className="border-2">
                    <CardHeader className="bg-slate-50">
                      <div className="flex items-start gap-3">
                        {/* Ícone de arrasto */}
                        <div className="flex flex-col gap-1 pt-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8 cursor-grab bg-transparent">
                            <GripVertical className="h-4 w-4" />
                          </Button>
                        </div>

                        {/* Campos bilíngues do nome do módulo */}
                        <div className="flex-1 space-y-3">
                          {/* Tabs PT / EN para o nome da seção */}
                          <Tabs defaultValue="pt" className="w-full">
                            <TabsList className="grid w-40 grid-cols-2 mb-2">
                              <TabsTrigger value="pt">
                                <Globe className="h-3 w-3 mr-1" />
                                PT
                              </TabsTrigger>
                              <TabsTrigger value="en">
                                <Globe className="h-3 w-3 mr-1" />
                                EN
                              </TabsTrigger>
                            </TabsList>
                            <TabsContent value="pt" className="space-y-2 mt-0">
                              <Input
                                placeholder="Nome do Módulo (Português)"
                                value={section.namePT}
                                onChange={(e) => updateSection(section.id, "namePT", e.target.value)}
                                className="font-semibold"
                              />
                              <Textarea
                                placeholder="Objetivos de aprendizagem (Português)"
                                value={section.learningObjectivesPT}
                                onChange={(e) => updateSection(section.id, "learningObjectivesPT", e.target.value)}
                                rows={2}
                              />
                            </TabsContent>
                            <TabsContent value="en" className="space-y-2 mt-0">
                              <Input
                                placeholder="Module Name (English)"
                                value={section.nameEN}
                                onChange={(e) => updateSection(section.id, "nameEN", e.target.value)}
                                className="font-semibold"
                              />
                              <Textarea
                                placeholder="Learning objectives (English)"
                                value={section.learningObjectivesEN}
                                onChange={(e) => updateSection(section.id, "learningObjectivesEN", e.target.value)}
                                rows={2}
                              />
                            </TabsContent>
                          </Tabs>
                        </div>

                        {/* Controles de ordem e exclusão */}
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => moveSectionUp(sectionIndex)}
                            disabled={sectionIndex === 0}
                            className="bg-transparent"
                          >
                            <ChevronUp className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => moveSectionDown(sectionIndex)}
                            disabled={sectionIndex === formData.sections.length - 1}
                            className="bg-transparent"
                          >
                            <ChevronDown className="h-4 w-4" />
                          </Button>
                          {/* Botão de exclusão: abre modal de confirmação */}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setItemToDelete({ sectionId: section.id })}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 bg-transparent"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>

                    {/* Itens da seção (aulas, tarefas, testes) */}
                    <CardContent className="pt-4 space-y-3">
                      {section.items.map((item) => (
                        <div key={item.id} className="flex items-start gap-3 p-3 border rounded bg-white">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 cursor-grab flex-shrink-0 bg-transparent"
                          >
                            <GripVertical className="h-4 w-4" />
                          </Button>

                          <div className="flex-1 space-y-2">
                            {/* Badge de tipo do item */}
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs bg-slate-100 px-2 py-1 rounded font-medium">
                                {item.type === "lesson" ? "Aula" : item.type === "assignment" ? "Tarefa" : "Teste Final"}
                              </span>
                            </div>

                            {/* Tabs PT / EN para nome e descrição da aula */}
                            <Tabs defaultValue="pt" className="w-full">
                              <TabsList className="grid w-40 grid-cols-2">
                                <TabsTrigger value="pt">
                                  <Globe className="h-3 w-3 mr-1" />
                                  PT
                                </TabsTrigger>
                                <TabsTrigger value="en">
                                  <Globe className="h-3 w-3 mr-1" />
                                  EN
                                </TabsTrigger>
                              </TabsList>
                              <TabsContent value="pt" className="space-y-2 mt-2">
                                <Input
                                  placeholder="Nome da aula (Português)"
                                  value={item.namePT}
                                  onChange={(e) => updateItem(section.id, item.id, "namePT", e.target.value)}
                                />
                                <Textarea
                                  placeholder="Descrição (Português)"
                                  value={item.descriptionPT}
                                  onChange={(e) => updateItem(section.id, item.id, "descriptionPT", e.target.value)}
                                  rows={2}
                                />
                              </TabsContent>
                              <TabsContent value="en" className="space-y-2 mt-2">
                                <Input
                                  placeholder="Lesson name (English)"
                                  value={item.nameEN}
                                  onChange={(e) => updateItem(section.id, item.id, "nameEN", e.target.value)}
                                />
                                <Textarea
                                  placeholder="Description (English)"
                                  value={item.descriptionEN}
                                  onChange={(e) => updateItem(section.id, item.id, "descriptionEN", e.target.value)}
                                  rows={2}
                                />
                              </TabsContent>
                            </Tabs>

                            {/* Conteúdo específico para aulas */}
                            {item.type === "lesson" && (
                              <div className="border-t pt-3 mt-3">
                                <p className="text-sm font-medium mb-2">Conteúdo da Aula:</p>
                                <Tabs defaultValue="article">
                                  <TabsList className="grid w-full grid-cols-3">
                                    <TabsTrigger value="article">
                                      <FileText className="h-4 w-4 mr-2" />
                                      Artigo
                                    </TabsTrigger>
                                    <TabsTrigger value="video">
                                      <Video className="h-4 w-4 mr-2" />
                                      Vídeo
                                    </TabsTrigger>
                                    <TabsTrigger value="pdf">
                                      <FileType className="h-4 w-4 mr-2" />
                                      PDF
                                    </TabsTrigger>
                                  </TabsList>

                                  {/* Artigo: campos PT e EN separados */}
                                  <TabsContent value="article" className="space-y-3 mt-2">
                                    <div>
                                      <Label className="text-xs text-muted-foreground mb-1 block">
                                        Conteúdo em Português
                                      </Label>
                                      <Textarea placeholder="Conteúdo do artigo em Português..." rows={4} />
                                    </div>
                                    <div>
                                      <Label className="text-xs text-muted-foreground mb-1 block">
                                        Content in English
                                      </Label>
                                      <Textarea placeholder="Article content in English..." rows={4} />
                                    </div>
                                  </TabsContent>

                                  {/* Vídeo: upload + transcrições PT e EN */}
                                  <TabsContent value="video" className="space-y-3 mt-2">
                                    <Input type="file" accept="video/*" />
                                    <div>
                                      <Label className="text-xs text-muted-foreground mb-1 block">
                                        Transcrição em Português
                                      </Label>
                                      <Textarea placeholder="Transcrição em Português" rows={3} />
                                    </div>
                                    <div>
                                      <Label className="text-xs text-muted-foreground mb-1 block">
                                        Transcript in English
                                      </Label>
                                      <Textarea placeholder="Transcript in English" rows={3} />
                                    </div>
                                  </TabsContent>

                                  {/* PDF: upload simples */}
                                  <TabsContent value="pdf" className="mt-2">
                                    <Input type="file" accept="application/pdf" />
                                  </TabsContent>
                                </Tabs>
                              </div>
                            )}

                            {/* Conteúdo para tarefas e testes finais */}
                            {(item.type === "assignment" || item.type === "final-test") && (
                              <div className="border-t pt-3 mt-3">
                                <div className="flex items-center justify-between mb-2">
                                  <p className="text-sm font-medium">Questões:</p>
                                  <Button size="sm" variant="outline" className="bg-transparent">
                                    <Plus className="h-3 w-3 mr-1" />
                                    Adicionar Questão
                                  </Button>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  Clique para adicionar questões de múltipla escolha
                                </p>
                              </div>
                            )}
                          </div>

                          {/* Botão de exclusão de item */}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setItemToDelete({ sectionId: section.id, itemId: item.id })}
                            className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50 bg-transparent"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}

                      {/* Botões para adicionar itens ao módulo */}
                      <div className="pt-2">
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => addItem(section.id, "lesson")}
                            className="flex-1 bg-transparent"
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Aula
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => addItem(section.id, "assignment")}
                            className="flex-1 bg-transparent"
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Tarefa
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => addItem(section.id, "final-test")}
                            className="flex-1 bg-transparent"
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Teste Final
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {/* Estado vazio */}
                {formData.sections.length === 0 && (
                  <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                      <BookOpen className="h-12 w-12 text-muted-foreground mb-3 opacity-50" />
                      <p className="text-sm text-muted-foreground">Nenhum módulo adicionado ainda</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Clique em &quot;Adicionar Módulo&quot; para começar
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* ==========================================
                SEÇÃO: ASSINATURA DO INSTRUTOR
                Multi-select de instrutores cadastrados
                no módulo de Assinaturas.
            ========================================== */}
            {activeSection === "assinatura" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PenLine className="h-5 w-5" />
                    Assinatura do Instrutor
                  </CardTitle>
                  <CardDescription>
                    Selecione os instrutores cujas assinaturas serão exibidas nos certificados deste curso.
                    Os instrutores listados são gerenciados na página{" "}
                    <a href="/admin/assinaturas" className="text-teal-600 underline hover:text-teal-700">
                      Gerenciar Assinaturas
                    </a>.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">

                  {/* Lista de instrutores disponíveis com multi-select */}
                  {INSTRUCTORS_MOCK.length === 0 ? (
                    // Estado vazio: nenhum instrutor cadastrado
                    <div className="border border-dashed rounded-lg p-8 text-center">
                      <PenLine className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-40" />
                      <p className="text-sm text-muted-foreground">
                        Nenhum instrutor cadastrado ainda.
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Acesse{" "}
                        <a href="/admin/assinaturas" className="text-teal-600 underline">
                          Gerenciar Assinaturas
                        </a>{" "}
                        para cadastrar.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {INSTRUCTORS_MOCK.map((instructor) => {
                        const isSelected = formData.instructorIds.includes(instructor.id)
                        return (
                          // Card clicável para cada instrutor
                          <button
                            key={instructor.id}
                            type="button"
                            onClick={() => toggleInstructor(instructor.id)}
                            className={cn(
                              "w-full flex items-center gap-4 p-4 border rounded-lg text-left transition-colors",
                              isSelected
                                ? "bg-teal-50 border-teal-400"
                                : "bg-white border-neutral-200 hover:bg-slate-50",
                            )}
                          >
                            {/* Indicador de seleção */}
                            <div
                              className={cn(
                                "w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0",
                                isSelected
                                  ? "bg-teal-600 border-teal-600"
                                  : "border-neutral-300",
                              )}
                            >
                              {isSelected && <Check className="h-3 w-3 text-white" />}
                            </div>

                            {/* Dados do instrutor */}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-neutral-900">{instructor.name}</p>
                              <p className="text-sm text-muted-foreground">{instructor.crea}</p>
                            </div>

                            {/* Badge de perfil */}
                            <span
                              className={cn(
                                "text-xs font-medium px-2 py-1 rounded-full",
                                instructor.role === "Responsável"
                                  ? "bg-blue-50 text-blue-700"
                                  : "bg-teal-50 text-teal-700",
                              )}
                            >
                              {instructor.role}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  )}

                  {/* Resumo de seleção */}
                  {formData.instructorIds.length > 0 && (
                    <div className="bg-teal-50 border border-teal-200 rounded-lg p-3">
                      <p className="text-sm text-teal-800">
                        <strong>{formData.instructorIds.length}</strong> instrutor(es) selecionado(s):{" "}
                        {INSTRUCTORS_MOCK
                          .filter((i) => formData.instructorIds.includes(i.id))
                          .map((i) => i.name)
                          .join(", ")}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* ==========================================
                SEÇÃO: MENSAGENS DO CURSO
            ========================================== */}
            {activeSection === "mensagens" && (
              <Card>
                <CardHeader>
                  <CardTitle>Mensagens do Curso</CardTitle>
                  <CardDescription>Configure mensagens automáticas e emails</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Esta funcionalidade será implementada em breve.</p>
                </CardContent>
              </Card>
            )}

            {/* ==========================================
                SEÇÃO: PUBLICAR / DESPUBLICAR CURSO
                Botão alterna entre os dois estados.
            ========================================== */}
            {activeSection === "publicar" && (
              <Card>
                <CardHeader>
                  <CardTitle>Publicar Curso</CardTitle>
                  <CardDescription>
                    Controle a visibilidade do curso para os alunos da plataforma.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">

                  {/* Status atual */}
                  <div className="flex items-center gap-4 p-4 border rounded-lg bg-white">
                    <div
                      className={cn(
                        "w-12 h-12 rounded-lg flex items-center justify-center",
                        formData.published ? "bg-teal-50" : "bg-amber-50",
                      )}
                    >
                      {formData.published ? (
                        <Eye className="h-6 w-6 text-teal-600" />
                      ) : (
                        <EyeOff className="h-6 w-6 text-amber-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-neutral-900">
                        Status: {formData.published ? "Publicado" : "Rascunho (não publicado)"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formData.published
                          ? "O curso está visível para os alunos e disponível para compra."
                          : "O curso não é visível para os alunos. Publique quando estiver pronto."}
                      </p>
                    </div>
                  </div>

                  {/* Aviso antes de publicar */}
                  {!formData.published && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                      <p className="text-sm text-amber-900">
                        <strong>Atenção:</strong> Certifique-se de revisar todas as informações,
                        módulos e preços antes de publicar o curso.
                      </p>
                    </div>
                  )}

                  {/* Botão Publicar / Despublicar */}
                  <Button
                    size="lg"
                    onClick={handleTogglePublish}
                    className={cn(
                      "w-full",
                      formData.published
                        ? "bg-amber-500 hover:bg-amber-600 text-white"
                        : "bg-teal-600 hover:bg-teal-700 text-white",
                    )}
                  >
                    {formData.published ? (
                      <>
                        <EyeOff className="h-5 w-5 mr-2" />
                        Despublicar Curso
                      </>
                    ) : (
                      <>
                        <Upload className="h-5 w-5 mr-2" />
                        Publicar Curso
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}

          </div>
        </main>
      </div>

      {/* ——————————————————————————————
          MODAL: CONFIRMAÇÃO DE EXCLUSÃO
          Mensagem: "Tem certeza que deseja excluir?"
          Usado tanto para módulos quanto para itens.
      —————————————————————————————— */}
      <AlertDialog open={!!itemToDelete} onOpenChange={() => setItemToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza que deseja excluir?</AlertDialogTitle>
            <AlertDialogDescription>
              {itemToDelete?.itemId
                ? "Este item será removido do módulo permanentemente."
                : "Este módulo e todas as suas aulas serão removidos permanentemente."}
              {" "}Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (itemToDelete) {
                  if (itemToDelete.itemId) {
                    deleteItem(itemToDelete.sectionId, itemToDelete.itemId)
                  } else {
                    deleteSection(itemToDelete.sectionId)
                  }
                }
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
