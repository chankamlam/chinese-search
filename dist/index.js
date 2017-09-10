"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.Engine = exports.clearAllKeys = exports.initRedisClient = exports.reMixWords = exports.cutWords = exports.addUUID = undefined;

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

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

'use strict';
var __IDHEAD__ = "__UUIDOFDATA__";
// redis客户端
var redisClient = undefined;
/**
 * 默认参数
 */
var option = {
    host: '127.0.0.1',
    port: 6379
    /**
     * 删除所有现存分词KEY
     * @param  {fn} done 
     */
};var clearAllKeys = function clearAllKeys(client, done) {
    if (!client) return;
    var a = function a(cb) {
        client.keys('*', function (err, r) {
            return cb(err ? "err in get all keys from redis" : null, r);
        });
    };
    var b = function b(n, cb) {
        if (n.length <= 0) return cb(null);

        client.del(n, function (err, r) {
            return cb(err ? "err in delete all keys from redis" : null, r);
        });
    };
    _async2.default.waterfall([a, b], function (err, r) {
        return done(err, r);
    });
};
/**
 * 初始化RedisClient
 */
var initRedisClient = function initRedisClient(client, opt) {
    if (!client) {
        return _redis2.default.createClient({
            'host': opt.host,
            'port': opt.port
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
    var n = {};
    cutKeys.forEach(function (key) {
        d.forEach(function (obj) {
            if (obj[key]) {
                var words = _nodejieba2.default.cut(obj[key]);
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
var reMixWords = function reMixWords(returnKeys, word) {
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
    // 初始化RedisClient
    redisClient = initRedisClient(undefined, option);
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
        value: function supportExpres(key, args) {
            var self = this;
            return function (req, res, next) {
                init(args);
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
            }
            return this;
        }
        /**
         * 初始化redis数据
         * @param  {[type]}   d           被检索数据
         * @param  {Function} done        回调函数
         * @param  {Boolean}  isAddedData 是否追加数据
         */

    }, {
        key: "data",
        value: function data(d, done) {
            var isAddedData = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;

            if (!(_util2.default.isArray(d) && redisClient)) return done(new Error('....'), null);
            //非追加数据清理所有KEY对应UUID
            var fn_a = function fn_a(cb) {
                if (!isAddedData) {
                    clearAllKeys(redisClient, function (err, r) {
                        return cb(err ? 'err in cutKeys' : null, {});
                    });
                } else {
                    cb(null, {});
                }
            };
            //添加UUID并插数据如redis
            var fn_b = function fn_b(n, cb) {
                n.d = addUUID(d);
                _async2.default.map(n.d, function (item, cbk) {
                    redisClient.set(item._id, JSON.stringify(item), function (err, r) {
                        return cbk(err ? err : null, r);
                    });
                }, function (err, r) {
                    return cb(err ? 'err in insert data ' : null, n);
                });
            };
            // 分词处理
            var fn_c = function fn_c(n, cb) {
                if (option.cutKeys) {
                    n.c = cutWords(option.cutKeys, n.d);
                } else {
                    cb('need 2 setup the cutKeys before calling the data method');
                }
                cb(null, n);
            };
            // 选择db 1 (目前node_redis包不支持切换db,后续版本跟进。)
            var fn_d = function fn_d(n, cb) {
                redisClient.select(1, function (err, r) {
                    return cb(err ? err : null, n);
                });
            };
            // sadd data 2 redis
            var fn_e = function fn_e(n, cb) {
                _async2.default.map(Object.keys(n.c), function (k, cbk) {
                    // 获取UUID数组
                    var uuids = Array.of.apply(Array, _toConsumableArray(n.c[k]));
                    // 插入redis
                    redisClient.sadd(k, uuids, function (err, r) {
                        return cbk(err ? err : null, r);
                    });
                }, function (err, r) {
                    return cb(err ? err : null, r);
                });
            };
            // 执行瀑布流
            _async2.default.waterfall([fn_a, fn_b, fn_c, fn_e], function (err, r) {
                return done ? done(err, r) : undefined;
            });
        }
        /**
         * 追加数据2Redis
         * @param {array}   d    被检索数据
         * @param {Function} done 回调函数
         */

    }, {
        key: "addData",
        value: function addData(d, done) {
            this.data(d, done, true);
        }
        /**
         * 检索数据
         * @param  {array}   d  关键字数组
         * @param  {Function} done 回调函数
         */

    }, {
        key: "query",
        value: function query(d, done) {

            if (!(_util2.default.isArray(d) && redisClient)) return done(new Error('....'), null);

            // 遍历获取分词对应uuids,数据格式 => '北京':Set(uuid1,uuid2)
            var fn_a = function fn_a(cb) {
                _async2.default.map(d, function (word, cbk) {
                    redisClient.smembers(word, function (err, r) {
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
                    redisClient.get(uuid, function (err, r) {
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
                return done ? done(err, r) : undefined;
            });
        }
    }]);

    return Engine;
}();

exports.addUUID = addUUID;
exports.cutWords = cutWords;
exports.reMixWords = reMixWords;
exports.initRedisClient = initRedisClient;
exports.clearAllKeys = clearAllKeys;
exports.Engine = Engine;
