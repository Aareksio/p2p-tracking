import io from 'socket.io-client';

import { TrackingBase } from "../common/TrackingBase.mjs";
import { ItemTracker } from "./ItemTracker.mjs";
import { WEBSOCKET_URL } from './resources.mjs';
import { http } from './helpers.mjs';

async function getSocketMetadata() {
  return http.get('/metadata/socket').then(r => r.data)
}

async function getSocketConnection() {
  return io(WEBSOCKET_URL, {
    transports: ['websocket'],
    path: '/s/',
    secure: true,
    rejectUnauthorized: false,
    reconnect: true,
    extraHeaders: { 'User-Agent': 'API Bot' }
  })
}

export class TrackingEmpire extends TrackingBase {
  constructor() {
    super()

    this.itemTracker = new ItemTracker()

    this.itemTracker.events.on('item_sold', (item) => {
      this.events.emit('item_sold', item)
    })

    this.itemTracker.events.on('error', (payload) => {
      this.events.emit('error', payload)
    })

    this.itemTracker.events.on('warn', (payload) => {
      this.events.emit('warn', payload)
    })
  }

  async init() {
    if (!process.env.CSGOEMPIRE_API_TOKEN) {
      this.events.emit('error', 'Failed to start: missing api key')
      return
    }

    this.socket = await getSocketConnection()
    await this.setSocketHandlers(this.socket)

    this.events.emit('init')
  }

  async setSocketHandlers(socket) {
    const socketMetadata = await getSocketMetadata()

    socket.on('init', (data) => {
      if (data && data.authenticated) {
        return
      }

      socket.emit('identify', {
        uid: socketMetadata.user.id,
        model: socketMetadata.user,
        authorizationToken: socketMetadata.socket_token,
        signature: socketMetadata.socket_signature
      })
  
      setTimeout(() => {
        socket.emit('filters', { price_max: 9999999 })
      }, 2_500)
    })

    socket.on('new_item', (data) => {
      for (const item of data) {
        this.itemTracker.onItemPublished(item)
      }
    })

    socket.on('deleted_item', (data) => {
      for (const itemId of data) {
        this.itemTracker.onItemDeleted(itemId)
      }
    })

    socket.on('auction_update', (data) => {
      for (const payload of data) {
        this.itemTracker.onAuctionUpdate(payload)
      }
    })
  }
}
