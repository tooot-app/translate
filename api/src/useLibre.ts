import axios from 'axios'
import Koa from 'koa'
import { sortBy } from 'lodash'
import log from 'loglevel'

type Detections = {
  confidence: number
  language: string
}[]

type Translation = {
  translatedText: string
}

const useLibre = async (ctx: Koa.Context, next: Koa.Next) => {
  log.debug('tooot', 'Using tooot to translate')
  let detected: string = ''

  if (!ctx.request.body.source) {
    log.debug('tooot', 'Could not find source language')
    try {
      const detections = await axios.post<Detections>(
        'https://libretranslate.tooot.app/detect',
        {
          api_key: process.env.LIBRE_API_KEY,
          q: ctx.request.body.text
        }
      )
      detected = sortBy(detections.data, d => -d.confidence)[0].language
    } catch (err) {
      log.debug('tooot', err.response.data?.error)
      await next()
    }
  }

  try {
    const res = await axios.post<Translation>(
      'https://libretranslate.tooot.app/translate',
      {
        api_key: process.env.LIBRE_API_KEY,
        source: ctx.request.body.source || detected,
        target: ctx.params.target,
        q: ctx.request.body.text
      }
    )

    log.debug('tooot', 'Translated')
    ctx.response.body = { provider: 'tooot', text: res.data.translatedText }
  } catch (err) {
    log.debug('tooot', err.response.data?.error)
    await next()
  }
}

export default useLibre
