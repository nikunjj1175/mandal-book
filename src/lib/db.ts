import mongoose from 'mongoose';

const MONGODB_URI = process.env.DATABASE_URL || '';

if (!MONGODB_URI) {
  // Not throwing to allow build on platforms without env set; runtime will fail fast
  console.warn('DATABASE_URL is not set');
}

type MongooseGlobal = typeof global & {
  __mongooseConnection?: Promise<typeof mongoose>;
};

let cached = (global as MongooseGlobal).__mongooseConnection;

export async function connectToDatabase() {
  if (!cached) {
    cached = mongoose
      .connect(MONGODB_URI, {
        dbName: undefined
      })
      .then((conn) => conn);
    (global as MongooseGlobal).__mongooseConnection = cached;
  }
  return cached;
}