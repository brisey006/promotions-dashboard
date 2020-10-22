const storageApiUrl = process.env.STORAGE_API_URL;

module.exports = {
    addImagesRootUrl: (user) => {
        if (user.displayImage.thumbnail !== undefined) {
            return { 
                ...user, 
                displayImage: {
                    thumbnail: `${storageApiUrl}/${user.displayImage.thumbnail}`,
                    original: `${storageApiUrl}/${user.displayImage.original}`,
                }
            }
        } else {
            const usert = user;
            delete usert.displayImage;
            return usert;
        }
    }
}