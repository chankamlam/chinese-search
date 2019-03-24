"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.Engine = exports.clearAllKeys = exports.initDataWithSQL = exports.initDataWithArray = exports.initDataClient = exports.initCacheClient = exports.reMixWords = exports.cutWords = exports.addUUID = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _redis = require("redis");

var _redis2 = _interopRequireDefault(_redis);

var _async = require("async");

var _async2 = _interopRequireDefault(_async);

var _util = require("util");

var _util2 = _interopRequireDefault(_util);

var _nodejieba = require("nodejieba");

var _nodejieba2 = _interopRequireDefault(_nodejieba);

var _v = require("uuid/v4");

var _v2 = _interopRequireDefault(_v);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

'use strict';
var __IDHEAD__ = "__GUESSCITY__";
// 缓存客户端
var cacheClient = undefined;
// 数据库客户端
var dataClient = undefined;
/**
 * 默认参数
 */
var option = {
    cache: {
        host: '127.0.0.1', // host ip
        port: 6379, // port of host
        type: 'redis' // redis:0;mamcache:1
    },
    data: {
        host: '127.0.0.1',
        port: 3306,
        type: 'mysql'
    }
    /**
     * 删除所有现存分词KEY
     * @param  {fn} done
     */
};var clearAllKeys = function clearAllKeys(client, done) {

    var fn_a = function fn_a(cb) {
        var n = {};
        if (!client) {
            cb("redis haven't been init");
        } else {
            cb(null, n);
        }
    };
    var fn_b = function fn_b(n, cb) {
        client.keys('*', function (err, r) {
            return cb(err ? "err in get all keys from redis" : null, r);
        });
    };
    var fn_c = function fn_c(n, cb) {
        if (n.length <= 0) return cb(null);

        client.del(n, function (err, r) {
            return cb(err ? "err in delete all keys from redis" : null, r);
        });
    };
    _async2.default.waterfall([fn_a, fn_b, fn_c], function (err, r) {
        return done(err, r);
    });
};
/**
 * 初始化CacheClient
 */
var initCacheClient = function initCacheClient(client, opt) {
    if (!client) {
        var cache = opt.cache;
        return _redis2.default.createClient({
            'host': cache.host,
            'port': cache.port,
            'type': cache.type
        });
    };
    return undefined;
};
/**
 * 初始化DataClient
 */
var initDataClient = function initDataClient(client, opt) {
    if (!client) {
        var data = opt.data;
        return require('knex')({
            client: data.type,
            connection: {
                host: data.host,
                user: data.user,
                password: data.pwd,
                database: data.db,
                port: data.port
            }
        });
    };
    return undefined;
};
/**
 * 按照KEY分词
 * @param  {array} cutKeys
 * @param  {array} d
 */
var cutWords = function cutWords(cutKeys, d) {
    if (!cutKeys) {
        cutKeys = [];
    }
    var n = {};
    cutKeys.forEach(function (key) {
        d.forEach(function (obj) {
            if (obj[key]) {
                var words = _nodejieba2.default.cut(obj[key], true);
                words.forEach(function (w) {
                    if (!n[w]) {
                        n[w] = new Set();
                    }
                    n[w].add(obj['_id']);
                });
            }
        });
    });
    return n;
};
/**
 * 根据KEY重组对象
 * @param  {array} returnKeys 返回KEY数组
 * @param  {object} word       输入对象
 * @return {object}            返回对象
 */
var reMixWords = function reMixWords(returnKeys, word) {
    if (returnKeys.length <= 0) return word;
    var n = {};
    returnKeys.forEach(function (k) {
        if (k in word) {
            n[k] = word[k];
        }
    });
    return n;
};
/**
 * 添加唯一键
 * @param  {array} d 需要处理数组
 * @return {array}   处理过数组
 */
var addUUID = function addUUID(d) {
    return d.map(function (obj) {
        obj['_id'] = __IDHEAD__ + (0, _v2.default)();
        return obj;
    });
};
/**
 * 初始化
 * @param  {object} args 用户传参
 */
