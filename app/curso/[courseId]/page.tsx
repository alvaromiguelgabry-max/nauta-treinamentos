// Página do curso individual - Interface de aprendizado estilo Udemy
// Esta é a página mais complexa, onde o usuário assiste aulas, faz quizzes e acompanha progresso

"use client" // Client Component para interatividade

import { useState, useEffect, useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"

// Importações de componentes UI
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

// Importações de dados e tipos
import {
  courses,
  mockUserCourses,
  mockQuizzes,
  type Course,
  type Quiz,
  type UserCourse,
  type Lesson,
  type CourseSection,
} from "@/lib/data"

// Importações de ícones
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  X,
  Menu,
  CheckCircle,
  XCircle,
  AlertCircle,
  Video,
  FileText,
  FileQuestion,
  Download,
  Clock,
  PlayCircle,
  BookOpen,
} from "lucide-react"

// Importação da função de confete - DESATIVADA conforme solicitação
// import { triggerConfetti } from "@/lib/utils"

// FUNÇÕES AUXILIARES
// Estas funções ajudam a buscar dados específicos

// Busca curso por ID
const getCourseDetails = (courseId: string): Course | undefined => {
  return courses.find((c) => c.id === courseId)
}

// Busca progresso do usuário em um curso
const getUserCourseProgress = (courseId: string): UserCourse | undefined => {
  return mockUserCourses.find((uc) => uc.courseId === courseId)
}

// Busca quiz por ID
const getQuizDetails = (quizId: string): Quiz | undefined => {
  return mockQuizzes.find((q) => q.id === quizId)
}

