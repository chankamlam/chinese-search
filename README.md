# chinese-search

    chinese-search是一个全文检索组件，基层实现依赖"nodejieba"中文分词和“redis”集合存储。

# Install with

    npm install chinese-search

# Usage Example

```js
var search = require('chinese-search');

var str = [{
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

// index() 用以输入需要进行分词的列
// key() 用以输入对应分词返回数据需要存储的列，至少你需要存储id，通过id于数据库获取其它你需要的数据内容。
// data() 用以输入需要分词数据源
var s=search({'host':'127.0.0.1','port':4000})
       .index(['name','title'])
       .key(['name','title','id'])
       .data(str)

// query() 关键字检索
s.query('A',(err,r)=>{
	if (err) {
		console.log(err);
	};
	console.log(r);   // 结果：[ { name: 'C++权威指南-full', title: 'A', id: 2 } ]
})

```
# 特点
     这个全文检索组件最大特点: 是通过index()和key()可以自定义你需要分词的列和分词对应返回的数据结构,
     减少因为只返回id而需要频繁检索数据库的机率.
