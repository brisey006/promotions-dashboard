const express = require('express');
const { isAuthenticated, isAdmin } = require('../config/auth');
const { addImagesRootUrl } = require('../functions/user');
const { authHeader } = require('../functions/auth');
const router = express.Router();

router.get('/', isAuthenticated, isAdmin, async (req, res, next) => {
    try {
        const token = req.session.token;
        const response = await req.authAxios.get('/');
        const users = response.data;
        const docs = [];
        for (u of users.docs) {
            let user = u;
            const adminResponse = await req.authAxios.get(`/admins/user/${user._id}`, { headers: authHeader(token) });
            if (adminResponse.data != null) {
                user = { ...user, isAdmin: true };
            } else {
                user = { ...user, isAdmin: false };
            }
            if (user.displayImage != undefined) {
                docs.push(addImagesRootUrl(user));
            } else {
                docs.push(user);
            }
        }
        
        res.render('users/users', {
            pageTitle: "Users",
            users: { ...users, docs }
        });
    } catch (e) {
        console.log(e.message);
        res.sendStatus(500);
    }
});

module.exports = router;