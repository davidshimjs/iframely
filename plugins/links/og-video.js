var _ = require("underscore");
var utils = require('./utils');

function getVideoLinks(video, whitelistRecord) {

    var players = [{
        href: video.url || video,
        type: video.type || CONFIG.T.text_html,
        rel: [CONFIG.R.player, CONFIG.R.og],
        width: video.width,
        height: video.height
    }];

    if (!whitelistRecord || whitelistRecord.isAllowed('og.video', 'ssl')) {
        players.push({
            href: video.secure_url,
            type: video.type || CONFIG.T.text_html,
            rel: [CONFIG.R.player, CONFIG.R.og],
            width: video.width,
            height: video.height
        });
    }

    return players;
}

module.exports = {

    getLinks: function(og, whitelistRecord) {

        if (og.video && (!whitelistRecord || (whitelistRecord.isAllowed && whitelistRecord.isAllowed('og.video')))) {

            if (og.video instanceof Array) {

                return utils.mergeMediaSize(_.flatten(og.video.map(function(video) {
                    return getVideoLinks(video, whitelistRecord);
                })));

            } else if (og.video) {

                return getVideoLinks(og.video, whitelistRecord);
            }
        }
    }
};