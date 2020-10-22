const express = require('express');
const { isAuthenticated } = require('../config/auth');
const router = express.Router();

router.get('/', isAuthenticated, (req, res) => {
    res.render('index', {
        pageTitle: "Home",
        css: [
            "/assets/plugins/jqvmap/jquery-jvectormap-2.0.2.css",
            "/assets/plugins/daterangepicker/daterangepicker.css",
            "/assets/plugins/chartist/chartist.css"
        ],
        js: [
            "/assets/plugins/daterangepicker/daterangepicker.js",
            "/assets/plugins/jqvmap/jquery-jvectormap-2.0.2.min.js",
            "/assets/plugins/jqvmap/gdp-data.js",
            "/assets/plugins/jqvmap/maps/jquery-jvectormap-world-mill-en.js",
            "/assets/plugins/chartist/chartist.js",
            "/assets/plugins/apex-chart/apexcharts.min.js",
            "/assets/plugins/apex-chart/irregular-data-series.js",
            "/assets/plugins/flot/jquery.flot.js",
            "/assets/plugins/flot/jquery.flot.pie.js",
            "/assets/plugins/flot/jquery.flot.resize.js",
            "/assets/plugins/flot/sampledata.js",
            "/assets/js/dashboard/sales-dashboard-init.js"
        ]
    });
});

module.exports = router;