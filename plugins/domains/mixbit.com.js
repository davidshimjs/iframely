module.exports = {

    re: [
        /^https?:\/\/mixbit\.com\/v\/(\w+)(?:\/.+)?/i,
        /^https?:\/\/mixbit\.com\/s\/(\_\w+)(?:\/.+)?/i
    ],

    getMeta: function(mixbit) {
        return {
            title: mixbit.title,
            site: "MixBit"
        };
    },

    provides: 'mixbit',

    getData: function(urlMatch, request, cb) {
        request({
            uri: "https://api.mixbit.com/api/v1/msee/project/" + urlMatch[1],
            json: true
        }, function(error, response, body) {
            if (error) {
                return cb(error);
            }
            if (body.status != "success") {
                return cb(body.status);
            }
            cb(null, {
                mixbit: body.pkg
            });
        });
    },

    getLink: function(mixbit) {
        return [{
            href: "https://mixbit.com/favicon.ico",
            type: CONFIG.T.image_icon,
            rel: CONFIG.R.icon
        }, {
            href: mixbit.thumbnail_url,
            type: CONFIG.T.image_jpeg,
            rel: CONFIG.R.thumbnail,
            width: mixbit.thumbnail_width,
            height: mixbit.thumbnail_height
        }, {
            href: "https://mixbit.com/embed/" + mixbit.project_id,
            type: CONFIG.T.text_html,
            rel: [CONFIG.R.player, CONFIG.R.html5],
            "aspect-ratio": mixbit.video_width / mixbit.video_height
        }];
    },

    tests: [{
        noFeeds: true
    },
        "https://mixbit.com/v/_KoIPSHoobOao45Bsy8qWM",
        "https://mixbit.com/v/_4okZTAsQnkchEV5dap0Ei"
    ]
};