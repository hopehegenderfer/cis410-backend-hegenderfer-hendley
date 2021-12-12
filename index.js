const express = require('express');
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const db = require("./dbConnectExec.js")
const rockwellConfig = require('./config.js');

const auth = require("./middleware/authenticate")
const authorize = require("./middleware/authorize")

const app = express();

app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 5000;
app.listen(PORT, ()=>{
    console.log(`app is running on  port  ${PORT}`);
});

//azurewebsites.net

app.get("/hi",(req, res)=>{res.send("hello world");
});

app.get("/", (req,res) =>
{res.send("API is running");
});

app.post("/member/logout", auth, (req,res)=>{
  let query = `Update Member
  set token = null
  where userID = ${req.member.userID}`;
  
  db.executeQuery(query)
  .then(()=>{res.status(200).send()})
  .catch((err)=>{
console.log("error in POST /member/logout", err);
res.status(500).send;
  })
})

 app.get("/ratings/me", auth, async (req,res)=>{
//     //1 get member pk
        pk = req.member.userID;
//     //2 query the database for users records
        let insertQuery = `select * 
        from Rating
        LEFT JOIN Style 
    ON Style.StyleID = Rating.shoeFK
        where userID_FK = ${pk}`
//     //3 send users reviews back to them
        db.executeQuery(insertQuery)
            .then((theResults)=>{
        res.status(200).send(theResults)
            })
            .catch((myError)=>{
                console.log(myError);
        res.status(500).send();
            });
    })

 //post route for admin users to create a new shoe record
 app.post("/shoes", authorize, async (req,res)=>{
try {
    let name = req.body.name;
    let size = req.body.size;
    let cost = req.body.cost;
    let styleFK = req.body.styleFK;

    if( !name || !size || !cost || !styleFK ){ return res.status(400).
    send("Bad request")};

    name = name.replace("'","''");

    let insertQuery = `Insert into shoe (name,size,cost,styleFK)
    output inserted.name, inserted.size, inserted.cost, inserted.styleFK
    values('${name}', '${size}', '${cost}',  '${styleFK}')`;

   let insertedShoe = await db.executeQuery(insertQuery);
    res.status(201).send(insertedShoe[0]);
}
catch(err){
    console.log("error in POST /shoes", err);
    res.status(500).send();
}

})

//PATCH route for Admin to update a new shoe record
app.patch("/shoes/:pk", authorize, async (req,res)=>{
try{
    let pk = req.params.pk

    let name = req.body.name;
    let size = req.body.size;
    let cost = req.body.cost;
    let styleFK = req.body.styleFK;

    if( !name || !size || !cost || !styleFK ){ return res.status(400).
    send("Bad request")};

    name = name.replace("'","''");

    let insertQuery = 
    `update shoe
    set name = '${name}', size = '${size}', cost = '${cost}', styleFK = '${styleFK}'
    output inserted.name, inserted.size, inserted.cost, inserted.styleFK
    where shoeID = ${pk}`

   let updatedShoe =  await db.executeQuery(insertQuery)
    
    res.status(201).send(updatedShoe[0]);
}
    catch(err){
        console.log("error in POST /shoe", err);
        res.status(500).send();
    }
 })

//PATCH route for user to update their review
app.patch("/ratings/:pk", auth, async(req, res)=>{
   
    let pk = req.params.pk;
    let userID = req.member.userID;
    
    try{
        let review = req.body.review;
        let score = req.body.score;
        let shoeFK = req.body.shoeFK;

        if(!review || !score || !shoeFK || !Number.isInteger(score)){
            return res.status(400).send("bad request");
        }

        review = review.replace("'", "''");

        let insertQuery = `update rating
        set review = '${review}', score = '${score}', shoeFK = '${shoeFK}'
        output inserted.review, inserted.score, inserted.shoeFK
        where postID = ${pk} and userID_FK = ${userID}`;

        let insertedReview = await db.executeQuery(insertQuery);

        res.status(201).send(insertedReview[0]);

        if (!insertedReview[0]){return res.status(400).send("You cannot edit this review")};
    }
    catch(err){
        console.log("error in PATCH /ratings/:pk", err);
        res.status(500).send();
    }
})

