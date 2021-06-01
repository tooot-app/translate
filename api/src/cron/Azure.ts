import * as msRestNodeAuth from '@azure/ms-rest-nodeauth'
import axios from 'axios'
import { uniq } from 'lodash'
import log from 'loglevel'
import { AZURE_STATS } from '..'

type Usage = {
  value: {
    name: {
      value: 'CognitiveServices.TextTranslation.Commitment.F0'
      localizedValue: 'CognitiveServices.TextTranslation.Commitment.F0'
    }
    status: string
    currentValue: number
    limit: number
    nextResetTime: string
  }[]
}

type Languages = {
  translation: {
    [key: string]: {
      name: string
      nativeName: string
    }
  }
}

const cronAzure = async () => {
  const clientId = process.env.AZURE_AUTH_CLIENT_ID
  const secret = process.env.AZURE_AUTH_CLIENT_SECRET
  const tenantId = process.env.AZURE_AUTH_TENANT_ID
  if (!clientId || !secret || !tenantId) {
    log.info('cron Azure', 'missing credentials')
    return
  }

  const subscriptionId = process.env.AZURE_SUBSCRIPTION_ID
  if (!subscriptionId) {
    log.info('cron Azure', 'missing subscription ID')
    return
  }

  const subscriptionKey = process.env.AZURE_TRANSLATE_SUBSCRIPTION_KEY
  if (!subscriptionKey) {
    log.info('cron Azure', 'missing translator subscription key')
    throw new Error()
  }

  const auth = await msRestNodeAuth.loginWithServicePrincipalSecretWithAuthResponse(
    clientId,
    secret,
    tenantId
  )
  const token = await auth.credentials.getToken()
  const usage = await axios.get<Usage>(
    `https://management.azure.com/subscriptions/${subscriptionId}/resourceGroups/tooot/providers/Microsoft.CognitiveServices/accounts/tooot-translate/usages`,
    {
      headers: {
        Authorization: `Bearer ${token.accessToken}`
      },
      params: {
        'api-version': '2017-04-18'
      }
    }
  )
  AZURE_STATS.counts.current = Math.round(usage.data.value[0].currentValue)

  const languages = await axios.get<Languages>(
    'https://api.cognitive.microsofttranslator.com/languages',
    {
      params: {
        'api-version': '3.0'
      },
      headers: {
        'Ocp-Apim-Subscription-Key': subscriptionKey
      }
    }
  )

  AZURE_STATS.languages = uniq(
    Object.keys(languages.data.translation).map(lang => lang.slice(0, 2))
  )
}

export default cronAzure
