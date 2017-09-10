import mocha from "mocha";
import should from "should";
import ayc from "async";
import {
	addUUID,
    cutWords,
    reMixWords,
    initRedisClient,
    sadd2Redis,
    clearAllKeys,
    Search,
} from "../dist/index";
import debug from "debug";


let log = debug("reIndex:log")

describe(' - 测试公共方法调用', function() {
    let s
    beforeEach(() => {
        s = new Search({})
    })
    it('test method addUUID', function() {
    	let d = addUUID([{
            id: 0,
            'name': 'aAa',
            'title':'你好吗？老师!'
        }, {
            id: 1,
            'name': 'bBb',
            'title':'中午还没有吃饭呢！aAa'
        }])
        log(d);
        d[0].should.be.have.property("_id")
    });
    it('test method cutWords', function() {
        let objs = cutWords(['name','title'], addUUID([{
            id: 0,
            'name': 'aAa',
            'title':'你好吗？老师!'
        }, {
            id: 1,
            'name': 'bBb',
            'title':'老师！他中午还没有吃饭呢!aAa'
        }]))
        log(objs);
        objs['aAa'].size.should.eql(2)
        objs['!'].size.should.eql(2)
        objs['老师'].size.should.eql(2)
        objs['！'].size.should.eql(1)
    });
    it('test method reMixWords', function() {

    	let word = reMixWords(['name','title'],{
    		'name':'ken',
    		'title':'i am 18 years old',
    		'desc':'from hk',
    		'id':10
    	})
    	log(word)
    	word.should.be.have.property('name')
    	word.should.be.have.property('title')
    	
    });
    it('test method initRedisClient', function(done) {
    	let opt={
    		'host':'127.0.0.1',
    		'port':6379
    	}
    	let client = initRedisClient(null,opt)
    	client.echo('helo',(err,r)=>{
    		log(r)
    		r.should.eql('helo')
    		done()
    	})
    });
    it('test method clearAllKeys', function(done) {
    	let opt={
    		'host':'127.0.0.1',
    		'port':6379
    	}
    	let client = initRedisClient(null,opt)
    	clearAllKeys(client,(err,r)=>{
            if(!err){
    		done()
                
            }
    	})
    });
    it('test method sadd2Redis', function(done) {
    	let objs = cutWords(['name','title'], addUUID([{
            id: 0,
            'name': 'aAa',
            'title':'你好吗？老师!'
        }, {
            id: 1,
            'name': 'bBb',
            'title':'老师！他中午还没有吃饭呢!aAa'
        }]))
    	let opt={
    		'host':'127.0.0.1',
    		'port':6379
    	}
    	let client = initRedisClient(null,opt)
       ayc.map(Object.keys(objs), (k, cbk) => {
            // 获取UUID数组
            let uuids = Array.of(...objs[k])
            log(k+' => '+uuids)
            // 插入redis
            sadd2Redis(client,k,uuids,(err,r)=>{
                if(err){
                    cbk(err)
                }else{
                cbk(null,r)
                }
            })
        }, (err, r) => {
            if (!err) {            
            log(r)
            done()
            }
        })
    });
});
describe(' - 测试API', function() {
    it('test API cutKeys && data', function(done) {
        let opt={
            'host':'127.0.0.1',
            'port':6379
        }
        let s = new Search(opt)
        s.cutKeys(['name'])
        // .data([{
        //     id: 0,
        //     'name': 'aAa',
        //     'title':'你好吗？老师!'
        // }, {
        //     id: 1,
        //     'name': 'bBb',
        //     'title':'中午还没有吃饭呢！aAa'
        // }],(err,r)=>{
        //     // if(!err){
        //     //     log(r)
        //     //     done()
        //     // }
        //     log(err)
        //     log(r)
        //     done()
        // })
        log(s.cutKeys)
        done()
    });
});
// 
//