//PATCH route for users to update their information
app.patch("/member/me", auth, async (req,res)=>{

    try{
    member = req.member;
    pk = req.member.userID;

    let firstName = req.body.firstName;
    let lastName = req.body.lastName;
    let email = req.body.email;
    let password = req.body.password;

    if(!firstName|| !lastName || !email || !password){ return res.status(400).
    send("Bad request")};

    firstName = firstName.replace("'","''");
    lastName = lastName.replace("'","''");

    let emailCheckQuery = `SELECT email
    from member
    where email = '${email}' and userID != ${pk}`;

    let existingUser = await db. executeQuery(emailCheckQuery);

    if (existingUser[0]){return res.status(409).send("duplicate email")};

    let hashedPassword = bcrypt.hashSync(password);

    let insertQuery = 
    `update Member
    set firstName = '${firstName}', lastName = '${lastName}', email ='${email}', password = '${hashedPassword}'
    output inserted.firstName, inserted.lastName, inserted.email, inserted.password
    where userID = ${member.userID}`

    updatedMember = await db.executeQuery(insertQuery)
    res.status(201).send(updatedMember[0])
}
    catch(err){
        console.log("error in PATCH/member/me/update", err);
        res.status(500).send();
    }
})


app.post("/ratings", auth, async (req,res)=>{
    try{
        let shoeFK = req.body.shoeFK;
        let review = req.body.review;
        let score = req.body.score;

        if(!shoeFK || !review || !score || !Number.isInteger(score)){
            return res.status(400).send("bad request");
        }

        review = review.replace("'", "''");

        let insertQuery = `insert into Rating (review, score, shoeFK, userID_FK)
        output inserted.postID, inserted.review, inserted.score, inserted.shoeFK, inserted.userID_FK
        values('${review}','${score}','${shoeFK}', ${req.member.userID})`;

        let insertedReview = await db.executeQuery(insertQuery);
        res.status(201).send(insertedReview[0]);
    }
    catch(err){
        console.log("error in POST /rating", err);
        res.status(500).send();
    }

})

app.get("/member/me",auth,(req,res)=>{
    res.send(req.member);
})


app.post("/member/login", async (req,res)=>{
    //console.log("/member/login called", req.body);

    //1.email validation
let email = req.body.email;
let password = req.body.password;

if(!email || !password){return res.status(400).send("bad request")};
    //2. check is user is in the database
let query = `select *
from Member
where email = '${email}'`

let result 
try{
    result = await db.executeQuery(query);
}catch(myError){
    console.log("error in /member/login", myError);
    return res.status(500).send();
}

if(!result[0]){
    return res.status(401).send("invalid user credentials");
}

    //3. check password

let user = result[0];

if(!bcrypt.compareSync(password, user.password)){
    return res.status(401).send("invalid user credentials");
}

    //4. generate token

let token = jwt.sign({pk:user.userID}, rockwellConfig.JWT, {
    expiresIn: "60 minutes",
});
console.log("token", token);

    //5. save token in database and send response back

let setTokenQuery = `update Member
set token = '${token}'
where userID = ${user.userID}`

try{
   await db.executeQuery(setTokenQuery);

   res.status(200).send({
       token: token,
       user: {
           firstName: user.firstName,
           lastName: user.lastName,
           email: user.email,
           userID: user.userID, 
       },
   });
}
catch(myError){
    console.log("error in a setting user token", myError);
    res.status(500).send()
}

});

app.post("/member", async (req, res)=>{

    let firstName = req.body.firstName;
    let lastName = req.body.lastName;
    let email = req.body.email;
    let password = req.body.password;

    if(!firstName|| !lastName || !email || !password){ return res.status(400).
    send("Bad request")};

    firstName = firstName.replace("'","''");
    lastName = lastName.replace("'","''");

    let emailCheckQuery = `SELECT email
    from member
    where email = '${email}'`;

    let existingUser = await db. executeQuery(emailCheckQuery);

    if (existingUser[0]){return res.status(409).send("duplicate email")};

    let hashedPassword = bcrypt.hashSync(password);

    let insertQuery = 
    `Insert into member (firstName,lastName,email,password)
    values('${firstName}', '${lastName}', '${email}', '${hashedPassword}')`

    db.executeQuery(insertQuery)
    .then(()=>{res.status(201).send()})
    .catch((err)=>{
        console.log("error in POST /member", err);
        res.status(500).send();
    })

})

app.get("/shoes", (req,res)=>{
    //get data from the database
    db.executeQuery(
    `select *
    from Shoe
    LEFT JOIN Style 
    ON Style.StyleID = Shoe.StyleFK`
    ).then((theResults)=>{
        res.status(200).send(theResults)
    })
    .catch((myError)=>{
        console.log(myError);
        res.status(500).send();
    });
});

app.get("/shoes/:pk", (req,res)=>{
    let pk = req.params.pk;
    let myQuery = `select *
    from Shoe
    LEFT JOIN Style 
    ON Style.StyleID = Shoe.StyleFK
    Where shoeID = ${pk}`

    db.executeQuery(myQuery)
    .then((result)=>{
        console.log("result",result);
      if(result[0]) {
          res.send(result[0]);
        }else{
            res.status(404).send(`bad request`);
        } 
    })
    .catch((err)=>{
        console.log("error in /shoe/:pk", err);
        res.status(500).send()
    });
});
