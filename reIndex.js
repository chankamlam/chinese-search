import redis from "redis";
import ayc from "async";
import util from "util";
import jieba from "nodejieba";
import uuid from "uuid/v4";
let redisClient
let option = {
    host: '127.0.0.1',
    port: 6379
}
/**
 * 删除所有现存分词KEY
 * @param  {fn} cbk 
 */
let clearAllKeys = (cbk) => {
    if (!redisClient) {
        return
    }
    let a = (cb) => {
        redisClient.keys('*', (err, r) => {
            if (err) {
                cb("err in get all keys from redis")
                return
            };
            cb(null, r)
        })
    }
    let b = (n, cb) => {
        redisClient.del(n, (err, r) => {
            if (err) {
                cb("err in delete all keys from redis")
                return
            };
            cb(null)
        })
    }
    async.waterfall([a, b], (err, r) => {
        if (err) {
            throw new Error('err in fn clearAllKeys')
            return
        };
        cbk()
    })
}
/**
 * 初始化RedisClient
 */
let initRedisClient = (opt) => {
    if (!redisClient) {
        redisClient = redis.createClient({
            'host': opt.host,
            'port': opt.port
        });
    };
}
/**
 * 按照KEY分词
 * @param  {array} cutKeys 
 * @param  {array} d     
 */
let cutWords = (cutKeys, d) => {
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
/**
 * 添加唯一键
 * @param  {array} d 需要处理数组
 * @return {array}   处理过数组
 */
let addUUID = d => {
    return d.map(obj => {
        obj['_id'] = uuid()
        return obj
    })
}
class Search {
    constructor(args) {
        this.opt = Object.assign({}, option, args)
        // initRedisClient(this.opt)
    }
    /**
     * 需要进行分词KEY
     * @param  {Array} arr 
     */
    cutKeys(arr) {
        if (util.isArray(arr)) {
            option['cutKeys'] = arr
        }
        return this
    }
    data(d, done, isAddedData = false) {
        if (util.isArray(d)) {
            //非追加数据清理所有KEY对应UUID
            let a = cb => {
                if (isAddedData) {
                    clearAllKeys(() => {
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
                n = cutWords(option.cutKeys, n.d)
                cb(null, n)
            }
            // 保存到redis
            ayc.waterfall([a, b, c], (err, r) => {
                if (err) {
                    throw new Error("err in method data")
                    return
                }
                if (done) {
                    done()
                }
            })
        }
        return this
    }
    addData(d, done) {
        data(d, done, true)
        return this
    }
}
export {
    addUUID,
    cutWords,
    Search
}