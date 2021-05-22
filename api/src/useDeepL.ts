import axios from 'axios'
import Koa from 'koa'
import log from 'loglevel'
import { DEEPL_STATS } from '.'

type Translation = {
  translations: { detected_source_language: string; text: string }[]
}

const useDeepL = async (ctx: Koa.Context, next: Koa.Next) => {
  const text = ctx.request.body.text
  const source = ctx.request.body.source
  const target = ctx.params.target

  if (
    DEEPL_STATS.counts.current + text.length >= DEEPL_STATS.counts.limit ||
    (source &&
      DEEPL_STATS.languages.length &&
      !DEEPL_STATS.languages.includes(source))
  ) {
    log.debug('DeepL', 'Unable to use')
    await next()
  } else {
    log.debug('DeepL', 'Translating')
    try {
      const { data } = await axios.post<Translation>(
        'https://api-free.deepl.com/v2/translate',
        undefined,
        {
          params: {
            auth_key: process.env.DEEPL_AUTH_KEY,
            text,
            target_lang: target
          }
        }
      )

      log.debug('DeepL', 'Translated')
      ctx.response.body = {
        provider: 'DeepL',
        text: data.translations[0].text
      }
    } catch (err) {
      log.debug('DeepL', err.response.data?.error)
      await next()
    }
  }
}

export default useDeepL
