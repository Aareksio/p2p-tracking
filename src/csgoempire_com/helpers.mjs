import axios from 'axios'

import { API_URL, COIN_TO_CENTS_MULTIPLIER } from './resources.mjs'

export function coinsToCents(price) {
  return Math.ceil(price / COIN_TO_CENTS_MULTIPLIER)
}

export function centsToCoins(price) {
  return Math.floor(price * COIN_TO_CENTS_MULTIPLIER)
}

export function getPriceCents(item) {
  const price = getPriceCoins(item)
  return coinsToCents(price)
}

export function getPriceCoins(item) {
  return item.auction_highest_bid ? item.auction_highest_bid : (item.purchase_price ?? item.expected_price)
}

export const http = axios.create({
  baseURL: API_URL,
  headers: { 'Authorization': `Bearer ${process.env.CSGOEMPIRE_API_TOKEN}` } 
})

export function sleep(delay) {
  return new Promise((resolve) => setTimeout(resolve, delay))
}
