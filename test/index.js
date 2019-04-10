const mocha  = require("mocha");
const should = require("should");
const ayc = require("async");

const search = require("../index.js");

const debug = require("debug");

const {
    addUUID,
    cutWords,
    reMixWords,
    initCacheClient,
    initDataClient,
    clearAllKeys,
    Engine,
} = search

let log = debug("debug:log")

describe(' - 测试公共方法调用', function() {
    let s
    beforeEach(() => {
        s = new Engine({})
    })
    it('test common method -> addUUID', function() {
        let d = addUUID([{
            'name': 'aAa',
            'title': '你好吗？老师!'
        }, {
            'name': 'bBb',
            'title': '中午还没有吃饭呢！aAa'
        }])
        log(d);
        d.should.matchEach(function(value) { value.should.have.property('_id') });
    });
    it('test common method -> cutWords', function() {
        let objs = cutWords(['name', 'title'], addUUID([{
            'name': 'aAa',
            'title': '你好吗？老师!'
        }, {
            'name': 'bBb',
            'title': '老师！他中午还没有吃饭呢!aAa'
        }]))
        log(objs);
        objs['aAa'].size.should.eql(2)
        objs['!'].size.should.eql(2)
        objs['老师'].size.should.eql(2)
        objs['！'].size.should.eql(1)
    });
    it('test common method -> reMixWords', function() {

        let word = reMixWords(['name', 'title'], {
            'name': 'ken',
            'title': 'i am 18 years old',
            'desc': 'from hk',
            'id': 10
        })
        log(word)
        word.should.have.property('name')
        word.should.have.property('title')

    });
    it('test common method -> initCacheClient', function(done) {
        let opt = {
            'host': '127.0.0.1',
            'port': 6379
        }
        let client = initCacheClient(null, {cache:opt})
        client.echo('helo', (err, r) => {
            log(r)
            r.should.eql('helo')
            done()
        })
    });
    it('test common method -> initDataClient', function(done) {
      let sql = 'select * from book'
      let opt = {
          host:'127.0.0.1',
          port:3306,
          db:'test',
          user:'root',
          pwd:'Ken5201314',
          type:'mysql'
      }
      if(process.env["CODECOV_TOKEN"]){
        opt.pwd = ''
      }
        let client = initDataClient(null, {data:opt})
        client.raw(sql)
        .then(res=>{
          res[0].length.should.eql(3)
          done()
        })
    });
    it('test common method -> clearAllKeys', function(done) {
        let opt = {
            'host': '127.0.0.1',
            'port': 6379
        }
        let client = initCacheClient(null, {cache:opt})
        clearAllKeys(client, (err, r) => {
            if (err) {
                log(err)
            } else {
                log(r)
                done()
            }
        })
    });

});


describe(' - 测试API(SQL填入数据)', function() {
    let s=null
    let sql = 'select * from book'
    let opt = {cache:{
        'host': '127.0.0.1',
        'port': 6379
    },
    data:{
        host:'127.0.0.1',
        port:3306,
        db:'test',
        user:'root',
        pwd:'Ken5201314',
        type:'mysql'
    }}
    if(process.env["CODECOV_TOKEN"]){
      data.pwd = ''
    }
    beforeEach(() => {
        s = new Engine(opt)
    })
    it('test API -> cutKeys && initData with sql', function(done) {
        s.cutKeys(['book_desc', 'book_title'])
            .initData(sql,(err, r) => {
                if (err) {
                  log(err)
                } else {
                  log(r)
                  done()
                }
            })
    });
    // it('test API -> appendData', function(done) {
    //     s.cutKeys(['name', 'title'])
    //         .initData([{
    //             id: 0,
    //             'name': 'aAa',
    //             'title': '你好吗？老师!'
    //         }, {
    //             id: 1,
    //             'name': 'bBb',
    //             'title': '老师！他中午还没有吃饭呢!aAa'
    //         }], (err, r) => {
    //             s.appendData([{ id: 3, 'name': 'kkk', 'title': 'aAa' }], (err, r) => {
    //                 if (err) {
    //                     log(err)
    //                 } else {
    //                     log(r)
    //                     done()
    //                 }
    //             })
    //         })
    // });
    it('test API -> query', function(done) {
        s.cutKeys(['book_desc', 'book_title'])
            .initData(sql, (err, r) => {
                if (err) {
                  log(err)
                } else {
                  s.query(['PHP'], (err, r) => {
                    if (err) {
                      log(err)
                    } else {
                      log(r)
                      r.length.should.eql(1)
                      r[0].should.have.property('book_id')
                      r[0].should.have.property('book_desc')
                      r[0].should.have.property('book_title')
                      r[0].should.have.property('_id')
                      done()
                    }
                  })
                }
            })
    });
    it('test API -> returnKeys', function(done) {
        s.cutKeys(['book_desc', 'book_anthor'])
            .initData(sql, (err, r) => {
                if (!err) {
                    s.returnKeys(['book_id', 'book_desc', 'book_title'])
                    .query(['ben'], (err, r) => {
                        if (err) {
                            log(err)
                        } else {
                            log(r)
                            r.length.should.eql(2)
                            r[0].should.have.property('book_id')
                            r[0].should.have.property('book_desc')
                            r[0].should.have.property('book_title')
                            r[0].should.not.have.keys('_id')
                            done()
                        }
                    })
                } else {
                    log(err)
                }
            })
    });
    it('test API -> clearAll', function(done) {
        s.clearAll((err, r) => {
            if (err) {
                log(err)
            } else {
                log(r)
                done()
            }
        })
    });
});

