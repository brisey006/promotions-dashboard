const FormData = require('form-data');
const { authHeader } = require('./auth');
const storageApiUrl = process.env.STORAGE_API_URL;

const getCurrentUrl = (url, page) => {
    let currentUrl = url;

    const currentPage = `page=${page}`;

    if (currentUrl.indexOf(`${currentPage}&`) > -1) {
        currentUrl = currentUrl.replace(`${currentPage}&`, '');
    } else if (currentUrl.indexOf(`${currentPage}`) > -1) {
        currentUrl = currentUrl.replace(`${currentPage}`, '');
    }

    if (currentUrl.indexOf('?') > -1) {
        if (currentUrl.charAt(currentUrl.length -1) != '&') {
            currentUrl = `${currentUrl}&`;
        }
    } else {
        currentUrl = `${currentUrl}?`;
    }
    return currentUrl;
}

const prepareFormData = (file, path, title, token) => {
    const mimeType = file.mimetype;
    const formData = new FormData();

    formData.append('imagePath', path);
    formData.append('title', title);
    formData.append('file', file.data);
    formData.append('extension', mimeType.substring(mimeType.indexOf('/') + 1, mimeType.length));

    const formHeaders = {
        ...authHeader(token),
        ...formData.getHeaders()
    };

    return {
        formData,
        formHeaders
    };
}

const checkFile = (reqFile) => {
    let fileAvailable = true;
    if (reqFile == undefined) {
        fileAvailable = false;
    }

    if (reqFile.file == undefined) {
        fileAvailable = false;
    }
    return fileAvailable;
}

const appendImageUrlPrefix = (displayImage) => {
    let image = undefined;
    if (displayImage) {
        image = {
            thumbnail: `${storageApiUrl}/${displayImage.thumbnail}`,
            original: `${storageApiUrl}/${displayImage.original}`,
        };
    }
    return image;
}

module.exports = {
    getCurrentUrl,
    checkFile,
    prepareFormData,
    appendImageUrlPrefix,
}