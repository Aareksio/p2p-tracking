export const subscribeCompletedTrades = `
subscription Subscription($status: TradeStatus) {
  updateTrade(status: $status) {
    trade {
      tradeItems {
        marketName
        value
      }
    }
  }
}
`
