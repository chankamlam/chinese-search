# 简介

    chinese-search是一个全文检索组件，基层实现依赖"nodejieba"中文分词和“redis”集合存储。
    chinese-search is a full text search in chinese , base on nodejieba and redis.
    it is easy, small and fast than using mysql.

# 安装
    npm install chinese-search

# 使用

```js
    var search = require('chinese-search');

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
    // 启动服务，首先填入数据。这些检索数据将会保存在redis里面
    var s = search({'host':'127.0.0.1','port':4000})
            .cutKeys(['name','title'])
            .data(data,() => {
                // 填完数据后处理
                })

    // 关键字检索
    s.returnKeys(['name','title','id'])
     .query('A',(err,r)=>{
    	if (err) {
    		console.log(err);
            return
    	};
        // 结果：[ { name: 'C++权威指南-full', title: 'A', id: 2 } ]
        console.log(r);   
    })

```
# API
### cutKeys()
```js
    // 设置需要分词的键，这步是必须的，否则报错
    s.cutKeys(['name','title'])
    // 假如被分词数据没有某个KEY，将略过
    s.cutKeys(['name','title','description'])
```
### data()
```js
```
### addData()
```js
     // 追加数据
     s.addData([{
        'name': 'NodeJS权威指南',
        'title': 'NodeJS',
        'author':'ken',
        'id': 4
     }])
    // 重定义分词键并追加数据
     s.cutKeys(['name']) //默认按初始化设定
      .addData([{
        'name': 'NodeJS权威指南',
        'title': 'NodeJS',
        'author':'ken',
        'id': 4
      }])
```
### returnKeys()
```js
     // 根据需要选择返回数据KEY
     s.returnKeys(['name','title','id'])
     .query(['A'],(err,r)=>{
        if (err) {
            console.log(err);
            return
        };
        // 结果：[ { name: 'AAA', title: 'A', id: 2 } ]
        console.log(r);   
    })
    // 根据需要选择返回数据KEY
    s.returnKeys(['name'])
     .query(['A'],(err,r)=>{
        if (err) {
            console.log(err);
            return
        };
        // 结果：[ { name: 'AAA' } ]
        console.log(r);   
    })
```
### query()
```js
    // 根据需要选择返回数据KEY
    s.returnKeys(['name'])
     .query(['A','B'],(err,r)=>{
        if (err) {
            console.log(err);
            return
        };
        // 结果：[ { name: 'AAA' } ,{ name: 'BBB' } ]
        console.log(r);   
    })
```