// COMPONENTE PRINCIPAL
export default function CursoPage() {
  // Hooks do Next.js para navegação e parâmetros
  const params = useParams()
  const router = useRouter()
  const courseId = params.courseId as string

  // ESTADOS PRINCIPAIS
  const [course, setCourse] = useState<Course | null>(null)
  const [userProgress, setUserProgress] = useState<UserCourse | null>(null)
  const [currentSectionId, setCurrentSectionId] = useState<string | null>(null)
  const [currentLessonId, setCurrentLessonId] = useState<string | null>(null)

  // ESTADOS DA SIDEBAR
  const [sidebarVisible, setSidebarVisible] = useState(false) // Começa fechada no mobile
  const [expandedSections, setExpandedSections] = useState<string[]>([]) // Seções expandidas

  // ESTADOS DO QUIZ
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null)
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({})
  const [quizResult, setQuizResult] = useState<{
    score: number
    passed: boolean
    feedback: Record<string, boolean | undefined>
    explanations: Record<string, string | undefined>
  } | null>(null)
  const [quizAttemptsMade, setQuizAttemptsMade] = useState(0)

  // ESTADO DE IDIOMA
  // Controla em qual idioma o aluno visualiza o conteúdo do curso
  const [idioma, setIdioma] = useState<"PT" | "EN">("PT")

  // ESTADOS MOBILE
  const [isMobile, setIsMobile] = useState(false)

  // EFEITO DE INICIALIZAÇÃO
  // Carrega dados do curso quando a página é montada
  useEffect(() => {
    const courseData = getCourseDetails(courseId)
    const userProgressData = getUserCourseProgress(courseId)

    if (courseData) {
      setCourse(courseData)
      // Expande todas as seções por padrão
      if (courseData.courseSections) {
        setExpandedSections(courseData.courseSections.map((s) => s.id))
        // Seleciona primeira aula do primeiro módulo
        const firstSection = courseData.courseSections[0]
        if (firstSection && firstSection.lessons.length > 0) {
          setCurrentSectionId(firstSection.id)
          setCurrentLessonId(firstSection.lessons[0].id)
        }
      }
    }

    if (userProgressData) {
      setUserProgress(userProgressData)
    } else if (courseData) {
      // Inicializa progresso se não existir
      setUserProgress({
        id: `uc-${courseId}`,
        courseId: courseId,
        name: courseData.name,
        progress: 0,
        imageUrl: courseData.imageUrl,
        completedLessonIds: [],
        quizAttempts: [],
        isCompleted: false,
        certificateAvailable: false,
      })
    }
  }, [courseId])

  // Detecta se é mobile e ajusta sidebar
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      // No desktop, sidebar começa aberta
      if (!mobile) {
        setSidebarVisible(true)
      }
    }

    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  // AULA ATUAL (MEMOIZADA)
  // useMemo evita recálculos desnecessários
  const currentLesson: Lesson | null = useMemo(() => {
    if (!course || !currentSectionId || !currentLessonId) return null
    const section = course.courseSections?.find((s) => s.id === currentSectionId)
    return section?.lessons.find((l) => l.id === currentLessonId) || null
  }, [course, currentSectionId, currentLessonId])

  // EFEITO PARA CARREGAR QUIZ
  // Quando aula atual muda e é um quiz, carrega dados do quiz
  useEffect(() => {
    if (currentLesson?.type === "quiz" && currentLesson.quizId) {
      const quizData = getQuizDetails(currentLesson.quizId)
      setActiveQuiz(quizData || null)
      setQuizResult(null)
      setQuizAnswers({})
      // Atualiza tentativas do quiz
      const attemptData = userProgress?.quizAttempts?.find((qa) => qa.quizId === currentLesson.quizId)
      setQuizAttemptsMade(attemptData?.attemptsMade || 0)
    } else {
      setActiveQuiz(null)
    }
  }, [currentLesson, userProgress])

  // FUNÇÕES DE NAVEGAÇÃO

  // Seleciona uma aula específica
  const handleSelectLesson = (sectionId: string, lessonId: string) => {
    setCurrentSectionId(sectionId)
    setCurrentLessonId(lessonId)
    setQuizResult(null)
    // Fecha sidebar no mobile
    if (isMobile) {
      setSidebarVisible(false)
    }
  }

  // Expande/colapsa seção na sidebar
  const toggleSectionExpansion = (sectionId: string) => {
    setExpandedSections((prev) =>
      prev.includes(sectionId) ? prev.filter((id) => id !== sectionId) : [...prev, sectionId],
    )
  }

  // Alterna visibilidade da sidebar
  const toggleSidebar = () => {
    setSidebarVisible(!sidebarVisible)
  }

  // FUNÇÕES DE PROGRESSO

  // Calcula progresso geral do curso
  const calculateProgress = (): number => {
    if (!course || !course.courseSections || !userProgress || !userProgress.completedLessonIds) return 0
    const totalLessons = course.courseSections.reduce((sum, section) => sum + section.lessons.length, 0)
    if (totalLessons === 0) return 0
    const completedCount = userProgress.completedLessonIds.length
    return Math.round((completedCount / totalLessons) * 100)
  }

  // Calcula progresso de uma seção específica
  const calculateSectionProgress = (section: CourseSection): { completed: number; total: number; duration: string } => {
    const total = section.lessons.length
    const completed = section.lessons.filter((lesson) => userProgress?.completedLessonIds?.includes(lesson.id)).length

    // Calcula duração total da seção
    const totalMinutes = section.lessons.reduce((sum, lesson) => {
      if (lesson.duration) {
        const match = lesson.duration.match(/(\d+)\s*min/)
        return sum + (match ? Number.parseInt(match[1]) : 0)
      }
      return sum
    }, 0)

    const duration = totalMinutes > 60 ? `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m` : `${totalMinutes}m`

    return { completed, total, duration }
  }

  // Marca aula como concluída
  const markLessonComplete = (lessonIdToMark: string) => {
    if (!userProgress || userProgress.completedLessonIds?.includes(lessonIdToMark)) return

    const updatedProgressData = {
      ...userProgress,
      completedLessonIds: [...(userProgress.completedLessonIds || []), lessonIdToMark],
    }

    // Verifica se curso foi concluído
    const totalLessons = course?.courseSections?.reduce((sum, section) => sum + section.lessons.length, 0) || 0
    const allLessonsDone = updatedProgressData.completedLessonIds.length === totalLessons

    let finalQuizPassed = true
    if (course?.finalQuizId) {
      const finalQuizAttempt = updatedProgressData.quizAttempts?.find((qa) => qa.quizId === course.finalQuizId)
      finalQuizPassed = finalQuizAttempt?.passed || false
    }

    if (allLessonsDone && finalQuizPassed) {
      updatedProgressData.isCompleted = true
      updatedProgressData.progress = 100
      alert("Parabéns! Curso concluído e certificado gerado!")
    }

    setUserProgress(updatedProgressData)
  }

  // Alterna status de conclusão de aula (via checkbox)
  const toggleLessonCompletion = (lessonId: string) => {
    if (!userProgress) return

    const isCompleted = userProgress.completedLessonIds?.includes(lessonId)
    let updatedCompletedIds: string[]

    if (isCompleted) {
      // Remove da lista
      updatedCompletedIds = userProgress.completedLessonIds?.filter((id) => id !== lessonId) || []
    } else {
      // Adiciona à lista
      updatedCompletedIds = [...(userProgress.completedLessonIds || []), lessonId]
    }

    const updatedProgressData = {
      ...userProgress,
      completedLessonIds: updatedCompletedIds,
    }

    setUserProgress(updatedProgressData)
  }

  // FUNÇÕES DO QUIZ

  // Processa submissão do quiz
  const handleQuizSubmit = () => {
    if (!activeQuiz || !userProgress) return

    let score = 0
    const feedback: Record<string, boolean | undefined> = {}
    const explanations: Record<string, string | undefined> = {}

    // Avalia cada questão
    activeQuiz.questions.forEach((q) => {
      const isCorrect = quizAnswers[q.id] === q.correctOptionId
      if (isCorrect) score++
      feedback[q.id] = isCorrect
      explanations[q.id] = q.explanation
    })

    const percentageScore = Math.round((score / activeQuiz.questions.length) * 100)
    const passed = percentageScore >= activeQuiz.passingScore

    setQuizResult({ score: percentageScore, passed, feedback, explanations })

    // Confete se passou - DESATIVADO conforme solicitação
    // if (passed) {
    //   triggerConfetti(150, 90, 0.6)
    // }

    // Atualiza tentativas
    const updatedAttempts = (userProgress.quizAttempts || []).filter((qa) => qa.quizId !== activeQuiz.id)
    const currentAttemptData = userProgress.quizAttempts?.find((qa) => qa.quizId === activeQuiz.id)
    const newAttemptsMade = (currentAttemptData?.attemptsMade || 0) + 1

    updatedAttempts.push({
      quizId: activeQuiz.id,
      attemptsMade: newAttemptsMade,
      bestScore: Math.max(percentageScore, currentAttemptData?.bestScore || 0),
      passed: passed || currentAttemptData?.passed || false,
    })

    const updatedUserProgress = { ...userProgress, quizAttempts: updatedAttempts }
    setQuizAttemptsMade(newAttemptsMade)

    if (passed) {
      markLessonComplete(currentLessonId!)
    }

    setUserProgress(updatedUserProgress)
  }

  // Atualiza resposta selecionada
  const handleAnswerChange = (questionId: string, optionId: string) => {
    setQuizAnswers((prev) => ({ ...prev, [questionId]: optionId }))
  }

  // FUNÇÕES DE NAVEGAÇÃO ENTRE AULAS

  // Encontra próxima aula
  const getNextLesson = (): { sectionId: string; lessonId: string } | null => {
    if (!course || !currentSectionId || !currentLessonId || !course.courseSections) return null

    const currentSectionIndex = course.courseSections.findIndex((s) => s.id === currentSectionId)
    if (currentSectionIndex === -1) return null

    const currentSection = course.courseSections[currentSectionIndex]
    const currentLessonIndex = currentSection.lessons.findIndex((l) => l.id === currentLessonId)

    // Próxima aula na mesma seção
    if (currentLessonIndex < currentSection.lessons.length - 1) {
      return { sectionId: currentSectionId, lessonId: currentSection.lessons[currentLessonIndex + 1].id }
    }
    // Primeira aula da próxima seção
    else if (currentSectionIndex < course.courseSections.length - 1) {
      const nextSection = course.courseSections[currentSectionIndex + 1]
      if (nextSection.lessons && nextSection.lessons.length > 0) {
        return { sectionId: nextSection.id, lessonId: nextSection.lessons[0].id }
      }
    }
    return null
  }

  // Encontra aula anterior
  const getPreviousLesson = (): { sectionId: string; lessonId: string } | null => {
    if (!course || !currentSectionId || !currentLessonId || !course.courseSections) return null

    const currentSectionIndex = course.courseSections.findIndex((s) => s.id === currentSectionId)
    if (currentSectionIndex === -1) return null

    const currentSection = course.courseSections[currentSectionIndex]
    const currentLessonIndex = currentSection.lessons.findIndex((l) => l.id === currentLessonId)

    // Aula anterior na mesma seção
    if (currentLessonIndex > 0) {
      return { sectionId: currentSectionId, lessonId: currentSection.lessons[currentLessonIndex - 1].id }
    }
    // Última aula da seção anterior
    else if (currentSectionIndex > 0) {
      const prevSection = course.courseSections[currentSectionIndex - 1]
      if (prevSection.lessons && prevSection.lessons.length > 0) {
        return { sectionId: prevSection.id, lessonId: prevSection.lessons[prevSection.lessons.length - 1].id }
      }
    }
    return null
  }

  // Navega para próxima/anterior aula
  const navigateLesson = (direction: "next" | "prev") => {
    const targetLesson = direction === "next" ? getNextLesson() : getPreviousLesson()
    if (targetLesson) {
      if (direction === "next" && currentLessonId && currentLesson?.type !== "quiz") {
        markLessonComplete(currentLessonId)
      }
      handleSelectLesson(targetLesson.sectionId, targetLesson.lessonId)
    } else if (direction === "next" && currentLessonId && currentLesson?.type !== "quiz") {
      markLessonComplete(currentLessonId)
    }
  }

  // Função para obter ícone da aula
  const getLessonIcon = (lesson: Lesson) => {
    switch (lesson.type) {
      case "video":
        return <PlayCircle className="h-4 w-4" />
      case "text":
        return <FileText className="h-4 w-4" />
      case "quiz":
        return <FileQuestion className="h-4 w-4" />
      default:
        return <BookOpen className="h-4 w-4" />
    }
  }

  // RENDERIZAÇÃO CONDICIONAL
  if (!course || !userProgress) {
    return (
      <div className="flex flex-col min-h-screen">
        <div className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
            <p className="text-neutral-600">Carregando treinamento...</p>
          </div>
        </div>
      </div>
    )
  }

  const overallProgress = calculateProgress()

  // JSX DA PÁGINA
  return (
    <div className="flex flex-col h-screen bg-slate-50">
      {/* HEADER DO CURSO */}
      <header className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between border-b">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          {/* Botão voltar para Meus Treinamentos */}
          <Link
            href="/meus-cursos"
            className="flex items-center text-sm hover:text-teal-300 transition-colors flex-shrink-0"
          >
            <ChevronLeft className={`${isMobile ? "h-6 w-6" : "h-5 w-5"} mr-1`} />
            {!isMobile && "Voltar"}
          </Link>

          {/* Título do curso */}
          <div className="flex-1 min-w-0">
            {isMobile ? (
              <div className="overflow-hidden">
                <h1 className="text-lg font-semibold whitespace-nowrap animate-marquee">{course.name}</h1>
              </div>
            ) : (
              <h1 className="text-lg font-semibold truncate">{course.name}</h1>
            )}
          </div>
        </div>

        {/* Área direita do header: seletor de idioma + progresso */}
        <div className="flex items-center gap-4 flex-shrink-0">
          {/* SELETOR DE IDIOMA: alterna entre PT e EN */}
          <div className="flex items-center bg-slate-800 rounded-lg p-1 gap-1">
            <button
              onClick={() => setIdioma("PT")}
              className={`text-xs font-semibold px-3 py-1 rounded-md transition-colors ${
                idioma === "PT"
                  ? "bg-teal-500 text-white"
                  : "text-slate-300 hover:text-white"
              }`}
              aria-label="Alternar para Português"
            >
              PT
            </button>
            <button
              onClick={() => setIdioma("EN")}
              className={`text-xs font-semibold px-3 py-1 rounded-md transition-colors ${
                idioma === "EN"
                  ? "bg-teal-500 text-white"
                  : "text-slate-300 hover:text-white"
              }`}
              aria-label="Switch to English"
            >
              EN
            </button>
          </div>

          {/* Progresso (só desktop) */}
          {!isMobile && (
            <div className="flex items-center gap-3">
              <div className="text-sm">
                <span className="text-slate-300">Progresso: </span>
                <span className="font-medium">{overallProgress}%</span>
              </div>
              <Progress value={overallProgress} className="w-32 h-2 bg-slate-700 [&>div]:bg-teal-400" />
            </div>
          )}
        </div>
      </header>

      {/* LAYOUT PRINCIPAL */}
      <div className="flex flex-1 overflow-hidden">
        {/* ÁREA PRINCIPAL DE CONTEÚDO */}
        <main
          className={`flex-1 overflow-y-auto transition-all duration-300 ${
            isMobile ? "w-full" : sidebarVisible ? "mr-80" : "mr-0"
          }`}
        >
          <div className={`${isMobile ? "p-4" : "p-6"} max-w-4xl mx-auto`}>
            {currentLesson ? (
              <div className="space-y-6">
                {/* CABEÇALHO DA AULA */}
                <div className="bg-white rounded-lg shadow-sm border p-6">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="text-teal-600 flex-shrink-0">{getLessonIcon(currentLesson)}</div>
                    <div className="flex-1">
                      <h2 className="text-2xl font-bold text-neutral-800 mb-2">{currentLesson.title}</h2>
                      <div className="flex items-center gap-3">
                        {currentLesson.duration && (
                          <div className="flex items-center text-sm text-neutral-500">
                            <Clock className="h-4 w-4 mr-1" />
                            {currentLesson.duration}
                          </div>
                        )}
                        {/* Badge indicando o idioma selecionado pelo aluno */}
                        <span className="text-xs font-semibold bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full">
                          {idioma === "PT" ? "Português" : "English"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* CONTEÚDO DA AULA */}
                <div className="bg-white rounded-lg shadow-sm border">
                  {/* CONTEÚDO DE VÍDEO */}
                  {currentLesson.type === "video" && (
                    <div className="p-6">
                      <div className="aspect-video bg-slate-900 rounded-lg flex items-center justify-center text-white relative mb-4">
                        <Video className="h-16 w-16 opacity-50" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-center">
                            <p className="text-sm opacity-75">Player de Vídeo</p>
                            <p className="text-xs opacity-50">(Placeholder)</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* CONTEÚDO DE TEXTO */}
                  {currentLesson.type === "text" && (
                    <div className="p-6">
                      <div className="prose prose-neutral max-w-none">
                        <p className="text-neutral-700 leading-relaxed">
                          {currentLesson.textContent || "Conteúdo textual da aula será exibido aqui."}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* CONTEÚDO DE QUIZ */}
                  {currentLesson.type === "quiz" && activeQuiz && (
                    <div className="p-6">
                      {!quizResult ? (
                        <div className="space-y-6">
                          {/* Alerta de limite de tentativas */}
                          {quizAttemptsMade >= activeQuiz.maxAttempts && (
                            <Alert variant="destructive">
                              <AlertCircle className="h-4 w-4" />
                              <AlertTitle>Limite de Tentativas Atingido</AlertTitle>
                              <AlertDescription>
                                Você atingiu o número máximo de {activeQuiz.maxAttempts} tentativas para este quiz.
                              </AlertDescription>
                            </Alert>
                          )}

                          <div className="text-sm text-neutral-600 mb-4">
                            Tentativa {Math.min(quizAttemptsMade + 1, activeQuiz.maxAttempts)} de{" "}
                            {activeQuiz.maxAttempts}
                          </div>

                          {/* QUESTÕES DO QUIZ */}
                          <div className="space-y-6">
                            {activeQuiz.questions.map((question, index) => (
                              <Card key={question.id} className="border-slate-200 shadow-sm">
                                <CardHeader className="pb-4">
                                  <CardTitle className="text-lg font-semibold text-neutral-800">
                                    Pergunta {index + 1}:
                                  </CardTitle>
                                  <CardDescription className="text-base text-neutral-700 leading-relaxed">
                                    {question.text}
                                  </CardDescription>
                                </CardHeader>
                                <CardContent>
                                  <RadioGroup
                                    onValueChange={(value) => handleAnswerChange(question.id, value)}
                                    value={quizAnswers[question.id] || ""}
                                    className="space-y-3"
                                  >
                                    {question.options.map((option) => (
                                      <div key={option.id} className="relative">
                                        <div className="flex items-center space-x-3">
                                          <RadioGroupItem
                                            value={option.id}
                                            id={`${question.id}-${option.id}`}
                                            className="mt-1"
                                          />
                                          <Label
                                            htmlFor={`${question.id}-${option.id}`}
                                            className="text-neutral-700 cursor-pointer flex-1 py-3 px-4 rounded-lg border-2 border-slate-200 hover:border-teal-300 hover:bg-teal-50 transition-all duration-200 block"
                                          >
                                            {option.text}
                                          </Label>
                                        </div>
                                      </div>
                                    ))}
                                  </RadioGroup>
                                </CardContent>
                              </Card>
                            ))}
                          </div>

                          {/* BOTÃO DE SUBMISSÃO */}
                          <div className="flex justify-center pt-6">
                            <Button
                              onClick={() => {
                                // Exibe confirmação antes de finalizar avaliação
                                if (window.confirm("Tem certeza que deseja finalizar sua atividade?")) {
                                  handleQuizSubmit()
                                }
                              }}
                              disabled={quizAttemptsMade >= activeQuiz.maxAttempts}
                              className="bg-teal-600 hover:bg-teal-700 px-8 py-3 text-lg font-medium"
                            >
                              Finalizar Avaliação
                            </Button>
                          </div>
                        </div>
                      ) : (
                        // RESULTADO DO QUIZ
                        <div className="space-y-6">
                          <Alert
                            variant={quizResult.passed ? "default" : "destructive"}
                            className={
                              quizResult.passed
                                ? "bg-green-50 border-green-300 text-green-800"
                                : "bg-red-50 border-red-300 text-red-800"
                            }
                          >
                            {quizResult.passed ? <CheckCircle className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
                            <AlertTitle className="font-semibold">
                              Resultado: {quizResult.score}% - {quizResult.passed ? "Aprovado!" : "Não Aprovado"}
                            </AlertTitle>
                            <AlertDescription>
                              {quizResult.passed
                                ? "Parabéns! Você foi aprovado neste quiz."
                                : `Você precisava de ${activeQuiz.passingScore}% para ser aprovado.`}
                            </AlertDescription>
                          </Alert>

                          {/* FEEDBACK DAS QUESTÕES */}
                          <div className="space-y-4">
                            {activeQuiz.questions.map((question, index) => {
                              const isCorrect = quizResult.feedback[question.id]
                              const userAnswer = quizAnswers[question.id]
                              const correctAnswer = question.options.find((opt) => opt.id === question.correctOptionId)
                              const userAnswerText = question.options.find((opt) => opt.id === userAnswer)?.text

                              return (
                                <Card
                                  key={question.id}
                                  className={`border-2 ${
                                    isCorrect ? "border-green-300 bg-green-50" : "border-red-300 bg-red-50"
                                  }`}
                                >
                                  <CardHeader>
                                    <CardTitle className="text-base flex items-center gap-2">
                                      {isCorrect ? (
                                        <CheckCircle className="h-5 w-5 text-green-600" />
                                      ) : (
                                        <XCircle className="h-5 w-5 text-red-600" />
                                      )}
                                      <span className={isCorrect ? "text-green-800" : "text-red-800"}>
                                        Pergunta {index + 1} - {isCorrect ? "Correta" : "Incorreta"}
                                      </span>
                                    </CardTitle>
                                    <CardDescription className="text-neutral-700 font-medium">
                                      {question.text}
                                    </CardDescription>
                                  </CardHeader>
                                  <CardContent className="space-y-3">
                                    <div className={`p-3 rounded-lg ${isCorrect ? "bg-green-100" : "bg-red-100"}`}>
                                      <p className="text-sm font-medium">
                                        <span className="text-neutral-600">Sua resposta: </span>
                                        <span className={isCorrect ? "text-green-700" : "text-red-700"}>
                                          {userAnswerText || "Não respondida"}
                                        </span>
                                      </p>
                                    </div>
                                    {!isCorrect && (
                                      <div className="p-3 rounded-lg bg-green-100">
                                        <p className="text-sm font-medium">
                                          <span className="text-neutral-600">Resposta correta: </span>
                                          <span className="text-green-700">{correctAnswer?.text}</span>
                                        </p>
                                      </div>
                                    )}
                                    {quizResult.explanations[question.id] && (
                                      <div className="p-3 rounded-lg bg-blue-50 border-l-4 border-blue-400">
                                        <p className="text-sm text-blue-800">
                                          <span className="font-medium">💡 Explicação: </span>
                                          {quizResult.explanations[question.id]}
                                        </p>
                                      </div>
                                    )}
                                  </CardContent>
                                </Card>
                              )
                            })}
                          </div>

                          {/* BOTÃO TENTAR NOVAMENTE */}
                          {quizAttemptsMade < activeQuiz.maxAttempts && !quizResult.passed && (
                            <div className="flex justify-center pt-4">
                              <Button
                                onClick={() => {
                                  setQuizResult(null)
                                  setQuizAnswers({})
                                }}
                                className="bg-teal-600 hover:bg-teal-700"
                              >
                                Tentar Novamente
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* NAVEGAÇÃO ENTRE AULAS */}
                <div className="flex justify-between items-center bg-white rounded-lg shadow-sm border p-4">
                  <Button
                    onClick={() => navigateLesson("prev")}
                    disabled={!getPreviousLesson()}
                    variant="outline"
                    className={`flex items-center gap-2 ${isMobile ? "px-3" : ""}`}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    {!isMobile && "Anterior"}
                  </Button>

                  <div className="text-sm text-neutral-500">
                    {currentLesson.type !== "quiz" && !userProgress.completedLessonIds?.includes(currentLessonId!) && (
                      <Button
                        onClick={() => markLessonComplete(currentLessonId!)}
                        variant="outline"
                        size="sm"
                        className="text-teal-600 border-teal-600 hover:bg-teal-50"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        {isMobile ? "Concluir" : "Marcar como Concluída"}
                      </Button>
                    )}
                  </div>

                  <Button
                    onClick={() => navigateLesson("next")}
                    disabled={!getNextLesson()}
                    className={`flex items-center gap-2 bg-teal-600 hover:bg-teal-700 ${isMobile ? "px-3" : ""}`}
                  >
                    {!isMobile && "Próxima"}
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-64">
                <p className="text-neutral-500">Selecione uma aula para começar</p>
              </div>
            )}
          </div>
        </main>

        {/* SIDEBAR DE CONTEÚDO DO CURSO */}
        <aside
          className={`fixed ${isMobile ? "inset-0" : "right-0 top-0 h-full"} bg-white border-l border-slate-200 shadow-lg transition-transform duration-300 z-40 select-none ${
            sidebarVisible ? "translate-x-0" : "translate-x-full"
          } ${isMobile ? "w-full" : ""}`}
          style={isMobile ? {} : { width: "320px", userSelect: "none" }}
        >
          {/* HEADER DA SIDEBAR */}
          <div className="flex items-center justify-between p-4 border-b bg-slate-50">
            <h3 className="font-semibold text-neutral-800">Conteúdo do treinamento</h3>
            <Button
              onClick={() => setSidebarVisible(false)}
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 hover:bg-slate-200"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* LISTA DE SEÇÕES E AULAS */}
          <div className={`overflow-y-auto h-full ${isMobile ? "pb-4" : "pb-20"}`}>
            {course.courseSections?.map((section) => {
              const sectionProgress = calculateSectionProgress(section)
              const isExpanded = expandedSections.includes(section.id)

              return (
                <div key={section.id} className="border-b border-slate-100">
                  <Collapsible open={isExpanded} onOpenChange={() => toggleSectionExpansion(section.id)}>
                    <CollapsibleTrigger className="w-full p-4 text-left hover:bg-slate-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-neutral-800 text-sm mb-1">{section.title}</h4>
                          <p className="text-xs text-neutral-500">
                            {sectionProgress.completed}/{sectionProgress.total} | {sectionProgress.duration}
                          </p>
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4 text-neutral-500" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-neutral-500" />
                        )}
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="pb-2">
                        {section.lessons.map((lesson) => {
                          const isCompleted = userProgress.completedLessonIds?.includes(lesson.id)
                          const isActive = currentLessonId === lesson.id

                          return (
                            <div
                              key={lesson.id}
                              className={`flex items-center gap-3 p-3 mx-2 rounded cursor-pointer transition-colors ${
                                isActive ? "bg-teal-100 border-l-4 border-teal-500" : "hover:bg-slate-50"
                              }`}
                              onClick={() => handleSelectLesson(section.id, lesson.id)}
                            >
                              <Checkbox
                                checked={isCompleted}
                                onCheckedChange={() => toggleLessonCompletion(lesson.id)}
                                onClick={(e) => e.stopPropagation()}
                                className="data-[state=checked]:bg-teal-600 data-[state=checked]:border-teal-600"
                              />
                              <div className="text-teal-600">{getLessonIcon(lesson)}</div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-neutral-800 truncate">{lesson.title}</p>
                                {lesson.duration && <p className="text-xs text-neutral-500">{lesson.duration}</p>}
                              </div>
                              {/* Botão de recursos (placeholder) */}
                              {lesson.hasResources && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-xs px-2 py-1 h-6 bg-transparent"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    // Implementar funcionalidade de recursos
                                  }}
                                >
                                  <Download className="h-3 w-3 mr-1" />
                                  Recursos
                                </Button>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </div>
              )
            })}
          </div>
        </aside>

        {/* BOTÃO MOBILE PARA ABRIR CONTEÚDO */}
        {isMobile && (
          <div className="fixed bottom-4 left-4 right-4 z-50">
            <Button
              onClick={toggleSidebar}
              className="w-full bg-teal-600 hover:bg-teal-700 shadow-lg flex items-center justify-center gap-2"
            >
              <Menu className="h-4 w-4" />
              Conteúdo do treinamento
            </Button>
          </div>
        )}

        {/* BOTÃO PARA MOSTRAR SIDEBAR (DESKTOP) */}
        {!sidebarVisible && !isMobile && (
          <Button
            onClick={() => setSidebarVisible(true)}
            className="fixed right-4 top-20 z-50 bg-teal-600 hover:bg-teal-700 shadow-lg"
            size="sm"
          >
            <Menu className="h-4 w-4 mr-1" />
            Conteúdo
          </Button>
        )}
      </div>
    </div>
  )
}
