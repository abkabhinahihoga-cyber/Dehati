const mongoose = require('mongoose');
const uri = "mongodb+srv://abkabhinahihoga_db_user:wDPqGEcMzwuKGpw5@cluster0.95fukca.mongodb.net/dehatisathi";

async function check() {
  await mongoose.connect(uri);
  const users = mongoose.connection.collection('users');
  const groceries = mongoose.connection.collection('groceries');
  const hubs = mongoose.connection.collection('hubs');
  
  const allUsers = await users.find({}).toArray();
  console.log("Total Users:", allUsers.length);
  
  const sellers = await users.find({ role: { $in: ['seller', 'hub'] } }).toArray();
  console.log("Total Sellers:", sellers.length);
  console.log("Approved Sellers:", sellers.filter(s => s.sellerStatus === 'approved').length);

  const allProducts = await groceries.find({}).toArray();
  console.log("Total Products:", allProducts.length);
  if(allProducts.length > 0) {
      console.log("Sample Product Seller ID:", allProducts[0].seller);
      console.log("Sample Product Hub ID:", allProducts[0].hub);
  }
  
  const allHubs = await hubs.find({}).toArray();
  console.log("Total Hubs:", allHubs.length);
  
  process.exit(0);
}
check();
