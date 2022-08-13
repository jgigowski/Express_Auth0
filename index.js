const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const mustacheExpress = require('mustache-express');
const path = require('path');
const { auth, requiresAuth } = require('express-openid-connect');
const { decode, verify, sign } = require("jws");
const dotenv = require("dotenv");
const app = express();
//var apicheck = require('./public/routes/apicheck.js')(app);
dotenv.config();
const PORT = process.env.PORT || 5050;
const templateDir = path.join(__dirname, 'public', 'views');
const frontendDir = path.join(__dirname, 'public', 'css');

//TODO:
//Copy in A0 setup
//network menu link to test
//

const config = {
    authRequired: false,
    auth0Logout: true
};

app.use(session({secret: process.env.SECRET}));//session
app.use(bodyParser.urlencoded({ extended: true }));//middleware for post requests

//oidc middleware
app.use(
    auth(config, 
    {
        authRequired: false
    })
);

//mustache config
app.use('/css', express.static(frontendDir));
app.engine('mustache', mustacheExpress());
app.set('view engine', 'mustache');
app.set('views', templateDir);

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));

app.get('/', (req, res) => {
    res.render('home', {
        isLoggedIn: req.oidc.isAuthenticated(),
        user: req.oidc.user
    });
});

app.get('/redirect_action', (req, res) => {
    //store values needed for response in session
    req.session.redirect_uri = req.query.redirect_uri;
    req.session.state = req.query.state;
    req.session.session_token = req.query.session_token;

    const secret = process.env.SESSION_TOKEN_SECRET;

    //console.log("incoming token: ", req.session.session_token);

    const verified = verify(req.session.session_token, 'HS256', secret);
    if(!verified) throw new Error("Incoming session token cannot be verified.");

    res.render('actionform', {

    });
});

app.post('/actionresponse', (req, res) => {
    const decoded = decode(req.session.session_token);
    const secret = process.env.SESSION_TOKEN_SECRET;

    const issuedAt = Math.floor(Date.now() / 1000);

    var sTerms = "";
    if(req.body.cTerms == "on"){
        sTerms = new Date().toISOString();
    }

    const payload =  {
        ...decoded.payload,
        state: req.session.state,
        iat: issuedAt,
        exp: issuedAt + (60 * 5), // five minutes
        other: {
            redirect_test_success_at: new Date().toISOString(),
            favoritevacation: req.body.tFavoriteVacation,
            markettingpreference: req.body.rMarkettingPreference,
            termsapprovedon: sTerms
        }
    }

    const responseToken = sign({
        header: {
            alg: 'HS256',
            typ: 'JWT',
        },
        encoding: 'utf-8',
        payload,
        secret,
    });

    console.log("sending back responseToken to Auth0: ", responseToken);

    res.redirect(`${req.session.redirect_uri}?state=${req.session.state}&session_token=${responseToken}`);
});

app.get('/config', requiresAuth(), (req, res) => {

    res.render('config', {
        isLoggedIn: req.oidc.isAuthenticated(),
        client_id: process.env.CLIENT_ID,
        appBaseUrl: process.env.BASE_URL,
        issuerBaseUrl: process.env.ISSUER_BASE_URL,
        port: process.env.PORT
    });
});

app.get('/profile', requiresAuth(), (req, res) => {

    //console.log('JSON.stringify(req.oidc.user) = ' + JSON.stringify(req.oidc.user));

    var accessToken = req.oidc.accessToken;
    if (typeof accessToken === 'undefined'){
        accessToken = 'Not Requested';
    }

    res.render('profile', {
        isLoggedIn: req.oidc.isAuthenticated(),
        user: req.oidc.user,
        lastupdated: new Date(req.oidc.user.updated_at).toLocaleString(),
        id_token: req.oidc.idToken,
        accessToken: accessToken
    });
});