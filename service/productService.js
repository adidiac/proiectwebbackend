const mongoose = require('mongoose')

const productSchema=new mongoose.Schema({
    url:String,
    price:Number,
    name:String,
    author:String,
    description:String
});

productSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString()
    delete returnedObject._id
    delete returnedObject.__v
  }
})

const Product = mongoose.model('Product', productSchema);

module.exports = Product