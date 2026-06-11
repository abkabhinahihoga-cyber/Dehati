import React from "react";
import connectDb from "@/lib/db"; 
import User from "@/app/models/user.model";
import Grocery from "@/app/models/grocery.model"; 
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Nav from "@/components/Nav";
import UserDashboard from "@/components/UserDashboard";
// 👇 Import Algolia Client (Reuse the one from lib)
import algoliaClient from "@/lib/algolia"; 

export const dynamic = "force-dynamic";
export const revalidate = 0;

// Type definition for Next.js Page Props
type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

async function Home(props: Props) {
  await connectDb();
  const session = await auth();

  if (!session?.user) {
    redirect("/landing");
  }

  const user = await User.findById(session.user.id);
  if (!user) redirect("/login");

  // --- 1. HANDLE SEARCH QUERY ---
  const searchParams = await props.searchParams;
  const query = typeof searchParams.query === 'string' ? searchParams.query : "";

  let products = [];

  if (query) {
      console.log(`🔍 Searching via Algolia for: "${query}"`);
      
      try {
          // A. Algolia Search (Fast & Relevant)
          const { results } = await algoliaClient.search({
              requests: [
                  {
                      indexName: 'products',
                      query: query,
                      hitsPerPage: 50
                  }
              ]
          });

          // B. Get IDs from Algolia Hits
          // Cast to 'any' to handle v5 types easily
          const hits = (results[0] as any).hits;
          const objectIds = hits.map((hit: any) => hit.objectID);

          // C. Fetch Full Data from MongoDB (Source of Truth)
          // We need full details (stock, seller info) that Algolia might not have
          const dbProducts = await Grocery.find({ _id: { $in: objectIds } });

          // D. Re-Sort MongoDB results to match Algolia's relevance order
          // (MongoDB returns items in random order, we want Algolia's smart order)
          products = objectIds.map((id: string) => 
              dbProducts.find((p: any) => p._id.toString() === id)
          ).filter(Boolean); // Remove nulls (in case sync had a delay)

      } catch (error) {
          console.error("⚠️ Algolia Search Failed, Falling back to Regex:", error);
          
          // Fallback: Standard MongoDB Regex (Slower, no typo tolerance)
          const searchRegex = new RegExp(query, "i");
          products = await Grocery.find({
              $or: [
                  { name: { $regex: searchRegex } },
                  { category: { $regex: searchRegex } },
                  { description: { $regex: searchRegex } }
              ]
          }).limit(50).sort({ createdAt: -1 });
      }

  } else {
      // DEFAULT FEED: Show latest 20 items
      products = await Grocery.find({}).limit(20).sort({ createdAt: -1 });
  }

  // --- 2. SERIALIZE DATA ---
  const plainUser = JSON.parse(JSON.stringify(user));
  const plainProducts = JSON.parse(JSON.stringify(products));

  return (
    <>
      <Nav user={plainUser} />
      
      {/* --- 3. PASS FILTERED PRODUCTS TO DASHBOARD --- */}
      <UserDashboard 
          user={plainUser} 
          products={plainProducts} 
          searchQuery={query} 
      />
    </>
  );
}

export default Home;