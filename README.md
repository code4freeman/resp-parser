# RESP解析器
[resp标准](https://redis.io/topics/protocol)

## 问题
* 解决数据过长导致的递归停止问题；这里准备采用循环来替代
* 设计一个缓存，解决数据过长处理速度慢跟不上chunk事件的问题