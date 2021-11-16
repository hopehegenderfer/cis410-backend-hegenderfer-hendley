const bcrypt = require("bcryptjs");

let hashedPassword = bcrypt.hashSync("csu123");

console.log(hashedPassword);

let hashTest = bcrypt.compareSync("csu1234", hashedPassword);

console.log(hashTest);
