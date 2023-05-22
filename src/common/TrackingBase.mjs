import EventEmitter from 'node:events'

export class TrackingBase {
  events = new EventEmitter()
  async init() {}
}
