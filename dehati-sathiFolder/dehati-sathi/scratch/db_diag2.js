const mongoose = require('mongoose');
const connStr = 'mongodb+srv://abkabhinahihoga_db_user:wDPqGEcMzwuKGpw5@cluster0.95fukca.mongodb.net/dehatisathi';
mongoose.connect(connStr).then(async () => {
  const Hub = mongoose.model('Hub', new mongoose.Schema({ managerId: mongoose.Schema.Types.ObjectId, name: String }));
  const User = mongoose.model('User', new mongoose.Schema({ name: String, role: String, connectedHub: mongoose.Schema.Types.ObjectId }));
  const Grocery = mongoose.model('Grocery', new mongoose.Schema({ name: String, status: String, seller: mongoose.Schema.Types.ObjectId }));
  const MasterProduct = mongoose.model('MasterProduct', new mongoose.Schema({ name: String, isHubProduct: Boolean, isActive: Boolean }));

  const h = await Hub.findOne({ name: 'KNIT ' });
  console.log('Hub:', h);
  const manager = await User.findById(h.managerId);
  console.log('Manager:', manager);
  
  const connectedSellers = await User.find({ connectedHub: h._id, role: 'seller' });
  console.log('Sellers ids:', connectedSellers.map(s => s._id));

  const allTargetIds = [h.managerId, ...connectedSellers.map(s => s._id)];
  console.log('All Target IDs:', allTargetIds);

  const groceryProducts = await Grocery.find({ 
      seller: { $in: allTargetIds }
  });
  console.log('Groceries found with seller in allTargetIds:', groceryProducts.map(gp => ({ name: gp.name, seller: gp.seller, status: gp.status })));
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
