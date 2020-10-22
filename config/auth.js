const { authHeader } = require('../functions/auth');

module.exports = {
    isAuthenticated: async (req, res, next) => {
        try {
            if (!req.session.user) {
                req.session.urlTo = req.originalUrl;
                res.redirect('/login');
            } else {
                next();
            }
            
        } catch (e) {
            console.log(e.message);
            req.session.urlTo = req.originalUrl;
            res.redirect('/login');
        }
    },
    isAdmin: async (req, res, next) => {
        try {
            const token = req.session.token;
            const userResponse = await req.authAxios.get('/admins/admin-user', { headers: authHeader(token) });
            if (userResponse.status == 200) {
                next();
            } else {
                res.redirect('/');
            }
        } catch (e) {
            console.log(e.message);
            res.sendStatus(500);
        }
    }
}