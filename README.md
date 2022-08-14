# Express_Auth0
 
Setup Instructions
1. App Setup - Update the ENV file with details about the Auth0 tenant and App
2. Auth0 Tenant - Integrate the app into Auth0 tenant and create an Action in the Login Flow with the below code
3. Create 2 Action Secrets - You can see them in the action code comment below

ENV file
<pre>
SESSION_TOKEN_SECRET variables must match (Action Secret and ENV variable)
SESSION_TOKEN_SECRET = '???'

SECRET variable can be anything
SECRET = 'a long, randomly-generated string stored in env'

BASE_URL is the app url
BASE_URL = 'http://localhost:5050'

CLIENT_ID comes from the AUth0 app integration
CLIENT_ID = '???'

ISSUER_BASE_URL is the Auth0 url
ISSUER_BASE_URL = 'https://???.us.auth0.com' or similar

PORT of the app
PORT = '5050'
</pre>

Action Code
<pre>
/**
* Handler that will be called during the execution of a PostLogin flow.

* SESSION_TOKEN_SECRET = '???'
* FORM_URL = http://???/redirect_action

*/
exports.onExecutePostLogin = async (event, api) => {
  if(event.client.name !== "express_Auth0"){
    console.log('Redirect Action not supported for App - '+ event.client.name +'. Skipping.');
    return;
  }

  if (!event.secrets.SESSION_TOKEN_SECRET || !event.secrets.FORM_URL) {
    console.log('Missing required configuration. Skipping.');
    return;
  }
  
  const sessionToken = api.redirect.encodeToken({
    secret: event.secrets.SESSION_TOKEN_SECRET,
    payload: {
      iss: `https://${event.request.hostname}/`,
    },
  });

  api.redirect.sendUserTo(event.secrets.FORM_URL, {
    query: {
      session_token: sessionToken,
      redirect_uri: `https://${event.request.hostname}/continue`,
    },
  });
};

exports.onContinuePostLogin = async (event, api) => {
  let decodedToken;
  try {
    decodedToken = api.redirect.validateToken({
      secret: event.secrets.SESSION_TOKEN_SECRET,
      tokenParameterName: 'session_token',
    });
  } catch (error) {
    console.log(error.message);
    return api.access.deny('Error occurred during redirect.');
  }

  const customClaims = decodedToken.other;

  for (const [key, value] of Object.entries(customClaims)) {
    api.user.setUserMetadata(key, value);
  }
};
</pre>
