process.env.NODE_ENV === 'production' && require('newrelic')

import Router from '@koa/router'
import './cron'
import Koa from 'koa'
import bodyParser from 'koa-bodyparser'
import logger from 'koa-logger'
import log from 'loglevel'
import useDeepL from './useDeepL'
import useLibre from './useLibre'
import useIBM from './useIBM'
import useAzure from './useAzure'
import returnHealth from './returnHealth'
import { crons } from './cron'
import checkKey from './checkKey'
import prepareOriginal from './prepareOriginal'

type Stats = {
  counts: {
    current: number
    limit: number
  }
  languages: string[]
}

const PORT = 5000
export const VERSION = 'v1'
export const AZURE_STATS: Stats = {
  counts: {
    current: 0,
    limit: 2000000
  },
  languages: []
}
export const DEEPL_STATS: Stats = {
  counts: {
    current: 0,
    limit: 500000
  },
  languages: []
}
export const IBM_STATS: Stats = {
  counts: {
    current: 0,
    limit: 1000000
  },
  languages: []
}

const main = async () => {
  log.debug('Stats', 'updating')
  await crons()
  log.debug('Stats', 'updated')

  const app = new Koa()
  const router = new Router({
    prefix: `/${VERSION}`
  })

  process.env.NODE_ENV !== 'production' ? log.enableAll() : log.disableAll()
  process.env.NODE_ENV !== 'production' && app.use(logger())

  app.use(
    bodyParser({
      enableTypes: ['json'],
      onerror: (_, ctx) => {
        ctx.throw(422, 'Body parse error')
      }
    })
  )

  router.get('/health', returnHealth)
  router.get(
    '/translate/:base64/:target',
    // -> headers { source?: string, text: string[] }
    // <- { provider: string, sourceLanguage: string, text: string[] }
    checkKey,
    prepareOriginal,
    useIBM,
    useAzure,
    useDeepL,
    useLibre
  )

  app.use(router.routes())

  app.listen(PORT, () => {
    log.debug('Koa', `listening on port ${PORT}`)
  })
}

main()
