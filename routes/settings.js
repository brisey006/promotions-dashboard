const express = require('express');
const router = express.Router();
const { isAdmin, isAuthenticated } = require('../config/auth');
const { authHeader } = require('../functions/auth');
const { getCurrentUrl } = require('../functions/general');

const addCurrencyOptions = {
    pageTitle: 'Add Currency',
    validationStatus: 'needs-validation'
}

router.get('/currencies', async (req, res, next) => {
    try {
        let currentUrl = getCurrentUrl(req.originalUrl, req.query.page);
        const response = await req.promotionsAxios.get(`/currencies`, { params: req.query });
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

        res.render('settings/currencies', {
            pageTitle: 'Currencies',
            data,
            currentUrl
        });
    } catch (e) {
        console.log(e.message);
        res.sendStatus(500);
    }
});

router.get('/currencies/add', (req, res) => {
    res.render('settings/add-currency', addCurrencyOptions);
});

router.post('/currencies/add', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const token = req.session.token;
        const response = await req.promotionsAxios.post('/currencies', req.body, { headers: authHeader(token) });
        const currency = response.data;
        res.render('settings/add-currency', {
            ...addCurrencyOptions,
            successMessage: `${currency.name} was successfully added.`
        });
    } catch (e) {
        if (e.response) {
            if (e.response.status == 406) {
                const errorContainer = JSON.parse(e.response.data.errors).reduce((acc, cur) => ({ ...acc, [cur.field]: cur.message }), {});
                res.render('settings/add-currency', {
                    ...addCurrencyOptions,
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

router.get('/currencies/delete/:acronym', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const token = req.session.token;
        const acronym = req.params.acronym;
        const deletedCurrency = await req.promotionsAxios.delete(`/currencies/${acronym}`, { headers: authHeader(token) });
        res.redirect('/settings/currencies');
    } catch (e) {
        console.log(e.message)
    }
});

module.exports = router; 