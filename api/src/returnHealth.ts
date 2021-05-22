import Koa from 'koa'
import { AZURE_STATS, DEEPL_STATS, IBM_STATS } from '.'

const returnHealth = async (ctx: Koa.Context) => {
  ctx.response.body = {
    Azure: AZURE_STATS,
    DeepL: DEEPL_STATS,
    IBM: IBM_STATS
  }
}

export default returnHealth
