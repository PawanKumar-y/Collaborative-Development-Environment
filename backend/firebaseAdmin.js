const admin = require("firebase-admin/app");
const { cert } = require("firebase-admin/app");

const serviceAccount = require(
   "./collaborative-online-editor-firebase-adminsdk-fbsvc-09abb8547a.json"
);

admin.initializeApp({
    credential: cert(serviceAccount)
});

module.exports = admin;