import cron from 'node-cron'
import cronAzure from './cron/Azure'
import cronDeepL from './cron/DeppL'
import cronIBM from './cron/IBM'

export const crons = async () => {
  return Promise.allSettled([cronAzure(), cronDeepL(), cronIBM()])
}

cron.schedule('0 * * * *', () => {
  crons()
})
