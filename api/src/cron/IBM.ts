import UsageReportsV4 from 'ibm-platform-services/usage-reports/v4'
import { IamAuthenticator } from 'ibm-watson/auth'
import LanguageTranslatorV3 from 'ibm-watson/language-translator/v3'
import { uniq } from 'lodash'
import log from 'loglevel'
import { IBM_STATS } from '../index'

const cronIBM = async () => {
  const apikey = process.env.IBM_AUTH_API_KEY
  if (!apikey) {
    log.error('cron IBM', 'missing api key')
    throw new Error()
  }

  const accountId = process.env.IBM_AUTH_ACCOUNT_ID
  const resourceId = process.env.IBM_AUTH_RESOURCE_ID
  if (!accountId || !resourceId) {
    log.error('cron IBM', 'missing auth details')
    return
  }

  const instance = process.env.IBM_TRANSLATE_INSTANCE
  if (!instance) {
    log.error('cron IBM', 'missing instance')
    throw new Error()
  }

  const authenticator = new IamAuthenticator({ apikey })

  const usage = await UsageReportsV4.newInstance({
    authenticator
  }).getResourceUsageAccount({
    accountId,
    billingmonth: `${new Date().getFullYear()}-${new Date().getMonth() + 1}`,
    resourceId
  })

  IBM_STATS.counts.current = usage.result.resources
    ? usage.result.resources[0].usage[0].quantity
    : 0

  const languageTranslator = new LanguageTranslatorV3({
    authenticator,
    serviceUrl: `https://api.eu-de.language-translator.watson.cloud.ibm.com/instances/${instance}`,
    version: '2018-05-01'
  })
  const languages = await languageTranslator.listLanguages()

  IBM_STATS.languages = uniq(
    languages.result.languages.map(language => language.language!.slice(0, 2))
  )
}

export default cronIBM
