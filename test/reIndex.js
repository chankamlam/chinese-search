import mocha from "mocha";
import should from "should";
import {
	addUUID,
    cutWords,
    reMixWords,
    Search
} from "../dist/index";
import debug from "debug";
let log = debug("reIndex:log")
describe('- 测试公共方法调用', function() {
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
});
// 
//