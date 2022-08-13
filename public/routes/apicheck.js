module.exports = function(app){

    var jwt = require('express-jwt');
    var jwtAuthz = require('express-jwt-authz');
    var jwksRsa = require('jwks-rsa');
    
    const authorizeAccessToken = jwt({
       secret: jwksRsa.expressJwtSecret({
           cache:true,
           rateLimit:true,
           jwksRequestPerMinute:5,
           jwksUri: `https://${process.env.ISSUER_BASE_URL}/.well-known/jwks.json`
       }),
       audience:'https://example-api.com/api',
       issuer: `https://${process.env.ISSUER_BASE_URL}/`,
       algorithms:["RS256"]
    });
    
    const checkPermissions = jwtAuthz(["read:messages"], {
       customScopeKey: "permissions"
    });
    
    app.get("/api/public", (req, res) => {
       res.send({
           msg: "You called the public endpoint!"
       });
    });
    
    app.get("/api/protected", authorizeAccessToken,(req, res) => {
       res.send({
           msg: "You called the protected endpoint!"
       });
    });
    
    app.get("/api/role", authorizeAccessToken, checkPermissions, (req, res) => {
       res.send({
           msg: "You called the role endpoint!"
       });
    });
}