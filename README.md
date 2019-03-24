```ascii
     ________    _                           _____                      __  
    / ____/ /_  (_)___  ___  ________       / ___/___  ____ ___________/ /_
   / /   / __ \/ / __ \/ _ \/ ___/ _ \______\__ \/ _ \/ __ `/ ___/ ___/ __ \
  / /___/ / / / / / / /  __(__  )  __/_____/__/ /  __/ /_/ / /  / /__/ / / /
  \____/_/ /_/_/_/ /_/\___/____/\___/     /____/\___/\__,_/_/   \___/_/ /_/

```
# 简介

```js

    Chinese-Search 是一个全文检索组件,基层实现依赖nodejieba中文分词和redis集合存储。

    Chinese-Search is a full text search in chinese,base on nodejieba and redis,
    and it is easy, small and fast than by using mysql with sql like.

```

# 安装

```js

    npm i chinese-search -s

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
    var s = search.Engine({
      cache:{
        host:'127.0.0.1',
        port:4000,
        type:'redis'
      }
    })
    .cutKeys(['desc','title'])   // 声明分词的KEY
    .data(data,(err,r) => {
           if(err){
              console.error(err)
              return
           }
           // 查询
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
