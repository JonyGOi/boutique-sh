import { Link } from 'react-router-dom'
import { CATEGORIES, STORE } from '../../config/store'
import { buildWhatsAppSupportUrl } from '../../lib/whatsapp'
import { IconWhatsApp, IconTruck, IconShield, IconCreditCard } from '../ui/Icons'

export function Footer() {
  return (
    <footer className="mt-16 border-t border-white/10 bg-ink-2">
      {/* Barra de Vantagens e Confiança */}
      <div className="border-b border-white/10 bg-ink py-6">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-4 sm:grid-cols-3 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded border border-gold/40 bg-gold/10 text-gold">
              <IconTruck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider font-semibold text-paper">Envio Seguro para Todo o Brasil</p>
              <p className="text-[11px] text-mute">Correios com rastreamento oficial</p>
            </div>
          </div>

          <div className="flex items-center justify-center sm:justify-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded border border-gold/40 bg-gold/10 text-gold">
              <IconCreditCard className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider font-semibold text-paper">PIX & Cartão de Crédito</p>
              <p className="text-[11px] text-mute">Confirmação rápida e segura</p>
            </div>
          </div>

          <div className="flex items-center justify-center sm:justify-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded border border-gold/40 bg-gold/10 text-gold">
              <IconShield className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider font-semibold text-paper">Troca Fácil em 7 Dias</p>
              <p className="text-[11px] text-mute">Garantia total de satisfação</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 md:grid-cols-4">
        {/* Coluna 1: Marca */}
        <div>
          <span className="flex h-11 w-11 items-center justify-center border border-gold text-gold font-display text-lg tracking-[0.2em]">
            SH
          </span>
          <p className="mt-3 font-display text-xl text-paper">{STORE.name}</p>
          <p className="mt-2 text-xs uppercase tracking-[0.25em] text-gold">Alta Moda & Estilo</p>
          <p className="mt-3 text-xs leading-relaxed text-mute">
            Curadoria exclusiva de peças refinadas. Atendimento personalizado e finalização prática via WhatsApp.
          </p>
        </div>

        {/* Coluna 2: Atendimento e Contato Abrangente */}
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-gold font-semibold">Atendimento & Contato</p>
          <div className="mt-4 space-y-2.5 text-xs text-mute">
            <p>
              <strong className="text-paper">Horário:</strong> Segunda a Sábado das 09h às 19h
            </p>
            <p>
              <strong className="text-paper">WhatsApp Oficial:</strong> +55 (11) 96444-2424
            </p>
            <p>
              <strong className="text-paper">E-mail:</strong> contato@boutiquesh.com
            </p>
            <p className="text-[11px] text-mute">
              Atendimento ágil para tirar dúvidas de medidas, disponibilidade de tamanhos e pedidos especiais.
            </p>
          </div>
          <a
            href={buildWhatsAppSupportUrl()}
            className="mt-4 inline-flex min-h-10 items-center gap-2 rounded border border-gold bg-gold/10 px-4 text-xs uppercase tracking-[0.16em] text-gold hover:bg-gold hover:text-ink transition font-medium"
            rel="noopener noreferrer"
            target="_blank"
          >
            <IconWhatsApp className="w-4 h-4" />
            Falar no WhatsApp
          </a>
        </div>

        {/* Coluna 3: Categorias Rápidas */}
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-gold font-semibold">Nossas Coleções</p>
          <ul className="mt-4 grid grid-cols-2 gap-x-2 gap-y-2 text-xs">
            {CATEGORIES.slice(0, 8).map((cat) => (
              <li key={cat.slug}>
                <Link to={`/colecao?categoria=${cat.slug}`} className="text-mute hover:text-gold transition">
                  {cat.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Coluna 4: Informações e Segurança (SEM link administrativo) */}
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-gold font-semibold">Informações</p>
          <ul className="mt-4 space-y-2.5 text-xs text-mute">
            <li>
              <Link to="/colecao" className="hover:text-gold transition">
                Catálogo Completo
              </Link>
            </li>
            <li>
              <Link to="/colecao?categoria=promocoes" className="hover:text-gold transition">
                Promoções Especiais
              </Link>
            </li>
            <li>
              <Link to="/privacidade" className="hover:text-gold transition">
                Política de Privacidade
              </Link>
            </li>
            <li>
              <span className="text-mute/80">Termos e Condições</span>
            </li>
            <li className="pt-2 text-[11px] text-mute border-t border-white/5">
              Compras acima de R$ 500 garantem 10% de desconto automático.
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10 px-4 py-6 text-center text-[11px] tracking-[0.16em] text-mute">
        {STORE.name} · CNPJ e Direitos Reservados · Alta Moda & Estilo
      </div>
    </footer>
  )
}
