import { Link } from 'react-router-dom'
import { STORE } from '../../config/store'
import { buildWhatsAppSupportUrl } from '../../lib/whatsapp'

export function Footer() {
  return (
    <footer className="mt-16 border-t border-white/10 bg-ink-2">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 md:grid-cols-3">
        <div>
          <p className="font-display text-2xl tracking-[0.2em] text-gold">SH</p>
          <p className="mt-2 font-display text-xl text-paper">{STORE.name}</p>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-mute">
            Loja digital de moda feminina. Pedidos combinados pelo WhatsApp, sem pagamento online neste site.
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-gold">Contato</p>
          <a
            href={buildWhatsAppSupportUrl()}
            className="mt-4 inline-flex min-h-11 items-center text-sm text-paper hover:text-gold"
            rel="noopener noreferrer"
            target="_blank"
          >
            WhatsApp
          </a>
          <p className="mt-3 text-xs leading-relaxed text-mute">
            O número usado para abrir a conversa é o oficial da loja, definido na configuração do projeto.
            Frete, pagamento e prazos são combinados no atendimento.
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-gold">Informações</p>
          <ul className="mt-4 space-y-3 text-sm">
            <li>
              <Link to="/colecao" className="hover:text-gold">
                Coleção
              </Link>
            </li>
            <li>
              <Link to="/privacidade" className="hover:text-gold">
                Política de privacidade
              </Link>
            </li>
            <li>
              <Link to="/admin" className="hover:text-gold">
                Área administrativa
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 px-4 py-6 text-center text-[11px] tracking-[0.16em] text-mute">
        {STORE.name} · Brasil · Pedidos via WhatsApp
      </div>
    </footer>
  )
}
