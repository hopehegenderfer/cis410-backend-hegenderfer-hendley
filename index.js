const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const db = require("./dbConnectExec.js");
const rockwellConfig = require("./config.js");

const auth = require("./middleware/authenticate");
const app = express();

app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`app is running on  port  ${PORT}`);
});

//azurewebsites.net

app.get("/hi", (req, res) => {
  res.send("hello world");
});

app.get("/", (req, res) => {
  res.send("API is running");
});

app.post("/member/logout", auth, (req, res) => {
  let query = `Update Member
  set token = null
  where userID = ${req.member.userID}`;

  db.executeQuery(query)
    .then(() => {
      res.status(200).send();
    })
    .catch((err) => {
      console.log("error in POST /member/logout", err);
      res.status(500).send;
    });
});

app.get("/reviews/me", auth, async (req, res) => {
  //     //1 get member pk
  //     //2 query the database for users records
  //     //3 send users reviews back to them
});

app.post("/ratings", auth, async (req, res) => {
  try {
    let shoeFK = req.body.shoeFK;
    let review = req.body.review;
    let score = req.body.score;

    if (!shoeFK || !review || !score || !Number.isInteger(score)) {
      return res.status(400).send("bad request");
    }

    review = review.replace("'", "''");
    //console.log("here is the member", req.member);

    let insertQuery = `insert into Rating (review, score, shoeFK, userID_FK)
        output inserted.postID, inserted.review, inserted.score, inserted.shoeFK, inserted.userID_FK
        values('${review}','${score}','${shoeFK}', ${req.member.userID})`;

    let insertedReview = await db.executeQuery(insertQuery);
    // console.log("inserted review", insertedReview);
    //res.send("here is the response");
    res.status(201).send(insertedReview[0]);
  } catch (err) {
    console.log("error in POST /rating", err);
    res.status(500).send();
  }
});

app.get("/member/me", auth, (req, res) => {
  res.send(req.member);
});

app.post("/member/login", async (req, res) => {
  //console.log("/member/login called", req.body);

  //1.email validation
  let email = req.body.email;
  let password = req.body.password;

  if (!email || !password) {
    return res.status(400).send("bad request");
  }
  //2. check is user is in the database
  let query = `select *
from Member
where email = '${email}'`;

  let result;
  try {
    result = await db.executeQuery(query);
  } catch (myError) {
    console.log("error in /member/login", myError);
    return res.status(500).send();
  }

  //console.log("result", result);

  if (!result[0]) {
    return res.status(401).send("invalid user credentials");
  }

  //3. check password

  let user = result[0];

  if (!bcrypt.compareSync(password, user.password)) {
    return res.status(401).send("invalid user credentials");
  }

  //4. generate token

  let token = jwt.sign({ pk: user.userID }, rockwellConfig.JWT, {
    expiresIn: "60 minutes",
  });
  console.log("token", token);
  //5. save token in database and send response back
  let setTokenQuery = `update Member
set token = '${token}'
where userID = ${user.userID}`;

  try {
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
  } catch (myError) {
    console.log("error in a setting user token", myError);
    res.status(500).send();
  }
});

app.post("/member", async (req, res) => {
  // res.send("/member called");

  //console.log("request body", req.body)

  let firstName = req.body.firstName;
  let lastName = req.body.lastName;
  let email = req.body.email;
  let password = req.body.password;

  if (!firstName || !lastName || !email || !password) {
    return res.status(400).send("Bad request");
  }

  firstName = firstName.replace("'", "''");
  lastName = lastName.replace("'", "''");

  let emailCheckQuery = `SELECT email
    from member
    where email = '${email}'`;

  let existingUser = await db.executeQuery(emailCheckQuery);

  //console.log("existing user", existingUser);

  if (existingUser[0]) {
    return res.status(409).send("duplicate email");
  }

  let hashedPassword = bcrypt.hashSync(password);

  let insertQuery = `Insert into member (firstName,lastName,email,password)
    values('${firstName}', '${lastName}', '${email}', '${hashedPassword}')`;

  db.executeQuery(insertQuery)
    .then(() => {
      res.status(201).send();
    })
    .catch((err) => {
      console.log("error in POST /member", err);
      res.status(500).send();
    });
});

app.get("/shoes", (req, res) => {
  //get data from the database
  db.executeQuery(
    `select *
    from Shoe
    LEFT JOIN Style 
    ON Style.StyleID = Shoe.StyleID_FK`
  )
    .then((theResults) => {
      res.status(200).send(theResults);
    })
    .catch((myError) => {
      console.log(myError);
      res.status(500).send();
    });
});

app.get("/shoes/:pk", (req, res) => {
  let pk = req.params.pk;
  //console.log(pk);
  let myQuery = `select *
    from Shoe
    LEFT JOIN Style 
    ON Style.StyleID = Shoe.StyleID_FK
    Where shoeID = ${pk}`;

  db.executeQuery(myQuery)
    .then((result) => {
      console.log("result", result);
      if (result[0]) {
        res.send(result[0]);
      } else {
        res.status(404).send(`bad request`);
      }
    })
    .catch((err) => {
      console.log("error in /shoe/:pk", err);
      res.status(500).send();
    });
});
