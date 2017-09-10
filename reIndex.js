import redis from "redis";
import ayc from "async";
import util from "util";
import jieba from "nodejieba";
import uuid from "uuid/v4";
// redis客户端
let redisClient
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
    return
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
        if (word[k]) {
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
const addUUID = d => {
    return d.map(obj => {
        obj['_id'] = uuid()
        return obj
    })
}
/**
 * sadd数组到redis
 * @param  {[type]}   client [description]
 * @param  {[type]}   key    [description]
 * @param  {[type]}   val    [description]
 * @param  {Function} cb     [description]
 * @return {[type]}          [description]
 */
const sadd2Redis = (client, key, val, cb) => {
    client.sadd(key, val, (err, r) => {
        cb(err,r)
    })
}
/**
 * 中文全文检索引擎
 */
class Search {
    constructor(args) {
        option = Object.assign({}, option, args)
        // 初始化RedisClient
        redisClient = initRedisClient(redisClient, option)
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
        if (util.isArray(d) && redisClient) {
            //非追加数据清理所有KEY对应UUID
            let a = cb => {
                if (isAddedData) {
                    clearAllKeys(redisClient, (err, r) => {
                        cb('err in cutKeys')
                        cb(null, {})
                    })
                }
            }
            //添加UUID
            let b = (n, cb) => {
                n.d = addUUID(d)
                cb(null, n)
            }
            // 分词
            let c = (n, cb) => {
                if (option.cutKeys) {
                    n = cutWords(option.cutKeys, n.d)
                } else {
                    cb('need 2 setup the cutKeys before calling the data method')
                }
                cb(null, n)
            }
            // 选择db 1
            let d = (n, cb) => {
                redisClient.select(1, (err, r) => {
                    if (err) {
                        cb('err in select redis db 1')
                        return
                    }
                    cb(null, n)
                })
            }
            // sadd data 2 redis
            let e = (n, cb) => {
                ayc.map(n.keys, (k, cbk) => {
                    // 获取UUID数组
                    let uuids = Array.of(...objs[k])
                    // 插入redis
                    sadd2Redis(client, k, uuids, (err,r) => {
                    	if(err){
                    		cb('err in sadd data 2 redis')
                    		return 
                    	}
                        cbk(null, r)
                    })
                }, (err, r) => {
                    if (err) {
                        cb(err)
                        return
                    }
                    cb(r)
                })
            }
            // excute
            ayc.waterfall([a, b, c], (err, r) => {
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
    }
    /**
     * 追加数据2Redis
     * @param {array}   d    被检索数据
     * @param {Function} done 回调函数
     */
    addData(d, done) {
        data(d, done, true)
    }
    /**
     * 检索数据
     * @param  {array}   arr  关键字数组
     * @param  {Function} done 回调函数
     */
    query(arr, done) {
        let r = []
        if (util.isArray(arr)) {
            ayc.map(arr, (word, cbk) => {
                //根据word去redis获取对象
                //
                //根据returnKeys重组对象
                if (option.returnKeys) {
                    cbk(null, reMixWords(option.returnKeys, obj))
                } else {
                    cbk(null, obj)
                }
            }, (err, r) => {
                if (done) {
                    done(err, r)
                } else {
                    if (err) {
                        throw new Error('err in method query')
                        return
                    }
                }
            })
        }
    }
}
export {
    addUUID,
    cutWords,
    reMixWords,
    initRedisClient,
    clearAllKeys,
    sadd2Redis,
    Search
}