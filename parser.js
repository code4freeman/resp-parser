"use strict";

//对象中保存chunks的key和回调队列的key
let callbacks = "", chunks = "";

function handler(chunk)
{

    //向队列中获取回调，这里方便调试才单独整一个函数
    const f1 = ()=>
    {
        let cb = this[callbacks].shift();
        // console.log(`第${i}个回调弹出使用=====================================>`)
        // console.log(`剩余${this[callbacks].length}个=========================<`)
        return cb;
    }

    //积攒
    this[chunks] = Buffer.concat([this[chunks], chunk]);

    //这里暂不做首个字符检查
    //...

    //递归
    const action = ()=>
    {
        let firstByte = this[chunks][0];

        //处理+
        if(firstByte === 43)
        {
            let data = [], index = 1;
            //获取数据
            for(let i = 1; i < this[chunks].length; i++)
            {   
                data.push(this[chunks][i]);
                if(this[chunks][i+1] === 13 && this[chunks][i+2] === 10)
                {
                    index = i+2;
                    break;
                }
            }
            //截断数据
            if(index > 1)
            {
                this[chunks] = this[chunks].slice(index + 1);
                this[callbacks][0] && f1()("+", Buffer.from(data).toString());
                console.log("+" + Buffer.from(data).toString());
                action();
            }
        }

        //处理-
        if (firstByte === 45)
        {   
            let data = [], index = 1;
            //获取数据
            for (let i = 1; i < this[chunks].length; i++)
            {
                data.push(this[chunks][i]);
                if (this[chunks][i+1] === 13 && this[chunks][i + 2] === 10)
                {   
                    index = i + 2;
                    break;
                }
            }
            //截断数据
            if (index > 1) 
            {   
                this[chunks] = this[chunks].slice(index + 1);
                this[callbacks][0] && f1()("-" + Buffer.from(data).toString());
                console.log("-" + Buffer.from(data).toString());
                action();
            }
        }

        //处理:
        if (firstByte === 58)
        {
            let data = [], index = 1;
            //获取数据
            for (let i = 1; i < this[chunks].length; i++) 
            {
                data.push(this[chunks][i]);
                if (this[chunks][i + 1] === 13 && this[chunks][i + 2] === 10)
                {
                    index = i + 2;
                    break;
                }
            }
            //截断数据
            if (index > 1)
            {   
                this[chunks] = this[chunks].slice(index + 1);
                this[callbacks][0] && f1()(":" + Buffer.from(data).toString());
                console.log(":" + Buffer.from(data).toString());
                action();
            }
        }

        //处理$
        if(firstByte === 36)
        {  
            //空字符$0\r\n\r\n
            if(this[chunks][1] === 48)
            {
                let index = 1;
                if (this[chunks][index + 1] === 13 && this[chunks][index + 2] === 10 && this[chunks][index + 3] === 13 && this[chunks][index + 4] === 10)
                {
                    index += 4;
                }
                if (index > 1) 
                {
                    this[chunks] = this[chunks].slice(index + 1);
                    this[callbacks][0] && f1()("$", "");
                    console.log("$" + "");
                    action();
                }
            }
            //null $-1\r\n
            if(this[chunks][1] === 45)
            {
                let index = 1;
                if (this[chunks][index + 1] === 49 && this[chunks][index + 2] === 13 && this[chunks][index + 3] === 10) 
                {
                    index += 3;
                }
                if (index > 1)
                {
                    this[chunks] = this[chunks].slice(index + 1);
                    this[callbacks][0] && f1()("$", null);
                    console.log("$", null);
                    action();
                }
            }

            //正常$x\r\nx\r\n
            let data = [], index = 1;
            //获取num
            for (let i = 1; i < this[chunks].length; i++) 
            {
                data.push(this[chunks][i]);
                if (this[chunks][i + 1] === 13 && this[chunks][i + 2] === 10) 
                {
                    index = i + 2;
                    break;
                }
            }
            //根据num获取数据
            if(index > 1)
            {   
                let num = Number(Buffer.from(data).toString());
                if (this[chunks][index + num + 1] === 13 && this[chunks][index + num + 2] === 10)
                {
                    let 
                    data = this[chunks].slice(index + 1,  index + num + 1),
                    data2 = data.toString();
                    this[chunks] = this[chunks].slice(index + num + 2 + 1);
                    this[callbacks][0] && f1()("$", data2);
                    console.log("$" + Buffer.from(data).toString());
                    action();
                }
            }
        }

        //处理*
        if (firstByte === 42) 
        {
            //空阵列*0\r\n
            if (this[chunks][1] === 48) 
            {
                let index = 1;
                if (this[chunks][index + 1] === 13 && this[chunks][index + 2] === 10)
                {
                    index += 2;
                }
                if(index > 1)
                {
                    this[callbacks][0] && f1()("*", []);
                    this[chunks] = this[chunks].slice(index + 1);
                    action();
                }
            }
            //null*-1\r\n
            if (this[chunks][1] === 45) 
            {   
                let index = 1;
                if (this[chunks][index + 1] === 49 && this[chunks][index + 2] === 13 && this[chunks][index + 3] === 10)
                {
                    index += 3;
                }
                if(index > 1)
                {
                    this[callbacks][0] && f1()("*", null);
                    this[chunks] = this[chunks].slice(index + 1);
                    action();
                }
            }

            //正常*x\r\n...
            let data = [], index = 1;
            //获取num
            for (let i = 1; i < this[chunks].length; i++) 
            {
                data.push(this[chunks][i]);
                if (this[chunks][i + 1] === 13 && this[chunks][i + 2] === 10) 
                {   
                    index = i + 2;
                    break;
                }
            }

            if (index > 1)
            {
                //克隆一下chunks，因为后面的运算会进行删减操作
                let buf = Buffer.concat([this[chunks]]);
                //数据长度
                let num = Number(Buffer.from(data).toString());
                //用于存储解阵列里析出来的数据
                let arr = [];
                //记录处理数据的长度
                let position = 0;
                //去除头部的*x\r\n
                buf = buf.slice(index+1);

                // for(let i = 0; i < buf.length; i++)
                // {
                //     console.log(buf[i]);
                // }

                /*
                * 开始计算count，最后如果count === len则验证通过
                * 开始计算，根据上面计算:、$、-、+、的方式一样
                * 这里用递实现循环， 后期维护在考虑这里实现多维度阵列的解析
                */
                const action2 = ()=>
                {
                    /*
                    * 这里每次处理都先判断一下count是否等于len， 是则退出action2递归，进行后续的代码执行
                    */

                    //处理+
                    if (buf[0] === 43) 
                    {   
                        if(num === arr.length) return;

                        let data = [], index = 1;
                        //获取数据
                        for (let i = 1; i < buf.length; i++) 
                        {
                            data.push(buf[i]);
                            if (buf[i + 1] === 13 && buf[i + 2] === 10) 
                            {
                                index = i + 2;
                                break;
                            }
                        }
                        //截断数据
                        if (index > 1) 
                        {   
                            position += index + 1; //已处理长度
                            buf = buf.slice(index + 1);//去掉已处理的buf
                            arr.push("+"+Buffer.from(data).toString());
                            // console.log(Buffer.from(data).toString())
                            // console.log(buf)
                            action2();
                        }
                    }

                    //处理-
                    if (buf[0] === 45) 
                    {   
                        if(num === arr.length) return;

                        let data = [], index = 1;
                        //获取数据
                        for (let i = 1; i < buf.length; i++) 
                        {
                            data.push(buf[i]);
                            if (buf[i + 1] === 13 && buf[i + 2] === 10) 
                            {
                                index = i + 2;
                                break;
                            }
                        }
                        //截断数据
                        if (index > 1) 
                        {
                            position = index + 1;
                            buf = buf.slice(index + 1);
                            arr.push("-" + Buffer.from(data).toString());
                            // console.log(Buffer.from(data).toString())
                            // console.log(buf)
                            action2();
                        }
                    }

                    //处理:
                    if (buf[0]=== 58) 
                    {   
                        if(num === arr.length) return;

                        let data = [], index = 1;
                        //获取数据
                        for (let i = 1; i < buf.length; i++) 
                        {
                            data.push(buf[i]);
                            if (buf[i + 1] === 13 && buf[i + 2] === 10)
                            {
                                index = i + 2;
                                break;
                            }
                        }
                        //截断数据
                        if (index > 1) 
                        {
                            position += index + 1;
                            buf = buf.slice(index + 1);
                            arr.push(":" + Buffer.from(data).toString());
                            // console.log(Buffer.from(data).toString())
                            // console.log(buf)
                            action2();
                        }
                    }

                    //处理$
                    if (buf[0] === 36)
                    {
                        //空字符$0\r\n\r\n
                        if (buf[1] === 48) 
                        {   
                            if (num === arr.length) return;

                            let index = 1;
                            if (buf[index + 1] === 13 && buf[index + 2] === 10 && buf[index + 3] === 13 && buf[index + 4] === 10)
                            {
                                index += 4;
                            }
                            if (index > 1) 
                            {   
                                position += index + 1;
                                buf = buf.slice(index + 1);
                                arr.push("");
                                action2();
                            }
                        }
                        //null $-1\r\n
                        if (buf[1] === 45) 
                        {
                            if (num === arr.length) return;

                            let index = 1;
                            if (buf[index + 1] === 49 && buf[index + 2] === 13 && buf[index + 3] === 10)
                            {
                                index += 3;
                            }
                            if (index > 1) 
                            {   
                                position += index + 1;
                                buf = buf.slice(index + 1);
                                arr.push(null);
                                action2();
                            }
                        }

                        if(num === arr.length) return;
                        //正常$x\r\nx\r\n
                        let data = [], index = 1;
                        //获取num
                        for (let i = 1; i < buf.length; i++)
                        {
                            data.push(buf[i]);
                            if (buf[i + 1] === 13 && buf[i + 2] === 10) 
                            {
                                index = i + 2;
                                break;
                            }
                        }
                        //根据num获取数据
                        if (index > 1) 
                        {   
                            let num = Number(Buffer.from(data).toString());
                            if (buf[index + num + 1] === 13 && buf[index + num + 2] === 10) 
                            {
                                let
                                data = buf.slice(index + 1, index + num + 1),
                                data2 = data.toString();
                                position += (index + num + 2 + 1);
                                buf = buf.slice(index + num + 2 + 1);
                                arr.push(data2);
                                // console.log(data2);
                                // console.log(buf);
                                action2();
                            }
                        }
                    }
                }
                action2();


                /*
                * 这里判断count === len则通过，并在chunks中删除已解析的字符，然后继续执行递归
                * 反之不予理会
                */
                if(arr.length === num)
                {
                    this[callbacks][0] && f1()("*", arr);
                    this[chunks] = this[chunks].slice(index + position + 1);
                    console.log("*" + arr.toString());
                    action();
                }
            }
        }
    }
    action();
}

module.exports = function(_callbacks, _chunks)
{
    callbacks = _callbacks;
    chunks = _chunks;
    return handler;
}

/*
 调试验证记录

 最后调试日期：
 2019/04/13 凌晨00:51
 2019/04/13 凌晨01:18
 2019/04/14 下午12:52
 2019/04/24 中午12:31 修改读取数据中含有换行符号时，导致的解析出错
 2019/04/27 下午15:44 由于前面才用正则分析，导致很多数据中出现的特殊符号与resp标准中的分隔符重复，现在直接对二进制进行ASCII对比识别，彻底避免了这一问题

*/