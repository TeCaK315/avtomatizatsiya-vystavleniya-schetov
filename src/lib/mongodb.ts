import { MongoClient, Db } from 'mongodb';

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

export async function connectToDatabase(): Promise<{ client: MongoClient; db: Db }> {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB;

  if (!uri) {
    throw new Error('MONGODB_URI environment variable is not defined');
  }

  if (!dbName) {
    throw new Error('MONGODB_DB environment variable is not defined');
  }

  const client = new MongoClient(uri, {
    maxPoolSize: 10,
    minPoolSize: 2,
    maxIdleTimeMS: 30000,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  });

  await client.connect();

  const db = client.db(dbName);

  cachedClient = client;
  cachedDb = db;

  await ensureIndexes(db);

  return { client, db };
}

export async function getDatabase(): Promise<Db> {
  const { db } = await connectToDatabase();
  return db;
}

async function ensureIndexes(db: Db): Promise<void> {
  const clientsCollection = db.collection('clients');
  await clientsCollection.createIndex({ email: 1 }, { unique: true });
  await clientsCollection.createIndex({ name: 1 });
  await clientsCollection.createIndex({ createdAt: -1 });

  const invoicesCollection = db.collection('invoices');
  await invoicesCollection.createIndex({ invoiceNumber: 1 }, { unique: true });
  await invoicesCollection.createIndex({ clientId: 1 });
  await invoicesCollection.createIndex({ status: 1 });
  await invoicesCollection.createIndex({ issueDate: -1 });
  await invoicesCollection.createIndex({ dueDate: 1 });
  await invoicesCollection.createIndex({ createdAt: -1 });
  await invoicesCollection.createIndex(
    { 'client.name': 'text', invoiceNumber: 'text' },
    { name: 'search_index' }
  );

  const uploadedPdfsCollection = db.collection('uploaded_pdfs');
  await uploadedPdfsCollection.createIndex({ uploadedAt: -1 });
}