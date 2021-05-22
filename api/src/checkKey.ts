import Koa from 'koa'

const checkKey = async (ctx: Koa.Context, next: Koa.Next) => {
  if (ctx.request.headers.key !== process.env.API_KEY) {
    console.log(ctx.request.headers)
    ctx.throw(403)
  }

  await next()
}

export default checkKey
