const fs = require("fs");
const Parse = require("./index");

let parse = new Parse();

parse.on("data", data => {
	console.log("data事件 => ");
	console.log(data);
	fs.writeFileSync("json.json", JSON.stringify(data, null, 4));
});

parse.parse(fs.readFileSync("./data.text"));