var express = require('express');
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
var router = express.Router();
var User=require('../service/userService');
var ObjectId = require('mongodb').ObjectID;


const getTokenFrom = request => {
  const authorization = request.get('authorization')

  if (authorization && authorization.toLowerCase().startsWith('bearer ')) {
    return authorization.substring(7)
  }
  return null
}

/* GET users listing. */
router.post('/login', async function(req, res, next) {

  const body = req.body

  const user = await User.findOne({ email: body.email })
  const passwordCorrect = user === null
    ? false
    : await bcrypt.compare(body.password, user.password)

  if (!(user && passwordCorrect)) {
    return res.status(401).json({
      error: 'invalid username or password'
    })
  }

  const userForToken = {
    email: user.email,
    id: user._id,
  }

  const token = user.type=="admin"?
  jwt.sign(userForToken, process.env.SECRET_ADMIN):
  jwt.sign(userForToken, process.env.SECRET);

  res
    .status(200)
    .send({ token,
       email: user.email, 
       name: user.name,
       type:user.type,
       comenzi:user.orders
      })

});
router.post('/register', async  function(req, res, next) {
  const body = req.body
  //ading a user
  const user1 = await User.findOne({ email: body.email })
  if (user1) {
    return res.status(401).json({
      error: 'username already exist'
    })
  }

  console.log(body) 

  const saltRounds = 10;
  
  const passwordHash = await bcrypt.hash(body.password, saltRounds)
  console.log(passwordHash)
  const user=new User({
    name:body.name,
    email:body.email,
    password:passwordHash,
    type:'normal',
    orders:[]
  })

  user.save().then(res=>{console.log('user add'+res)})

  const userForToken = {
    email: user.email,
    id: user._id,
  }
  const token =  jwt.sign(userForToken, process.env.SECRET);
  res
  .status(200)
  .send({
    token, 
     email: user.email, 
     name: user.name,
     type:user.type,
     comenzi:[]
    })
});


router.delete('/:id', async function(req, res, next) {
  const body = req.body
  console.log(req.params.id)
  const token = getTokenFrom(req)
  try {
    const decodedToken = jwt.verify(token, process.env.SECRET_ADMIN)
    const user=await User.findById(ObjectId(req.params.id))
    user.delete();
    res.send('User deleted succefull');
  } catch (errorr) {
      console.log(errorr)
      return res.status(401).json({ error: 'you are not admin '+errorr })
  }

});


router.post('/all', function(req, res, next) {
  const body = req.body
  const token = getTokenFrom(req)
  try {
    const decodedToken = jwt.verify(token, process.env.SECRET_ADMIN)
    User.find({}).then(users=>res.send(users));
    
  } catch (errorr) {
      return res.status(401).json({ error: 'you are not admin '+errorr })
  }
});


router.post('/order', async function(req, res, next) {
  const body = req.body
  const token = getTokenFrom(req)
  const decodedToken = jwt.verify(token, process.env.SECRET)
  if (!token || !decodedToken.id) {
    return res.status(401).json({ error: 'token missing or invalid' })
  }
  const user = await User.findById(decodedToken.id)
  user.orders=user.orders.concat(body.order);
  await user.save();
  res.send({
    comanda:body.order,
    id:user.orders[user.orders.length-1]._id
  });
});

router.post('/allOrders', async function(req, res, next) {
  const body = req.body
  const token = getTokenFrom(req)
  try {
    const decodedToken = jwt.verify(token, process.env.SECRET_ADMIN)
    let orders=[];
    await User.find({}).then(users=>users.map(el=>{
      if(el.orders.length>0)
      orders=[...orders,el.orders];
    }));
    res.send(orders);
  } catch (errorr) {
      return res.status(401).json({ error: 'you are not admin '+errorr })
  }
 
 
  
});

module.exports = router;
