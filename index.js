const express = require('express');

const app = express();

app.listen(5000, ()=>{
    console.log(`app is running on  port  5000`);
});

app.get("/hi",(req, res)=>{res.send("hello world");
});

app.get("/", (req,res) =>
{res.send("API is running");
});