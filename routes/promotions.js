const express = require('express');
const router = express.Router();
const { isAuthenticated, isAdmin } = require('../config/auth');
const { authHeader } = require('../functions/auth');
const { promotionsAxios } = require('../functions/axios');
const { checkFile, prepareFormData, getCurrentUrl, appendImageUrlPrefix } = require('../functions/general');

const getPromotion = async (slug, axios) => {
    const response = await axios.get(`/promotions/${slug}?admin=true`);
    return response.data;
}

router.get('/', isAuthenticated, isAdmin, async (req, res, next) => {
    try {
        let currentUrl = getCurrentUrl(req.originalUrl, req.query.page);
        const response = await req.promotionsAxios.get(`/promotions/admin`, { params: req.query });
        let data = response.data;
        
        const deletedPromotion = req.session.deletedPromotion;
        const approvedPromotion = req.session.approvedPromotion;
        const disapprovedPromotion = req.session.disapprovedPromotion;

        req.session.deletedPromotion = undefined;
        req.session.approvedPromotion = undefined;
        req.session.disapprovedPromotion = undefined;

        const docs = [];
        const { limit, page } = data;

        let initPoint = (limit * page) - limit;

        for (x of data.docs) {
            initPoint += 1;
            const displayImage = appendImageUrlPrefix(x.displayImage);
            const newPage = { ...x, position: initPoint, displayImage };
            docs.push(newPage);
        }

        data.docs = docs;

        res.render('promotions/promotions', {
            pageTitle: "Promotions",
            data,
            currentUrl,
            deletedPromotion,
            approvedPromotion,
            disapprovedPromotion
        });
        
    } catch (e) {
        console.log(e.message);
        res.sendStatus(500);
    }
});

router.get('/:slug', async (req, res) => {
    try {
        const promotion = await getPromotion(req.params.slug, req.promotionsAxios);
        switch(promotion.step) {
            case 0:
                res.redirect(`/promotions/${promotion.slug}/set-picture`);
                break;
            case 1: 
                res.redirect(`/promotions/${promotion.slug}/prices`);
                break;
            default:
                res.render('promotions/promotion', {
                    pageTitle: promotion.title,
                    promotion
                });
        }
    } catch (e) {
        console.log(e.message);
        res.sendStatus(500);
    }
});

const changeImageResources = {
    css: ["/assets/plugins/dropzone/dropzone.css"],
    js: [
        "/assets/plugins/dropzone/dropzone.js",
        "/assets/js/app/change-promotion-picture.js"
    ]
}

router.get('/:slug/set-picture', async (req, res) => {
    try {
        const promotion = await getPromotion(req.params.slug, req.promotionsAxios);
        req.session.promotion = promotion;
        res.render('promotions/change-picture', {
            promotion,
            pageTitle: `Change ${promotion.title}'s picture`,
            ...changeImageResources
        });
    } catch (e) {
        console.log(e.message);
        res.sendStatus(500);
    }
});

router.post('/:slug/upload-picture', isAuthenticated, async (req, res) => {
    try {
        const reqFile = req.files;
        if (checkFile(reqFile)) {
            const token = req.session.token;
            const promotion = await getPromotion(req.params.slug, req.promotionsAxios);
            const { formData, formHeaders } = prepareFormData(reqFile.file, 'images/promotions', promotion.title, token);
            const imagesResponse = await req.storageAxios.post('/image', formData, { headers: formHeaders });
            const images = imagesResponse.data;

            //Update promotion images
            if (promotion.step == 0) {
                await req.promotionsAxios.put(`/promotions/${promotion.slug}`, { displayImage: images, step: 1 }, { headers: authHeader(token) });
            } else {
                await req.promotionsAxios.put(`/promotions/${promotion.slug}`, { displayImage: images }, { headers: authHeader(token) });
            }
            res.send("Display Picture Uploaded!");
        } else {
            res.status(406).send("Please select an image to upload.");
        }
    } catch (e) {
        console.log(e.message);
        res.sendStatus(500);
    }
});

