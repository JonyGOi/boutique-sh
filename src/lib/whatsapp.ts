import { STORE } from '../config/store'
import { formatBRL } from './money'
import type { ValidatedLine } from '../types/product'

function buildOrderMessage(
  lines: ValidatedLine[],
  subtotalCents: number,
  tierDiscountCents: number = 0,
  couponDiscountCents: number = 0,
  couponCode: string = '',
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

  const totalsLines = [`Subtotal dos produtos: ${formatBRL(subtotalCents)}`]

  if (tierDiscountCents > 0) {
    totalsLines.push(`Desconto Especial de Meta: -${formatBRL(tierDiscountCents)}`)
  }
  if (couponDiscountCents > 0 && couponCode) {
    totalsLines.push(`Cupom de Desconto (${couponCode}): -${formatBRL(couponDiscountCents)}`)
  }

  if (tierDiscountCents > 0 || couponDiscountCents > 0) {
    totalsLines.push(`Total Final com Desconto: ${formatBRL(finalCents)}`)
  } else {
    totalsLines.push(`Total a Pagar: ${formatBRL(finalCents)}`)
  }

  return [
    `Olá, ${STORE.name}! Gostaria de finalizar o seguinte pedido:`,
    '',
    blocks.join('\n\n'),
    '',
    totalsLines.join('\n'),
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
  tierDiscountCents: number = 0,
  couponDiscountCents: number = 0,
  couponCode: string = '',
  finalCents: number = subtotalCents,
): string {
  const message = buildOrderMessage(
    lines,
    subtotalCents,
    tierDiscountCents,
    couponDiscountCents,
    couponCode,
    finalCents,
  )
  return `https://wa.me/${STORE.whatsappNumber}?text=${encodeURIComponent(message)}`
}

export function buildWhatsAppSupportUrl(): string {
  const message = `Olá, ${STORE.name}! Gostaria de um atendimento personalizado.`
  return `https://wa.me/${STORE.whatsappNumber}?text=${encodeURIComponent(message)}`
}
