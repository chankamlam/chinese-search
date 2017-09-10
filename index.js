import redis from "redis";
import ayc from "async";
import util from "util";
import jieba from "nodejieba";
import uuid from "uuid/v4";
'use strict';
const __IDHEAD__ = "__UUIDOFDATA__"
// redis客户端
let redisClient = undefined
/**
 * 默认参数
 */
let option = {
    host: '127.0.0.1',
    port: 6379
}
/**
 * 删除所有现存分词KEY
 * @param  {fn} done 
 */
const clearAllKeys = (client, done) => {
    if (!client) {
        return
    }
    let a = (cb) => {
        client.keys('*', (err, r) => {
            if (err) {
                cb("err in get all keys from redis")
                return
            };
            cb(null, r)
        })
    }
    let b = (n, cb) => {
        if (n.length <= 0) {
            cb(null)
            return
        }
        client.del(n, (err, r) => {
            if (err) {
                cb("err in delete all keys from redis")
                return
            };
            cb(null, r)
        })
    }
    ayc.waterfall([a, b], (err, r) => {
        done(err, r)
    })
}
/**
 * 初始化RedisClient
 */
const initRedisClient = (client, opt) => {
    if (!client) {
        return redis.createClient({
            'host': opt.host,
            'port': opt.port
        });
    };
    return undefined
}
/**
 * 按照KEY分词
 * @param  {array} cutKeys 
 * @param  {array} d     
 */
const cutWords = (cutKeys, d) => {
    let n = {}
    cutKeys.forEach(key => {
        d.forEach(obj => {
            if (obj[key]) {
                let words = jieba.cut(obj[key])
                words.forEach(w => {
                    if (!n[w]) {
                        n[w] = new Set();
                    }
                    n[w].add(obj['_id'])
                })
            }
        })
    })
    return n
}
const reMixWords = (returnKeys, word) => {
    let n = {}
    returnKeys.forEach((k) => {
        if (k in word) {
            n[k] = word[k]
        }
    })
    return n
}
/**
 * 添加唯一键
 * @param  {array} d 需要处理数组
 * @return {array}   处理过数组
 */
const addUUID = (d) => {
    return d.map(obj => {
        obj['_id'] = __IDHEAD__ + uuid()
        return obj
    })
}


/**
 * 中文全文检索引擎
 */
class Search {
    constructor(args) {
        option = Object.assign({}, option, args)
        // 初始化RedisClient
        redisClient = initRedisClient(undefined, option)
    }
    /**
     * 需要进行分词KEY
     * @param  {Array} arr 键数组
     * @return {object}   Search对象
     */
    cutKeys(arr) {
        if (util.isArray(arr)) {
            option['cutKeys'] = arr
        }
        return this
    }
    /**
     * 需要返回的KEY
     * @param  {array} arr 键数组
     * @return {object}   Search对象
     */
    returnKeys(arr) {
        if (util.isArray(arr)) {
            option['returnKeys'] = arr
        }
        return this
    }
    /**
     * 初始化redis数据
     * @param  {[type]}   d           被检索数据
     * @param  {Function} done        回调函数
     * @param  {Boolean}  isAddedData 是否追加数据
     */
    data(d, done, isAddedData = false) {
        if (!(util.isArray(d) && redisClient)) {
            done(new Error('....'), null)
            return
        }
        //非追加数据清理所有KEY对应UUID
        let fn_a = cb => {
            if (!isAddedData) {
                clearAllKeys(redisClient, (err, r) => {
                    if (err) {
                        cb('err in cutKeys')
                        return
                    }
                    cb(null, {})
                })
            } else {
                cb(null, {})
            }
        }
        //添加UUID并插数据如redis
        let fn_b = (n, cb) => {
            n.d = addUUID(d)
            ayc.map(n.d, (item, cbk) => {
                redisClient.set(item._id, JSON.stringify(item), (err, r) => {
                    if (err) {
                        cbk(err)
                        return
                    }
                    cbk(null, r)
                })
            }, (err, r) => {
                if (err) {
                    cb('err in insert data ')
                    return
                }
                cb(null, n)
            })
        }
        // 分词
        let fn_c = (n, cb) => {
            if (option.cutKeys) {
                n.c = cutWords(option.cutKeys, n.d)
            } else {
                cb('need 2 setup the cutKeys before calling the data method')
            }
            cb(null, n)
        }
        // 选择db 1 (目前node_redis包不支持切换db,后续版本跟进。)
        let fn_d = (n, cb) => {
            redisClient.select(1, (err, r) => {
                if (err) {
                    cb(err)
                    return
                }
                cb(null, n)
            })
        }
        // sadd data 2 redis
        let fn_e = (n, cb) => {
            ayc.map(Object.keys(n.c), (k, cbk) => {
                // 获取UUID数组
                let uuids = Array.of(...n.c[k])
                // 插入redis
                redisClient.sadd(k, uuids, (err, r) => {
                    if (err) {
                        cbk(err)
                        return
                    }
                    cbk(null, r)
                })
            }, (err, r) => {
                if (err) {
                    cb(err)
                    return
                }
                cb(null, n)
            })
        }
        // excute
        ayc.waterfall([fn_a, fn_b, fn_c, fn_e], (err, r) => {
            if (done) {
                done(err, r)
            } else {
                if (err) {
                    throw new Error(err)
                    return
                }
            }
        })
    }
    /**
     * 追加数据2Redis
     * @param {array}   d    被检索数据
     * @param {Function} done 回调函数
     */
    addData(d, done) {
        this.data(d, done, true)
    }
    /**
     * 检索数据
     * @param  {array}   d  关键字数组
     * @param  {Function} done 回调函数
     */
    query(d, done) {
        if (!(util.isArray(d) && redisClient)) {
            done(new Error('....'), null)
            return
        }
        // let r = []
        // ayc.map(d, (word, callback) => {

        let fn_a = (cb) => {
            ayc.map(d, (word, cbk) => {

                // get the uuid first
                redisClient.smembers(word, (err, r) => {
                    if (err) {
                        cbk('err in smembers uuid from redis')
                        return
                    }
                    cbk(null, r)

                })
            }, (err, r) => {
                if (err) {
                    cb(err)
                    return
                }
                cb(null, { uuids: r })
            })
        }
        let fn_b = (n,cb)=>{
        	let set = new Set();
        	n.uuids.forEach(arr=>{
        		arr.forEach(uuid=>{
        			set.add(uuid)
        		})
        	})
        	cb(null,Array.of(...set))
        }
        let fn_c = (n, cb) => {
            ayc.map(n, (uuid, cbk) => {
                //根据uuid去redis获取对象
                redisClient.get(uuid, (err, r) => {
                    if (err) {
                        cbk('err in get data using uuid')
                        return
                    }
                    // 根据returnKeys重组对象
                    if (option.returnKeys) {
                        cbk(null, reMixWords(option.returnKeys, JSON.parse(r)))
                    } else {
                        cbk(null, JSON.parse(r))
                    }
                })

            }, (err, r) => {
                if (err) {
                    cb(err)
                    return
                }
                cb(null, r)
            })
        }
        ayc.waterfall([fn_a,fn_b,fn_c], (err, r) => {
            if (done) {
                // let arr = []
                // r.forEach(item => {
                //     arr = arr.concat(item)
                // })
                done(err, r)
            } else {
                if (err) {
                    throw new Error(err)
                    return
                }
            }
        })
    }
}
export {
    addUUID,
    cutWords,
    reMixWords,
    initRedisClient,
    clearAllKeys,
    Search
}