router.get('/delete/:slug', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const token = req.session.token;
        const response = await req.promotionsAxios.delete(`/promotions/${req.params.slug}`, { headers: authHeader(token) });
        req.session.deletedPromotion = response.data;
        res.redirect('/promotions');
    } catch (e) {
        console.log(e.message);
        res.sendStatus(500);
    }
});

const pricesParameters = async (promotionsAxios, slug) => {
    const currenciesResponse = await promotionsAxios.get('/currencies?limit=100');
    const currencies = currenciesResponse.data.docs;

    const promotion = await getPromotion(slug, promotionsAxios);

    const pricesResponse = await promotionsAxios.get(`/promotions/${slug}/prices`);
    const prices = pricesResponse.data;

    return {
        pageTitle: `${promotion.title} Prices`,
        currencies,
        data: prices,
        promotionObject: promotion,
        js: [
            "/assets/plugins/cleavejs/cleave.min.js",
            "/assets/js/app/prices.js",
        ]
    }
}

router.get('/:slug/prices', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const parameters = await pricesParameters(req.promotionsAxios, req.params.slug);
        const deletedPrice = req.session.deletedPrice;
        req.session.deletedPrice = undefined;
        res.render('promotions/prices', {
            ...parameters,
            deletedPrice
        });
    } catch (e) {
        console.log(e.message);
        res.sendStatus(500);
    }
});

router.post('/:slug/prices', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const token = req.session.token;
        await req.promotionsAxios.post(`/promotions/${req.params.slug}/add-price`, req.body, { headers: authHeader(token) });
        const parameters = await pricesParameters(req.promotionsAxios, req.params.slug);
        res.render('promotions/prices', {
            ...parameters,
            successMessage: "A promotion price was added successfully."
        });
    } catch (e) {
        if (e.response) {
            if (e.response.status == 406) {
                const errorContainer = JSON.parse(e.response.data.errors).reduce((acc, cur) => ({ ...acc, [cur.field]: cur.message }), {});
                console.log(errorContainer)
                const parameters = await pricesParameters(req.promotionsAxios, req.params.slug);
                res.render('promotions/prices', {
                    ...parameters,
                    ...req.body,
                    errorContainer
                });
            } else {
                console.log(e.message)
                res.sendStatus(500);
            }
        } else {
            console.log(e.message)
            res.sendStatus(500);
        }
    }
});

router.get('/delete-price/:slug/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const token = req.session.token;
        const deletedResponse = await req.promotionsAxios.delete(`/prices/${req.params.id}`, { headers: authHeader(token) });
        const deletedPrice = deletedResponse.data;
        req.session.deletedPrice = deletedPrice;
        res.redirect(`/promotions/${req.params.slug}/prices`);
    } catch (e) {
        console.log(e.message);
        res.sendStatus(500);
    }
});

router.get('/:slug/finish', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const token = req.session.token;
        await req.promotionsAxios.put(`/promotions/${req.params.slug}`, { step: 2 }, { headers: authHeader(token) });
        res.redirect(`/promotions/${req.params.slug}`);
    } catch (e) {
        console.log(e.message);
        res.sendStatus(500);
    }
});

router.get('/:slug/approve', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const token = req.session.token;
        const response = await promotionsAxios(req).put(`/promotions/${req.params.slug}/approve`, { approved: true }, { headers: authHeader(token) });
        req.session.approvedPromotion = response.data;
        res.redirect('/promotions');
    } catch (e) {
        console.log(e.message);
        res.sendStatus(500);
    }
});

router.get('/:slug/disapprove', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const token = req.session.token;
        const response = await promotionsAxios(req).put(`/promotions/${req.params.slug}/approve`, { approved: false }, { headers: authHeader(token) });
        req.session.disapprovedPromotion = response.data;
        res.redirect('/promotions');
    } catch (e) {
        console.log(e.message);
        res.sendStatus(500);
    }
});

module.exports = router; 