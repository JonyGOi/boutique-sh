import { STORE } from '../config/store'

export function Privacy() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-12 text-sm leading-relaxed text-mute">
      <h1 className="font-display text-4xl text-paper">Política de privacidade</h1>
      <p className="mt-6">
        A {STORE.name} utiliza este site para apresentar o catálogo de produtos e encaminhar pedidos pelo WhatsApp.
        Não processamos pagamentos neste site e não solicitamos dados de cartão, PIX ou boleto por formulário.
      </p>
      <h2 className="mt-8 font-display text-2xl text-paper">Dados coletados</h2>
      <p className="mt-3">
        O carrinho é armazenado apenas no seu navegador. O painel administrativo usa autenticação do Supabase para
        contas autorizadas. Não coletamos cadastro de clientes na loja pública.
      </p>
      <h2 className="mt-8 font-display text-2xl text-paper">WhatsApp</h2>
      <p className="mt-3">
        Ao finalizar um pedido, o navegador abre uma conversa com o número oficial configurado no projeto. A mensagem
        é gerada nesta aplicação; o envio depende da sua confirmação no WhatsApp.
      </p>
      <h2 className="mt-8 font-display text-2xl text-paper">Imagens e conteúdo</h2>
      <p className="mt-3">
        Fotografias enviadas no painel ficam no armazenamento do projeto. Textos de produtos são exibidos de forma
        segura, sem execução de HTML.
      </p>
      <h2 className="mt-8 font-display text-2xl text-paper">Contato</h2>
      <p className="mt-3">
        Dúvidas sobre privacidade podem ser enviadas pelo WhatsApp da loja. Este documento não inventa endereço, CNPJ
        ou redes sociais.
      </p>
    </article>
  )
}
