const moment = require('moment');
module.exports = {
    random: () => {
        return Math.random();
    },
    stringfy: (data) => {
        return JSON.stringify(data);
    },
    shorten: (data, block) => {
        let { limit } = block.hash;
        limit = limit == undefined ? 200 : limit;
        let des = data.length > limit ? `${data.substring(0, limit - 3)}...` : data;
        return des;
    },
    formatDateOfBirth: (data) => {
        return moment(data).format('DD-MM-YYYY');
    },
    formatDate: (data) => {
        return moment(data).format('DD MMM YYYY');
    },
    paginate: (page, block) => {
        var accum = '';
        const { total } = block.hash;
        let start = page;

        if (page >= 3) {
            start = page - 2;
        } else {
            start = 1;
        }

        let last = total >= start + 5 ? start + 5 : total;

        for(var i = start; i <= last; ++i)
            accum += block.fn(i);
        return accum;
    },
    thumbnailUrl: (path) => {
        let url = '';
        if (path != undefined) {
            if (path.indexOf('/thumbnails/') == 0) {
                url = `${process.env.THUMBNAILS_API_URL}${path}`;
            } else {
                url = `${process.env.STORAGE_API_URL}${path}`;
            }
        }
        return url;
    },
    urlParse: (url) => {
        if (url != undefined) {
            var prefix = 'http://';
            let s = url;
            if (s.substr(0, prefix.length) !== prefix)
            {
                s = prefix + s;
            }
            return s;
        } else {
            return '';
        }
    }
}