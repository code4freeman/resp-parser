"use strict"

const {EventEmitter:Emitter} = require("events");
let test = 0;
module.exports = class Parse extends Emitter{

	constructor () {
		super();
		this.DEBUG = true;
		/**
		 * 返回数据累计 
		 */
		this.chunk = Buffer.from([]);
		/**
		 * 深度栈，递归解析*时候使用 
		 */
		this.deepStack = [];
		/**
		 * 处理索引 
		 */
		this.index = 0;
		/**
		 * 控制符ascii字典
		 */
		this.ascii = {
			CR:     13,
			LF:     10,
			ADD:    43,
			SUB:    45,
			DOLLAR: 36,
			COLON:  58,
			STAR:   42
		}
		/**
		 * asii数组,不包含CR\LF （数据同ascii，只是结构不一样） 
		 */
		this.asciis = [];
		Object.keys(this.ascii).forEach(key => {
			if (!["CR", "LF"].includes(key)) this.asciis.push(this.ascii[key]);
		});
	}

	/**
	 * 解析方法
	 * 
	 * @param {Buffer} respChunk 
	 */
	parse (respChunk = null) {
		
		/**
		 * 累加chunk （如果有）
		 */
		if (respChunk) {
			if (!(respChunk instanceof Buffer)) {
				const err = new Error("respChunk 必须为Buffer类型");
				this.emit("error", err);
				throw err;
			}
			this.chunk = Buffer.concat([this.chunk, respChunk]);
		}

		/**
		 * 处理 + 
		 */
		if (this.chunk[this.index] === this.ascii.ADD) {
			this.index ++;
			let data = [], byte = null;
			while (this.index < this.chunk.byteLength) {
				byte = this.chunk[this.index];
				if (byte === this.ascii.CR && this.chunk[this.index + 1] === this.ascii.LF) {
					break;
				} else {
					data.push(byte);
					this.index ++;
				}
			}
			/**
			 * 在递归处理*时候与正常解析的处理方式不一样的 
			 */
			if (this.deepStack.length > 0) {
				data = Buffer.from(data).toString();
				const lastChild = this.deepStack[this.deepStack.length - 1];
				lastChild.num ++;
				lastChild.data.push(data);
				this.index += 2;
				if (lastChild.num === lastChild.length) return;
			} else {
				data = Buffer.from(data).toString();
				this.emit("data", data);
				this.chunk = this.chunk.slice(this.index + 2);
				this.index = 0;
			}
		}

		/**
		 * 处理 - 
		 */
		if (this.chunk[this.index] === this.ascii.SUB) {
			this.index ++;
			let data = [], byte = null;
			while (this.index < this.chunk.byteLength) {
				byte = this.chunk[this.index];
				if (byte === this.ascii.CR && this.chunk[this.index + 1] === this.ascii.LF) {
					break;
				} else {
					data.push(byte);
					this.index ++;
				}
			}
			if (this.deepStack.length > 0) {
				data = Buffer.from(data).toString();
				const lastChild = this.deepStack[this.deepStack.length - 1];
				lastChild.num ++;
				lastChild.data.push(data);
				this.index += 2;
				if (lastChild.num === lastChild.length) return;
			} else {
				data = Buffer.from(data).toString();
				this.emit("data", data);
				this.chunk = this.chunk.slice(this.index + 2);
				this.index = 0;
			}
		}

		/**
		 * 处理 : 
		 */
		if (this.chunk[this.index] === this.ascii.COLON) {
			this.index ++;
			let data = [], byte = null;
			while (this.index < this.chunk.byteLength) {
				byte = this.chunk[this.index];
				if (byte === this.ascii.CR && this.chunk[this.index + 1] === this.ascii.LF) {
					break;
				} else {
					data.push(byte);
					this.index ++;
				}
			}
			if (this.deepStack.length > 0) {
				data = Buffer.from(data).toString();
				const lastChild = this.deepStack[this.deepStack.length - 1];
				lastChild.num ++;
				lastChild.data.push(data);
				this.index += 2;
				if (lastChild.num === lastChild.length) return;
			} else {
				data = Buffer.from(data).toString();
				this.emit("data", data);
				this.chunk = this.chunk.slice(this.index + 2);
				this.index = 0;
			}
		}

		/**
		 * 处理 $
		 */
		if (this.chunk[this.index] === this.ascii.DOLLAR) {
			this.index ++;
			let data = [], byte = null, length = [], num = 0;
			while (this.index < this.chunk.byteLength) {
				byte = this.chunk[this.index];
				if (byte === this.ascii.CR && this.chunk[this.index + 1] === this.ascii.LF) {
					length = Number(Buffer.from(length).toString());
					break;
				} else {
					length.push(byte);
					this.index ++;
				}
			}
			this.index += 2;
			while (num <= length) {
				byte = this.chunk[this.index + num];
				if (!byte) {
					this.DEBUG && console.log("$解析时候，目前chunk长度不够length，需要等待下次parse调用累积处理");
					return;
				}
				if (num === length) {
					if (byte === this.ascii.CR && this.chunk[this.index + num + 1] === this.ascii.LF) {
						break;
					} else {
						const err = new Error("解析$时候，对应数据长度不匹配, 实际数据比给定长度超出\n" + this._getErrorPositionStr());
						this.emit("error", err);
						throw err;
					}
				} else {
					data.push(byte);
					num ++;
				}
			}
			if (this.deepStack.length > 0) {
				//在递归解析*时候的逻辑
				data = Buffer.from(data).toString();
				const lastChild = this.deepStack[this.deepStack.length - 1];
				lastChild.num ++;
				lastChild.data.push(data);
				this.index = this.index + num + 2;
				if (lastChild.num === lastChild.length) return;
			} else {
				data = Buffer.from(data).toString();
				this.emit("data", data);
				this.chunk = this.chunk.slice(this.index + num + 2);
				this.index = 0;
			}
		}

		/**
		 * 处理 * 
		 */
		if (this.chunk[this.index] === this.ascii.STAR) {
			this.index ++;
			let length = 0, bytes = [], byte = null;
			while (this.index < this.chunk.byteLength) {
				byte = this.chunk[this.index];
				if (byte === this.ascii.CR && this.chunk[this.index + 1] === this.ascii.LF) {
					length = Number(Buffer.from(bytes).toString());
					this.index += 2;
					break;
				} else {
					bytes.push(byte);
					this.index ++;
				}
			}
			//压栈、递归
			this.deepStack.push(this._buildDeepStackChild(length));
			this.parse();
			const lastChild = this.deepStack[this.deepStack.length - 1];
			if (lastChild.num === lastChild.length) {
				/**
				 * 深度栈有元素，代表当前操作处于*递归当中
				 * 把当前栈顶的数据压入到倒数第二个栈元素当中；并将栈顶元素出栈
				 * 然后return出去
				 */
				if (this.deepStack.length > 1) {
					const last2Child = this.deepStack[this.deepStack.length - 2];
					last2Child.num ++;
					last2Child.data.push(lastChild.data);
					this.deepStack.pop();
					return;
				} 
				/**
				 * 深度栈无元素，代表当前处于*递归完成返回
				 * 获取数据，触发事件传出数据
				 * 然后继续处理其他数据
				 */
				else {
					this.emit("data", this.deepStack[0].data);
					this.deepStack = [];
					this.chunk = this.chunk.slice(this.index);
					this.index = 0;
				}
			}
		}

		/**
		 * 末尾检测
		 */
		if (this.chunk.byteLength > 0) {
			if (this.asciis.includes(this.chunk[this.index])) {
				this.parse();
			} else {
				let err = new Error("resp结构有错或者缺失:\n" + this._getErrorPositionStr());
				this.emit("error", err);
				throw err;
			}
		}
	}

	/**
	 * 构造deepStack元素数据结构
	 *  
	 * @param {Number} length *的长度
	 */
	_buildDeepStackChild (length) {
		return {
			length,
			num: 0,
			data: [],
			_deep: this.deepStack.length
		}
	}

	/**
	 * 获取resp出错位置 
	 * 
	 * @return {String}
	 */
	_getErrorPositionStr () {
		let str = "";
		for (let i = 0; i < this.index + 1; i++) {
			if (i === this.index) {
				str += `'${this.chunk[this.index]}'`;
			} else {
				str += this.chunk[i] + " ";
			}
		}
		str += `\n位于resp索引: ${this.index}\n`;
		if (this.deepStack.length > 0) {
			str += `位于深度栈索引: ${this.deepStack[this.deepStack.length - 1]._deep}`;
		} else {
			str += "没有深度栈";
		}
		return str;
	}
}