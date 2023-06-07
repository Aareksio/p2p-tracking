import { createClient } from 'graphql-ws';
import WebSocket from 'ws'

import { TrackingBase } from '../common/TrackingBase.mjs'
import { subscribeCompletedTrades } from './queries.mjs'

const websocketURL = 'wss://api.csgoroll.com/graphql'

function getPriceCents(priceRaw) {
  return priceRaw * 70
}

async function subscribe(client, query, variables = {}, callback) {
  let unsubscribe

  await new Promise((resolve, reject) => {
    unsubscribe = client.subscribe(
      { query, variables },
      { next: callback, error: reject, complete: resolve },
    );
  })

  return unsubscribe
}

export class TrackingRoll extends TrackingBase {
  async init() {
    this.client = createClient({
      url: websocketURL,
      webSocketImpl: WebSocket,
      retryAttempts: Infinity, // worth a try? I mean roll has frequent disconnects..
    });

    subscribe(this.client, subscribeCompletedTrades, { status: "COMPLETED" }, (response) => {
      const { marketName, value } = response.data.updateTrade.trade.tradeItems[0]
      this.events.emit('item_sold', { marketName, priceRemoteCents: getPriceCents(value), priceRemoteRaw: value })
    })
  }
}
