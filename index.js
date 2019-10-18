"use strict"

const {EventEmitter:Emitter} = require("events");

module.exports = class Parser extends Emitter{

	constructor () {
		super();
		/**
		 * debug模式 
		 */
		this.DEBUG = true;
		/**
		 * 是否短缺 
		 */
		this.isLack = false;
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
			this.isLack = false;
			this.index = 0;
			this.deepStack = [];
			if (!(respChunk instanceof Buffer)) {
				const err = new Error("respChunk 必须为Buffer类型");
				this.emit("error", err);
				throw err;
			}
			this.chunk = Buffer.concat([this.chunk, respChunk]);
		}

		while (!this.isLack) {

			/**
			 * 处理 + 
			 */
			if (this.chunk[this.index] === this.ascii.ADD) {
				this.DEBUG && console.log("--> +");
				this.index ++;
				let data = [], byte = null, isBreak = false;
				while (this.index < this.chunk.byteLength) {
					byte = this.chunk[this.index];
					if (byte === this.ascii.CR && this.chunk[this.index + 1] === this.ascii.LF) {
						isBreak = true;
						break;
					} else {
						data.push(byte);
						this.index ++;
					}
				}
				if (!isBreak) {
					this._emitWarn();
					this.isLack = true;
					return;
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
			 * 处理 - 
			 */
			if (this.chunk[this.index] === this.ascii.SUB) {
				this.DEBUG && console.log("--> -");
				this.index ++;
				let data = [], byte = null, isBreak = false;
				while (this.index < this.chunk.byteLength) {
					byte = this.chunk[this.index];
					if (byte === this.ascii.CR && this.chunk[this.index + 1] === this.ascii.LF) {
						isBreak = true;
						break;
					} else {
						data.push(byte);
						this.index ++;
					}
				}
				if (!isBreak) {
					this._emitWarn();
					this.isLack = true;
					return;
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
				this.DEBUG && console.log("--> :");
				this.index ++;
				let data = [], byte = null, isBreak = false;
				while (this.index < this.chunk.byteLength) {
					byte = this.chunk[this.index];
					if (byte === this.ascii.CR && this.chunk[this.index + 1] === this.ascii.LF) {
						isBreak = true;
						break;
					} else {
						data.push(byte);
						this.index ++;
					}
				}
				if (!isBreak) {
					this._emitWarn();
					this.isLack = true;
					return;
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
				this.DEBUG && console.log("--> $");
				this.index ++;
				let data = [], byte = null, length = [], isBreak = false;
				while (this.index < this.chunk.byteLength) {
					byte = this.chunk[this.index];
					if (byte === this.ascii.CR && this.chunk[this.index + 1] === this.ascii.LF) {
						length = Number(Buffer.from(length).toString());
						isBreak = true;
						break;
					} else {
						length.push(byte);
						this.index ++;
					}
				}
				if (!isBreak) {
					this._emitWarn();
					this.isLack = true;
					break;
				}
				switch (length) {
					case -1: 
						if (this.deepStack.length > 0) {
							//在递归解析*时候的逻辑
							data = null;
							const lastChild = this.deepStack[this.deepStack.length - 1];
							lastChild.num ++;
							lastChild.data.push(data);
							this.index = this.index + 2;
							if (lastChild.num === lastChild.length) return;
						} else {
							data = null;
							this.emit("data", data);
							this.chunk = this.chunk.slice(this.index + 2);
							this.index = 0;
						}
						isBreak = false;
					break;
					case 0:
						/**
						 * $0\r\n\r\n有2组CRLF；需要判断后面的CRLF是否存在
						 */
						if (this.chunk[this.index + 2] !== this.ascii.CR || this.chunk[this.index + 3] !== this.ascii.LF) {
							this._emitWarn();
							this.isLack = true;
							return;
						}
						if (this.deepStack.length > 0) {
							//在递归解析*时候的逻辑
							data = "";
							const lastChild = this.deepStack[this.deepStack.length - 1];
							lastChild.num ++;
							lastChild.data.push(data);
							this.index = this.index + 4;
							if (lastChild.num === lastChild.length) return;
						} else {
							data = "";
							this.emit("data", data);
							this.chunk = this.chunk.slice(this.index + 4);
							this.index = 0;
						}
						isBreak = false;
				}
				if (isBreak) {
					this.index += 2;
					let isBreak1 = false;

					data = this.chunk.slice(this.index, this.index + length);
					let _data = [];
					for (let i = 0; i < data.byteLength; i++) {
						_data.push(data[i]);
					}
					data = _data;

					this.index += length;

					/**
					 * 如果按照指定长度截取的数据 中含有CR、LF；那么说明resp结构有错误
					 * 直接弹错，终止运行
					 */
					if (data.includes(this.ascii.CR) || data.includes(this.ascii.LF)) {
						console.log(11);
						this._emitError();
					}

					/**
					 * 如果按照指定长度截取的数据中含有undefined；说明数据长度不够
					 * 那么直接弹出警告并return；等待下次调用的时候一起处理 
					 */
					if (data.includes(undefined)) {
						console.log(22)
						this._emitWarn();
						this.isLack = true;
						return;
					}

					/**
					 * 如果下2个字节不为CRLF；那么直接弹出警告，终止运行，等待下次调用一起处理
					 */
					if (this.chunk[this.index] !== this.ascii.CR || this.chunk[this.index + 1] !== this.ascii.LF) {
						console.log(33)
						this._emitWarn();
						this.isLack = true;
						return;
					}
					
					/**
					 * 正常处理 
					 */
					if (this.chunk[this.index] === this.ascii.CR && this.chunk[this.index + 1] === this.ascii.LF) {
						isBreak1 = true;
					}

					if (isBreak1) {
						if (this.deepStack.length > 0) {
							data = Buffer.from(data).toString();
							const lastChild = this.deepStack[this.deepStack.length - 1];
							lastChild.num ++;
							lastChild.data.push(data);
							this.index = this.index + 2;
							if (lastChild.num === lastChild.length) return;
						} else {
							data = Buffer.from(data).toString();
							this.emit("data", data);
							this.chunk = this.chunk.slice(this.index + 2);
							this.index = 0;
						}
					}
				}
			}

			/**
			 * 处理 * 
			 */
			if (this.chunk[this.index] === this.ascii.STAR) {
				this.DEBUG && console.log("--> *");
				this.index ++;
				let length = -1, bytes = [], byte = null, isBreak = false;
				while (this.index < this.chunk.byteLength) {
					byte = this.chunk[this.index];
					if (byte === this.ascii.CR && this.chunk[this.index + 1] === this.ascii.LF) {
						length = bytes.length > 0 ? Number(Buffer.from(bytes).toString()) : -1;
						isBreak = true;
						this.index += 2;
						break;
					} else {
						bytes.push(byte);
						this.index ++;
					}
				}
				if (!isBreak) {
					this._emitWarn();
					this.isLack = true;
					return;
				}
				//*指定长度为0时处理
				if (length === 0) {
					isBreak = false;
					if (this.deepStack.length > 0) {

						const
						lastChild = this.deepStack[this.deepStack.length -1],
						last2Child = this.deepStack[this.deepStack.length - 2];

						lastChild.num ++;
						lastChild.data.push([]);

						if (this.deepStack.length > 1) {
							console.log("-->< 1");
							if (lastChild.num === lastChild.length) {
								last2Child.data.push(lastChild.data);
								last2Child.num ++;
								this.deepStack.pop();
								return;
							}
						}
						if (this.deepStack.length === 1) {
							const firstChild = this.deepStack[0];
							if (firstChild.num === firstChild.length) {
								this.emit("data", firstChild.data);
								this.chunk = this.chunk.slice(this.index);
								this.index = 0;
							}
						}

					} else {
						this.emit("data", []);
						this.chunk = this.chunk.slice(this.index);
						this.index = 0;
					}
				}
				if (isBreak) {
					//压栈、递归
					this.deepStack.push(this._buildDeepStackChild(length));
					this.parse();
					const lastChild = this.deepStack[this.deepStack.length - 1];
					let isLack = false;
					if (lastChild && lastChild.num < lastChild.length && this.chunk[this.index] === undefined) {
						console.log("isLack...");
						isLack = true;
					}
					if (!isLack) {

						const
						lastChild = this.deepStack[this.deepStack.length -1],
						last2Child = this.deepStack[this.deepStack.length - 2];

						if (this.deepStack.length > 1) {
							console.log("-->< 1");
							if (lastChild.num === lastChild.length) {
								last2Child.data.push(lastChild.data);
								last2Child.num ++;
								this.deepStack.pop();
								return;
							}
						}
						// console.log(this.deepStack);
						if (this.deepStack.length === 1) {
							console.log("-->< 2");
							const firstChild = this.deepStack[0];
							if (firstChild.num === firstChild.length) {
								console.log("-->< 3");
								this.emit("data", firstChild.data);
								this.chunk = this.chunk.slice(this.index);
								this.index = 0;
							}
						}
					}
				}
			}

			/**
			 * 末尾检测
			 */
			if (this.isLack){
				break
			}
			if (this.chunk.byteLength === 0) {
				console.log(")))))))");
				break;
			}
			
		} // while end
	}

	/**
	 *  抛出警告
	 */
	_emitWarn () {
		this.emit("warn", "当前长度不足：" + this._getErrorPositionStr());
	}

	/**
	 *  抛出错误
	 */
	_emitError () {
		const error = new Error("当前resp结构发生错误：" + this._getErrorPositionStr());
		this.emit("error", error);
		throw error;
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
		let chunk = [], str = "";
		for (let i = 0; i < this.index; i++) {
			chunk.push(this.chunk[i]);
		}
		str = Buffer.from(chunk).toString();
		let str_ = "";
		if (str.length > 20) {
			str_ = str.slice(0, 10) + "\r\n部分省略...\r\n" + str.slice(this.index - 11);
		}
		str_ += " <- 问题在这个位置, 当前这个位置为：" + this.chunk[this.index];
		str_ += `\n位于resp索引: ${this.index}\n`;
		if (this.deepStack.length > 0) {
			str_ += `位于深度栈索引: ${this.deepStack[this.deepStack.length - 1]._deep}`;
		} else {
			str_ += "没有深度栈";
		}
		str_ += "\n\n";
		return str_;
	}
}