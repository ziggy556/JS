const express = require('express');
const routes = require('./routes');
const app = express();
const registry = require('./services/registry.json');
const PORT = process.env.PORT || 3000;
const helmet = require('helmet');

app.use(express.static('public'));
app.set('view engine', 'ejs');

app.use(express.json());
app.use(helmet());

app.get('/ui', (req,res) =>{
    res.render('index');
})

const auth = (req, res, next) => {
    const url = req.protocol + '://' + req.host + ':' + PORT + req.path;
    const authString = Buffer.from(req.headers.authorization, 'base64').toString('utf8');
    const authParts = authString.split(':');
    const [userName, password] = [authParts[0], authParts[1]];
    console.log(registry);
    const user = registry.auth.users[userName];
    if (user) {
        if (user.userName == userName && user.password == password) {
            next();
        }
        else {
            res.send({authenticated : false, path: url, message : 'Authorization unsuccessful : Incorrect password'});
        }
    } else {
        res.send({authenticated : false, path: url, message : 'Authorization unsuccessful : user ' + userName + ' does not exist'});
    }
}

app.use(auth);

app.use('/', routes);

app.listen(PORT, () => {
    console.log(`Server is running at ${PORT}`);
});