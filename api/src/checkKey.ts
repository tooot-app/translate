import Koa from 'koa'
import log from 'loglevel'

const checkKey = async (ctx: Koa.Context, next: Koa.Next) => {
  if (ctx.request.headers.key !== process.env.API_KEY) {
    log.info('checkKey', ctx.request.headers)
    ctx.throw(403)
  }

  ctx.set('Cache-Control', 'max-age=1209600')

  await next()
}

export default checkKey
