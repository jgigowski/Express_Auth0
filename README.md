# Express_Auth0
 
Setup Instructions
1. App Setup - Update the ENV file for your Auth0 tenant and app details
2. Auth0 Tenant - Integrate the app into Auth0 tenant and create an Action in the Login Flow with the following code
3. Create 2 Action Secrets - You can see them in the action code comment below

<pre>
/**
* Handler that will be called during the execution of a PostLogin flow.

* SESSION_TOKEN_SECRET = 'SESSION_TOKEN_SECRET'
* FORM_URL = http://localhost:5050/redirect_action

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
