const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');
const dotenv = require('dotenv');
dotenv.config();

// function
const docusign = require('./function/docusign');

const app = express();
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    secret: 'sd451sdaJSMdsfN12',
    resave: true,
    saveUninitialized: true
}))

app.post('/send-document', async (req, res) => {
    await docusign.checkToken(req);

    let envelopesApi = docusign.getEnvelopesApi(req);

    for (const data of req.body) {
        let envelope = docusign.makeEnvelope(data.templateId, data.email, data.name, data.role, data.tabData);
        let envelopeResults = await envelopesApi.createEnvelope(
            process.env.ACCOUNT_ID, { envelopeDefinition: envelope }
        );

        console.log("Envelope created:", envelopeResults);
    }

    res.json('success');
});

app.listen(8000, () => {
    console.log("server has started", process.env.USER_ID);
})