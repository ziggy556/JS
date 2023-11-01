const express = require('express');
const app  = express();
const PORT = process.env.PORT || 3001;
const HOST = 'localhost';
const axios = require('axios');

app.use(express.json());

app.get('/test', (req,res,next) =>{
    console.log('Welcome to test API');
    res.send('Welcome to test API');
})

app.listen(PORT, () =>{
    const authString = 'sajal:123456';
    const encodedAuthString = Buffer.from(authString, 'utf8').toString('base64');
    axios({
        method : 'POST',
        url : 'http://localhost:3000/register',
        headers : {
            'authorization' : encodedAuthString,
            'content-type' : 'application/json'
        },
        data : {
            apiName : 'testApi',
            host : HOST,
            protocol : 'http',
            port: PORT,
        }
    }).then((response) =>{
        console.log(response.data);
    }).catch(err =>{
        console.log(err);
    })
    console.log('Test API running at port ->' + PORT);
});