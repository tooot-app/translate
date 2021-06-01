import axios from 'axios'
import { uniq } from 'lodash'
import log from 'loglevel'
import { DEEPL_STATS } from '../index'

type Usage = {
  character_count: number
  character_limit: number
}

type Languages = {
  language: string
  name: string
}[]

const cronDeepL = async () => {
  const auth_key = process.env.DEEPL_AUTH_KEY
  if (!auth_key) {
    log.info('cron DeepL', 'missing auth key')
    throw new Error()
  }

  const usage = await axios.post<Usage>(
    'https://api-free.deepl.com/v2/usage',
    undefined,
    { params: { auth_key } }
  )

  DEEPL_STATS.counts = {
    current: usage.data.character_count,
    limit: usage.data.character_limit
  }

  const languages = await axios.post<Languages>(
    'https://api-free.deepl.com/v2/languages',
    undefined,
    { params: { auth_key } }
  )
  DEEPL_STATS.languages = uniq(
    languages.data.map(language => language.language.toLowerCase().slice(0, 2))
  )
}

export default cronDeepL
