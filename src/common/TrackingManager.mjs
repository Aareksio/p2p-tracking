import EventEmitter from 'node:events'

export class TrackingManager {
  events = new EventEmitter()

  async register(serviceName, Tracker) {
    const tracker = new Tracker(this.priceManager)

    tracker.events.on('item_sold', (item) => {
      this.events.emit('item_sold', item, serviceName)
    })

    tracker.events.on('error', (message) => {
      this.events.emit('error', (message, serviceName))
    })

    tracker.events.on('warn', (message) => {
      this.events.emit('warn', (message, serviceName))
    })

    await tracker.init()
  }
}
