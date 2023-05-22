import axios from 'axios'

export async function getBuffPrices() {
  try {
    const response = await axios.get(
      `https://pricempire.com/api/v3/getAllItems`, 
      { params: { api_key: process.env.PRICEMPIRE_API_KEY, sources: 'buff', appId: 730, currency: 'USD' } }
    ).then(r => r.data)

    return response
  } catch (err) {
    // This is just PoC code, figure out how you want to handle errors :)
    console.error(err)
    return {}
  }
}

export class PriceManager {
  prices = new Map()

  async updatePrices() {
    const prices = await getBuffPrices()

    for (const [marketName, priceObject] of Object.entries(prices)) {
      if (!priceObject.buff || !priceObject.buff.price) continue
      this.prices.set(marketName, priceObject.buff.price)
    }
  }

  getBuffPriceCents(marketName) {
    return this.prices.get(marketName) ?? 0
  }

  async init() {
    if (!process.env.PRICEMPIRE_API_KEY) {
      console.log('Pricempire API key was not provided, buff price will not be available')
      return
    }

    await this.updatePrices()
    this.interval = setInterval(() => this.updatePrices(), 60_000)
  }
}
