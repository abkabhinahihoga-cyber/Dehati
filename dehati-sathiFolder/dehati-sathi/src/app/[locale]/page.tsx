import React from "react";
import connectDb from "@/lib/db"; 
import User from "@/app/models/user.model";
import Grocery from "@/app/models/grocery.model"; 
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Nav from "@/components/Nav";
import UserDashboard from "@/components/UserDashboard";
import algoliaClient from "@/lib/algolia"; 
import { escapeRegex, getBestSearchQuery, getSearchVariants } from "@/lib/search-normalizer";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

async function Home(props: Props) {
  await connectDb();
  const session = await auth();

  if (!session?.user) {
    redirect("/landing");
  }

  const user = await User.findById(session.user.id).lean();
  if (!user) redirect("/login");

  const searchParams = await props.searchParams;
  const query = typeof searchParams.query === "string" ? searchParams.query : "";

  let products: any[] = [];

  if (query) {
      try {
          const algoliaQuery = getBestSearchQuery(query);
          const { results } = await algoliaClient.search({
              requests: [{ indexName: "products", query: algoliaQuery, hitsPerPage: 50 }]
          });
          const hits = (results[0] as any).hits;
          const objectIds = hits.map((hit: any) => hit.objectID);

          const hubId = (user as any).connectedHub;
          let dbQuery: any = { _id: { $in: objectIds } };
          if (hubId) {
            const hubSellers = await User.find({ connectedHub: hubId, role: "seller" }, "_id").lean();
            const sellerIds = (hubSellers as any[]).map((s: any) => s._id);
            dbQuery.seller = { $in: [...sellerIds, hubId] };
          }

          const dbProducts = await Grocery.find(dbQuery).lean();
          products = objectIds
            .map((id: string) => (dbProducts as any[]).find((p: any) => p._id.toString() === id))
            .filter(Boolean);

          if (products.length === 0) {
            const regexes = getSearchVariants(query).map((term) => new RegExp(escapeRegex(term), "i"));
            products = await Grocery.find({
                $or: [
                    { name: { $in: regexes } },
                    { category: { $in: regexes } },
                    { description: { $in: regexes } },
                    { unit: { $in: regexes } }
                ]
            }).limit(50).sort({ createdAt: -1 }).lean();
          }
      } catch (error) {
          console.error("Search error, falling back to regex:", error);
          const regexes = getSearchVariants(query).map((term) => new RegExp(escapeRegex(term), "i"));
          products = await Grocery.find({
              $or: [
                  { name: { $in: regexes } },
                  { category: { $in: regexes } },
                  { description: { $in: regexes } },
                  { unit: { $in: regexes } }
              ]
          }).limit(50).sort({ createdAt: -1 }).lean();
      }
  }

  const plainUser = JSON.parse(JSON.stringify(user));
  const plainProducts = JSON.parse(JSON.stringify(products));

  return (
    <>
      <Nav user={plainUser} />
      <UserDashboard 
          user={plainUser} 
          products={plainProducts} 
          searchQuery={query} 
      />
    </>
  );
}

export default Home;
