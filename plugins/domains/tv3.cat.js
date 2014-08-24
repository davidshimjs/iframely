var parseString = require('xml2js').parseString;
var async = require('async');

module.exports = {

    re: /^http:\/\/www\.tv3\.cat\/videos\/(\d+)/i,

    provides: 'tv3_cat',

    getData: function(urlMatch, request, cb) {

        async.parallel({

            meta: function(cb) {
                async.waterfall([
                    function(cb) {
                        request({
                            uri: 'http://www.tv3.cat/pshared/video/FLV_bbd_dadesItem.jsp?idint=' + urlMatch[1]
                        }, cb);
                    },
                    function(b, data, cb) {
                        parseString(data, cb);
                    }
                ], cb)
            },

            video: function(cb) {
                async.waterfall([
                    function(cb) {
                        request({
                            uri: 'http://www.tv3.cat/pshared/video/FLV_bbd_media.jsp?ID=' + urlMatch[1] + '&QUALITY=H&FORMAT=MP4&PROFILE=HTML5'
                        }, cb);
                    },
                    function(b, data, cb) {
                        parseString(data, cb);
                    }
                ], cb)
            }

        }, function(error, data) {
            if (error) {
                return cb(error);
            }

            cb(null, {
                title: data.meta.item.title[0],
                duration: data.meta.item.durada_h[0],
                imgsrc: data.meta.item.imgsrc[0],
                desc: data.meta.item.desc[0],
                date: data.meta.item.data[0],
                video_url: data.video.tv3alacarta.item[0].media[0]._
            });
        });
    }
};