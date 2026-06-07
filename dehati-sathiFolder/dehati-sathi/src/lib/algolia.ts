// src/lib/algolia.ts
// ✅ UNCOMMENT THIS for Production
import { algoliasearch } from 'algoliasearch';

const ALGOLIA_APP_ID = process.env.ALGOLIA_APP_ID || process.env.NEXT_PUBLIC_ALGOLIA_APP_ID;
const ALGOLIA_ADMIN_KEY = process.env.ALGOLIA_ADMIN_KEY;

// Global var for Singleton (prevents memory leaks during dev)
const globalForAlgolia = global as unknown as { algoliaClient: any };

let client: any;

// 🛠️ ROBUST MOCK CLIENT (Supports v4 & v5 syntax to prevent crashes)
const mockClient = {
    // v5 Support
    setSettings: async () => { console.log("⚠️ [Mock] Settings Updated"); return {}; },
    search: async () => { console.log("⚠️ [Mock] Search Performed"); return { results: [] }; },
    
    // v4/Legacy Support (Keep this for older code compatibility)
    initIndex: () => ({
        saveObject: async () => ({}),
        deleteObject: async () => ({}),
        search: async () => ({ hits: [] }),
        setSettings: async () => ({})
    })
};

try {
    if (!ALGOLIA_APP_ID || !ALGOLIA_ADMIN_KEY) {
        console.warn("⚠️ Production Warning: Algolia Keys missing. Using Mock.");
        client = mockClient;
    } else {
        // Singleton Initialization
        if (!globalForAlgolia.algoliaClient) {
            // v5 Client Initialization
            globalForAlgolia.algoliaClient = algoliasearch(ALGOLIA_APP_ID, ALGOLIA_ADMIN_KEY);
        }
        client = globalForAlgolia.algoliaClient;
    }
} catch (error) {
    console.error("❌ Algolia Connection Failed:", error);
    client = mockClient; // Fallback to prevent crash
}

export const algoliaClient = client;

// 🛡️ SAFE INDEX EXPORT (Polyfill for v5)
// This ensures 'productIndex.search()' works even if v5 removed 'initIndex'
export const productIndex = (() => {
    try {
        // If v4 (Legacy)
        if (typeof client.initIndex === 'function') {
            return client.initIndex('products');
        }
        
        // If v5 (Modern) - Create a compatibility wrapper
        // This allows existing code to call 'productIndex.saveObject' without breaking
        return {
            search: async (query: string, options: any) => {
                // Map legacy search to v5 search
                if (client.search) {
                    const res = await client.search({ requests: [{ indexName: 'products', query, ...options }] });
                    return res.results[0]; // Return expected v4 format
                }
                return { hits: [] };
            },
            saveObject: async (body: any) => {
                if (client.saveObject) return client.saveObject({ indexName: 'products', body });
                return {};
            },
            deleteObject: async (objectID: string) => {
                if (client.deleteObject) return client.deleteObject({ indexName: 'products', objectID });
                return {};
            },
            setSettings: async (settings: any) => {
                if (client.setSettings) return client.setSettings({ indexName: 'products', indexSettings: settings });
                return {};
            }
        };
    } catch (e) {
        // Fallback to mock index if anything fails
        return mockClient.initIndex();
    }
})();

export default client;