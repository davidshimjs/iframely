(function(whitelist) {

    var chokidar = require('chokidar'),
        fs = require('fs'),
        path = require('path'),
        _ = require('underscore'),
        request = require('request');

    var whitelistObject = {domains: {}};
    var currentWhitelistFilename;
    var WHITELIST_DIR = path.resolve(__dirname, '../whitelist');

    function isAllowed(path, option) {
        var bits = path.split('.');
        var tags = getTags.apply(this, bits);

        options = _.union(option && [option] || [], ["allow"]);

        return _.intersection(tags, options).length == options.length;
    }

    function getTags(source, type) {
        var s = this[source];
        var result = [];
        if (s) {
            result = s[type];
        }

        if (typeof result == "string") {
            result = [result];
        }

        return result;
    }

    function getWhitelistLinks(meta, rels) {

        var result = [];

        var sources = _.intersection(rels, CONFIG.KNOWN_SOURCES);

        if (sources.length == 0 && rels.indexOf("player") > -1) {

            // Meta is not available in new version.
            // Maybe need to create new tag.
            //if (meta && meta.video_src) {
                result.push({
                    source: "html-meta",
                    type: "video"
                });
            //}

        } else {
            sources.forEach(function(source) {
                CONFIG.REL[source].forEach(function(type) {

                    var iframelyType = CONFIG.REL_MAP[type] || type;

                    if (rels.indexOf(iframelyType) > -1) {
                        result.push({
                            source: source,
                            type: type
                        });
                    }
                });
            });
        }

        return result;
    }

    whitelist.findRawWhitelistRecordFor = function(uri) {

        if (!whitelistObject) {
            return null;
        }

        var patterns = extractDomainPatterns(uri, true);

        var record, i = 0;
        while(!record && i < patterns.length) {
            record = whitelistObject.domains[patterns[i]];
            i++;
        }

        return record;
    };

    whitelist.findWhitelistRecordFor = function(uri, disableWildcard) {

        if (!whitelistObject) {
            return null;
        }

        var patterns = extractDomainPatterns(uri, disableWildcard);

        var record, i = 0;
        while(!record && i < patterns.length) {
            record = whitelistObject.domains[patterns[i]];
            if (record) {
                record = _.extend({
                    domain: patterns[i],
                    isAllowed: function(path, option) {
                        // String path: "og.video"
                        return isAllowed.apply(this, [path, option]);
                    },
                    getQATags: function(meta, rel) {
                        var links = getWhitelistLinks(meta, rel);
                        var that = this;
                        var tags = links.map(function(link) {
                            return getTags.apply(that, [link.source, link.type]);
                        });
                        tags = _.unique(_.flatten(tags));
                        // Remove allow if denied.
                        var allowIdx = tags.indexOf("allow");
                        var denyIdx = tags.indexOf("deny");
                        if (allowIdx > -1 && denyIdx > -1) {
                            tags.splice(allowIdx, 1);
                        }
                        return tags;
                    },
                    isDefault: patterns[i] === "*" // true for wildcard from config
                }, record);

                // Override empty data with wildcard.
                if (!disableWildcard && CONFIG.WHITELIST_WILDCARD) {

                    for(var protocolId in CONFIG.WHITELIST_WILDCARD) {

                        var protocol = CONFIG.WHITELIST_WILDCARD[protocolId];

                        var recordProtocol = record[protocolId];

                        if (!recordProtocol) {
                            recordProtocol = record[protocolId] = {};
                        } else {
                            recordProtocol = _.extend({}, recordProtocol);
                        }

                        for(var type in protocol) {
                            if (!(type in recordProtocol)) {
                                recordProtocol[type] = protocol[type];
                            }
                        }
                    }
                }
            }
            i++;
        }

        return record;
    };

    whitelist.getWhitelistObject = function() {
        return whitelistObject;
    };

    function extractDomain(uri) {
        var m = uri.match(/^(?:https?:\/\/)?([^/]+)/i);
        if (m) {
            return m[1];
        } else {
            return null;
        }
    }

    function extractDomainPatterns(uri, disableWildcard) {

        var patterns = [];

        var domain = extractDomain(uri);
        if (!domain) {
            return patterns;
        }

        // Only full domain exact match.
        patterns.push(domain);

        // 'www' workaround.
        var bits = domain.split('.');
        if (bits[0] != 'www') {
            patterns.push('www.' + domain);
        } else {
            // Remove www.
            bits.splice(0, 1);
            domain = bits.join('.');
            patterns.push(domain);
        }

        // Wildcard pattern matches parent and this domain.
        if (bits.length > 2) {
            for(var i = 0; i < bits.length - 1; i++) {
                var d = bits.slice(i).join('.');
                patterns.push('*.' + d);
            }
        } else {
            patterns.push('*.' + domain);
        }

        if (!disableWildcard) {
            // System-wide top-level wildcard, taken from config.
            patterns.push('*');
        }

        return patterns;
    }

    function applyParsedWhitelist(data) {

        if (whitelistObject && whitelistObject.domains) {
            delete whitelistObject.domains["*"];
        }

        //utils.disposeObject(whitelistObject);

        whitelistObject = data;

        addWildcard();
    }

    function readWhitelist(filename) {

        var newWhitelist;

        try {
            console.log('Loading whitelist:', filename);
            newWhitelist = JSON.parse(fs.readFileSync(filename, 'utf8'));
        } catch(ex) {
            console.log("Error loading whitelist:", ex);
        }

        if (newWhitelist) {

            applyParsedWhitelist(newWhitelist);

            currentWhitelistFilename = filename;
        }
    }

    function addWildcard() {
        if (CONFIG.WHITELIST_WILDCARD) {
            whitelistObject.domains["*"] = CONFIG.WHITELIST_WILDCARD;
        }
    }

    function findLastWhitelist() {

        if (!fs.existsSync(WHITELIST_DIR)) {
            return null;
        }

        var files = fs.readdirSync(WHITELIST_DIR);

        files = files.filter(function(path) {
            return /iframely-.*\.json/.test(path);
        });

        files.sort();

        if (files.length) {
            return path.resolve(WHITELIST_DIR, files[files.length -1]);
        } else {
            return null;
        }
    }

    function loadLastWhitelist() {

        var filename = findLastWhitelist();

        if (filename && filename != currentWhitelistFilename) {
            readWhitelist(filename);
        } else {
            console.log('No local Domains DB whitelist file detected...');
            addWildcard();
        }

    }

    function startScanWhitelist() {

        var watcher = chokidar.watch(WHITELIST_DIR, {
            interval: 1000,
            binaryInterval: 1000,
            ignoreInitial: true
        });

        watcher.on('add', function(p) {
            p = path.resolve('.', p);
            // Check if newer file added.
            if (p.match(/iframely-.*\.json/)) {
                loadLastWhitelist();
            }
        });

        watcher.on('change', function(p) {
            p = path.resolve('.', p);
            // Reload last whitelist.
            if (p == currentWhitelistFilename) {
                readWhitelist(p);
            }
        });

        loadLastWhitelist();
    }

    startScanWhitelist();
    loadWhitelistUrl();

    function loadWhitelistUrl() {

        if (!currentWhitelistFilename && CONFIG.WHITELIST_URL && CONFIG.WHITELIST_URL_RELOAD_PERIOD) {

            if (CONFIG.WHITELIST_URL.search(/top100\.json/) > -1) {
                console.log("");
                console.log("Loading free whitelist with top 100 domains from " + CONFIG.WHITELIST_URL);
                console.log("*** Full version (w/ over 1500 domains): http://iframely.com/qa/buy");
                console.log("*** Hosted API w/ all-in-one and hosted widgets: http://iframe.ly");
                console.log("");
            } else {
                console.log("Loading whitelist from " + CONFIG.WHITELIST_URL);
            }

            request({
                uri: CONFIG.WHITELIST_URL,
                json: true,
                qs: {
                    domain: CONFIG.baseAppUrl.replace(/.+\/\//, '')
                }
            }, function(error, r, newWhitelist) {

                // TODO: newWhitelist cab be a string if server responds error.

                if (error) {
                    console.error('Error loading whitelist from ' + CONFIG.WHITELIST_URL);
                } else {
                    applyParsedWhitelist(newWhitelist);
                }

                setTimeout(loadWhitelistUrl, CONFIG.WHITELIST_URL_RELOAD_PERIOD);
            });
        }
    }

})(exports);
