import { createClient } from 'graphql-ws'
import WebSocket from 'ws'

import { TrackingBase } from '../common/TrackingBase.mjs'
import { subscribeCompletedTrades } from './queries.mjs'

const websocketURL = 'wss://api.csgoroll.com/graphql'

function getPriceCents(priceRaw) {
  return priceRaw * 70
}

async function subscribe(client, query, variables = {}, callback) {
  let unsubscribe

  const resubscribe = () => (unsubscribe = subscribe(client, query, variables, callback))

  // this should never resolve or complete so we resubscribe
  unsubscribe = client.subscribe({ query, variables }, { next: callback, error: resubscribe, complete: resubscribe })
  return unsubscribe
}

export class TrackingRoll extends TrackingBase {
  async init() {
    // This should always now keep tracking the trades
    // if it stops doing that, I blame Killian
    this.client = createClient({
      url: websocketURL,
      webSocketImpl: WebSocket,
      retryAttempts: Infinity,
      shouldRetry: () => true,
    })

    subscribe(this.client, subscribeCompletedTrades, { status: 'COMPLETED' }, (response) => {
      const { marketName, value } = response.data.updateTrade.trade.tradeItems[0]
      this.events.emit("item_sold", { marketName, priceRemoteCents: getPriceCents(value), priceRemoteRaw: value })
    })
  }
}
