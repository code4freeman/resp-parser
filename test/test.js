const fs = require("fs");
const Parser = require("../index");

let parser = new Parser();

parser.on("error", str => {
	console.log("！！！有错误日志");
	fs.appendFileSync("error.log", new Date().toLocaleTimeString() +"\n"+ str + "\n\n");
});
parser.on("warn", str => {
	console.log("！！！有警告日志");
	fs.appendFileSync("warn.log", new Date().toLocaleTimeString() +"\n"+ str + "\n\n");
});
parser.on("data", data => {
	console.log("data事件 => ");
	console.log(data);
	fs.writeFileSync("json.json", JSON.stringify(data, null, 4));
});

//取消debug模式（不显示调试信息）
parser.DEBUG = false;

parser.parse(fs.readFileSync("./data.text"));