var bodyParser = require('body-parser');
var express = require('express');
var app = express();
var xhub = require('express-x-hub');
var jsforce = require('jsforce');


app.set('port', (process.env.PORT || 5000));
app.listen(app.get('port'));

app.use(xhub({ algorithm: 'sha1', secret: process.env.APP_SECRET }));
app.use(bodyParser.json());

var token = process.env.TOKEN || 'token';
var received_updates = [];
var received_updates2 = [];

app.get('/', function(req, res) {
  console.log(req);
  res.send('<pre>' + JSON.stringify(received_updates2, null, 2) + '</pre>' + '<pre>' + JSON.stringify(received_updates, null, 2) + '</pre>');
});

app.get(['/facebook', '/instagram'], function(req, res) {
  if (
    req.query['hub.mode'] == 'subscribe' &&
    req.query['hub.verify_token'] == token
  ) {
    res.send(req.query['hub.challenge']);
  } else {
    res.sendStatus(400);
  }
});

app.post('/facebook', function(req, res) {
  console.log('Facebook request body:', req.body);

  if (!req.isXHubValid()) {
    console.log('Warning - request header X-Hub-Signature not present or invalid');
    res.sendStatus(401);
    return;
  }

  console.log('request header X-Hub-Signature validated');
  // Process the Facebook updates here
  received_updates.unshift(req.body);
  received_updates2 = req.body;
  res.sendStatus(200);

  var conn = new jsforce.Connection({
    oauth2 : {
      // you can change loginUrl to connect to sandbox or prerelease env.
      loginUrl : 'https://test.salesforce.com',
      clientId : '3MVG99VEEJ_Bj3.59zyuavq.GeuRs01dCd2FDWGc6grsKqBhj2WolvLYn53PAfSgzw4DNxHWKrDkXCZWqGYNZ',
      clientSecret : 'B342B22F60D960A0F693C7FFFB8F937913C2C54829B3F664FBBC30896DFCA1AE',
      redirectUri : 'https://fr1638910969386--dev.sandbox.lightning.force.com'
    }
  });
  var username = 'isifuentes@demo3.com.dev';
  var password = 'Freeway$2022';
  conn.login(username, password, function(err, userInfo) {
    console.log("attempting to auth salesforce");
    if (err) { return console.error(err); }
    // Now you can get the access token and instance URL information.
    // Save them to establish connection next time.
    console.log(conn.accessToken);
    console.log(conn.instanceUrl);
    // logged in user property
    console.log("User ID: " + userInfo.id);
    console.log("Org ID: " + userInfo.organizationId);
    
    //Salesforce comment insert.
    var body = JSON.stringify(received_updates2, null, 2);
    conn.apex.post("/InsertFBComment/", body, function(err, res) {
        if (err) { return console.error(err); }
        console.log("response: ", res);
        // the response object structure depends on the definition of apex class
      });
  });
});

app.post('/instagram', function(req, res) {
  console.log('Instagram request body:');
  console.log(req.body);
  // Process the Instagram updates here
  received_updates.unshift(req.body);
  received_updates2 = req.body;
  res.sendStatus(200);
});

app.listen();