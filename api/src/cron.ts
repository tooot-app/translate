import cron from 'node-cron'
import cronAzure from './cron/Azure'
import cronDeepL from './cron/DeppL'
import cronIBM from './cron/IBM'

cron.schedule('* * * * *', () => {
  cronAzure()
  cronDeepL()
  cronIBM()
})
