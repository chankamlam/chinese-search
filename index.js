import redis from "redis";
import ayc from "async";
import util from "util";
import jieba from "nodejieba";
import uuid from "uuid/v4";
'use strict';
const __IDHEAD__ = "__GUESSCITY__"
// 缓存客户端
let cacheClient = undefined
// 数据库客户端
let dataClient = undefined
/**
 * 默认参数
 */
let option = {
  cache:{
    host: '127.0.0.1', // host ip
    port: 6379,        // port of host
    type: 'redis',           // redis:0;mamcache:1
  },
  data:{
    host: '127.0.0.1',
    port: 3306,
    type: 'mysql'
  }
}
/**
 * 删除所有现存分词KEY
 * @param  {fn} done
 */
const clearAllKeys = (client, done) => {

    const fn_a = (cb) => {
      let n = {}
      if(!client){
        cb("redis haven't been init")
      }else{
        cb(null,n)
      }
    }
    const fn_b = (n,cb) => {
        client.keys('*', (err, r) => cb(err ? "err in get all keys from redis" : null, r))
    }
    const fn_c = (n, cb) => {
        if (n.length <= 0) return cb(null)

        client.del(n, (err, r) => cb(err ? "err in delete all keys from redis" : null, r))
    }
    ayc.waterfall([fn_a, fn_b,fn_c], (err, r) => done(err, r))
}
/**
 * 初始化CacheClient
 */
const initCacheClient = (client, opt) => {
    if (!client) {
        const cache = opt.cache
        return redis.createClient({
            'host': cache.host,
            'port': cache.port,
            'type': cache.type,
        });
    };
    return undefined
}
/**
 * 初始化DataClient
 */
