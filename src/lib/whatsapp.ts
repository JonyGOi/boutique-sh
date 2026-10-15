import { STORE } from '../config/store'
import { formatBRL } from './money'
import type { ValidatedLine } from '../types/product'

function buildOrderMessage(lines: ValidatedLine[], totalCents: number): string {
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

  return [
    `Olá, ${STORE.name}! Gostaria de finalizar o seguinte pedido:`,
    '',
    blocks.join('\n\n'),
    '',
    `Total dos produtos: ${formatBRL(totalCents)}`,
    '',
    'Como podemos combinar o pagamento e a entrega?',
  ].join('\n')
}

/**
 * Gera o link oficial. O destino é sempre o número configurado no projeto.
 * Não aceita número, URL ou destino fornecidos pelo chamador.
 */
export function buildWhatsAppCheckoutUrl(lines: ValidatedLine[], totalCents: number): string {
  const message = buildOrderMessage(lines, totalCents)
  return `https://wa.me/${STORE.whatsappNumber}?text=${encodeURIComponent(message)}`
}

export function buildWhatsAppSupportUrl(): string {
  const message = `Olá, ${STORE.name}! Gostaria de um atendimento personalizado.`
  return `https://wa.me/${STORE.whatsappNumber}?text=${encodeURIComponent(message)}`
}
