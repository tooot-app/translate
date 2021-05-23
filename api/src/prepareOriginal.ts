import Koa from 'koa'
import log from 'loglevel'
import sanitize from 'sanitize-html'

const prepareOriginal = async (ctx: Koa.Context, next: Koa.Next) => {
  if (
    !ctx.request.headers.original ||
    typeof ctx.request.headers.original !== 'string'
  ) {
    ctx.throw(400)
  }

  let original
  try {
    const data = Buffer.from(ctx.request.headers.original, 'base64').toString(
      'utf8'
    )
    original = JSON.parse(data)
  } catch {
    ctx.throw(400)
  }

  original.source = original.source.slice(0, 2)

  log.debug('Original', original.text)
  original.text = original.text.map((t: string) =>
    sanitize(t, {
      allowedTags: ['p', 'br'],
      allowedAttributes: {},
      nonTextTags: ['style', 'script', 'textarea', 'option', 'a'],
      exclusiveFilter: frame => frame.tag !== 'br' && !frame.text.trim()
    }).trim()
  )
  log.debug('Sanitized', original.text)

  const cleaned = original.text.map((t: string) =>
    sanitize(t, {
      allowedTags: [],
      allowedAttributes: {},
      nonTextTags: ['style', 'script', 'textarea', 'option', 'a'],
      exclusiveFilter: frame => frame.tag !== 'br' && !frame.text.trim()
    }).trim()
  )

  ctx.state.original = original
  ctx.state.cleaned = cleaned

  await next()
}

export default prepareOriginal
