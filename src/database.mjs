import { connect } from "@planetscale/database";

const connection = connect({
  host: process.env.DATABASE_HOST,
  username: process.env.DATABASE_USERNAME,
  password: process.env.DATABASE_PASSWORD,
})

export async function storeItemSaleEvent({ serviceName, marketName, priceRemoteCents = 0, priceRemoteRaw = 0, priceBuffCents = 0 }) {
  if (!process.env.DATABASE_HOST || !process.env.DATABASE_USERNAME || !process.env.DATABASE_PASSWORD) {
    return
  }

  await connection.execute(
    'INSERT INTO sales (source, market_name, price_remote_raw, price_remote_cents, price_buff_cents) VALUES (:serviceName, :marketName, :priceRemoteRaw, :priceRemoteCents, :priceBuffCents)', 
    { serviceName, marketName, priceRemoteCents, priceRemoteRaw, priceBuffCents }
  )
}
