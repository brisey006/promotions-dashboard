const express = require('express');
const FormData = require('form-data');
const { isAuthenticated } = require('../config/auth');
const { authHeader } = require('../functions/auth');
const { addImagesRootUrl } = require('../functions/user');
const { checkFile } = require('../functions/general');

const router = express.Router();

router.get('/login', (req, res) => {
    res.render('login', {
        layout: 'auth',
        pageTitle: 'Login'
    });
});

router.get('/register', (req, res) => {
    res.render('register', {
        layout: 'auth',
        pageTitle: 'Register'
    });
});

router.get('/confirmation-sent', (req, res) => {
    res.render('confirmation-sent', {
        layout: 'auth',
        pageTitle: 'Confirmation sent',
        userId: req.session.userId,
        resent: req.session.resent
    });
});

router.get('/verify', async (req, res) => {
    try {
        const token = req.query.token;
        const result = await req.authAxios.get(`/verify?token=${token}`);
        res.render('confirmed', {
            layout: 'auth',
            pageTitle: 'Confirmed',
        });
    } catch (e) {
        if (e.response.status == 406) {
            res.render('verification-error', {
                layout: 'auth',
                pageTitle: 'Promotions | An error occurred',
                linkExpired: true
            });
        } 
    }
});

router.post('/request-verification-link', async (req, res) => {
    try {
        const email = req.body.email;
        if (!email) {
            res.render('verification-error', {
                layout: 'auth',
                pageTitle: 'An error occurred',
                authErrors: ["Please provide your email to continue"]
            });
        } else {
            const response = await req.authAxios.post('/request-verification-token', { email });
            const { _id } = response.data;
            req.session.userEmail = email;
            req.session.userId = _id;
            res.redirect('/confirmation-sent');
        }
    } catch (e) {
        console.log(e.message);
        if (e.response.status == 406) {
            res.render('verification-error', {
                layout: 'auth',
                pageTitle: 'An error occurred',
                accountVerified: true
            });
        } else {
            res.sendStatus(500);
        }
    }
});

router.get('/resend-verification/:id', async (req, res) => {
    try {
        const id = req.params.id;
        req.session.userId = id;
        const response = await req.authAxios.get(`/request-verification-token/${id}`);
        const { _id, email } = response.data;
        req.session.userEmail = email;
        req.session.userId = _id;
        req.session.resent = true;
        res.redirect('/confirmation-sent');
    } catch (e) {
        console.log(e.message);
        if (e.response.status == 406) {
            res.render('verification-error', {
                layout: 'auth',
                pageTitle: 'An error occurred',
                accountVerified: true
            });
        } else {
            res.sendStatus(500);
        }
    }
});

router.post('/register', async (req, res) => {
    try {
        const result = await req.authAxios.post(`/`, req.body);
        req.session.userEmail = result.data.email;
        req.session.userId = result.data._id;
        res.redirect('/confirmation-sent');
    } catch (e) {
        console.log(e.response.data.errors);
        res.render('register', {
            layout: 'auth',
            register: true,
            authErrors: JSON.parse(e.response.data.errors), 
            formFields: req.body
        });
    }
});

router.post('/login', async (req, res) => {
    try {
        const response = await req.authAxios.post('/login', req.body);
        if (response.data.isVerified) {
            const refreshToken = response.data.refreshToken;
            const url = req.session.urlTo == undefined ? '/' : req.session.urlTo;
            res.cookie('user', refreshToken)
            .redirect(url);
        } else {
            req.session.userId = response.data._id;
            res.redirect('/confirmation-sent');
        }
    } catch (e) {
        console.log(e.response.data.errors);
        res.render('login', {
            layout: 'auth',
            authErrors: JSON.parse(e.response.data.errors), 
            formFields: req.body
        });
    }
});

router.get('/logout', async (req, res) => {
    try {
        const token = req.session.token;
        await req.authAxios.delete('/logout', { headers: authHeader(token) });
        req.session.token = null;
        req.session.user = null;
        req.app.locals.user = null;
        res.cookie('user', '', { maxAge: 0 }).redirect('/');
    } catch (e) {
        console.log(e.message);
        res.sendStatus(500);
    }
});

router.get('/my-profile', async (req, res) => {
    try {
        res.render('profile/my-profile', {
            pageTitle: "My Profile"
        });
    } catch (e) {
        console.log(e.message);
        res.sendStatus(500);
    }
});

router.get('/change-display-picture', (req, res) => {
    res.render('profile/change-picture', {
        pageTitle: "Change Display Picture",
        css: ["/assets/plugins/dropzone/dropzone.css"],
        js: [
            "/assets/plugins/dropzone/dropzone.js",
            "/assets/js/app/change-picture.js"
        ]
    });
});

router.post('/upload-display-picture', isAuthenticated, async (req, res) => {
    console.log(req.user);
    try {
        const reqFile = req.files;
        if (checkFile(reqFile)) {
            const mimeType = reqFile.file.mimetype;
            const formData = new FormData();
            const token = req.session.token;

            formData.append('imagePath', 'images/user');
            formData.append('title', `${req.user.firstName} ${req.user.lastName}`);
            formData.append('file', reqFile.file.data);
            formData.append('extension', mimeType.substring(mimeType.indexOf('/') + 1, mimeType.length));

            const formHeaders = {
                ...authHeader(token),
                ...formData.getHeaders()
            };

            const images = await req.storageAxios.post('/image', formData, { headers: formHeaders });
            const updateResponse = await req.authAxios.put('/update', { displayImage: images.data }, { headers: authHeader(token) });
            const updatedUser = addImagesRootUrl(updateResponse.data);
            req.session.user = updatedUser;
            req.app.locals.user = updatedUser;
            res.send("Display Picture Uploaded!");
        } else {
            res.status(406).send("Please select an image to upload.");
        }
    } catch (e) {
        console.log(e.message);
        res.sendStatus(500);
    }
});

module.exports = router;