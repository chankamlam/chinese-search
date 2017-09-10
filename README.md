# 简介

```js

    chinese-search是一个全文检索组件，
    基层实现依赖nodejieba中文分词和redis集合存储。

    chinese-search is a full text search in chinese, 
    base on nodejieba and redis.
    it is easy, small and fast than using mysql.

```

# 安装

```js

    npm install chinese-search
    
```

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

    // 启动Redis服务，然后填入数据。
    var s = search.Engine({'host':'127.0.0.1','port':4000})
            .cutKeys(['name','title'])   // 声明分词的KEY
            .data(data,(err,r) => {
                   if(err){
                        // 错误处理
                      return
                   }
                         // 正常在这里可以使用query()
                         // 
                })

    // 查询
    s.returnKeys(['name','title','id']) // 声明数据返回包含KEY
     .query(['A'],(err,r)=>{            // 关键字数组
    	if (err) {
    		console.log(err);
            return
    	};
        console.log(r);   
        // 结果：[ { name: 'C++权威指南-full', title: 'A', id: 2 } ]
    })

    ### Express使用
    app.use(search.Engine({'host':'127.0.0.1','port':4000}).supportExpres('SEARCHENGINE'))
    // 你可以在这些地方找到引擎对象，然后对它操作
    // req.app['SEARCHENGINE'],res.app['SEARCHENGINE'],app['SEARCHENGINE']
    app['SEARCHENGINE'].cutKeys(['name','title']) 
            .data(data,(err,r) => {
                   if(err){
                        // 错误处理
                      return
                   }
                         // 正常在这里可以使用query()
                         // 
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
### data()
```js

    var s = search.Engine({'host':'127.0.0.1','port':4000})
            .cutKeys(['name','title'])   // 声明分词的KEY
            .data(data,(err,r) => {      // data必须是个数组
                   if(err){
                        // 错误处理
                      return
                   }
                         // 正常在这里可以使用query()
                         // 
                })

```
### addData()
```js

     // 追加被检索数据
     s.addData([{
        'name': 'NodeJS权威指南',
        'title': 'NodeJS',
        'author':'ken',
        'id': 4
     }])

    // 重声明分词的KEY并追加被检索数据
     s.cutKeys(['name']) // 重声明分词的KEY，非重声明则按照初始化设定
      .addData([{
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
# license
```js

   MIT

```
