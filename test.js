const parser = require("./parser")("_func", "_chunks");
const fs = require("fs");
function F()
{
    this._func = [];
    this._chunks = Buffer.from([]);
}
F.prototype._parse = parser;
F.prototype.test = function()
{
    let data = fs.readFileSync("./data.txt");
    this._parse(data);
}




//=========================================================================================
let f = new F();
f.test();