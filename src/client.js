const NetCat = require("netcat/client");
const Stream = require("stream");
const EventEmitter = require("events");
require('dotenv').config()

const strToByteArray = (str) => {
  const size = str.length / 2;
  let arr = new Array(size);

  for (let i = 0, j = 0; i < size; i++, j += 2) {
    arr[i] = parseInt(str.substring(j, j + 2), 16);
  }
  return arr;
};

const getTypeCodeString = (tc) => {
  if (tc <= 4) return "Aircraft Identification";
  if (tc >= 5 && tc <= 8) return "Surface Position";
  if (tc >= 9 && tc <= 18) return "Airborne Position (w/ Barometer Alt.)";
  if (tc === 19) return "Airborne Velocities";
  if (tc >=20 && tc <= 22) return "Airborne Position (w/ GNSS Height)"
  if (tc === 28) return "Aircraft Status";
  if (tc === 29) return "Target state and status information";
  if (tc === 31) return "Aircraft operation status"
};

const processQueue = () => {
  if (messageQueue.length === 0) return;

  for (messageObj of messageQueue) {
    let messageByteArr = strToByteArray(messageObj.message);
    let transCapability = messageByteArr[0] & 7;
    let icaoHex = messageObj.message.substring(2, 8);
    let me = messageByteArr.slice(4, 11);
    let meTypeCode = me[0] >> 3;
    let meTypeCodeString = getTypeCodeString(meTypeCode);
    let timeSent = messageObj.now;
    let newMessage = { transCapability, icaoHex, meTypeCode, meTypeCodeString, timeSent, rawMessage: messageObj.message };
    messages[icaoHex] = newMessage;
    messageQueue.pop();
  }
  console.log(messages);
};
const emitter = new EventEmitter();
emitter.on("new-data", processQueue);

const processChunk = (chunk) => {
  let arr = Array.from(chunk)
    .filter((el) => el !== 42 && el !== 59) //Remove '*' and ';' characters
    .map((el) => String.fromCharCode(el)); //Convert number to UTF-16 character.

  let message = "";
  let now = Date.now();
  for (el of arr) {
    if (el !== "\n") {
      message += el;
    } else {
      //We only want ADS-B messages - first 5 bits equal 17
      if (parseInt(message.substring(0, 2), 16) >> 3 === 17) {
        messageQueue.push({ message, now });
      }
      message = "";
    }
  }
  emitter.emit("new-data");
};

let messages = {};
let messageQueue = [];

let nc = new NetCat();
let write = new Stream.Writable({
  write(chunk, enc, cb) {
    processChunk(chunk);
    cb(null);
  }
});

const addr = process.env.addr;
const port = Number(process.env.port);
//Start reading the data from dump1090
nc.addr(addr || "127.0.0.1")
  .port(port || 30002)
  .connect()
  .pipe(write)
  .on("close", () => console.log("NetCat is Closing"));
