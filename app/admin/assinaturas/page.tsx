// ============================================
// PÁGINA DE GERENCIAMENTO DE ASSINATURAS
// ============================================
// Permite cadastrar e gerenciar assinaturas digitais
// de Responsáveis e Instrutores utilizadas nos certificados.
// Acesso restrito a administradores.

"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

// Componentes de UI
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import Navbar from "@/components/layout/navbar"
import Footer from "@/components/layout/footer"
import { useAuth } from "@/lib/auth-context"

// Ícones
import { Plus, Trash2, PenLine, UserCheck, HardHat, Upload, X } from "lucide-react"

// ============================================
// TIPOS
// ============================================

// Perfis disponíveis para uma assinatura
type PerfilAssinatura = "Responsável" | "Instrutor"

// Estrutura de dados de uma assinatura cadastrada
interface Assinatura {
  id: string
  nomeCompleto: string
  crea: string
  formacaoTecnica: string
  cpf: string
  telefone: string
  email: string
  perfil: PerfilAssinatura
  // URL local (blob) ou caminho da imagem da assinatura digital
  imagemAssinatura: string | null
}

// Estado inicial do formulário vazio
const FORM_VAZIO: Omit<Assinatura, "id"> = {
  nomeCompleto: "",
  crea: "",
  formacaoTecnica: "",
  cpf: "",
  telefone: "",
  email: "",
  perfil: "Instrutor",
  imagemAssinatura: null,
}

