import { ButtonLink } from '../components/ui/Button'

export function NotFound() {
  return (
    <div className="px-4 py-24 text-center">
      <h1 className="font-display text-4xl">Página não encontrada</h1>
      <p className="mt-4 text-sm text-mute">O endereço solicitado não existe neste site.</p>
      <div className="mt-8">
        <ButtonLink to="/">Voltar ao início</ButtonLink>
      </div>
    </div>
  )
}