var init = function init(args) {
    option = Object.assign({}, option, args);
    // 初始化缓存客户端
    cacheClient = initCacheClient(undefined, option);
    // 初始化数据库客户端
    dataClient = initDataClient(undefined, option);
};
/**
 * 以数组初始化数据库
 * @param  {Array}   d                    数据
 * @param  {Function} done                 回调方法
 * @param  {Boolean}  [isAppendData=false] 是否追加数据
 */
var initDataWithArray = function initDataWithArray(d, done) {
    var isAppendData = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;

    //非追加数据清理所有KEY对应UUID
    var fn_a = function fn_a(cb) {
        var n = {};
        n.d = d;
        if (!isAppendData) {
            clearAllKeys(cacheClient, function (err, r) {
                return cb(err ? 'err in clearAllKeys' : null, n);
            });
        } else {
            cb(null, n);
        }
    };
    //添加UUID并插数据如redis
    var fn_b = function fn_b(n, cb) {
        n.d = addUUID(n.d);
        _async2.default.map(n.d, function (item, cbk) {
            cacheClient.set(item._id, JSON.stringify(item), function (err, r) {
                return cbk(err ? err : null, r);
            });
        }, function (err, r) {
            return cb(err ? 'err in insert data ' : null, n);
        });
    };
    // 分词处理
    var fn_c = function fn_c(n, cb) {
        if (option.cutKeys && option.cutKeys.length > 0) {
            n.c = cutWords(option.cutKeys, n.d);
            cb(null, n);
        } else {
            cb('need to setup the cutKeys before calling the data method');
        }
    };
    // 选择db 1 (目前node_redis包不支持切换db,后续版本跟进。)
    var fn_d = function fn_d(n, cb) {
        cacheClient.select(1, function (err, r) {
            return cb(err ? err : null, n);
        });
    };
    // sadd data 2 redis
    var fn_e = function fn_e(n, cb) {
        _async2.default.map(Object.keys(n.c), function (k, cbk) {
            // 获取UUID数组
            var uuids = Array.of.apply(Array, _toConsumableArray(n.c[k]));
            // 插入redis
            cacheClient.sadd(k, uuids, function (err, r) {
                return cbk(err ? err : null, r);
            });
        }, function (err, r) {
            return cb(err ? err : null, r);
        });
    };
    // 执行瀑布流
    _async2.default.waterfall([fn_a, fn_b, fn_c, fn_e], function (err, r) {
        return done && done(err, r);
    });
};
/**
 * 以SQL初始化数据库
 * @param  {string}   d                    sql
 * @param  {Function} done                 回调方法
 * @param  {Boolean}  [isAppendData=false] 是否追加数据
 */
var initDataWithSQL = function initDataWithSQL(d, done) {
    var isAppendData = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;

    dataClient.raw(d).then(function (res) {
        initDataWithArray(res[0], done, isAppendData);
    }).catch(function (err) {
        done(err, null);
    });
};
/**
 * 中文全文检索引擎
 */