// ============================================
// DADOS MOCKADOS (simulando banco de dados)
// ============================================
const ASSINATURAS_MOCK: Assinatura[] = [
  {
    id: "ass-1",
    nomeCompleto: "Eng. Carlos Eduardo Lima",
    crea: "CREA-RJ 123456/D",
    formacaoTecnica: "Engenharia de Petróleo",
    cpf: "123.456.789-00",
    telefone: "(21) 99999-0001",
    email: "carlos.lima@nauta.com.br",
    perfil: "Responsável",
    imagemAssinatura: null,
  },
  {
    id: "ass-2",
    nomeCompleto: "Téc. Mariana Santos",
    crea: "CREA-SP 654321/T",
    formacaoTecnica: "Técnica em Segurança do Trabalho",
    cpf: "987.654.321-00",
    telefone: "(11) 98888-0002",
    email: "mariana.santos@nauta.com.br",
    perfil: "Instrutor",
    imagemAssinatura: null,
  },
]

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
export default function AssinaturasPage() {
  const router = useRouter()
  const { user, isAdmin } = useAuth()

  // Lista de assinaturas cadastradas
  const [assinaturas, setAssinaturas] = useState<Assinatura[]>(ASSINATURAS_MOCK)

  // Controle do modal de adição
  const [modalAberto, setModalAberto] = useState(false)

  // Dados do formulário dentro do modal
  const [form, setForm] = useState<Omit<Assinatura, "id">>(FORM_VAZIO)

  // Assinatura selecionada para exclusão
  const [assinaturaParaExcluir, setAssinaturaParaExcluir] = useState<Assinatura | null>(null)

  // Referência ao input de upload de imagem
  const inputImagemRef = useRef<HTMLInputElement>(null)

  // Proteção de rota: redireciona se não for admin
  useEffect(() => {
    if (!user) {
      router.push("/login")
    } else if (!isAdmin) {
      router.push("/")
    }
  }, [user, isAdmin, router])

  // Não renderiza enquanto autenticação não confirma admin
  if (!user || !isAdmin) return null

  // ——————————————————————————————
  // HANDLERS DO FORMULÁRIO
  // ——————————————————————————————

  // Atualiza campo genérico do formulário
  const atualizarCampo = <K extends keyof typeof form>(campo: K, valor: (typeof form)[K]) => {
    setForm((prev) => ({ ...prev, [campo]: valor }))
  }

  // Processa o upload da imagem de assinatura
  const handleUploadImagem = (e: React.ChangeEvent<HTMLInputElement>) => {
    const arquivo = e.target.files?.[0]
    if (arquivo) {
      // Cria URL local temporária para preview
      const urlBlob = URL.createObjectURL(arquivo)
      atualizarCampo("imagemAssinatura", urlBlob)
    }
  }

  // Remove a imagem selecionada
  const removerImagem = () => {
    atualizarCampo("imagemAssinatura", null)
    if (inputImagemRef.current) inputImagemRef.current.value = ""
  }

  // Abre o modal de adição com formulário limpo
  const abrirModal = () => {
    setForm(FORM_VAZIO)
    setModalAberto(true)
  }

  // Fecha o modal sem salvar
  const fecharModal = () => {
    setModalAberto(false)
  }

  // Valida e salva nova assinatura
  const salvarAssinatura = () => {
    // Validação simples dos campos obrigatórios
    if (!form.nomeCompleto || !form.crea || !form.cpf || !form.email) {
      alert("Preencha os campos obrigatórios: Nome, CREA, CPF e E-mail.")
      return
    }

    const nova: Assinatura = {
      id: `ass-${Date.now()}`,
      ...form,
    }

    setAssinaturas((prev) => [...prev, nova])
    setModalAberto(false)
  }

  // Confirma e executa a exclusão
  const confirmarExclusao = () => {
    if (assinaturaParaExcluir) {
      setAssinaturas((prev) => prev.filter((a) => a.id !== assinaturaParaExcluir.id))
      setAssinaturaParaExcluir(null)
    }
  }

  // ——————————————————————————————
  // AGRUPAMENTO POR PERFIL
  // ——————————————————————————————
  const responsaveis = assinaturas.filter((a) => a.perfil === "Responsável")
  const instrutores = assinaturas.filter((a) => a.perfil === "Instrutor")

  // ——————————————————————————————
  // RENDER
  // ——————————————————————————————
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-grow bg-slate-50 py-8 px-4">
        <div className="container max-w-5xl mx-auto">

          {/* Cabeçalho com breadcrumb e botão de adição */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
            <div>
              <div className="text-sm text-muted-foreground mb-2">
                <Link href="/painel" className="hover:text-teal-600">Painel</Link>
                {" / "}
                <span className="text-neutral-800">Assinaturas</span>
              </div>
              <h1 className="text-3xl font-bold text-neutral-900">Gerenciar Assinaturas</h1>
              <p className="text-muted-foreground mt-1">
                Cadastre assinaturas digitais de responsáveis e instrutores para uso nos certificados.
              </p>
            </div>

            {/* Botão para abrir modal de cadastro */}
            <Button
              size="lg"
              className="bg-teal-600 hover:bg-teal-700"
              onClick={abrirModal}
            >
              <Plus className="h-5 w-5 mr-2" />
              Nova Assinatura
            </Button>
          </div>

          {/* Contadores de resumo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            <Card>
              <CardHeader className="pb-3 flex flex-row items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                  <UserCheck className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <CardDescription>Responsáveis</CardDescription>
                  <CardTitle className="text-2xl">{responsaveis.length}</CardTitle>
                </div>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-3 flex flex-row items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center">
                  <HardHat className="h-5 w-5 text-teal-600" />
                </div>
                <div>
                  <CardDescription>Instrutores</CardDescription>
                  <CardTitle className="text-2xl">{instrutores.length}</CardTitle>
                </div>
              </CardHeader>
            </Card>
          </div>

          {/* Seção de Responsáveis */}
          <SecaoAssinaturas
            titulo="Responsáveis"
            icone={<UserCheck className="h-5 w-5 text-blue-600" />}
            lista={responsaveis}
            onExcluir={(a) => setAssinaturaParaExcluir(a)}
          />

          {/* Seção de Instrutores */}
          <div className="mt-6">
            <SecaoAssinaturas
              titulo="Instrutores"
              icone={<HardHat className="h-5 w-5 text-teal-600" />}
              lista={instrutores}
              onExcluir={(a) => setAssinaturaParaExcluir(a)}
            />
          </div>

          {/* Mensagem quando não há assinaturas */}
          {assinaturas.length === 0 && (
            <Card className="border-dashed mt-6">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <PenLine className="h-12 w-12 text-muted-foreground mb-4 opacity-40" />
                <p className="text-muted-foreground">Nenhuma assinatura cadastrada.</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Clique em &quot;Nova Assinatura&quot; para começar.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      <Footer />

      {/* ——————————————————————————————
          MODAL: CADASTRO DE ASSINATURA
      —————————————————————————————— */}
      {modalAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">

            {/* Cabeçalho do modal */}
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h2 className="text-xl font-bold text-neutral-900">Nova Assinatura Digital</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Preencha os dados do responsável ou instrutor.
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={fecharModal} className="bg-transparent">
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Corpo do modal com o formulário */}
            <div className="p-6 space-y-5">

              {/* Seleção de perfil */}
              <div className="space-y-2">
                <Label>
                  Perfil <span className="text-red-500">*</span>
                </Label>
                <div className="flex gap-3">
                  {(["Responsável", "Instrutor"] as PerfilAssinatura[]).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => atualizarCampo("perfil", p)}
                      className={`flex-1 py-2 px-4 rounded-lg border text-sm font-medium transition-colors ${
                        form.perfil === p
                          ? "bg-teal-600 text-white border-teal-600"
                          : "bg-white text-neutral-700 border-neutral-300 hover:bg-slate-50"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Nome Completo */}
              <div className="space-y-2">
                <Label htmlFor="nomeCompleto">
                  Nome Completo <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="nomeCompleto"
                  placeholder="Ex: Eng. Carlos Eduardo Lima"
                  value={form.nomeCompleto}
                  onChange={(e) => atualizarCampo("nomeCompleto", e.target.value)}
                />
              </div>

              {/* Número do CREA */}
              <div className="space-y-2">
                <Label htmlFor="crea">
                  Número do CREA <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="crea"
                  placeholder="Ex: CREA-RJ 123456/D"
                  value={form.crea}
                  onChange={(e) => atualizarCampo("crea", e.target.value)}
                />
              </div>

              {/* Formação Técnica */}
              <div className="space-y-2">
                <Label htmlFor="formacaoTecnica">Formação Técnica</Label>
                <Input
                  id="formacaoTecnica"
                  placeholder="Ex: Engenharia de Petróleo"
                  value={form.formacaoTecnica}
                  onChange={(e) => atualizarCampo("formacaoTecnica", e.target.value)}
                />
              </div>

              {/* CPF e Telefone lado a lado */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cpf">
                    CPF <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="cpf"
                    placeholder="000.000.000-00"
                    value={form.cpf}
                    onChange={(e) => atualizarCampo("cpf", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input
                    id="telefone"
                    placeholder="(00) 00000-0000"
                    value={form.telefone}
                    onChange={(e) => atualizarCampo("telefone", e.target.value)}
                  />
                </div>
              </div>

              {/* E-mail */}
              <div className="space-y-2">
                <Label htmlFor="email">
                  E-mail <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="nome@empresa.com.br"
                  value={form.email}
                  onChange={(e) => atualizarCampo("email", e.target.value)}
                />
              </div>

              {/* Upload da imagem da assinatura */}
              <div className="space-y-2">
                <Label>Imagem da Assinatura Digital</Label>
                {form.imagemAssinatura ? (
                  // Preview da imagem com opção de remover
                  <div className="border rounded-lg p-3 flex items-center gap-4 bg-slate-50">
                    <img
                      src={form.imagemAssinatura}
                      alt="Preview da assinatura"
                      className="h-16 object-contain border rounded bg-white"
                    />
                    <div className="flex-1">
                      <p className="text-sm text-neutral-700">Imagem carregada com sucesso.</p>
                      <p className="text-xs text-muted-foreground">Clique em remover para trocar.</p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={removerImagem}
                      className="bg-transparent text-red-500 hover:text-red-600"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  // Área de upload
                  <div
                    className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center cursor-pointer hover:border-teal-400 transition-colors"
                    onClick={() => inputImagemRef.current?.click()}
                  >
                    <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Clique para fazer upload da imagem da assinatura
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">PNG, JPG ou SVG (fundo transparente recomendado)</p>
                  </div>
                )}
                {/* Input escondido para seleção de arquivo */}
                <input
                  ref={inputImagemRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleUploadImagem}
                />
              </div>
            </div>

            {/* Rodapé do modal com ações */}
            <div className="flex gap-3 p-6 border-t bg-slate-50 rounded-b-xl">
              <Button variant="outline" className="flex-1 bg-transparent" onClick={fecharModal}>
                Cancelar
              </Button>
              <Button className="flex-1 bg-teal-600 hover:bg-teal-700" onClick={salvarAssinatura}>
                Cadastrar Assinatura
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ——————————————————————————————
          DIALOG: CONFIRMAÇÃO DE EXCLUSÃO
      —————————————————————————————— */}
      <AlertDialog open={!!assinaturaParaExcluir} onOpenChange={() => setAssinaturaParaExcluir(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Você tem certeza que deseja excluir a assinatura de{" "}
              <strong>{assinaturaParaExcluir?.nomeCompleto}</strong>? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmarExclusao}
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

// ============================================
// SUBCOMPONENTE: SEÇÃO DE LISTA DE ASSINATURAS
// ============================================
// Renderiza um grupo de assinaturas (Responsáveis ou Instrutores)
function SecaoAssinaturas({
  titulo,
  icone,
  lista,
  onExcluir,
}: {
  titulo: string
  icone: React.ReactNode
  lista: Assinatura[]
  onExcluir: (a: Assinatura) => void
}) {
  if (lista.length === 0) return null

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          {icone}
          {titulo} ({lista.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {lista.map((assinatura) => (
            <div
              key={assinatura.id}
              className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 border rounded-lg bg-slate-50 hover:bg-white transition-colors"
            >
              {/* Preview da assinatura ou placeholder */}
              <div className="w-24 h-12 border rounded bg-white flex items-center justify-center flex-shrink-0 overflow-hidden">
                {assinatura.imagemAssinatura ? (
                  <img
                    src={assinatura.imagemAssinatura}
                    alt={`Assinatura de ${assinatura.nomeCompleto}`}
                    className="w-full h-full object-contain p-1"
                  />
                ) : (
                  <PenLine className="h-5 w-5 text-muted-foreground opacity-40" />
                )}
              </div>

              {/* Dados da assinatura */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-neutral-900">{assinatura.nomeCompleto}</p>
                <p className="text-sm text-muted-foreground">{assinatura.crea}</p>
                {assinatura.formacaoTecnica && (
                  <p className="text-xs text-muted-foreground">{assinatura.formacaoTecnica}</p>
                )}
                <div className="flex flex-wrap gap-3 mt-1 text-xs text-muted-foreground">
                  <span>{assinatura.cpf}</span>
                  <span>{assinatura.email}</span>
                  {assinatura.telefone && <span>{assinatura.telefone}</span>}
                </div>
              </div>

              {/* Botão de exclusão */}
              <Button
                variant="outline"
                size="sm"
                className="text-red-600 hover:text-red-700 hover:bg-red-50 bg-transparent flex-shrink-0"
                onClick={() => onExcluir(assinatura)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
