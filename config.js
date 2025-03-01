(function() {
    var _ = require('underscore');
    var path = require('path');
    var fs = require('fs');

    var version = require('./package.json').version;

    var config = {

        WHITELIST_URL: 'http://iframely.com/qa/top100.json',
        WHITELIST_URL_RELOAD_PERIOD: 60 * 60 * 1000,  // will reload WL every hour, if no local files are found in /whitelist folder

        WHITELIST_LOG_URL: 'http://iframely.com/whitelist-log',

        // Default cache engine to prevent warning.
        CACHE_ENGINE: 'node-cache',
        CACHE_TTL: 24 * 60 * 60,

        CACHE_TTL_PAGE_TIMEOUT: 10 * 60,

        CLUSTER_WORKER_RESTART_ON_MEMORY_USED: 500 * 1024 * 1024, // 500 MB.
        CLUSTER_MAX_CPU_LOAD_TIME_IN_SECONDS: 20,   // if 20 seconds load over 95% - restart worker.
        CLUSTER_MAX_CPU_LOAD_IN_PERCENT: 95,

        RESPONSE_TIMEOUT: 5 * 1000,

        USER_AGENT: "Iframely/" + version + " (+http://iframely.com/;)",

        T: {
            text_html: "text/html",
            javascript: "application/javascript",
            safe_html: "text/x-safe-html",
            image_jpeg: "image/jpeg",
            flash: "application/x-shockwave-flash",
            image: "image",
            image_icon: "image/icon",
            image_png: "image/png",
            image_svg: "image/svg",
            video_mp4: "video/mp4",
            video_ogg: "video/ogg"
        },

        REL_GROUPS: [
            "app",
            "player",
            "survey",
            "image",
            "reader",
            "thumbnail",
            "logo",
            "icon"
        ],

        MEDIA_ATTRS: [
            "width",
            "min-width",
            "max-width",
            "height",
            "min-height",
            "max-height",
            "aspect-ratio"
        ],

        R: {
            player: "player",
            thumbnail: "thumbnail",
            image: "image",
            reader: "reader",
            file: "file",
            survey: "survey",
            app: "app",
            summary: "summary",

            iframely: "iframely",
            og: "og",
            twitter: "twitter",
            oembed: "oembed",

            icon: "icon",
            logo: "logo",

            inline: "inline",

            autoplay: "autoplay",
            html5: "html5"
        },

        // Whitelist settings.

        REL: {
            "iframely": [
                "reader",
                "app",
                "player",
                "survey",
                "image",
                "thumbnail",
                "logo"
            ],
            "twitter": [
                "player",
                "photo"
            ],
            "og": [
                "video"
            ],
            "oembed": [
                "link",
                "rich",
                "video",
                "photo"
            ],
            "html-meta": [  // TODO: Need change to 'fb'.
                "video"
            ]
        },

        REL_OPTIONS: {
            all: ["ssl"],
            player: ["responsive", "autoplay"],
            video: ["responsive", "autoplay"],
            link: ["reader"],
            rich: ["reader"]
        },

        // whitelist rel to iframely rel.
        REL_MAP: {
            "article": "reader",
            "photo": "image",
            "video": "player"
        },

        // To detect: "html-meta".
        KNOWN_SOURCES: [
            "oembed",
            "og",
            "twitter",
            "iframely"
        ],

        OEMBED_RELS_PRIORITY: ["player", "survey", "image", "reader", "app"],
        providerOptions: {
            "readability": {},
            "twitter.status": {}
        }
    };

    var local_config_path = path.resolve(__dirname, "config.local.js");
    if (fs.existsSync(local_config_path)) {
        var local = require(local_config_path);
        _.extend(config, local);
    }

    config.baseStaticUrl = config.baseAppUrl + config.relativeStaticUrl;

    module.exports = config;
})();