var Engine = function () {
    function Engine(args) {
        _classCallCheck(this, Engine);

        init(args);
    }
    /**
     * 支持express
     * @param  {string} key  绑定在appKEY
     * @param  {object} args 用户传参
     * @return {fn}      as express middleware
     */


    _createClass(Engine, [{
        key: "supportExpres",
        value: function supportExpres(key) {
            var self = this;
            return function (req, res, next) {
                req.app[key] = res.app[key] = self;
                next();
            };
        }
        /**
         * 需要进行分词KEY
         * @param  {Array} arr 键数组
         * @return {object}   Search对象
         */

    }, {
        key: "cutKeys",
        value: function cutKeys(arr) {
            if (_util2.default.isArray(arr)) {
                option['cutKeys'] = arr;
            } else {
                option['cutKeys'] = [];
            }
            return this;
        }
        /**
         * 需要返回的KEY
         * @param  {array} arr 键数组
         * @return {object}   Search对象
         */

    }, {
        key: "returnKeys",
        value: function returnKeys(arr) {
            if (_util2.default.isArray(arr)) {
                option['returnKeys'] = arr;
            } else {
                option['returnKeys'] = [];
            }
            return this;
        }
        /**
         * 初始化redis数据
         * @param  {[type]}   d           被检索数据
         * @param  {Function} done        回调函数
         * @param  {Boolean}  isAppendData 是否追加数据
         */

    }, {
        key: "initData",
        value: function initData(d, done) {
            var isAppendData = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;

            // if (!(util.isArray(d) && cacheClient)) return done(new Error('err in initData'), null)
            // if (!((typeof d == 'string') && dataClient)) return done(new Error('err in initData'), null)
            option.returnKeys && (option.returnKeys = []);
            if (_util2.default.isArray(d) && cacheClient) {
                return initDataWithArray(d, done, isAppendData);
            } else if (typeof d == 'string' && dataClient) {
                return initDataWithSQL(d, done, isAppendData);
            }
        }
        /**
         * 追加数据到缓存
         * @param  {[type]} d      [数据]
         * @param  {[type]} doneFn [回调函数]
         */

    }, {
        key: "appendData",
        value: function appendData(d, doneFn) {
            this.initData(d, doneFn, true);
        }
        /**
         * 检索数据
         * @param  {array}   d  关键字数组
         * @param  {Function} done 回调函数
         */

    }, {
        key: "query",
        value: function query(d, done) {

            if (!(_util2.default.isArray(d) && cacheClient)) return done(new Error('....'), null);

            // 遍历获取分词对应uuids,数据格式 => '北京':Set(uuid1,uuid2)
            var fn_a = function fn_a(cb) {
                _async2.default.map(d, function (word, cbk) {
                    cacheClient.smembers(word, function (err, r) {
                        return cbk(err ? 'err in smembers uuid from redis' : null, r);
                    });
                }, function (err, r) {
                    return cb(err ? err : null, { uuids: r });
                });
            };
            // 对获取uuids做唯一性处理
            var fn_b = function fn_b(n, cb) {
                var set = new Set();
                n.uuids.forEach(function (arr) {
                    arr.forEach(function (uuid) {
                        set.add(uuid);
                    });
                });
                cb(null, Array.of.apply(Array, _toConsumableArray(set)));
            };
            // 遍历获取uuid对应ObjectString which save in redis
            var fn_c = function fn_c(n, cb) {
                _async2.default.map(n, function (uuid, cbk) {
                    //根据uuid去redis获取对象
                    cacheClient.get(uuid, function (err, r) {
                        if (err) {
                            cbk('err in get data using uuid');
                            return;
                        }
                        // 根据returnKeys重组对象
                        if (option.returnKeys) {
                            cbk(null, reMixWords(option.returnKeys, JSON.parse(r)));
                        } else {
                            cbk(null, JSON.parse(r));
                        }
                    });
                }, function (err, r) {
                    return cb(err ? err : null, r);
                });
            };
            // 执行瀑布流
            _async2.default.waterfall([fn_a, fn_b, fn_c], function (err, r) {
                return done && done(err, r);
            });
        }
        /**
         * 清空所有数据
         * @param  {Function} done 回调函数
         */

    }, {
        key: "clearAll",
        value: function clearAll(done) {
            clearAllKeys(cacheClient, done);
        }
    }]);

    return Engine;
}();

exports.addUUID = addUUID;
exports.cutWords = cutWords;
exports.reMixWords = reMixWords;
exports.initCacheClient = initCacheClient;
exports.initDataClient = initDataClient;
exports.initDataWithArray = initDataWithArray;
exports.initDataWithSQL = initDataWithSQL;
exports.clearAllKeys = clearAllKeys;
exports.Engine = Engine;
