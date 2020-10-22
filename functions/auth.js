module.exports = {
    authHeader: (token) => {
        return { 'Authorization': `Bearer ${token}` };
    }
}