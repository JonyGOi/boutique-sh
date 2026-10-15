import { effectivePriceCents, formatBRL, parseBRLToCents, subtotalCents } from './money.ts'
import { STORE } from '../config/store.ts'

function assert(cond: unknown, message: string) {
  if (!cond) throw new Error(message)
}

assert(formatBRL(12990).includes('129,90'), 'formatBRL')
assert(parseBRLToCents('129,90') === 12990, 'parse 129,90')
assert(parseBRLToCents('1.299,50') === 129950, 'parse thousands')
assert(parseBRLToCents('abc') === null, 'invalid parse')
assert(subtotalCents(12990, 2) === 25980, 'subtotal')

try {
  subtotalCents(100, 0)
  throw new Error('should reject qty 0')
} catch (e) {
  if ((e as Error).message === 'should reject qty 0') throw e
}

assert(
  effectivePriceCents({ price_cents: 20000, is_promo: true, promo_price_cents: 15000 }) === 15000,
  'promo price',
)

assert(STORE.whatsappNumber === '5511964442424', 'whatsapp number')
const message = [
  `Olá, ${STORE.name}! Gostaria de finalizar o seguinte pedido:`,
  '',
  'Produto: Vestido teste',
  'Tamanho: M',
  'Cor: Preto',
  'Quantidade: 1',
  `Preço unitário: ${formatBRL(12990)}`,
  `Subtotal: ${formatBRL(12990)}`,
  '',
  `Total dos produtos: ${formatBRL(12990)}`,
  '',
  'Como podemos combinar o pagamento e a entrega?',
].join('\n')
const url = `https://wa.me/${STORE.whatsappNumber}?text=${encodeURIComponent(message)}`
assert(url.startsWith('https://wa.me/5511964442424?text='), 'whatsapp dest')
assert(decodeURIComponent(url).includes('Total dos produtos'), 'message total')
assert(decodeURIComponent(url).includes('Vestido teste'), 'message item')

console.log('ok')
