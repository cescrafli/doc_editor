import { createClient, type Client } from '@libsql/client';
import { initializeSchemaAndSeed } from './schema';

const DEFAULT_TURSO_URL = 'libsql://doceditor-cescrafli.aws-ap-southeast-1.turso.io';

let singletonClient: Client | null = null;
let initPromise: Promise<void> | null = null;

export function getDbClient(): Client {
  if (singletonClient) {
    return singletonClient;
  }

  const tursoToken = process.env.TURSO_AUTH_TOKEN?.trim();
  const tursoUrl =
    process.env.TURSO_DATABASE_URL?.trim() ||
    (tursoToken ? DEFAULT_TURSO_URL : undefined);

  if (tursoUrl) {
    singletonClient = createClient({
      url: tursoUrl,
      authToken: tursoToken || undefined,
    });
  } else if (process.env.VERCEL) {
    singletonClient = createClient({
      url: 'file:/tmp/cesctor.db',
    });
  } else {
    singletonClient = createClient({
      url: 'file:./local.db',
    });
  }

  return singletonClient;
}

export async function ensureDbReady(customClient?: Client): Promise<Client> {
  if (customClient) {
    return customClient;
  }

  const client = getDbClient();
  if (!initPromise) {
    initPromise = initializeSchemaAndSeed(client).catch((err) => {
      initPromise = null;
      throw err;
    });
  }

  await initPromise;
  return client;
}

export { initializeSchemaAndSeed };
