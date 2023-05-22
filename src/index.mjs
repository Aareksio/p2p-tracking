import { PriceManager } from "./common/PriceManager.mjs";
import { TrackingManager } from "./common/TrackingManager.mjs";
import { TrackingEmpire } from "./csgoempire_com/index.mjs";
import { TrackingRoll } from "./csgoroll_com/index.mjs";
import { storeItemSaleEvent } from './database.mjs'

async function main() {
  const priceManager = new PriceManager()
  await priceManager.init()

  const trackingManager = new TrackingManager(priceManager)

  trackingManager.events.on('item_sold', async (item, serviceName) => {
    // item = { marketName: string, priceRemoteCents: number, priceRemoteRaw: number }
    // serviceName = 'csgoempire.com' | 'csgoroll.com'

    const formatUSD = (value) => `${((value ?? 0) / 100).toFixed(2)} USD`
    const priceBuffCents = priceManager.getBuffPriceCents(item.marketName)
    console.log(`[${serviceName}] Sold: ${item.marketName} (${formatUSD(priceBuffCents)})`)


    const itemSaleEvent = {
      serviceName,
      marketName: item.marketName,
      priceRemoteRaw: item.priceRemoteRaw,
      priceRemoteCents: item.priceRemoteCents,
      priceBuffCents: priceManager.getBuffPriceCents(item.marketName)
    }

    await storeItemSaleEvent(itemSaleEvent)
  })

  trackingManager.events.on('error', (payload, serviceName) => {
    console.error(`[${serviceName}] ${payload}`)
  })

  trackingManager.events.on('error', (payload, serviceName) => {
    console.warn(`[${serviceName}] ${payload}`)
  })

  await trackingManager.register('csgoempire.com', TrackingEmpire)
  await trackingManager.register('csgoroll.com', TrackingRoll)
}

main()
