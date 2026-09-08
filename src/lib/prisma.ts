import { PrismaClient } from '@prisma/client'
import { encrypt, decrypt, generateHmac } from './crypto'

// Define which fields are encrypted and whether they are queryable (exact-match)
const ENCRYPTED_FIELDS: Record<string, Record<string, { queryable: boolean }>> = {
  User: {
    email: { queryable: true }
  },
  IntelEntity: {
    primaryAlias: { queryable: true },
    summary: { queryable: false }
  },
  CryptoWallet: {
    address: { queryable: true }
  },
  PGPKey: {
    fingerprint: { queryable: true },
    shortKeyId: { queryable: true }
  },
  FeedEntry: {
    source: { queryable: true },
    details: { queryable: false }
  },
  MapIncident: {
    label: { queryable: true },
    details: { queryable: false },
    originRoute: { queryable: false }
  }
}

function encryptData(modelName: string, data: any) {
  if (!data || typeof data !== 'object') return data;
  const fields = ENCRYPTED_FIELDS[modelName];
  if (!fields) return data;

  const newData = { ...data };
  for (const [field, config] of Object.entries(fields)) {
    if (newData[field] !== undefined && newData[field] !== null) {
      if (typeof newData[field] === 'string') {
        newData[field] = encrypt(newData[field], config.queryable);
      }
    }
  }
  return newData;
}

function decryptData(modelName: string, data: any) {
  if (!data || typeof data !== 'object') return data;
  const fields = ENCRYPTED_FIELDS[modelName];
  if (!fields) return data;

  const newData = { ...data };
  for (const field of Object.keys(fields)) {
    if (typeof newData[field] === 'string') {
      try {
        newData[field] = decrypt(newData[field]);
      } catch (e) {
        // Fallback to original if decryption fails (e.g., partial migration)
      }
    }
  }
  return newData;
}

function processWhere(modelName: string, where: any) {
  if (!where || typeof where !== 'object') return where;
  const fields = ENCRYPTED_FIELDS[modelName];
  if (!fields) return where;

  const newWhere = { ...where };
  for (const [field, config] of Object.entries(fields)) {
    if (newWhere[field] !== undefined && config.queryable) {
      if (typeof newWhere[field] === 'string') {
        // Exact match transformation
        const hmac = generateHmac(newWhere[field]);
        newWhere[field] = { startsWith: `v1:${hmac}:` };
      }
    }
  }
  return newWhere;
}

const basePrisma = new PrismaClient({ log: ['query'] });

export const prisma = basePrisma.$extends({
  query: {
    $allModels: {
      async $allOperations({ model, operation, args, query }) {
        // 1. Intercept Where clause for exact match queries
        if (args.where) {
          args.where = processWhere(model, args.where);
        }

        // 2. Intercept Data writes
        if (args.data) {
          if (Array.isArray(args.data)) {
            args.data = args.data.map(d => encryptData(model, d));
          } else {
            args.data = encryptData(model, args.data);
          }
        }
        
        if ((args as any).update) {
          (args as any).update = encryptData(model, (args as any).update);
        }
        if ((args as any).create) {
          (args as any).create = encryptData(model, (args as any).create);
        }

        // 3. Execute query
        const result = await query(args);

        // 4. Decrypt results
        if (result) {
          if (Array.isArray(result)) {
            return result.map(r => decryptData(model, r));
          } else {
            return decryptData(model, result);
          }
        }
        
        return result;
      }
    }
  }
});

const globalForPrisma = global as unknown as { prisma: typeof prisma }
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
