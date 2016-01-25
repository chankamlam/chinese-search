"use strict"
var util = require('util');
var jieba = require('nodejieba');
var redis = require('redis');
var async = require('async');
var redisClient;

var option = {
    'host': '127.0.0.1',
    'port': 4000,
    'indexArr': null,
    'keyArr': null
}

var redisClientInit = () => {
    if (!redisClient) {
        redisClient = redis.createClient({
            'host': option.host,
            'port': option.port
        });
    };
}
var clearAllKeys = (callback) => {
    var a = (cb) => {
        redisClient.keys('*', (err, r) => {
            if (err) {
                throw new Error('err in clearAllKeys')
                return
            };
            var n = {}
            n.r = r
            cb(null, n)
        })
    }
    var b = (n, cb) => {
        redisClient.del(n.r, (err1, r1) => {
            if (err1) {

            };
            if (r1 <= 0) {
                throw new Error('err in clearAllKeys')
                return
            };
            cb(null, n)
        })
    }
    async.waterfall([a, b], (err, r) => {
        if (err) {
            throw new Error('err in clearAllKeys')
            return
        };
        callback()
    })
}

function search(opt) {
    if (!(this instanceof search)) {
        return new search(opt);
    }
    if (opt && util.isObject(opt)) {
        opt.host || (option.host = opt.host)
        opt.port || (option.port = opt.port)
    };
}
search.prototype.option = function(opt) {
    if (opt && util.isObject(opt)) {
        opt.host || (option.host = opt.host)
        opt.port || (option.port = opt.port)
    };
}
search.prototype.index = function(arr) {
    if (arr && util.isArray(arr)) {
        option.indexArr = arr;
        return this;
    } else {
        throw new Error('err in indexArr')
    };
};
search.prototype.key = function(arr) {
    if (arr && util.isArray(arr)) {
        option.keyArr = arr;
        return this;
    } else {
        throw new Error('err in keyArr')
    };
};
search.prototype.queryKeyword = function(str, cb) {
    if (str && util.isString(str)) {
        redisClientInit.apply(this)
        redisClient.keys('*' + str + '*', (err, r) => {
            if (err) {
                throw new Error('err in redisClient')
                return
            };
            cb(r)
        })
    } else {
        throw new Error('err in queryKey string')
    };
};
search.prototype.query = function(str, cb) {
    if (str && util.isString(str)) {
        redisClientInit.apply(this)
        redisClient.smembers(str, (err, r) => {
            if (err) {
                throw new Error('err in redisClient')
                return
            };
            var res = []
            r.forEach((item) => {
                res.push(JSON.parse(item))
            })
            cb(res)
        })
    } else {
        throw new Error('err in query string')
    };
};
search.prototype.adddata = function(arr) {
    this.data(arr, true)
}
search.prototype.data = function(arr, isAdded) {
    if (arr && util.isArray(arr)) {
        if (option.indexArr == null) {
            throw new Error('set up the index before using the method of data')
            return
        };
        if (option.keyArr == null) {
            throw new Error('set up the key before using the method of data')
            return
        };
        redisClientInit.apply(this)
        var a = (cb) => {
            var n = {}
            if (!isAdded) {
                clearAllKeys.call(this, () => {
                    cb(null, n)
                })
            } else {
                cb(null, n)
            };
        }
        var b = (n, cb) => {
            arr.forEach((item) => {
                var indexArr = option.indexArr
                indexArr.forEach((index) => {
                    var itemOfIndex = item[index]
                    if (!itemOfIndex) {
                        throw new Error('can not find the key in the data')
                        return
                    };
                    var wordArr = jieba.cut(itemOfIndex)
                    var obj = {}
                    var keyArr = option.keyArr
                    keyArr.forEach((key) => {
                        var itemOfKey = item[key]
                        if (!itemOfKey) {
                            throw new Error('can not find the key in the data')
                            return
                        };
                        obj[key] = itemOfKey
                    })
                    var n = {}
                    n['wordArr'] = wordArr
                    n['obj'] = obj
                    cb(null, n)
                })
            })
        }
        var c = (n, cb) => {
            var wordArr = n.wordArr
            var obj = n.obj
            wordArr.forEach((word) => {
                redisClient.sadd(word, JSON.stringify(obj), (err, r) => {
                    if (err) {
                        throw new Error('err in redisClient')
                        return
                    };
                    cb(null, {})
                })
            })

        }
        async.waterfall([a, b, c], (err, r) => {
            if (err) {
                throw new Error('err in async')
                return
            };
        })
        return this

    } else {
        throw new Error('err in dataArr')
    };
};

module.exports = search
