const { default: Axios } = require('axios');

const authAxios = (req) => {
    let ax = Axios.create();
    ax = req.authAxios;
    return ax;
}

const storageAxios = (req) => {
    let ax = Axios.create();
    ax = req.storageAxios;
    return ax;
}

const promotionsAxios = (req) => {
    let ax = Axios.create();
    ax = req.promotionsAxios;
    return ax;
}

module.exports = {
    authAxios,
    storageAxios,
    promotionsAxios
}