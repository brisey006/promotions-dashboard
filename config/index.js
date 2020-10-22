const { authHeader } = require('../functions/auth');
const { addImagesRootUrl } = require('../functions/user');

module.exports = async (req, res, next) => {
    try {
        if (req.session.user != undefined) {
            req.user = req.session.user;
            req.app.locals.user = req.session.user;
        } else {
            if (req.cookies.user != undefined) {
                const refreshToken = req.cookies.user;
                const response = await req.authAxios.post('/refresh-token', {}, { headers: authHeader(refreshToken) });
                const token = response.data.token;
                req.session.token = token;
                const userResponse = await req.authAxios.get('/current', { headers: authHeader(token) });
                let user = userResponse.data;
                if (user.displayImage) {
                    user = addImagesRootUrl(user);
                }
                req.session.user = user;
                req.app.locals.user = user;
                req.user = req.session.user;
            }
        }
        next();
    } catch (e) {
        console.log(e.message);
        next();
    }
    
};