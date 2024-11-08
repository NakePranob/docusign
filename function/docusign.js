const docusign = require('docusign-esign');
const fs = require('fs');
const path = require('path');

async function checkToken(req) {
    if (req.session.access_token && req.session.expires_at > Date.now()) {
        console.log("re-using access token", req.session.access_token);
    } else {
        console.log("getting new access token");
        let dsApiClient = new docusign.ApiClient();
        dsApiClient.setBasePath(process.env.BASE_PATH_DEMO);
        const privateKeyPath = path.join(__dirname, '../', 'private.key');
        const results = await dsApiClient.requestJWTUserToken(
            process.env.INTEGRATION_KEY, 
            process.env.USER_ID, 
            "signature", 
            fs.readFileSync(privateKeyPath, 'utf8'), 
            3600
        );
        console.log(results.body);
        req.session.access_token = results.body.access_token;
        req.session.expires_at = Date.now() + (results.body.expires_in - 60) * 1000;
    }
}

function getEnvelopesApi(req) {
    let dsApiClient = new docusign.ApiClient();
    dsApiClient.setBasePath(process.env.BASE_PATH_DEMO);
    dsApiClient.addDefaultHeader('Authorization', 'Bearer ' + req.session.access_token);
    return new docusign.EnvelopesApi(dsApiClient);
}

function makeEnvelope(templateId, email, name, role, tabDataArray=[]) {
    let env = new docusign.EnvelopeDefinition();
    env.templateId = templateId;

    if (!Array.isArray(tabDataArray)) {
        throw new Error("tabDataArray should be an array");
    }

    let textTabs = tabDataArray.map(data => {
        return docusign.Text.constructFromObject({
            tabLabel: data.tabLabel,
            value: data.value
        });
    });

    let tabs = docusign.Tabs.constructFromObject({
        textTabs: textTabs
    });

    const templateRole = new docusign.TemplateRole();
    templateRole.name = name;
    templateRole.email = email;
    templateRole.roleName = role;
    templateRole.tabs = tabs;
  
    env.templateRoles = [templateRole];
    env.status = 'sent';

    return env;
}

module.exports = {
    checkToken,
    getEnvelopesApi,
    makeEnvelope,
};