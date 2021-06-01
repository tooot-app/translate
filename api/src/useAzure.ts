import axios from 'axios'
import Koa from 'koa'
import log from 'loglevel'
import { AZURE_STATS } from '.'
import displayName from './displayName'

type Translation = {
  detectedLanguage: {
    language: string
    score: number
  }
  translations: {
    text: string
    to: string
  }[]
}[]

const useAzure = async (ctx: Koa.Context, next: Koa.Next) => {
  const text: string[] = ctx.state.original.text
  const source = ctx.state.original.source
  const target = ctx.params.target

  if (
    AZURE_STATS.counts.current + text.length >= AZURE_STATS.counts.limit ||
    (source &&
      AZURE_STATS.languages.length &&
      !AZURE_STATS.languages.includes(source))
  ) {
    log.debug('Azure', 'Unable to use')
    await next()
  } else {
    log.debug('Azure', 'Translating')
    try {
      const { data } = await axios.post<Translation>(
        'https://api.cognitive.microsofttranslator.com/translate',
        text.map(t => ({ text: t })),
        {
          params: {
            'api-version': '3.0',
            to: target,
            textType: 'html'
          },
          headers: {
            'Ocp-Apim-Subscription-Key':
              process.env.AZURE_TRANSLATE_SUBSCRIPTION_KEY,
            'Ocp-Apim-Subscription-Region':
              process.env.AZURE_TRANSLATE_SUBSCRIPTION_REGION
          }
        }
      )

      log.debug('Azure', 'Translated')
      ctx.response.body = {
        provider: 'Azure',
        sourceLanguage: displayName({
          source: source || data[0].detectedLanguage.language,
          target
        }),
        text: data.map(d => d.translations[0].text)
      }
    } catch (err) {
      log.info('Azure', err.response.data?.error)
      if (err.response?.data?.error?.code == 403001) {
        log.debug('Azure', 'Out of limit')
        AZURE_STATS.counts.current = 2000000
      }
      await next()
    }
  }
}

export default useAzure
