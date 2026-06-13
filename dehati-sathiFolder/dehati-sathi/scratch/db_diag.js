const mongoose = require('mongoose');
const connStr = 'mongodb+srv://abkabhinahihoga_db_user:wDPqGEcMzwuKGpw5@cluster0.95fukca.mongodb.net/dehatisathi';
mongoose.connect(connStr).then(async () => {
  const Hub = mongoose.model('Hub', new mongoose.Schema({ managerId: mongoose.Schema.Types.ObjectId, name: String }));
  const User = mongoose.model('User', new mongoose.Schema({ name: String, role: String, connectedHub: mongoose.Schema.Types.ObjectId }));
  const Grocery = mongoose.model('Grocery', new mongoose.Schema({ name: String, status: String, seller: mongoose.Schema.Types.ObjectId }));
  const MasterProduct = mongoose.model('MasterProduct', new mongoose.Schema({ name: String, isHubProduct: Boolean, isActive: Boolean }));

  const hubs = await Hub.find({});
  console.log('Hubs:', hubs);
  for (const h of hubs) {
     const manager = await User.findById(h.managerId);
     console.log('Hub manager:', manager ? manager.name : 'Unknown', 'role:', manager ? manager.role : '', 'id:', h.managerId);
     const connectedSellers = await User.find({ connectedHub: h._id, role: 'seller' });
     console.log('Connected Sellers:', connectedSellers.map(s => ({ name: s.name, id: s._id })));
     
     const hubManagerId = h.managerId;
     const sellerIds = connectedSellers.map(s => s._id);
     const allIds = [hubManagerId, ...sellerIds];
     const groceries = await Grocery.find({ seller: { $in: allIds } });
     console.log('Groceries count:', groceries.length);
     console.log('Groceries:', groceries.map(g => ({ name: g.name, seller: g.seller, status: g.status })));
  }
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
