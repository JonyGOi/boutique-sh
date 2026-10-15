import { STORE } from '../config/store'
import { formatBRL } from './money'
import type { ValidatedLine } from '../types/product'

function buildOrderMessage(
  lines: ValidatedLine[],
  subtotalCents: number,
  discountCents: number = 0,
  finalCents: number = subtotalCents,
): string {
  const blocks = lines.map((line) => {
    const size = line.size ? `Tamanho: ${line.size}` : 'Tamanho: não informado'
    const color = line.color ? `Cor: ${line.color}` : 'Cor: não informada'
    return [
      `Produto: ${line.product.name}`,
      size,
      color,
      `Quantidade: ${line.quantity}`,
      `Preço unitário: ${formatBRL(line.unitCents)}`,
      `Subtotal: ${formatBRL(line.subtotalCents)}`,
    ].join('\n')
  })

  const totalsText = discountCents > 0
    ? [
        `Subtotal dos produtos: ${formatBRL(subtotalCents)}`,
        `Desconto Especial de Meta: -${formatBRL(discountCents)}`,
        `Total com Desconto: ${formatBRL(finalCents)}`,
      ].join('\n')
    : `Total dos produtos: ${formatBRL(subtotalCents)}`

  return [
    `Olá, ${STORE.name}! Gostaria de finalizar o seguinte pedido:`,
    '',
    blocks.join('\n\n'),
    '',
    totalsText,
    '',
    'Como podemos combinar o pagamento e a entrega?',
  ].join('\n')
}

/**
 * Gera o link oficial. O destino é sempre o número configurado no projeto.
 * Não aceita número, URL ou destino fornecidos pelo chamador.
 */
export function buildWhatsAppCheckoutUrl(
  lines: ValidatedLine[],
  subtotalCents: number,
  discountCents: number = 0,
  finalCents: number = subtotalCents,
): string {
  const message = buildOrderMessage(lines, subtotalCents, discountCents, finalCents)
  return `https://wa.me/${STORE.whatsappNumber}?text=${encodeURIComponent(message)}`
}

export function buildWhatsAppSupportUrl(): string {
  const message = `Olá, ${STORE.name}! Gostaria de um atendimento personalizado.`
  return `https://wa.me/${STORE.whatsappNumber}?text=${encodeURIComponent(message)}`
}
