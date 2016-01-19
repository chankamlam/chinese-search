"use strict"
var util = require('util');
var jieba = require('nodejieba');
var redis = require('redis');
var async = require('async');
var redisClient = null;

var option = {
    'host': '127.0.0.1',
    'port': 4000,
    'indexArr': null,
    'keyArr': null
}

function search(opt) {
    if (!(this instanceof search)) {
        return new search(opt);
    }
    if (opt && util.isObject(opt)) {
        opt.host || option.host = opt.host
        opt.port || option.port = opt.port
    };
}

search.prototype.index = function(arr) {
    // body...
    if (arr && util.isArray(arr)) {
        option.indexArr = arr;
        return this;
    } else {
        throw new Error('err in indexArr')
    };
};
search.prototype.key = function(arr) {
    // body...
    if (arr && util.isArray(arr)) {
        option.keyArr = arr;
        return this;
    } else {
        throw new Error('err in keyArr')
    };
};
search.prototype.data = function(arr) {
    // body...

    if (arr && util.isArray(arr)) {
    	if (option.indexArr==null) {
    		throw new Error('set up the index before using the method of data')
    	};
    	if (option.keyArr=null) {
    		throw new Error('set up the key before using the method of data')
    	};
        if (redisClient == null) {
            redisClient = redis.createClient({
                'host': option.host,
                'port': option.port
            });
        };

        var a = (cb) => {
            arr.forEach((item) => {
                var indexArr = option.indexArr
                var keyArr = option.keyArr
                indexArr.forEach((index) => {
                    var wordArr = jieba.cut(item[index])
                    var obj = {}
                    keyArr.forEach((key) => {
                        if (item[key]) {
                            throw new Error('can not find the key in data')
                            return
                        };
                        obj[key] = item[key]
                    })
                    var n = {}
                    n['wordArr'] = wordArr
                    n['obj'] = obj
                    cb(null, n)
                })
            })
        }
        var b = (n, cb) => {
            var wordArr = n.wordArr
            var obj = n.obj
            if (redisClient == null) {
                throw new Error('err in redisClient')
                return
            };
            wordArr.forEach((item) => {
                redisClient.sadd(item, obj, (err, r) => {
                    if (err) {
                        throw new Error('err in redisClient')
                        return
                    };
                    cb(null,{})
                })
            })

        }
        async.waterfall([a, b], (err, r) => {
            if (err) {
                throw new Error('err in async')
                return
            };
            return this;
        })

    } else {
        throw new Error('err in dataArr')
    };
};

module.exports=search
