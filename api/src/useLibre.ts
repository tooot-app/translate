import axios from 'axios'
import Koa from 'koa'
import log from 'loglevel'
import displayName from './displayName'

type Translation = {
  translatedText: string[]
}

const useLibre = async (ctx: Koa.Context, next: Koa.Next) => {
  const text: string[] = ctx.state.cleaned
  const source = ctx.state.original.source
  const target = ctx.params.target

  log.debug('tooot', 'Translating')
  try {
    const res = await axios.post<Translation>(
      'http://libretranslate:5000/translate',
      {
        source: source || 'auto',
        target: target,
        q: text
      }
    )

    log.debug('tooot', 'Translated')
    ctx.response.body = {
      provider: 'tooot',
      ...(source && { sourceLanguage: displayName({ source, target }) }),
      text: res.data.translatedText
    }
  } catch (err) {
    log.info('tooot', err.response.data?.error)
    ctx.throw(500)
  }
}

export default useLibre
