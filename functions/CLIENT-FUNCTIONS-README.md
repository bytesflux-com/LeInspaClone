# Client Management backend (ADM-010 → ADM-019)

Extract this zip into your project root (the folder that contains `functions/`).

Changed files : functions/src/index.js, functions/src/accessModel.js, functions/src/dashboard.js
New files     : functions/src/clients/*.js, functions/firestore.indexes.clients.json

Then:  cd functions && firebase deploy --only functions
       (merge firestore.indexes.clients.json into firestore.indexes.json, deploy indexes)
In the admin app set  VITE_USE_MOCK_CLIENTS=false  to use these functions.
Sign in once as an admin after deploying: CATALOG_VERSION is 2, which writes the new permissions
(users.export, users.reveal_pii, memberships.manage). Give them to roles in admin_roles as needed.

Field names are in ONE place: the `F` map and CLIENT_FIELD at the top of src/clients/common.js.
