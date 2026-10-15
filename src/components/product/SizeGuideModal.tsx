import { IconClose, IconRuler } from '../ui/Icons'

interface SizeGuideModalProps {
  category?: string
  isOpen: boolean
  onClose: () => void
}

export function SizeGuideModal({ category = '', isOpen, onClose }: SizeGuideModalProps) {
  if (!isOpen) return null

  const isFootwear = category.toLowerCase().includes('calcado')

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/80 backdrop-blur-sm p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg rounded border border-gold/40 bg-ink-2 p-6 shadow-2xl transition"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-mute hover:text-paper p-1 transition"
          aria-label="Fechar tabela de medidas"
        >
          <IconClose className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 text-gold">
          <IconRuler className="w-5 h-5" />
          <h2 className="font-display text-xl text-paper tracking-wider">
            {isFootwear ? 'Tabela de Medidas · Calçados' : 'Tabela de Medidas · Roupas'}
          </h2>
        </div>
        <p className="mt-1 text-xs text-mute">
          {isFootwear
            ? 'Guia oficial para escolher a numeração correta do seu calçado.'
            : 'Medidas em centímetros para você escolher o caimento perfeito.'}
        </p>

        {isFootwear ? (
          <div className="mt-5 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gold/30 text-gold uppercase tracking-wider font-semibold">
                  <th className="py-2.5 px-3">Numeração</th>
                  <th className="py-2.5 px-3">Comprimento do Pé</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-paper">
                <tr><td className="py-2 px-3 font-medium">34</td><td className="py-2 px-3 text-mute">22,5 cm</td></tr>
                <tr><td className="py-2 px-3 font-medium">35</td><td className="py-2 px-3 text-mute">23,0 cm</td></tr>
                <tr><td className="py-2 px-3 font-medium">36</td><td className="py-2 px-3 text-mute">24,0 cm</td></tr>
                <tr><td className="py-2 px-3 font-medium">37</td><td className="py-2 px-3 text-mute">24,5 cm</td></tr>
                <tr><td className="py-2 px-3 font-medium">38</td><td className="py-2 px-3 text-mute">25,5 cm</td></tr>
                <tr><td className="py-2 px-3 font-medium">39</td><td className="py-2 px-3 text-mute">26,0 cm</td></tr>
                <tr><td className="py-2 px-3 font-medium">40</td><td className="py-2 px-3 text-mute">27,0 cm</td></tr>
              </tbody>
            </table>
          </div>
        ) : (
          <div className="mt-5 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gold/30 text-gold uppercase tracking-wider font-semibold">
                  <th className="py-2.5 px-2">Tam</th>
                  <th className="py-2.5 px-2">Manequim</th>
                  <th className="py-2.5 px-2">Busto</th>
                  <th className="py-2.5 px-2">Cintura</th>
                  <th className="py-2.5 px-2">Quadril</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-paper">
                <tr>
                  <td className="py-2.5 px-2 font-medium text-gold">PP</td>
                  <td className="py-2.5 px-2 text-mute">36</td>
                  <td className="py-2.5 px-2 text-mute">80 - 84 cm</td>
                  <td className="py-2.5 px-2 text-mute">62 - 66 cm</td>
                  <td className="py-2.5 px-2 text-mute">90 - 94 cm</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-2 font-medium text-gold">P</td>
                  <td className="py-2.5 px-2 text-mute">38</td>
                  <td className="py-2.5 px-2 text-mute">85 - 89 cm</td>
                  <td className="py-2.5 px-2 text-mute">67 - 71 cm</td>
                  <td className="py-2.5 px-2 text-mute">95 - 99 cm</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-2 font-medium text-gold">M</td>
                  <td className="py-2.5 px-2 text-mute">40</td>
                  <td className="py-2.5 px-2 text-mute">90 - 95 cm</td>
                  <td className="py-2.5 px-2 text-mute">72 - 77 cm</td>
                  <td className="py-2.5 px-2 text-mute">100 - 105 cm</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-2 font-medium text-gold">G</td>
                  <td className="py-2.5 px-2 text-mute">42</td>
                  <td className="py-2.5 px-2 text-mute">96 - 102 cm</td>
                  <td className="py-2.5 px-2 text-mute">78 - 84 cm</td>
                  <td className="py-2.5 px-2 text-mute">106 - 112 cm</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-2 font-medium text-gold">GG</td>
                  <td className="py-2.5 px-2 text-mute">44</td>
                  <td className="py-2.5 px-2 text-mute">103 - 110 cm</td>
                  <td className="py-2.5 px-2 text-mute">85 - 92 cm</td>
                  <td className="py-2.5 px-2 text-mute">113 - 120 cm</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-2 font-medium text-gold">XG</td>
                  <td className="py-2.5 px-2 text-mute">46</td>
                  <td className="py-2.5 px-2 text-mute">111 - 118 cm</td>
                  <td className="py-2.5 px-2 text-mute">93 - 100 cm</td>
                  <td className="py-2.5 px-2 text-mute">121 - 128 cm</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-5 rounded border border-white/10 bg-ink p-3 text-[11px] text-mute space-y-1">
          <p className="font-semibold text-paper">Como medir corretamente:</p>
          <p>• <strong>Busto / Tórax:</strong> Envolva a fita métrica sobre a parte mais cheia.</p>
          <p>• <strong>Cintura:</strong> Meça na parte mais fina, cerca de 2 dedos acima do umbigo.</p>
          <p>• <strong>Quadril:</strong> Contorne a área de maior circunferência do quadril.</p>
          <p className="text-gold pt-1">Ficou em dúvida? Fale conosco no WhatsApp que ajudamos a escolher!</p>
        </div>

        <div className="mt-5 text-right">
          <button
            type="button"
            onClick={onClose}
            className="rounded bg-gold px-4 py-2 text-xs uppercase tracking-wider text-ink font-semibold hover:bg-gold-light transition"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  )
}