describe(' - 测试API(数组填入数据)', function() {
    let s=null
    let opt = {cache:{
        'host': '127.0.0.1',
        'port': 6379
    },
    data:{
        host:'127.0.0.1',
        port:3306,
        db:'test',
        user:'root',
        pwd:'Ken5201314',
        type:'mysql'
    }}
    beforeEach(() => {
        s = new Engine(opt)
    })
    it('test API -> cutKeys && initData with data', function(done) {
        s.cutKeys(['name', 'title'])
            .initData([{
                id: 0,
                'name': 'aAa',
                'title': '你好吗？老师!'
            }, {
                id: 1,
                'name': 'bBb',
                'title': '老师！他中午还没有吃饭呢!aAa'
            }], (err, r) => {
                if (err) {
                  log(err)
                } else {
                  log(r)
                  done()
                }
            })
    });
    it('test API -> appendData', function(done) {
        s.cutKeys(['name', 'title'])
            .initData([{
                id: 0,
                'name': 'aAa',
                'title': '你好吗？老师!'
            }, {
                id: 1,
                'name': 'bBb',
                'title': '老师！他中午还没有吃饭呢!aAa'
            }], (err, r) => {
                s.appendData([{ id: 3, 'name': 'kkk', 'title': 'aAa' }], (err, r) => {
                    if (err) {
                        log(err)
                    } else {
                        log(r)
                        done()
                    }
                })
            })
    });
    it('test API -> query', function(done) {
        s.cutKeys(['name', 'title'])
            .initData([{
                id: 0,
                'name': 'aAa',
                'title': '你好吗？老师!'
            }, {
                id: 1,
                'name': 'bBb',
                'title': '老师！他中午还没有吃饭呢!'
            }], (err, r) => {
                if (!err) {
                    s.query(['aAa'], (err, r) => {
                        if (err) {
                            log(err)
                        } else {
                            log(r)
                            r.length.should.eql(1)
                            r[0].should.have.property('id')
                            r[0].should.have.property('name')
                            r[0].should.have.property('title')
                            r[0].should.have.property('_id')
                            done()
                        }
                    })
                } else {
                    log(err)
                }
            })
    });
    it('test API -> returnKeys', function(done) {
        s.cutKeys(['name', 'title'])
            .initData([{
                id: 0,
                'name': 'aAa',
                'title': '你好吗？老师!'
            }, {
                id: 1,
                'name': 'bBb',
                'title': '老师！他中午还没有吃饭呢!'
            }], (err, r) => {
                if (!err) {
                    s.returnKeys(['id', 'name', 'title'])
                    .query(['aAa'], (err, r) => {
                        if (err) {
                            log(err)
                        } else {
                            log(r)
                            r.length.should.eql(1)
                            r[0].should.have.property('id')
                            r[0].should.have.property('name')
                            r[0].should.have.property('title')
                            r[0].should.not.have.keys('_id')
                            done()
                        }
                    })
                } else {
                    log(err)
                }
            })
    });
    it('test API -> clearAll', function(done) {
        s.clearAll((err, r) => {
            if (err) {
                log(err)
            } else {
                log(r)
                done()
            }
        })
    });
});
