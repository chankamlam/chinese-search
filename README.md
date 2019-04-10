```ascii
     ________    _                           _____                      __  
    / ____/ /_  (_)___  ___  ________       / ___/___  ____ ___________/ /_
   / /   / __ \/ / __ \/ _ \/ ___/ _ \______\__ \/ _ \/ __ `/ ___/ ___/ __ \
  / /___/ / / / / / / /  __(__  )  __/_____/__/ /  __/ /_/ / /  / /__/ / / /
  \____/_/ /_/_/_/ /_/\___/____/\___/     /____/\___/\__,_/_/   \___/_/ /_/

```
[![Build Status](https://travis-ci.org/chankamlam/chinese-search.svg?branch=master)](https://travis-ci.org/chankamlam/chinese-search)
[![codecov](https://codecov.io/gh/chankamlam/chinese-search/branch/master/graph/badge.svg)](https://codecov.io/gh/chankamlam/chinese-search)
[![Codacy Badge](https://api.codacy.com/project/badge/Grade/8580c5b7b0f147518bf6a1feccd5ef45)](https://app.codacy.com/app/chankamlam/chinese-search?utm_source=github.com&utm_medium=referral&utm_content=chankamlam/chinese-search&utm_campaign=Badge_Grade_Dashboard)
[![MIT Licence](https://badges.frapsoft.com/os/mit/mit.svg?v=103)](https://opensource.org/licenses/mit-license.php)
[![Open Source Love](https://badges.frapsoft.com/os/v1/open-source.svg?v=103)](https://github.com/ellerbrock/open-source-badge/)    
[![作者](https://img.shields.io/badge/author-chankamlam-blue.svg)]()
# 简介
Chinese-Search is a full text search in chinese,base on nodejieba and redis, support to using sql pull data from mysql,
and it is easy, small and fast.

Chinese-Search 是一个全文检索组件,基层实现依赖nodejieba中文分词和redis存储。

# 安装

```js

    npm i chinese-search -s

```

# 测试

```

   npm i
   npm run test

```

# 下一个版本 what is the next

planning to support oracle/mssql in the next version

下一个版本即将支持oracle/mssql数据库，直接导入数据作为检索数据

# 使用

```js

    ## ES5
    var search = require('chinese-search');

    ## ES6
    import search from 'chinese-search'

    var data = [{
        'name': 'C#权威指南-full',
        'title': 'C#权威指南是一本C#进阶学习最好的书籍。',
        'author':'ken',
        'id': 1
    }, {
        'name': 'C++权威指南-full',
        'title': 'A',
        'author':'ken',
        'id': 2
    }, {
        'name': 'PHP权威指南-full',
        'title': 'B',
        'author':'ken',
        'id': 3
    }]

    // [1]启动Redis服务，然后填入数据。
    const s = new search.Engine({
      cache:{
        host:'127.0.0.1',
        port:3679,
        type:'redis'
      }
    })

    s.cutKeys(['name','title'])   // 声明分词的KEY
    .initData(data,(err,r) => {
           if(err){
              console.error(err)
              return
           }
           // 全文检索
            s
             .returnKeys(['name','title','id']) // 声明数据返回包含KEY
             .query(['A'],(err,r)=>{            // 关键字数组
               if (err) {
                 console.error(err);
                      return
               };
                  console.log(r);   
                // 结果：[ { name: 'C++权威指南-full', title: 'A', id: 2 } ]
            })
    })
    // [2]启动Redis服务，mysql数据库，使用sql语句填入数据。
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
    const s = new search.Engine(opt)
    s.cutKeys(['name','title'])
        .initData(sql,(err, r) => {
          if(err){
             console.error(err)
             return
          }
          // 全文检索
           s
            .returnKeys(['name','title','id']) // 声明数据返回包含KEY
            .query(['A'],(err,r)=>{            // 关键字数组
              if (err) {
                console.error(err);
                return
              };
                console.log(r);   
               // 结果：[ { name: 'C++权威指南-full', title: 'A', id: 2 } ]
           })
        })


```
# API

### cutKeys()
```js

    // 声明分词的KEY，这步是必须的，否则报错
    s.cutKeys(['name','title'])

    // 假如被分词数据没有某个KEY，将略过
    s.cutKeys(['name','title','description'])

```

### intData()
```js

    var s = new search.Engine({'host':'127.0.0.1','port':4000})
            .cutKeys(['name','title'])   // 声明分词的KEY
            .initData(data,(err,r) => {      // data必须是个数组
                   if(err){
                        // 错误处理
                      return
                   }
                         // 正常在这里可以使用query()
                         //
                })

```

### appendData()
```js

    // 重声明分词的KEY并追加被检索数据
     s.cutKeys(['name']) // 重声明分词的KEY，非重声明则按照初始化设定
      .appendData([{
        'name': 'NodeJS权威指南',
        'title': 'NodeJS',
        'author':'ken',
        'id': 4
      }])

```

### returnKeys()
```js

     // 声明数据返回包含KEY
     s.returnKeys(['name','title','id'])
     .query(['A'],(err,r)=>{
        if (err) {
            console.log(err);
            return
        };
        // 结果：[ { name: 'AAA', title: 'A', id: 2 } ]
        console.log(r);   
    })

    // 声明数据返回包含KEY
    s.returnKeys(['name'])
     .query(['A'],(err,r)=>{
        if (err) {
            console.log(err);
            return
        };
        // 结果：[ { name: 'AAA' } ]
        console.log(r);   
    })

    // 没有声明数据返回包含KEY，则返回所有
    s.query(['A'],(err,r)=>{
        if (err) {
            console.log(err);
            return
        };
        // 结果：[ { name: 'AAA', title: 'A', id: 2}]
        console.log(r);   
    })

```
### query()
```js

    // 根据关键字数组查询
    s.query(['A','B'],(err,r)=>{
        if (err) {
            console.log(err);
            return
        };
        // 结果：[ { name: 'AAA', title: 'YYYYY', id: 2} } ,{ name: 'BBB', title: 'XXXXXX', id: 1}} ]
        console.log(r);   
    })

    // 根据关键字数组查询
    s.query(['A'],(err,r)=>{
        if (err) {
            console.log(err);
            return
        };
        // 结果：[ { name: 'AAA', title: 'YYYYY', id: 2} }]
        console.log(r);   
    })

```
# author

  author : chankamlam(Ken)

  Email : 919125189@qq.com


# license
```js

   MIT

```
