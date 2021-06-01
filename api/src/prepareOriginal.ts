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

  let original: { source?: string; text: string[] }
  try {
    const data = Buffer.from(ctx.request.headers.original, 'base64').toString(
      'utf8'
    )
    original = JSON.parse(data)
  } catch (err) {
    log.info('prepareOriginal', err)
    ctx.throw(400)
  }

  // https://github.com/google/cld3#supported-languages
  // Remove some confusing languages, like new and old Norwegian shown as only `no`
  switch (original.source) {
    case 'no':
      original.source = undefined
      break
    default:
      original.source = original.source?.slice(0, 2)
      break
  }

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
