import EventEmitter from 'node:events'

import { getPriceCoins, getPriceCents, http, sleep } from './helpers.mjs'
import { MAX_ITEM_RETRIEVE_ATTEMPTS } from './resources.mjs'

async function getItem(itemId, attempt = 0) {
  /*
    // As labeled by pricempire
    0: 'pending', 
    1: 'received', 
    2: 'processing', 
    3: 'sending', 
    4: 'confirming', 
    5: 'sent', 
    6: 'completed', 
    7: 'declined', 
    8: 'cancelled', 
    9: 'timedout', 
    10: 'credited',
    -1: 'error'

    // They seem to be re-using enum from pre-p2p times
    2 = listing available
    3 = sold but waiting offer (?)
    4 = auction being closed (?)
  */

  try {
    const result = await http.get(`/trading/item/${itemId}`).then(r => r.data)
    return result.data.item
  } catch (err) {
    if (err.response) {
      switch (err.response.status) {
        case 404:
        case 429:
          return null
        case 502:
        case 406:
          if (attempt >= MAX_ITEM_RETRIEVE_ATTEMPTS) {
            return null
          }

          await sleep(2_500)
          return getItem(itemId, attempt + 1)
      }
    }
      
    this.events.emit('warn', err)
    return null
  }
}

export class ItemTracker {
  items = new Map()
  events = new EventEmitter()

  async checkItem(itemId, attempt = 0) {
    const item = await getItem(itemId)

    if (!item) {
      // Unlisted
      return
    }

    if (item.auction_number_of_bids) {
      // There were bids on the auction, assume item was sold
      return this.onItemSale(item)
    }

    if (item.status === 3) {
      // Pending sale...
      return this.onItemSale(item)
    }

    if (item.status === 2 || item.status === 4) {
      if (attempt >= MAX_ITEM_RETRIEVE_ATTEMPTS) {
        // Our patience ran out
        this.events.emit('warn', `Item in invalid state after ${MAX_ITEM_RETRIEVE_ATTEMPTS} attempts: ${JSON.stringify(item)}`)
        return
      }

      await sleep(2_500)
      return this.checkItem(itemId, attempt + 1)
    }

    this.events.emit('warn', `Failed to process item data: ${JSON.stringify(item)}`)
  }

  onItemSale(item) {
    this.events.emit('item_sold', { marketName: item.market_name, priceRemoteRaw: getPriceCoins(item), priceRemoteCents: getPriceCents(item) })
  }

  onItemPublished(item) {
    this.items.set(item.id, item)
  }

  async onItemDeleted(itemId) {
    if (this.items.has(itemId)) {
      // We have item data, if it was an auction, we can skip confirming item status

      const item = this.items.get(itemId)
      this.items.delete(itemId)

      if (item.auction_number_of_bids) {
        // There were bids on the auction, assume item was sold
        return this.onItemSale(item)
      }
    }

    return this.checkItem(itemId)
  }

  onAuctionUpdate(payload) {
    if (!this.items.has(payload.id)) {
      return
    }

    this.items.set(payload.id, { ...this.items.get(payload.id), ...payload })
  }
}
