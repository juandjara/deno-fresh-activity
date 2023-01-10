import { DB } from 'sqlite'

const db = new DB('data.db')

// if there is no `accounts` table in the DB, create an empty table
db.execute('CREATE TABLE IF NOT EXISTS accounts (name TEXT PRIMARY KEY, privkey TEXT, pubkey TEXT, webfinger TEXT, actor TEXT, apikey TEXT, followers TEXT, messages TEXT)');

// if there is no `messages` table in the DB, create an empty table
db.execute('CREATE TABLE IF NOT EXISTS messages (guid TEXT PRIMARY KEY, message TEXT)');

export default db
