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
    s.query('A',(err,r)=>{
    	if (err) {
    		console.log(err);
            return
    	};
        // 结果：[ { name: 'C++权威指南-full', title: 'A', id: 2 } ]
        console.log(r);   
    })

```
# API
### cutKeys
```js
```
### data
```js
```
### addData
```js
```

