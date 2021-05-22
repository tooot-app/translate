import { IamAuthenticator } from 'ibm-watson/auth'
import LanguageTranslatorV3 from 'ibm-watson/language-translator/v3'
import Koa from 'koa'
import log from 'loglevel'
import { IBM_STATS } from '.'

const useIBM = async (ctx: Koa.Context, next: Koa.Next) => {
  const text = ctx.request.body.text
  const source = ctx.request.body.source
  const target = ctx.params.target

  if (
    IBM_STATS.counts.current + text.length >= IBM_STATS.counts.limit ||
    (source &&
      IBM_STATS.languages.length &&
      !IBM_STATS.languages.includes(source))
  ) {
    log.debug('IBM', 'Unable to use')
    await next()
  } else {
    log.debug('IBM', 'Translating')

    const languageTranslator = new LanguageTranslatorV3({
      authenticator: new IamAuthenticator({
        apikey: process.env.IBM_AUTH_API_KEY!
      }),
      serviceUrl: `https://api.eu-de.language-translator.watson.cloud.ibm.com/instances/${process.env.IBM_TRANSLATE_INSTANCE}`,
      version: '2018-05-01'
    })

    try {
      const res = await languageTranslator.translate({ text, target })
      log.debug('IBM', 'Translated')
      ctx.response.body = {
        provider: 'IBM',
        text: res.result.translations[0].translation
      }
    } catch (err) {
      log.debug('IBM', err)
      await next()
    }
  }
}

export default useIBM