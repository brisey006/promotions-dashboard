const { default: Axios } = require('axios');
const authApi = process.env.AUTH_API_URL;
const storageUrl = process.env.STORAGE_API_URL;
const promotionsApi = process.env.PROMOTIONS_API_URL;

const refreshAccessToken = async (token) => {
    try {
        const response = await Axios.post(`${authApi}/refresh-token`, {}, {
            headers: {
                'Authorization': `Bearer ${token}` 
            }
        });
        return response.data.token;
    } catch (e) {
        console.log(e.message);
        return '';
    }
}

module.exports = (req, res, next) => {
    const storageAxios = Axios.create({ baseURL: storageUrl });
    const authAxios = Axios.create({ baseURL: authApi});
    const promotionsAxios = Axios.create({ baseURL: promotionsApi });

    const handleError = async (error, axios) => {
        const originalRequest = error.config;
        if (error.response.status === 401 && !originalRequest._retry && error.config.url.indexOf('/refresh-token') == -1) {
            originalRequest._retry = true;
            const access_token = await refreshAccessToken(req.cookies.user);
            req.session.token = access_token;   
            originalRequest.headers = {
                ...originalRequest.headers,
                'Authorization': `Bearer ${req.session.token}` 
            }
            return axios(originalRequest);
        }
        return Promise.reject(error);
    }

    const successResponse = (response) => {
        return response;
    };

    storageAxios.interceptors.response.use(successResponse, async (error) => {
        return await handleError(error, storageAxios);
    });

    authAxios.interceptors.response.use(successResponse, async (error) => {
        return await handleError(error, authAxios);
    });

    promotionsAxios.interceptors.response.use(successResponse, async (error) => {
        return await handleError(error, promotionsAxios);
    });

    req.storageAxios = storageAxios;
    req.authAxios = authAxios;
    req.promotionsAxios = promotionsAxios;

    next();
}