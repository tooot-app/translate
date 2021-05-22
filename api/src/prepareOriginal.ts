import Koa from 'koa'

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

  ctx.state.original = original

  await next()
}

export default prepareOriginal