const initDataClient = (client, opt) => {
    if (!client) {
        const data = opt.data
        return require('knex')({
                  client: data.type,
                  connection: {
                    host : data.host,
                    user : data.user,
                    password : data.pwd,
                    database : data.db,
                    port : data.port
                  }
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
  if(!cutKeys){
    cutKeys=[]
  }
    let n = {}
    cutKeys.forEach(key => {
        d.forEach(obj => {
            if (obj[key]) {
                let words = jieba.cut(obj[key],true)
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
 * 根据KEY重组对象
 * @param  {array} returnKeys 返回KEY数组
 * @param  {object} word       输入对象
 * @return {object}            返回对象
 */
const reMixWords = (returnKeys, word) => {
  if(returnKeys.length<=0) return word
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
 * 初始化
 * @param  {object} args 用户传参
 */
const init = (args) => {
    option = Object.assign({}, option, args)
    // 初始化缓存客户端
    cacheClient = initCacheClient(undefined, option)
    // 初始化数据库客户端
    dataClient = initDataClient(undefined,option)
}
/**
 * 以数组初始化数据库
 * @param  {Array}   d                    数据
 * @param  {Function} done                 回调方法
 * @param  {Boolean}  [isAppendData=false] 是否追加数据
 */
const initDataWithArray=(d, done, isAppendData = false)=>{
  //非追加数据清理所有KEY对应UUID
  let fn_a = cb => {
      let n = {}
      n.d = d
      if (!isAppendData) {
          clearAllKeys(cacheClient, (err, r) => cb(err ? 'err in clearAllKeys' : null, n))
      } else {
          cb(null, n)
      }
  }
  //添加UUID并插数据如redis
  let fn_b = (n, cb) => {
      n.d = addUUID(n.d)
      ayc.map(n.d, (item, cbk) => {
          cacheClient.set(item._id, JSON.stringify(item), (err, r) => cbk(err ? err : null, r))
      }, (err, r) => cb(err ? 'err in insert data ' : null, n))
  }
  // 分词处理
  let fn_c = (n, cb) => {
      if (option.cutKeys && option.cutKeys.length>0) {
          n.c = cutWords(option.cutKeys, n.d)
          cb(null, n)
      } else {
          cb('need to setup the cutKeys before calling the data method')
      }
  }
  // 选择db 1 (目前node_redis包不支持切换db,后续版本跟进。)
  let fn_d = (n, cb) => {
      cacheClient.select(1, (err, r) => cb(err ? err : null, n))
  }
  // sadd data 2 redis
  let fn_e = (n, cb) => {
      ayc.map(Object.keys(n.c), (k, cbk) => {
          // 获取UUID数组
          let uuids = Array.of(...n.c[k])
          // 插入redis
          cacheClient.sadd(k, uuids, (err, r) => cbk(err ? err : null, r))
      }, (err, r) => cb(err ? err : null, r))
  }
  // 执行瀑布流
  ayc.waterfall([fn_a, fn_b, fn_c, fn_e], (err, r) => done && done(err, r))
}
/**
 * 以SQL初始化数据库
 * @param  {string}   d                    sql
 * @param  {Function} done                 回调方法
 * @param  {Boolean}  [isAppendData=false] 是否追加数据
 */
const initDataWithSQL=(d, done, isAppendData = false)=>{
  dataClient.raw(d)
  .then(res=>{
    initDataWithArray(res[0],done,isAppendData)
  })
  .catch(err=>{
    done(err,null)
  })
}
/**
 * 中文全文检索引擎
 */
class Engine {
    constructor(args) {
        init(args)
    }
    /**
     * 支持express
     * @param  {string} key  绑定在appKEY
     * @param  {object} args 用户传参
     * @return {fn}      as express middleware
     */
    supportExpres(key) {
        let self = this
        return (req, res, next) => {
            req.app[key] = res.app[key] = self
            next()
        }
    }
    /**
     * 需要进行分词KEY
     * @param  {Array} arr 键数组
     * @return {object}   Search对象
     */
    cutKeys(arr) {
        if (util.isArray(arr)) {
            option['cutKeys'] = arr
        }else{
            option['cutKeys'] = []
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
        }else{
            option['returnKeys'] = []
        }
        return this
    }
    /**
     * 初始化redis数据
     * @param  {[type]}   d           被检索数据
     * @param  {Function} done        回调函数
     * @param  {Boolean}  isAppendData 是否追加数据
     */
    initData(d, done, isAppendData = false) {
        // if (!(util.isArray(d) && cacheClient)) return done(new Error('err in initData'), null)
        // if (!((typeof d == 'string') && dataClient)) return done(new Error('err in initData'), null)
        option.returnKeys && (option.returnKeys=[])
        if(util.isArray(d) && cacheClient){
          return initDataWithArray(d,done,isAppendData)
        }
        else if(typeof d == 'string' && dataClient){
          return initDataWithSQL(d,done,isAppendData)
        }
    }
    /**
     * 追加数据到缓存
     * @param  {[type]} d      [数据]
     * @param  {[type]} doneFn [回调函数]
     */
    appendData(d,doneFn){
        this.initData(d, doneFn, true)
    }
    /**
     * 检索数据
     * @param  {array}   d  关键字数组
     * @param  {Function} done 回调函数
     */
    query(d, done) {

        if (!(util.isArray(d) && cacheClient)) return done(new Error('....'), null)

        // 遍历获取分词对应uuids,数据格式 => '北京':Set(uuid1,uuid2)
        let fn_a = (cb) => {
            ayc.map(d, (word, cbk) => {
                cacheClient.smembers(word, (err, r) => cbk(err ? 'err in smembers uuid from redis' : null, r))

            }, (err, r) => cb(err ? err : null, { uuids: r }))
        }
        // 对获取uuids做唯一性处理
        let fn_b = (n, cb) => {
            let set = new Set();
            n.uuids.forEach(arr => {
                arr.forEach(uuid => {
                    set.add(uuid)
                })
            })
            cb(null, Array.of(...set))
        }
        // 遍历获取uuid对应ObjectString which save in redis
        let fn_c = (n, cb) => {
            ayc.map(n, (uuid, cbk) => {
                //根据uuid去redis获取对象
                cacheClient.get(uuid, (err, r) => {
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

            }, (err, r) => cb(err ? err : null, r))
        }
        // 执行瀑布流
        ayc.waterfall([fn_a, fn_b, fn_c], (err, r) => done && done(err, r) )
    }
    /**
     * 清空所有数据
     * @param  {Function} done 回调函数
     */
    clearAll(done){
      clearAllKeys(cacheClient,done)
    }
}
export {
    addUUID,
    cutWords,
    reMixWords,
    initCacheClient,
    initDataClient,
    initDataWithArray,
    initDataWithSQL,
    clearAllKeys,
    Engine
}
