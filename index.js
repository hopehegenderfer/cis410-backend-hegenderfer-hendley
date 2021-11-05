const express = require("express");
const bcrypt = require("bcryptjs");

const db = require("./dbConnectExec.js");

const app = express();
app.use(express.json());

app.listen(5000, () => {
  console.log("app is running on port 5000");
});

app.get("/hi", (req, res) => {
  res.send("hello world");
});

app.get("/", (req, res) => {
  res.send("API is running");
});

// app.post();
// app.put();

app.post("/contacts", async (req, res) => {
  // res.send("/contacts called");

  // console.log("request body", req.body);

  let nameFirst = req.body.nameFirst;
  let nameLast = req.body.nameLast;
  let phoneNumber = req.body.phoneNumber;
  let address = req.body.address;
  let dob = req.body.dob;

  if (!nameFirst || !nameLast || !phoneNumber || !address || !dob) {
    return res.status(400).send("Bad request");
  }

  nameFirst = nameFirst.replace("'", "''");
  nameLast = nameLast.replace("'", "''");

  let phoneCheckQuery = `select PhoneNumber
  from contact
  where PhoneNumber = '${phoneNumber}'`;

  let existingUser = await db.executeQuery(phoneCheckQuery);

  // console.log("existing user", existingUser);

  if (existingUser[0]) {
    return res.status(409).send("Duplicate Phone Number");
  }

  let hashedLastName = bcrypt.hashSync(nameLast);

  let insertQuery = `insert into contact(NameFirst, NameLast, PhoneNumber, Address, DOB)
    values ('${nameFirst}', '${hashedLastName}', '${phoneNumber}', '${address}', '${dob}')`;

  db.executeQuery(insertQuery)
    .then(() => {
      res.status(201).send();
    })
    .catch((err) => {
      console.log("error in POST /contact", err);
      res.status(500).send();
    });
});

app.get("/orders", (req, res) => {
  //get data from the database
  db.executeQuery(
    `select *
  from [Order]
  left join barista
  on [order].EmployeeFK = barista.EmployeePK`
  )
    .then((theResults) => {
      res.status(200).send(theResults);
    })
    .catch((myError) => {
      console.log(myError);
      res.status(500).send();
    });
});

app.get("/orders/:pk", (req, res) => {
  let pk = req.params.pk;
  // console.log(pk);
  let myQuery = `select *
  from [Order]
  left join barista
  on [order].EmployeeFK = barista.EmployeePK
  where orderID = ${pk}`;

  db.executeQuery(myQuery)
    .then((result) => {
      // console.log("result", result);
      if (result[0]) {
        res.send(result[0]);
      } else {
        res.status(404).send("bad request");
      }
    })
    .catch((err) => {
      console.log("Error in /orders/:pk", err);
      res.status(500).send();
    });
});
