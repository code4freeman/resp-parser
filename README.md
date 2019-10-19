# RESP解析器
[resp标准](https://redis.io/topics/protocol)

## 方法
*Parser.prototype.parse(String)*
* 参数，resp协议数据

## 事件
*data*
* 携带参数为解析后的数据

*warn*
* 携带参数为警告内容，在底层socket分包返回resp内容时导致单个包不足以解析出完成数据时触发

*error*
* 携带错误对象，在resp结构有错误时候触发

## 简单示例
```js
const testResp = `*2\r\n+ok\r\n+success\r\n`;

let parser = new Parser();

parser.on("data", data => {
    cosnole.log(data);  // ["ok", "success"]
});

parser.parse(testResp);
```