const express = require('express');
const router = express.Router();
const { authHeader } = require('../functions/auth');
const { isAdmin, isAuthenticated } = require('../config/auth');
const { getCurrentUrl } = require('../functions/general');

const createPageResources = {
    js: [
        "/assets/plugins/cleavejs/cleave.min.js",
        "/assets/plugins/cleavejs/addons/cleave-phone.zw.js",
        "/assets/js/app/create-page.js",
    ]
}

router.get('/', isAuthenticated, isAdmin, async (req, res, next) => {
    try {
        let currentUrl = getCurrentUrl(req.originalUrl, req.query.page);
        const response = await req.promotionsAxios.get(`/pages`, { params: req.query });
        let data = response.data;

        const docs = [];
        const { limit, page } = data;

        let initPoint = (limit * page) - limit;

        for (x of data.docs) {
            initPoint += 1;
            const newPage = { ...x, position: initPoint };
            docs.push(newPage);
        }

        data.docs = docs;

        res.render('pages/pages', {
            pageTitle: "Pages",
            data,
            currentUrl
        });
    } catch (e) {
        console.log(e.message);
        res.sendStatus(500);
    }
});

router.get('/create', (req, res) => {
    res.render('pages/create', {
        pageTitle: "Create Page",
        validationStatus: 'needs-validation',
        ...createPageResources
    });
});

router.post('/create', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const token = req.session.token;
        const response = await req.promotionsAxios.post('/pages', req.body, { headers: authHeader(token) });
        const page = response.data;
        res.redirect(`/pages/${page.slug}`);
    } catch (e) {
        if (e.response.status == 406) {
            const errorMessages = JSON.parse(e.response.data.errors).reduce((acc, cur) => ({ ...acc, [cur.field]: cur.message }), {});
            console.log(errorMessages);
            res.render('pages/create', {
                pageTitle: "Create Page",
                validationStatus: 'was-validated',
                ...errorMessages,
                ...req.body,
                ...createPageResources
            });
        } else {
            console.log(e.message)
            res.sendStatus(500);
        }
    }
});

router.get('/:slug', async (req, res, next) => {
    try {
        const token = req.session.token;
        const response = await req.promotionsAxios.get(`/pages/${req.params.slug}`, req.body, { headers: authHeader(token) });
        const page = response.data;

        res.render('pages/page', {
            pageTitle: page.name,
            page
        });
    } catch (e) {
        console.log(e.message);
    }
});

router.get('/change-display-picture/:slug', async (req, res, next) => {
    try {
        const token = req.session.token;
        const response = await req.promotionsAxios.get(`/pages/${req.params.slug}`, req.body, { headers: authHeader(token) });
        const page = response.data;
        res.render('pages/change-picture', {
            pageTitle: page.name,
            page
        });
    } catch (e) {
        console.log(e.message);
    }
});

const createPromotionParameters = async (req) => {
    const response = await req.promotionsAxios.get(`/pages/${req.params.slug}`);
    const page = response.data;
    return {
        page,
        pageTitle: 'Create Promotion',
        css: [
            "/assets/plugins/bootstrap-tagsinput/bootstrap-tagsinput.css"
        ],
        js: [
            "/assets/plugins/cleavejs/cleave.min.js",
            "/assets/js/app/create-promotion.js",
            "/assets/plugins/bootstrap-tagsinput/bootstrap-tagsinput.js"
        ]
    }
}

router.get('/:slug/create-promotion', async (req, res) => {
    try {
        const parameters = await createPromotionParameters(req);
        res.render('pages/create-promotion', {
            ...parameters
        });
    } catch (e) {
        console.log(e.message);
        res.sendStatus(500);
    }
});

router.post('/:slug/create-promotion', async (req, res) => {
    try {
        const token = req.session.token;
        const response = await req.promotionsAxios.post('/promotions', req.body, { headers: authHeader(token) });
        const promotion = response.data;
        res.redirect(`/promotions/${promotion.slug}`);
    } catch (e) {
        if (e.response) {
            if (e.response.status == 406) {
                const parameters = await createPromotionParameters(req);
                const errorContainer = JSON.parse(e.response.data.errors).reduce((acc, cur) => ({ ...acc, [cur.field]: cur.message }), {});
                res.render('pages/create-promotion', {
                    ...parameters,
                    errorContainer,
                    ...req.body
                });
            } else {
                console.log(e.message);
                res.sendStatus(500);
            }
        } else {
            console.log(e.message);
            res.sendStatus(500);
        }
    }
});

module.exports = router;