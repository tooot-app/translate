import axios, { AxiosResponse } from 'axios'
import Koa from 'koa'
import { sortBy } from 'lodash'
import log from 'loglevel'
import displayName from './displayName'

type Detections = {
  confidence: number
  language: string
}[]

type Translation = {
  translatedText: string
}

const useLibre = async (ctx: Koa.Context, next: Koa.Next) => {
  const text: string[] = ctx.state.original.text
  const source = ctx.state.original.source
  const target = ctx.params.target

  log.debug('tooot', 'Using tooot to translate')
  let detected: string = ''

  if (!source) {
    log.debug('tooot', 'Could not find source language')
    try {
      const detections = await axios.post<Detections>(
        'https://libretranslate.tooot.app/detect',
        {
          api_key: process.env.LIBRE_API_KEY,
          q: text[0]
        }
      )
      detected = sortBy(detections.data, d => -d.confidence)[0].language
    } catch (err) {
      log.debug('tooot', err.response.data?.error)
      await next()
    }
  }

  try {
    let res: AxiosResponse<Translation>[] = []
    for (const q of text) {
      res.push(
        await axios.post<Translation>(
          'https://libretranslate.tooot.app/translate',
          {
            api_key: process.env.LIBRE_API_KEY,
            source: source || detected,
            target: target,
            q
          }
        )
      )
    }

    log.debug('tooot', 'Translated')
    ctx.response.body = {
      provider: 'tooot',
      sourceLanguage: displayName({
        source: source || detected,
        target
      }),
      text: res.map(r => r.data.translatedText)
    }
  } catch (err) {
    log.debug('tooot', err.response.data?.error)
    await next()
  }
}

export default useLibre
