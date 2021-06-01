import axios from 'axios'
import Koa from 'koa'
import log from 'loglevel'
import { URLSearchParams } from 'url'
import { DEEPL_STATS } from '.'
import displayName from './displayName'

type Translation = {
  translations: { detected_source_language: string; text: string }[]
}

const useDeepL = async (ctx: Koa.Context, next: Koa.Next) => {
  const text: string[] = ctx.state.original.text
  const source = ctx.state.original.source
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
      const params = new URLSearchParams()
      params.append('auth_key', process.env.DEEPL_AUTH_KEY!)
      params.append('target_lang', target)
      for (const t of text) {
        params.append('text', t)
      }
      params.append('tag_handling', 'xml')
      const { data } = await axios.post<Translation>(
        'https://api-free.deepl.com/v2/translate',
        undefined,
        { params }
      )

      log.debug('DeepL', 'Translated')
      ctx.response.body = {
        provider: 'DeepL',
        sourceLanguage: displayName({
          source: source || data.translations[0].detected_source_language,
          target
        }),
        text: data.translations.map(t => t.text)
      }
    } catch (err) {
      log.info('DeepL', err.response.data?.error)
      await next()
    }
  }
}

export default useDeepL
