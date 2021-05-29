var express = require('express');
var multer=require('multer');
const bcrypt = require('bcrypt')
const { response } = require('../app');
var router = express.Router();
var ObjectId = require('mongodb').ObjectID;
const jwt = require('jsonwebtoken');


const storage=multer.diskStorage({
  destination:function(req,file,cb) {
    cb(null,"./public/static/media")
  },
  filename:function(req,file,cb)
  {
    console.log(file)
    cb(null,file.originalname)
  }
})


const upload=multer({storage:storage})
const Product=require('../service/productService');


const getTokenFrom = request => {
  const authorization = request.get('authorization')
  if (authorization && authorization.toLowerCase().startsWith('bearer ')) {
    return authorization.substring(7)
  }
  return null
}


router.get('/', function(req, res, next) {
    console.log("Getting products")
    Product.find({}).then(products=>res.json(products));
  });

router.post('/add',upload.single('productImage'),async function(req, res, next) {
  console.log(req.file)
  console.log(req.body)
  console.log("Adding product")
  const token = getTokenFrom(req)
  let path=req.file.path.substring(6)

   try {
   const decodedToken = jwt.verify(token, process.env.SECRET_ADMIN)
    const product=new Product({
      url:path,
      price:req.body.price,
      name:req.body.name,
      author:req.body.author,
      description:req.body.description
    });
    await product.save();
    res
        .status(200)
        .send({
          id:product.id,
          url:product.url,
          price:product.price,
          name:product.name,
          author:product.author,
          description:product.description
        });
  } catch (errorr) {
      return res.status(401).json({ error: 'you are not admin '+errorr })
  }
})

router.delete('/:id', async function(req, res, next) {
  const body = req.body
  console.log(req.params.id)
  const token = getTokenFrom(req)
  try {
    const decodedToken = jwt.verify(token, process.env.SECRET_ADMIN)
    const product=await Product.findById(ObjectId(req.params.id))
    console.log(product)
    product.delete()
    res.send('Product deleted succefull');
  } catch (errorr) {
      return res.status(401).json({ error: 'you are not admin '+errorr })
  }

});



module.exports = router;