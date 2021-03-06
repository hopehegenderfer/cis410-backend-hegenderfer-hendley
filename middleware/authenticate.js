const jwt = require("jsonwebtoken");

const db = require("../dbConnectExec.js")
const rockwellConfig = require("../config.js");

const auth = async(req,res,next)=>{
    // console.log("in the middlewere", req.header("Authorization"));
    // next();

  try{

    //1 decode token

    let myToken = req.header("Authorization").replace("Bearer ","");
    //console.log("token", myToken);

    let decoded = jwt.verify(myToken, rockwellConfig.JWT);
    console.log(decoded);

   let userID = decoded.pk;

    //2 compare token with database
    let query = `select userID, firstName, lastName, Email
    from Member
    where userID = ${userID} and token = '${myToken}'`;

    let returnedUser = await db.executeQuery(query);
    console.log("returned user", returnedUser)

    //3 save user info in the request
    if(returnedUser[0]){
      req.member = returnedUser[0];
      next();
    }
    else{
      return res.status(401).send("invalid credentials");
    }

  }
  catch(err){
      console.log(err);
      return res.status(401).send("invalid credentials");
    }
  }
module.exports = auth;